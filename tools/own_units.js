#!/usr/bin/env node
/* Schreibt selbst verfasste Einheiten (tools/open/own-units.json, src "own") nach data/open.
   Aufruf: node tools/own_units.js [--unit b-39] [--dry]
   Die Daten werden vor dem Schreiben mit tools/lib/open_rules.js geprüft (Whitelist, Umfang). Reihenfolge ist append-only (tools/open/lock.json). */
const fs = require('fs'), path = require('path'), os = require('os');
const rules = require('./lib/open_rules.js');
const ROOT = path.resolve(__dirname, '..'), OUT = path.join(ROOT, 'data/open'), LOCK = path.join(ROOT, 'tools/open/lock.json');
const A = process.argv.slice(2), arg = n => { const i = A.indexOf('--' + n); return i < 0 ? null : A[i + 1]; }, DRY = A.includes('--dry');
const own = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/open/own-units.json'), 'utf8'));
const themes = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/open/themes.json'), 'utf8')).units;
const ids = (arg('unit') ? [arg('unit')] : Object.keys(own).filter(k => k[0] !== '_'));
const lock = fs.existsSync(LOCK) ? JSON.parse(fs.readFileSync(LOCK, 'utf8')) : { units: {}, sentenceOrder: [] };
const norm = s => s.toLowerCase().replace(/^to\s+/, '').trim();
const legacy = new Set();
fs.readdirSync(path.join(ROOT, 'data')).filter(f => /^(business|smalltalk|idioms)/.test(f)).forEach(f => rules.load(path.join(ROOT, 'data', f)).units.forEach(u => u.words.forEach(w => legacy.add(norm(w[0])))));
const OWN = { src: 'own', lic: 'CC-BY-SA-4.0' };
const old = {}, oldSent = [];
if (fs.existsSync(OUT)) fs.readdirSync(OUT).filter(f => /^business-.*\.js$/.test(f)).forEach(f => rules.load(path.join(OUT, f)).units.forEach(u => (old[u.id] = u)));
if (fs.existsSync(path.join(OUT, 'saetze-open.js'))) rules.load(path.join(OUT, 'saetze-open.js')).sentences.forEach(s => oldSent.push(s));
const units = Object.assign({}, old), sent = oldSent.filter(s => ids.indexOf(s[5].unit) < 0);
const nl = JSON.parse(JSON.stringify(lock)), problems = [], seen = {};
Object.values(old).forEach(u => { if (ids.indexOf(u.id) < 0) u.words.forEach(w => (seen[norm(w[0])] = u.id)); });
for (const id of ids) {
  const th = themes.filter(t => t.id === id)[0], o = own[id]; if (!th || !o) { console.error('Einheit ' + id + ' fehlt in themes.json oder own-units.json'); process.exit(2); }
  const locked = (lock.units[id] || {}).words || [];
  const keys = o.words.map(w => w[0] + '|' + w[2]);
  locked.forEach((k, i) => { if (keys[i] !== k) { console.error(id + ': Reihenfolge/Inhalt der bereits vergebenen Wörter geändert (Position ' + i + ') – nur anhängen!'); process.exit(1); } });
  o.words.forEach(w => { const k = norm(w[0]); if (legacy.has(k)) problems.push(id + ': "' + w[0] + '" steht schon im Altbestand'); else if (seen[k] && seen[k] !== id) problems.push(id + ': "' + w[0] + '" steht schon in ' + seen[k]); seen[k] = id; });
  units[id] = { track: 'business', k: th.k, id, title: th.title, icon: th.icon, words: o.words.map(w => [w[0], w[1], w[3], w[4], Object.assign({ pos: w[2], ex: Object.assign({}, OWN) }, OWN)]) };
  o.sentences.forEach(s => sent.push(['business', th.k, s[0], s[1], s[2], Object.assign({ unit: id }, OWN)]));
  nl.units[id] = { words: keys, sentences: o.sentences.map(s => 'own:' + s[0]) };
  o.sentences.forEach(s => { if (nl.sentenceOrder.indexOf('own:' + s[0]) < 0) nl.sentenceOrder.push('own:' + s[0]); });
}
if (problems.length) { console.error('Dubletten (' + problems.length + '):'); problems.forEach(x => console.error('  - ' + x)); process.exit(1); }
const rank = s => nl.sentenceOrder.indexOf(s[5].src + ':' + (s[5].sentence_id || s[2]));
sent.sort((a, b) => rank(a) - rank(b));
const J = JSON.stringify, files = {};
for (const k of rules.STUFEN) {
  const us = Object.values(units).filter(u => u.k === k).sort((a, b) => a.id.localeCompare(b.id)); if (!us.length) continue;
  files['business-' + k.toLowerCase() + '.js'] = '/* Offene Business-Einheiten, Stufe ' + k + ' – Herkunft je Eintrag im 5. Feld (src, lic). Lizenz: CC BY-SA 4.0, siehe LICENSE-DATA.md */\nwindow.VOCAB_UNITS = (window.VOCAB_UNITS || []).concat([\n' + us.map(u => '{track:"business",k:' + J(u.k) + ',id:' + J(u.id) + ',title:' + J(u.title) + ',icon:' + J(u.icon) + ',words:[\n' + u.words.map(w => J(w)).join(',\n') + ']}').join(',\n') + '\n]);\n';
}
files['saetze-open.js'] = '/* Sätze der offenen Business-Einheiten – angehängt, damit bestehende Satz-IDs gleich bleiben. Herkunft im 6. Feld. Lizenz: CC BY-SA 4.0, siehe LICENSE-DATA.md */\nwindow.SENTENCES = (window.SENTENCES || []).concat([\n' + sent.map(r => J(r)).join(',\n') + '\n]);\n';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'own-'));
Object.keys(files).forEach(f => fs.writeFileSync(path.join(tmp, f), files[f]));
const taken = []; fs.readdirSync(path.join(ROOT, 'data')).filter(f => /^(business|smalltalk|idioms)/.test(f)).forEach(f => rules.load(path.join(ROOT, 'data', f)).units.forEach(u => taken.push(u.id)));
const chk = rules.validate(Object.keys(files).sort().map(f => path.join(tmp, f)), taken);
if (chk.errs.length) { fs.rmSync(tmp, { recursive: true, force: true }); console.error('Prüfung: ' + chk.errs.length + ' Verstöße, nichts geschrieben:'); chk.errs.forEach(e => console.error('  - ' + e)); process.exit(1); }
if (DRY) { fs.rmSync(tmp, { recursive: true, force: true }); console.log('Prüfung bestanden (Trockenlauf, nichts geschrieben).'); process.exit(0); }
fs.mkdirSync(OUT, { recursive: true }); Object.keys(files).forEach(f => fs.copyFileSync(path.join(tmp, f), path.join(OUT, f))); fs.rmSync(tmp, { recursive: true, force: true });
fs.writeFileSync(LOCK, JSON.stringify(nl, null, 1));
console.log('Geschrieben: ' + ids.join(', ') + ' nach data/open. Prüfung bestanden.');
