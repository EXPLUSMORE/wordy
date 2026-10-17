#!/usr/bin/env node
/* Erzeugt SOURCES.md aus den Daten: Altbestand (ohne Herkunftsangaben) und offene Einheiten (data/open) mit Herkunft und Lizenz.
   Aufruf: node tools/gen_sources.js   (schreibt SOURCES.md; node build.js ruft es nicht auf) */
const fs = require('fs'), path = require('path');
const rules = require('./lib/open_rules.js');
const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);
const LEGACY = ['data/business.js', 'data/business-basis2.js', 'data/business-aufbau2.js', 'data/business-profi2.js', 'data/smalltalk.js', 'data/idioms.js'];
const OPEN = fs.existsSync('data/open') ? fs.readdirSync('data/open').filter(f => /\.js$/.test(f)).sort().map(f => 'data/open/' + f) : [];
const notes = fs.existsSync('tools/sources-status.json') ? JSON.parse(fs.readFileSync('tools/sources-status.json', 'utf8')) : {};   // { "b-37": { status:"geprüft|Entwurf|unsicher", note:"…" } }

let md = `# Quellen und Herkunft der Business-Vokabeln

Diese Datei wird mit \`node tools/gen_sources.js\` aus den Daten erzeugt. Rechtlich offene Punkte stehen unten unter „Offene Punkte“.

## Zugelassene Quellen (Whitelist)

| Kürzel | Quelle | Lizenz |
|---|---|---|
${Object.keys(rules.SOURCES).map(k => `| \`${k}\` | ${rules.SOURCES[k].name} | ${rules.SOURCES[k].lic.join(' / ')} |`).join('\n')}

Alles andere ist nicht zulässig. \`node build.js\` bricht ab, wenn ein Eintrag in \`data/open\` kein \`src\` und \`lic\` von dieser Liste hat.

## Altbestand (vor Einführung der Herkunftsangaben)

Diese Einheiten haben **keine** \`src\`/\`lic\`-Angaben. Ihre Herkunft ist nicht belegt; sie fallen nicht unter die Datenlizenz in LICENSE-DATA.md. Status: **ungeprüft, Entscheidung des Betreibers offen**.

| Datei | Einheiten (ID, Titel, Stufe, Wörter) |
|---|---|
`;
const ctx = f => rules.load(f).units;
for (const f of LEGACY) { const us = ctx(f); md += `| \`${f}\` | ${us.map(u => `${u.id} ${u.title} (${u.k}, ${u.words.length})`).join('; ')} |\n`; }

md += `\n## Offene Einheiten (data/open)\n\n`;
if (!OPEN.length) md += `_Noch keine._\n`; else {
  md += `| Einheit | Titel | Stufe | Wörter | Quellen der Wörter | Beispielsätze | Status |\n|---|---|---|---|---|---|---|\n`;
  for (const f of OPEN) for (const u of ctx(f)) {
    const cnt = (sel) => { const c = {}; u.words.forEach(w => { const k = sel(w); if (k) c[k] = (c[k] || 0) + 1; }); return Object.keys(c).sort().map(k => k + ' ' + c[k]).join(', ') || '-'; };
    const n = notes[u.id] || { status: 'Entwurf' };
    md += `| ${u.id} | ${u.icon} ${u.title} | ${u.k} | ${u.words.length} | ${cnt(w => w[4] && w[4].src)} | ${cnt(w => w[3] && w[4] && w[4].ex && w[4].ex.src)} | ${n.status}${n.note ? ': ' + n.note : ''} |\n`;
  }
}
md += `
## Offene Punkte (rechtlich und fachlich, keine Rechtsberatung)

- Altbestand ohne Herkunftsangaben: bleibt bis zu einer Entscheidung des Betreibers unverändert und ist nicht unter CC BY-SA 4.0 gestellt.
- BSL: Lizenz und Weitergabebedingungen vor der Aufnahme auf der Originalseite erneut prüfen und hier mit Datum eintragen.
- Tatoeba steht unter CC BY 2.0 FR (einzelne Sätze CC0). Ob Sätze unter dieser Lizenz in einer CC BY-SA 4.0-Sammlung weitergegeben werden dürfen, sollte jemand mit juristischer Fachkenntnis bestätigen.
- Tatoeba-Übersetzungen haben eigene Autoren: für Englisch und Deutsch werden Autor und Satznummer getrennt festgehalten.
- Wiktionary-Lautschrift und Übersetzungen: je Eintrag ist die gewählte Bedeutung (Sense) im Feld \`note\` der Einheit zu vermerken, wenn das Wort mehrdeutig ist.
`;
fs.writeFileSync('SOURCES.md', md);
console.log('SOURCES.md geschrieben (' + OPEN.length + ' offene Dateien).');
