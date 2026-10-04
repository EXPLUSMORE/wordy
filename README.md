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
- Setup-Bereich mit Statistik, CSV-Import eigener Listen und
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

## Bedienung

### Zwei Lernbereiche
Oben in „Einheiten" (und in „Setup") lässt sich zwischen Schule und Business
umschalten. Beide führen getrennte Wortschätze, Sätze, Fehlerkarteien und
Statistiken; XP, Münzen, Streak und Abzeichen sind gemeinsam. Business hat
fünf Stufen, die einzeln zuschaltbar sind: Basis, Aufbau, Profi, Smalltalk
und Redewendungen.

### Lernlogik
SM-2-ähnliches Spaced-Repetition-Verfahren. Jedes Wort hat einen eigenen
Leichtigkeitsfaktor; richtige Antworten vergrößern den Wiederholungsabstand,
Fehler setzen ihn zurück und legen das Wort in die Fehlerkartei, die bei
gemischten Runden ein Viertel der Aufgaben stellt. Stufen: Neu → Angefangen
→ Geübt → Sitzt → Gemeistert (ab drei Wochen Abstand).

Ein Treffer in der Arena zählt als sichere, aber flache Wiederholung — er
schiebt das Wort eine Stufe weiter, ersetzt aber nicht das ruhige Training.
Ein Fehlgriff zählt voll.

### Aussprache
Über die Sprachausgabe des Browsers (Web Speech API), bevorzugt eine
britische Stimme. Lautsprecher gibt es auf der Wortkarte, in Auswahl- und
Rechtschreibaufgaben, nach jeder Antwort am Wort und am Beispielsatz, nach
jedem gebauten Satz und in jeder Zeile der Wortliste. Unter Setup →
Einstellungen lässt sich das abschalten und mit „Stimme testen" prüfen.
Auf iPhone und iPad muss der Ton einmal per Tippen freigegeben werden.

### Eigene Vokabeln
Setup → eigene Liste einfügen oder Datei laden:
`englisch;deutsch;beispielsatz` — Semikolon, Komma oder Tabulator, eine
Kopfzeile wird erkannt. Eigene Listen sind in beiden Bereichen aktiv.

### Lernstand
Liegt im `localStorage`, also pro Gerät und Browser getrennt. Gespeichert
wird nach jeder Antwort und beim Schließen oder Verlassen der App; dazu
kommt eine Sicherungskopie alle fünf Minuten sowie eine Kopie vor
Zurücksetzen, Einspielen und Wiederherstellen (Setup → Automatische
Sicherung). Ist der Hauptstand beschädigt, lädt die App die Kopie von
selbst. Der Browser wird zudem um dauerhaften Speicher gebeten. Umzug:
Setup → „Lernstand kopieren", auf dem anderen Gerät → „Lernstand
einspielen".

## Veröffentlichen

GitHub Pages liefert den Ordner `docs/` aus. Nach `node build.js` committen
und pushen, mehr ist nicht nötig — der Service Worker bekommt bei jeder
Inhaltsänderung automatisch eine neue Cache-Version und ersetzt die alte
beim nächsten Start.
