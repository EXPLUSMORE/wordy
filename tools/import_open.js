#!/usr/bin/env node
/* Erzeugt offene Business-Einheiten (data/open/*.js) aus lokal abgelegten Rohdaten.

   Rohdaten (werden NICHT ins Repository gelegt, Pfad gibt der Betreiber an; sie liegen z. B. unter private/raw/):
     ngsl.csv        NGSL-Liste (CSV/TSV mit Kopfzeile; Spalte für das Wort und optional für den Rang)
     bsl.csv         BSL-Liste (gleiches Format)
     wiktextract.jsonl   Wiktextract-Auszug des englischen Wiktionary (eine JSON-Zeile je Eintrag)
     tatoeba/        sentences_detailed.tsv, links.tsv, optional sentences_CC0.tsv
   Eigene Sätze (src "own"): tools/open/own-sentences.json
     { "b-37": { "words": { "to order": { "en": "...", "de": "...", "rule": "..." } }, "sentences": [ { "en": "...", "de": "...", "rule": "..." } ] } }

   Aufruf:
     node tools/import_open.js --raw private/raw --unit b-37 --dry      Kandidaten anzeigen, nichts schreiben
     node tools/import_open.js --raw private/raw --unit b-37            Einheit erzeugen/aktualisieren
     node tools/import_open.js --raw private/raw --all                  alle Einheiten aus themes.json
   Optionen: --themes <datei>  --out data/open  --count 16  --fixture (nur Tests: erlaubt Ausgabe außerhalb von data/open)

   Regeln: nur Wörter, die in NGSL oder BSL stehen und in Wiktextract eine deutsche Übersetzung haben; nichts wird geraten.
   Unsicheres (kein Artikel, mehrere Bedeutungen, kein Beispielsatz) landet im Bericht private/open-report.json und wird nicht aufgenommen.
   Reihenfolge ist append-only (tools/open/lock.json): einmal vergebene Wort- und Satzpositionen ändern sich nicht, damit Lernstand und Satz-IDs stabil bleiben. */
const fs = require('fs'), path = require('path'), readline = require('readline'), vm = require('vm');
const rules = require('./lib/open_rules.js');
const ROOT = path.resolve(__dirname, '..');
const A = process.argv.slice(2), arg = (n, d) => { const i = A.indexOf('--' + n); return i < 0 ? d : (A[i + 1] && !A[i + 1].startsWith('--') ? A[i + 1] : true); };
const RAW = path.resolve(ROOT, arg('raw', 'private/raw'));
const THEMES = path.resolve(ROOT, arg('themes', 'tools/open/themes.json'));
const OUT = path.resolve(ROOT, arg('out', 'data/open'));
const FIX = !!arg('fixture', false);
const LOCK = FIX ? path.join(OUT, 'lock.fixture.json') : path.resolve(ROOT, 'tools/open/lock.json');
const OWN = path.resolve(ROOT, arg('own', 'tools/open/own-sentences.json'));
const COUNT = +arg('count', 16), DRY = !!arg('dry', false);
if (!FIX && path.relative(path.join(ROOT, 'data/open'), OUT) !== '') { console.error('--out muss data/open sein (außer mit --fixture).'); process.exit(2); }
if (/(^|[\\/])private[\\/]/.test(path.relative(ROOT, OUT)) || /\.private\./.test(OUT)) { console.error('Die Ausgabe darf nicht in einen privaten Pfad.'); process.exit(2); }

/* ---------- Einlesen ---------- */
function splitLine(l, sep) { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (c === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (c === sep && !q) { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map(x => x.trim()); }
function readList(file, label) {
  if (!fs.existsSync(file)) return null;
  const lines = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim());
  const sep = ['\t', ';', ','].map(s => [s, lines[0].split(s).length]).sort((a, b) => b[1] - a[1])[0][0];
  const head = splitLine(lines[0], sep).map(h => h.toLowerCase());
  const wi = head.findIndex(h => /^(lemma|word|headword|entry|ngsl|bsl|item)$/.test(h)), ri = head.findIndex(h => /^(rank|sfi|freq(uency)?( rank)?|#|no\.?)$/.test(h));
  if (wi < 0) throw new Error(label + ': keine Spalte für das Wort gefunden (Kopfzeile: ' + head.join(' | ') + ')');
  const m = new Map();
  lines.slice(1).forEach((l, i) => {
    const c = splitLine(l, sep), w = (c[wi] || '').toLowerCase().trim(); if (!w || m.has(w)) return;
    const r = ri >= 0 ? parseInt(c[ri], 10) : NaN;
    m.set(w, { rank: isNaN(r) ? i + 1 : r, rankFromColumn: !isNaN(r) });
  });
  return m;
}
async function eachLine(file, fn) {
  const rl = readline.createInterface({ input: fs.createReadStream(file, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const l of rl) if (l) fn(l);
}
const norm = s => s.toLowerCase().replace(/^to\s+/, '').trim();

/* ---------- Wiktextract ---------- */
async function readWikt(file, wanted) {
  const m = new Map();
  await eachLine(file, line => {
    let o; try { o = JSON.parse(line); } catch (e) { return; }
    if (!(o.lang_code === 'en' || o.lang === 'English') || !o.word || !wanted.has(o.word.toLowerCase())) return;
    const key = o.word.toLowerCase();
    const senses = (o.senses || []).map(s => ({
      gloss: (s.glosses || []).join('; '),
      topics: (s.topics || []).map(t => String(t).toLowerCase()),
      cats: (s.categories || []).map(c => String(c.name || c).toLowerCase()).concat((o.categories || []).map(c => String(c.name || c).toLowerCase())),
      tags: s.tags || []
    }));
    const tr = (o.translations || []).filter(t => (t.lang_code === 'de' || t.code === 'de') && t.word).map(t => ({ word: t.word, sense: t.sense || '', tags: t.tags || [], roman: t.roman || '' }));
    const ipa = ((o.sounds || []).filter(s => s.ipa)[0] || {}).ipa || '';
    (m.get(key) || m.set(key, []).get(key)).push({ word: o.word, pos: o.pos, senses, tr, ipa });
  });
  return m;
}
function deForm(t, pos) {
  const tags = t.tags.join(' ');
  let art = '';
  if (pos === 'noun') art = /feminine/.test(tags) ? 'die ' : /masculine/.test(tags) ? 'der ' : /neuter/.test(tags) ? 'das ' : null;
  return art === null ? null : art + t.word;
}

/* ---------- Tatoeba ---------- */
async function readTatoeba(dir, words) {
  const det = path.join(dir, 'sentences_detailed.tsv'), lnk = path.join(dir, 'links.tsv'), cc0f = path.join(dir, 'sentences_CC0.tsv');
  if (!fs.existsSync(det) || !fs.existsSync(lnk)) return null;
  const re = new RegExp("\\b(" + [...words].map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ")(s|es|ed|d|ing)?\\b", 'i');
  const eng = new Map(); const need = new Map();
  await eachLine(det, l => {
    const c = l.split('\t'); if (c[1] !== 'eng' && c[1] !== 'deu') return;
    if (c[1] === 'eng') { const n = c[2].trim().split(/\s+/).length; if (n >= 4 && n <= 12 && re.test(c[2])) eng.set(c[0], { id: c[0], text: c[2].trim(), user: c[3] || '' }); }
  });
  const pairs = new Map();
  await eachLine(lnk, l => { const c = l.split('\t'); if (eng.has(c[0])) (pairs.get(c[0]) || pairs.set(c[0], []).get(c[0])).push(c[1]); });
  const deIds = new Set(); pairs.forEach(v => v.forEach(i => deIds.add(i)));
  const deu = new Map();
  await eachLine(det, l => { const c = l.split('\t'); if (c[1] === 'deu' && deIds.has(c[0])) deu.set(c[0], { id: c[0], text: c[2].trim(), user: c[3] || '' }); });
  const cc0 = new Set(); if (fs.existsSync(cc0f)) await eachLine(cc0f, l => cc0.add(l.split('\t')[0]));
  const out = [];
  eng.forEach(e => { const d = (pairs.get(e.id) || []).map(i => deu.get(i)).filter(Boolean)[0]; if (d && e.user) out.push({ en: e, de: d, lic: cc0.has(e.id) ? 'CC0-1.0' : 'CC-BY-2.0-FR' }); });
  return out;
}
/* Sätze ohne Eigennamen (großgeschriebene Wörter mitten im Satz außer I), Ziffern und einfache Stoppliste */
const STOP = new Set(['sex', 'sexy', 'kill', 'killed', 'dead', 'die', 'drunk', 'stupid', 'idiot', 'fuck', 'shit', 'damn', 'hell', 'gun', 'bomb', 'terror']);
function cleanSentence(t) {
  const w = t.split(/\s+/); if (/\d/.test(t)) return false;
  for (let i = 1; i < w.length; i++) if (/^[A-Z][a-z]+/.test(w[i].replace(/^[^A-Za-z]+/, '')) && w[i].replace(/\W/g, '') !== 'I' && !/^I['’]/.test(w[i])) return false;
  return !w.some(x => STOP.has(x.toLowerCase().replace(/\W/g, '')));
}

/* ---------- Kernlogik ---------- */
function legacyWords() {
  const set = new Set();
  for (const f of fs.readdirSync(path.join(ROOT, 'data')).filter(f => /^(business|smalltalk|idioms)/.test(f))) { try { rules.load(path.join(ROOT, 'data', f)).units.forEach(u => u.words.forEach(w => set.add(norm(w[0])))); } catch (e) {} }
  return set;
}
const lock = fs.existsSync(LOCK) ? JSON.parse(fs.readFileSync(LOCK, 'utf8')) : { units: {}, sentenceOrder: [] };
const own = fs.existsSync(OWN) ? JSON.parse(fs.readFileSync(OWN, 'utf8')) : {};
const report = { units: {}, note: 'Bericht zur Qualitätsprüfung; enthält unsichere und abgelehnte Kandidaten.' };

function matchTheme(entry, th) {
  const t = th.topics.map(x => x.toLowerCase()), c = th.categories.map(x => x.toLowerCase());
  return entry.senses.some(s => s.topics.some(x => t.indexOf(x) >= 0) || s.cats.some(x => c.some(p => x.indexOf(p) >= 0)));
}

async function main() {
  const themes = JSON.parse(fs.readFileSync(THEMES, 'utf8'));
  const wanted = arg('all', false) ? themes.units : themes.units.filter(u => u.id === arg('unit', ''));
  if (!wanted.length) { console.error('Keine Einheit gewählt (--unit b-37 oder --all).'); process.exit(2); }
  const ngsl = readList(path.join(RAW, 'ngsl.csv'), 'NGSL'), bsl = readList(path.join(RAW, 'bsl.csv'), 'BSL');
  if (!ngsl && !bsl) { console.error('Weder ngsl.csv noch bsl.csv in ' + path.relative(ROOT, RAW) + ' gefunden.'); process.exit(2); }
  const freq = new Map(); [['ngsl', ngsl], ['bsl', bsl]].forEach(([src, m]) => m && m.forEach((v, w) => { const o = freq.get(w); if (!o || v.rank < o.rank) freq.set(w, { rank: v.rank, src, rankFromColumn: v.rankFromColumn }); }));
  const wiktFile = path.join(RAW, 'wiktextract.jsonl');
  if (!fs.existsSync(wiktFile)) { console.error('wiktextract.jsonl fehlt in ' + path.relative(ROOT, RAW)); process.exit(2); }
  const wikt = await readWikt(wiktFile, freq), legacy = legacyWords();
  console.log('Frequenzliste: ' + freq.size + ' Wörter, davon in Wiktextract: ' + wikt.size);

  /* 1. Auswahl der Wörter je Einheit */
  const plan = {};
  for (const th of wanted) {
    const band = themes.bands[th.k], locked = (lock.units[th.id] || {}).words || [], chosen = [], rep = report.units[th.id] = { rejected: [], unsure: [], missingExample: [] };
    const entryFor = key => { const [lem, pos] = key.split('|'); return (wikt.get(lem) || []).filter(e => e.pos === pos)[0]; };
    const taken = new Set(locked.map(k => k.split('|')[0]));
    const cands = [];
    freq.forEach((f, lem) => {
      if (taken.has(lem) || legacy.has(lem) || f.rank > band || (th.exclude || []).indexOf(lem) >= 0) return;
      (wikt.get(lem) || []).forEach(e => { if (matchTheme(e, th) || (th.include || []).indexOf(lem) >= 0) cands.push({ lem, e, f }); });
    });
    cands.sort((a, b) => a.f.rank - b.f.rank);
    const seenLem = new Set(locked.map(k => k.split('|')[0]));
    const all = locked.map(k => ({ lem: k.split('|')[0], e: entryFor(k), f: freq.get(k.split('|')[0]), locked: true })).filter(x => x.e).concat(cands);
    for (const c of all) {
      if (chosen.length >= COUNT) break;
      if (!c.locked && seenLem.has(c.lem)) continue;
      const sense = c.e.senses.filter(s => !th || matchTheme({ senses: [s] }, th))[0] || c.e.senses[0];
      const tr = c.e.tr.filter(t => !t.sense || (sense && t.sense && sense.gloss.toLowerCase().indexOf(t.sense.toLowerCase().slice(0, 12)) >= 0))[0] || (c.e.tr.length === 1 ? c.e.tr[0] : null);
      if (!tr) { rep.rejected.push(c.lem + ' (' + c.e.pos + '): keine eindeutige deutsche Übersetzung'); continue; }
      const de = deForm(tr, c.e.pos);
      if (de === null) { rep.unsure.push(c.lem + ': Substantiv ohne Genus in der Übersetzung "' + tr.word + '"'); continue; }
      const en = c.e.pos === 'verb' ? 'to ' + c.lem : c.lem;
      seenLem.add(c.lem);
      chosen.push({ key: c.lem + '|' + c.e.pos, lem: c.lem, en, de: de || tr.word, pos: c.e.pos, ipa: c.e.ipa, sense: sense ? sense.gloss.slice(0, 80) : '', src: c.f.src, rank: c.f.rank, rankAssumed: !c.f.rankFromColumn });
    }
    plan[th.id] = { th, words: chosen };
    if (chosen.length < 12) rep.unsure.push('Nur ' + chosen.length + ' Wörter gefunden (nötig 12–20): Muster/Themenfilter prüfen');
  }

  /* 2. Sätze */
  const tat = await readTatoeba(path.join(RAW, 'tatoeba'), new Set(Object.values(plan).flatMap(p => p.words.map(w => w.lem))));
  if (!tat) console.log('Hinweis: Tatoeba-Dateien fehlen, es werden nur eigene Sätze (own) verwendet.');
  for (const id of Object.keys(plan)) {
    const p = plan[id], rep = report.units[id], ow = own[id] || { words: {}, sentences: [] };
    p.words.forEach(w => {
      const re = new RegExp('\\b' + w.lem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(s|es|ed|d|ing)?\\b', 'i');
      const hit = (tat || []).filter(t => re.test(t.en.text) && cleanSentence(t.en.text))[0];
      if (hit) w.ex = { en: hit.en.text, de: hit.de.text, meta: { src: 'tatoeba', lic: hit.lic, author: hit.en.user, sentence_id: +hit.en.id, de_author: hit.de.user, de_sentence_id: +hit.de.id } };
      else if (ow.words[w.en]) w.ex = { en: ow.words[w.en].en, de: ow.words[w.en].de, meta: { src: 'own', lic: 'CC-BY-SA-4.0' } };
      else rep.missingExample.push(w.en);
    });
    p.words = p.words.filter(w => w.ex || (rep.rejected.push(w.en + ': kein Beispielsatz (Tatoeba oder own)'), false));
    /* 3 bis 5 Einheitensätze: eigene zuerst, sonst Tatoeba-Sätze, die ein Wort der Einheit enthalten und noch nicht als Beispiel dienen */
    const sents = [], used = new Set(p.words.map(w => w.ex && w.ex.en));
    (ow.sentences || []).forEach(s => sents.push({ en: s.en, de: s.de, rule: s.rule, meta: { src: 'own', lic: 'CC-BY-SA-4.0' } }));
    (tat || []).forEach(t => { if (sents.length >= 5 || used.has(t.en.text) || !cleanSentence(t.en.text)) return; if (p.words.some(w => new RegExp('\\b' + w.lem + '(s|es|ed|d|ing)?\\b', 'i').test(t.en.text))) { used.add(t.en.text); sents.push({ en: t.en.text, de: t.de.text, rule: ow.rule || 'Typischer Satz zum Thema.', meta: { src: 'tatoeba', lic: t.lic, author: t.en.user, sentence_id: +t.en.id, de_author: t.de.user, de_sentence_id: +t.de.id } }); } });
    p.sentences = sents.slice(0, 5);
    if (p.sentences.length < 3) rep.unsure.push('Nur ' + p.sentences.length + ' Sätze (nötig 3–5)');
  }

  /* 3. Ausgabe */
  console.log('\nKandidaten:');
  for (const id of Object.keys(plan)) { const p = plan[id]; console.log(id + ' ' + p.th.title + ' (' + p.th.k + '): ' + p.words.length + ' Wörter, ' + p.sentences.length + ' Sätze'); p.words.forEach(w => console.log('   ' + w.en.padEnd(22) + w.de.padEnd(26) + w.src + ' #' + w.rank + (w.rankAssumed ? '*' : '') + '  ' + w.pos + '  ' + w.ipa + '  [' + w.sense + ']')); }
  fs.mkdirSync(path.join(ROOT, 'private'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'private/open-report.json'), JSON.stringify(report, null, 1));
  console.log('\nBericht: private/open-report.json (rank* = Position in der Liste, kein Rang in der Datei)');
  if (DRY) return;

  const nl = JSON.parse(JSON.stringify(lock)), J = JSON.stringify;   // Sperrliste erst nach bestandener Prüfung speichern
  for (const id of Object.keys(plan)) {
    const p = plan[id]; nl.units[id] = { words: p.words.map(w => w.key), sentences: p.sentences.map(s => s.meta.src + ':' + (s.meta.sentence_id || s.en)) };
    p.sentences.forEach(s => { const k = s.meta.src + ':' + (s.meta.sentence_id || s.en); if (nl.sentenceOrder.indexOf(k) < 0) nl.sentenceOrder.push(k); });
  }
  const old = {};   // bisherige Einheiten aus data/open übernehmen, damit eine Teilausführung andere Einheiten nicht löscht
  if (fs.existsSync(OUT)) fs.readdirSync(OUT).filter(f => /^business-.*\.js$/.test(f)).forEach(f => { rules.load(path.join(OUT, f)).units.forEach(u => (old[u.id] = u)); });
  const allUnits = Object.assign({}, old);
  Object.keys(plan).forEach(id => {
    const p = plan[id];
    allUnits[id] = { track: 'business', k: p.th.k, id, title: p.th.title, icon: p.th.icon, words: p.words.map(w => [w.en, w.de, w.rank <= 1500 ? 1 : w.rank <= 3000 ? 2 : 3, w.ex.en,
      { src: w.src, lic: 'CC-BY-SA-4.0', tr: 'wikt', pos: w.pos, ipa: w.ipa, rank: w.rank, sense: w.sense, ex: Object.assign({ de: w.ex.de }, w.ex.meta) }]) };
  });
  /* bereits vorhandene Sätze anderer Einheiten bleiben erhalten (aus der alten Satzdatei) */
  let oldSent = []; const sf = path.join(OUT, 'saetze-open.js'); if (fs.existsSync(sf)) oldSent = rules.load(sf).sentences;
  const sentRows = {}; oldSent.forEach(s => { (sentRows[s[5].unit] = sentRows[s[5].unit] || []).push(s); });
  Object.keys(plan).forEach(id => { sentRows[id] = plan[id].sentences.map(s => ['business', plan[id].th.k, s.en, s.de, s.rule, Object.assign({ unit: id }, s.meta)]); });
  const order = nl.sentenceOrder, rank = s => order.indexOf(s[5].src + ':' + (s[5].sentence_id || s[2]));
  const rows = Object.values(sentRows).flat().sort((a, b) => rank(a) - rank(b));
  /* Erst in einen Zwischenordner schreiben und prüfen; nur bei bestandener Prüfung wird data/open (und die Sperrliste) angefasst */
  const files = {};
  for (const k of rules.STUFEN) {
    const us = Object.values(allUnits).filter(u => u.k === k).sort((a, b) => a.id.localeCompare(b.id)); if (!us.length) continue;
    files['business-' + k.toLowerCase() + '.js'] = '/* Offene Business-Einheiten, Stufe ' + k + ' – erzeugt mit tools/import_open.js. Herkunft je Eintrag im 5. Feld (src, lic). Lizenz: CC BY-SA 4.0, siehe LICENSE-DATA.md */\nwindow.VOCAB_UNITS = (window.VOCAB_UNITS || []).concat([\n' + us.map(u => '{track:"business",k:' + J(u.k) + ',id:' + J(u.id) + ',title:' + J(u.title) + ',icon:' + J(u.icon) + ',words:[\n' + u.words.map(w => J(w)).join(',\n') + ']}').join(',\n') + '\n]);\n';
  }
  files['saetze-open.js'] = '/* Sätze der offenen Business-Einheiten – angehängt, damit bestehende Satz-IDs gleich bleiben. Herkunft im 6. Feld. Lizenz: CC BY-SA 4.0, siehe LICENSE-DATA.md */\nwindow.SENTENCES = (window.SENTENCES || []).concat([\n' + rows.map(r => J(r)).join(',\n') + '\n]);\n';
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'open-'));
  Object.keys(files).forEach(f => fs.writeFileSync(path.join(tmp, f), files[f]));
  const taken = []; ['business', 'business-basis2', 'business-aufbau2', 'business-profi2', 'smalltalk', 'idioms'].forEach(f => { try { rules.load(path.join(ROOT, 'data', f + '.js')).units.forEach(u => taken.push(u.id)); } catch (e) {} });
  const chk = rules.validate(Object.keys(files).sort().map(f => path.join(tmp, f)), taken);
  if (chk.errs.length) { fs.rmSync(tmp, { recursive: true, force: true }); console.error('\nPrüfung der Ausgabe meldet ' + chk.errs.length + ' Verstöße, es wurde nichts geschrieben:'); chk.errs.slice(0, 40).forEach(e => console.error('  - ' + e)); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  Object.keys(files).forEach(f => fs.copyFileSync(path.join(tmp, f), path.join(OUT, f)));
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.writeFileSync(LOCK, JSON.stringify(nl, null, 1));
  console.log('Geschrieben nach ' + path.relative(ROOT, OUT) + '. Prüfung bestanden.');
}
main().catch(e => { console.error(e.stack || e.message); process.exit(1); });
