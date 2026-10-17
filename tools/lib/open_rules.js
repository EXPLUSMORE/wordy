/* Regeln für die offenen Vokabel- und Satzdaten (data/open/*.js): erlaubte Quellen, Lizenzen, Umfang.
   Wird von build.js (Abbruch bei Verstoß) und tools/import_open.js (Prüfung vor dem Schreiben) benutzt. */
const vm = require('vm'), fs = require('fs');

/* Whitelist: Quellkürzel -> erlaubte Lizenzkennungen (SPDX-ähnlich) */
const SOURCES = {
  ngsl:    { name: 'NGSL (New General Service List)', lic: ['CC-BY-SA-4.0'] },
  bsl:     { name: 'BSL (Business Service List)', lic: ['CC-BY-SA-4.0'] },
  wikt:    { name: 'Wiktionary / Wiktextract', lic: ['CC-BY-SA-4.0'] },
  tatoeba: { name: 'Tatoeba', lic: ['CC-BY-2.0-FR', 'CC0-1.0'] },
  ewn:     { name: 'Open English WordNet', lic: ['CC-BY-4.0'] },
  own:     { name: 'eigene Formulierung', lic: ['CC-BY-SA-4.0'] }
};
const STUFEN = ['Basis', 'Aufbau', 'Profi'];
const LIMITS = { wordsMin: 12, wordsMax: 20, sentMin: 3, sentMax: 5, sentWordsMin: 4, sentWordsMax: 12 };

function checkMeta(m, where, errs, needAuthor) {
  if (!m || typeof m !== 'object') { errs.push(where + ': Herkunft (src, lic) fehlt'); return; }
  const s = SOURCES[m.src];
  if (!s) { errs.push(where + ': src "' + m.src + '" steht nicht auf der Whitelist'); return; }
  if (s.lic.indexOf(m.lic) < 0) errs.push(where + ': lic "' + m.lic + '" passt nicht zu src "' + m.src + '" (erlaubt: ' + s.lic.join(', ') + ')');
  if (m.src === 'tatoeba') {
    if (!m.author) errs.push(where + ': Tatoeba-Eintrag ohne author');
    if (!m.sentence_id) errs.push(where + ': Tatoeba-Eintrag ohne sentence_id');
  }
}

/* Lädt eine data/open-Datei in einer leeren Sandbox und liefert die Einheiten und Sätze, die sie hinzufügt */
function load(file) {
  const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
  ctx.window.VOCAB_UNITS = []; ctx.window.SENTENCES = [];
  vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file, timeout: 5000 });
  return { units: ctx.window.VOCAB_UNITS || [], sentences: ctx.window.SENTENCES || [], sources: ctx.window.OPEN_SOURCES || null };
}

/* Prüft alle Einheiten und Sätze; takenIds = IDs, die schon im Altbestand vergeben sind */
function validate(files, takenIds) {
  const errs = [], warns = [], seen = new Set(takenIds || []), perUnit = {};
  for (const f of files) {
    let d; try { d = load(f); } catch (e) { errs.push(f + ': Datei lässt sich nicht laden (' + e.message + ')'); continue; }
    for (const u of d.units) {
      const at = f + ' ' + u.id;
      if (!/^b-\d{2,3}$/.test(u.id || '')) errs.push(at + ': Einheiten-ID folgt nicht dem Schema b-NN');
      if (seen.has(u.id)) errs.push(at + ': Einheiten-ID ist schon vergeben');
      seen.add(u.id);
      if (u.track !== 'business') errs.push(at + ': track muss "business" sein');
      if (STUFEN.indexOf(u.k) < 0) errs.push(at + ': Stufe "' + u.k + '" ist keine von ' + STUFEN.join('/'));
      if (!u.title || !u.icon) errs.push(at + ': title oder icon fehlt');
      const n = (u.words || []).length;
      if (n < LIMITS.wordsMin || n > LIMITS.wordsMax) errs.push(at + ': ' + n + ' Wörter (erlaubt ' + LIMITS.wordsMin + '–' + LIMITS.wordsMax + ')');
      const en = new Set();
      (u.words || []).forEach((w, i) => {
        const wh = at + '#' + i + ' "' + w[0] + '"';
        if (!w[0] || !w[1]) errs.push(wh + ': Englisch oder Deutsch fehlt');
        if (en.has(String(w[0]).toLowerCase())) errs.push(wh + ': Dublette in der Einheit');
        en.add(String(w[0]).toLowerCase());
        checkMeta(w[4], wh, errs);
        if (w[3] && w[4] && w[4].ex) checkMeta(w[4].ex, wh + ' (Beispielsatz)', errs);
        else if (w[3]) errs.push(wh + ': Beispielsatz ohne Herkunft (meta.ex)');
      });
      perUnit[u.id] = { sent: 0 };
    }
    d.sentences.forEach((s, i) => {
      const sh = f + ' Satz ' + i + ' "' + String(s[2]).slice(0, 30) + '"';
      if (s[0] !== 'business' || STUFEN.indexOf(s[1]) < 0) errs.push(sh + ': track/Stufe falsch');
      const wc = String(s[2]).trim().split(/\s+/).length;
      if (wc < LIMITS.sentWordsMin || wc > LIMITS.sentWordsMax) errs.push(sh + ': ' + wc + ' Wörter (erlaubt ' + LIMITS.sentWordsMin + '–' + LIMITS.sentWordsMax + ')');
      if (!s[3] || !s[4]) errs.push(sh + ': Deutsch oder Regel fehlt');
      checkMeta(s[5], sh, errs);
      const uid = s[5] && s[5].unit;
      if (!uid) errs.push(sh + ': meta.unit fehlt (Zuordnung zur Einheit)'); else if (perUnit[uid]) perUnit[uid].sent++;
    });
  }
  Object.keys(perUnit).forEach(id => { const n = perUnit[id].sent; if (n < LIMITS.sentMin || n > LIMITS.sentMax) errs.push(id + ': ' + n + ' Sätze (erlaubt ' + LIMITS.sentMin + '–' + LIMITS.sentMax + ')'); });
  return { errs, warns };
}
module.exports = { SOURCES, STUFEN, LIMITS, validate, load, checkMeta };
