#!/usr/bin/env node
/* Dublettenprüfung für neue Vokabeln: vergleicht englische Einträge (Kandidaten-JSON: { "unit-id": { words: [[en, de, ...], ...] } } oder own-units.json)
   mit ALLEN vorhandenen Wörtern (data/*.js, data/open/*.js) und untereinander. Aufruf: node tools/dupcheck.js <datei.json> [--quiet] */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
function norm(s) {
  return String(s).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\bsb\.?\/sth\.?|\bsb\.?|\bsth\.?|\bsomeone\b|\bsomething\b|…|\.\.\./g, ' ')
    .replace(/^(to|a|an|the)\s+/, '').replace(/[-–—'’".,!?;:/]/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/\b(\w+?)(ies)\b/g, '$1y').replace(/\b(\w{3,}?)s\b/g, '$1');
}
function loadAll(ignoreUnit) {
  const have = new Map();   // norm -> [ "wo" ]
  const add = (en, where) => { const k = norm(en); if (!k) return; if (!have.has(k)) have.set(k, []); have.get(k).push(where + ': ' + en); };
  const files = []; ['data', 'data/open'].forEach(d => fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.js')).forEach(f => files.push(path.join(ROOT, d, f))));
  for (const f of files) {
    if (/saetze|grammatik|alternativen|lernbuch\.js$/.test(f) && !/lernbuch/.test(f)) continue;
    const ctx = { window: {} }; ctx.window.window = ctx.window; vm.createContext(ctx);
    try { vm.runInContext(fs.readFileSync(f, 'utf8'), ctx); } catch (e) { continue; }
    (ctx.window.VOCAB_UNITS || []).forEach(u => { if (ignoreUnit && ignoreUnit(u.id)) return; (u.words || []).forEach(w => add(w[0], path.basename(f) + ' ' + u.id)); });
    (ctx.window.VERBS || []).forEach(v => add(v.inf || v[0] || '', path.basename(f) + ' Verb'));
  }
  return have;
}
if (require.main === module) {
  const file = process.argv[2]; if (!file) { console.error('Aufruf: node tools/dupcheck.js <datei.json>'); process.exit(2); }
  const ig = process.argv.find(a => a.startsWith('--ignore-new=')), igr = ig ? ig.split('=')[1].split('-').map(Number) : null;
  const data = JSON.parse(fs.readFileSync(file, 'utf8')), have = loadAll(igr ? (id => { const m = /^b-(\d+)$/.exec(id); return !!m && +m[1] >= igr[0] && +m[1] <= igr[1]; }) : null), seen = new Map(); let bad = 0, n = 0; const keepFile = (process.argv.find(a => a.startsWith('--keep=')) || '').slice(7), kept = {};
  for (const id of Object.keys(data)) { if (id[0] === '_') continue;
    (data[id].words || []).forEach(w => { n++; const k = norm(w[0]); const before = bad;
      if (have.has(k)) { const biz = have.get(k).filter(x => !/^(klasse|lernbuch)/.test(x)); if (biz.length) { bad++; console.log('ALT   ' + id + ' "' + w[0] + '" = ' + biz[0]); } else console.log('SCHULE ' + id + ' "' + w[0] + '" steht nur im Schulwortschatz (' + have.get(k)[0] + ') – kein Fehler'); }
      else if (k.split(' ').length >= 2 && (() => { const sim = [...have.keys()].filter(h => h.split(' ').length >= 2 && ((' ' + h + ' ').includes(' ' + k + ' ') || (' ' + k + ' ').includes(' ' + h + ' '))); if (!sim.length) return false; bad++; console.log('ÄHNL. ' + id + ' "' + w[0] + '" ~ ' + have.get(sim[0])[0]); return true; })()) { }
      else if (seen.has(k)) { bad++; console.log('NEU   ' + id + ' "' + w[0] + '" doppelt mit ' + seen.get(k)); }
      if (bad === before) (kept[id] = kept[id] || { words: [] }).words.push(w);
      seen.set(k, id + ' "' + w[0] + '"'); }); }
  if (keepFile) fs.writeFileSync(keepFile, JSON.stringify(kept));
  console.log(n + ' geprüft, ' + bad + ' Dubletten'); process.exit(bad ? 1 : 0);
}
module.exports = { norm, loadAll };
