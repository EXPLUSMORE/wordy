# Offene Business-Einheiten erzeugen

Werkzeug: `tools/import_open.js`. Themen und Stufen: `themes.json` (Entwurf). Eigene Sätze: `own-sentences.json`.

## Rohdaten (liegen lokal, z. B. `private/raw/`, nie im Repository)

| Datei | Quelle | Erwartetes Format (Annahme, am echten Datensatz prüfen) |
|---|---|---|
| `ngsl.csv` | NGSL | Kopfzeile, Spalte `Lemma`/`Word` und optional `Rank`; Trenner `,` `;` oder Tab |
| `bsl.csv` | BSL | wie NGSL |
| `wiktextract.jsonl` | Wiktextract-Auszug des englischen Wiktionary | je Zeile ein JSON-Objekt mit `word`, `lang_code`, `pos`, `senses[]` (`glosses`, `topics`, `categories`), `sounds[]` (`ipa`), `translations[]` (`lang_code`, `word`, `tags`, `sense`) |
| `tatoeba/sentences_detailed.tsv` | Tatoeba-Export | Tab-getrennt: id, Sprache, Text, Benutzer, … |
| `tatoeba/links.tsv` | Tatoeba-Export | id1, id2 |
| `tatoeba/sentences_CC0.tsv` | Tatoeba-Export (optional) | erste Spalte = Satz-ID mit CC0-Lizenz; alle anderen gelten als CC BY 2.0 FR |

Offizielle Seiten: NGSL/BSL https://www.newgeneralservicelist.org/ · Wiktextract-Daten https://kaikki.org/ (Quelle: Wiktionary) · Tatoeba https://tatoeba.org/de/downloads · Open English WordNet https://en-word.net/. Die Lizenz ist vor dem Abruf auf der jeweiligen Seite zu bestätigen.

## Ablauf

1. `node tools/import_open.js --raw private/raw --unit b-39 --dry` zeigt Kandidaten (Wort, Übersetzung, Wortart, Lautschrift, gewählte Bedeutung, Rang). Unsicheres steht in `private/open-report.json`.
2. Ohne `--dry` wird `data/open/business-<stufe>.js` und `data/open/saetze-open.js` geschrieben, aber nur, wenn die Prüfung bestanden ist.
3. `node tools/gen_sources.js`, dann `node build.js`.

Reihenfolge ist append-only (`lock.json`): Wort- und Satzpositionen ändern sich nach dem Erzeugen nicht, damit Lernstand (`b-NN#Position`) und Satz-IDs (`s<Index>`) stabil bleiben.
