# Wordy

Englisch-Vokabeltrainer für Schule und Beruf. Läuft vollständig im Browser,
ohne Server, ohne Konto, ohne Datenübertragung — der Lernstand liegt im
`localStorage` des Geräts.

**Live: https://wordy.explusmore.com**

## Was drin ist

- **1440 Vokabeln** in 96 thematischen Einheiten
  - Schule, Klasse 6–8: 540 Wörter in 36 Einheiten
  - Business English: 720 Wörter in 48 Einheiten, vier Stufen
    (Basis, Aufbau, Profi, Smalltalk)
  - Redewendungen: 180 Idiome in 12 Einheiten
- **225 Sätze** für die Satzbauübung, je mit deutscher Entsprechung und der
  Grammatikregel, die dahintersteckt
- **Neun Aufgabentypen**: Wortkarte, Englisch→Deutsch, Deutsch→Englisch,
  Hörverständnis, Lückentext, Rechtschreibung, Zuordnen, „Was passt nicht“,
  Satzbau
- **Arena** mit vier Zeitmodi: Match-Rausch, Blitzrunde, Letztes Herz,
  Fehlerjagd
- **Spaced Repetition** nach SM-2 mit eigener Fehlerkartei
- Eltern-/Lehrerbereich mit Statistik, CSV-Import eigener Listen und
  Export des Lernstands
- Installierbar als App, funktioniert offline

## Aufbau

```
index.html      Quelle: Markup und Stylesheet
js/engine.js    Lernmotor: Speicherung, Wiederholungsplanung, Statistik
js/app.js       Oberfläche und Aufgabentypen
js/arena.js     Die vier Zeitmodi
data/*.js       Vokabeln und Sätze (reine Daten, keine Logik)
icons/          App-Symbole
build.js        erzeugt docs/ und wordy.html
docs/           gebaute Website, von GitHub Pages ausgeliefert
wordy.html      alles in einer Datei, zum Weitergeben ohne Server
```

Nach einer Änderung an `index.html`, `js/` oder `data/`:

```sh
node build.js
```

Das schreibt `docs/` neu, erzeugt den Service Worker mit einer neuen
Cache-Version und baut die Einzeldatei.

## Datenformat

Vokabel: `["englisch", "deutsch", Schwierigkeit 1-3, "Beispielsatz"]`
Der Beispielsatz muss das englische Wort enthalten — daraus entstehen
Lückentext und Hörsatz.

Satz: `[track, gruppe, "englischer Satz", "deutsche Fassung", "Regel"]`

## Lizenz

Privates Projekt, keine Lizenz vergeben.
