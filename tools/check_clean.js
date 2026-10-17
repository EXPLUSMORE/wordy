#!/usr/bin/env node
/* Prüft getrackte Dateien, docs/ und wordy.html gegen privat-blocklist.txt.
   Die Blocklist pflegt der Betreiber selbst; sie ist in .gitignore und wird nie committet.

   Aufruf:
     node tools/check_clean.js            Arbeitsverzeichnis: getrackte Dateien + docs/ + wordy.html
     node tools/check_clean.js --staged   Nur das, was gerade zum Commit vorgemerkt ist (pre-commit-Hook)
     node tools/check_clean.js --history  Gesamte Git-Historie (nur lesen, schreibt nichts um)
     --strict                             Fehlende Blocklist ist ein Fehler (sonst nur ein Hinweis)

   Format der Blocklist: ein Eintrag je Zeile, Groß-/Kleinschreibung egal, "#" beginnt einen Kommentar,
   "re:" davor = regulärer Ausdruck. Ausgegeben werden nur Datei, Zeile und die Nummer der Blocklist-Zeile,
   nie der Treffer selbst (damit die Begriffe nicht in Protokolle geraten).
   Ausgang 0 = sauber, 1 = Treffer, 2 = Aufruf/Lesefehler. */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2), has = a => args.includes(a);
const LIST = path.join(ROOT, 'privat-blocklist.txt');
const BIN = /\.(png|jpe?g|gif|webp|ico|mp3|wav|ogg|woff2?|ttf|otf|zip|gz|db|pdf)$/i;

function git(a, opt) { return cp.execFileSync('git', a, Object.assign({ cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }, opt || {})); }
function loadList() {
  if (!fs.existsSync(LIST)) return null;
  const out = [];
  fs.readFileSync(LIST, 'utf8').split(/\r?\n/).forEach((raw, i) => {
    const t = raw.replace(/(^|\s)#.*$/, '').trim(); if (!t) return;
    try { out.push({ n: i + 1, re: t.startsWith('re:') ? new RegExp(t.slice(3), 'i') : new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), src: t.startsWith('re:') ? t.slice(3) : t, rx: t.startsWith('re:') }); }
    catch (e) { console.error('Blocklist Zeile ' + (i + 1) + ': ungültiger Ausdruck'); process.exit(2); }
  });
  return out;
}
const list = loadList();
if (!list) {
  console.log('Hinweis: privat-blocklist.txt fehlt, die Prüfung auf private Inhalte wurde übersprungen.');
  process.exit(has('--strict') ? 1 : 0);
}
if (!list.length) { console.log('Hinweis: privat-blocklist.txt ist leer, nichts zu prüfen.'); process.exit(has('--strict') ? 1 : 0); }

const hits = [];
function scan(name, text) {
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) for (const b of list) if (b.re.test(lines[i])) hits.push(name + ':' + (i + 1) + ' (Blocklist-Zeile ' + b.n + ')');
}
function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); e.isDirectory() ? walk(p, acc) : acc.push(p); }
  return acc;
}

if (has('--history')) {
  /* Pickaxe-Suche (-G) je Eintrag über alle Zweige; Treffer = Commits, die den Begriff hinzufügen oder entfernen */
  const rows = [];
  for (const b of list) {
    const pat = b.rx ? b.src : b.src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let o = ''; try { o = git(['log', '--all', '-i', '-G', pat, '--format=%h %ad', '--date=short']); } catch (e) { console.error('git log fehlgeschlagen'); process.exit(2); }
    const c = o.split('\n').filter(Boolean); if (c.length) rows.push('Blocklist-Zeile ' + b.n + ': ' + c.length + ' Commit(s), ältester ' + c[c.length - 1] + ', neuester ' + c[0]);
  }
  if (!rows.length) { console.log('Historie sauber: kein Blocklist-Eintrag kommt in einem Commit vor.'); process.exit(0); }
  console.log('Treffer in der Git-Historie (nur Bericht, die Historie wird nicht verändert):'); rows.forEach(r => console.log('  ' + r)); process.exit(1);
}

if (has('--staged')) {
  let files = []; try { files = git(['diff', '--cached', '--name-only', '--diff-filter=ACM', '-z']).split('\0').filter(Boolean); } catch (e) { process.exit(2); }
  for (const f of files) { if (BIN.test(f) || f === 'privat-blocklist.txt') continue; let t = ''; try { t = git(['show', ':' + f]); } catch (e) { continue; } scan(f, t); }
} else {
  let files = []; try { files = git(['ls-files', '-z']).split('\0').filter(Boolean); } catch (e) { console.error('git ls-files fehlgeschlagen'); process.exit(2); }
  for (const extra of [path.join(ROOT, 'docs')]) if (fs.existsSync(extra)) walk(extra, []).forEach(p => files.push(path.relative(ROOT, p)));
  files.push('wordy.html');
  for (const f of new Set(files)) {
    const p = path.join(ROOT, f); if (BIN.test(f) || f === 'privat-blocklist.txt' || !fs.existsSync(p) || !fs.statSync(p).isFile()) continue;
    scan(f, fs.readFileSync(p, 'utf8'));
  }
}
if (hits.length) {
  console.error('FEHLER: Inhalte aus der Blocklist gefunden (' + hits.length + '):'); hits.slice(0, 200).forEach(h => console.error('  ' + h));
  if (hits.length > 200) console.error('  … und ' + (hits.length - 200) + ' weitere'); process.exit(1);
}
console.log('Prüfung auf private Inhalte: sauber (' + list.length + ' Blocklist-Einträge).');
