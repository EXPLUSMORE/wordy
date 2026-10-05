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
js/engine.js    Lernmotor: Speicherung, Wiederholungsplanung, Statistik, Shop-Katalog
js/cosmetics.js Zeichnungen, Effekte und Töne der Sammelobjekte
js/app.js       Oberfläche und Aufgabentypen
js/arena.js     Die vier Zeitmodi
data/*.js       Vokabeln, Sätze und Verben (reine Daten, keine Logik)
data/lernbuch.js  Vokabeln aus dem Schulbuch, seitenweise erfasst
data/verben.js  unregelmäßige Verben (Infinitiv, Past, Participle)
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

### Unregelmäßige Verben
Eigene Rubrik mit 108 Verben der Schule (`data/verben.js`), Stufe 1–3 nach
Häufigkeit. Abgefragt werden Simple Past (Präteritum) und Past Participle (Partizip Perfekt), beides muss
stimmen; mehrere gültige Formen (learnt/learned) stehen mit `/`. Neue Verben
bekommen erst eine Einführungskarte. Geübt wird mit „Verben üben“ (Start,
Einheiten) oder automatisch: in normalen Schulrunden kommt etwa jede achte
Aufgabe ein Verb, bevorzugt fällige und fehlerhafte. Zu jedem Verb gibt es drei
Beispielsätze mit Übersetzung, Zeitwort-Hinweis und Vorlesen (Präsens, Simple
Past, Present Perfect). Neben dem Tippen gibt es die Lückenaufgabe „Welche Form passt?“:
ein Satz mit Zeitwort, aus drei bis vier Formen (auch der falsch regelmäßigen wie
*goed*) wählt man die richtige. „Nur Tippen“ fragt immer beide Formen zum Schreiben ab, auch für ein einzelnes
Verb aus der Liste. Die Verbenliste zeigt
alle Verben mit Lernstufe; der Lernstand liegt im selben Speicher wie die Wörter.

### Vokabeln aus dem Schulbuch
Fotos der Heftseiten oder Kapitel schicken; die Vokabeln werden als Einheiten in
`data/lernbuch.js` eingetragen (Titel mit Buch, Unit und Seite, Schuljahr `k`)
und erscheinen danach unter „Einheiten“ im passenden Jahrgang.

### Münzen und Missionen
Münzen gibt es für **Fortschritt, nicht für Antworten**: neues Wort (+1), Stufe
höher (+1, Gemeistert +4), Wort aus der Fehlerkartei gelöst (+2), neue Einheit
entdeckt (+8, ab fünf Wörtern), Einheit geschafft (+30, alle mindestens
„Geübt“; Verben +60), Serien-Bonus bei 3, 7, 14, 30, 60 und 100 Tagen. Jedes Wort
zahlt höchstens einmal pro Tag und nur, wenn es fällig war, dasselbe Wort immer
wieder zu üben bringt also nichts. Dazu Missionen (drei pro Tag, „x
verschiedene Wörter“ statt Aufgaben), das Tagesziel (+20) und die Arena (höchstens
30 pro Tag). Die Startseite zeigt den **Wunsch** (⭐ im Shop oder Tippen auf ein
gesperrtes Album-Feld) mit Fortschrittsbalken; nach jeder Runde steht da,
wofür es Münzen gab.

### Shop und Sammelalbum
Münzen gibt es nur für Aussehen. Der Shop (Fortschritt) hat sieben Reiter:
Figuren (Emojis und gezeichnete Pummelfiguren, die seltenen erst ab einem
Mindestrang), Rahmen, Titel, Hintergründe, Effekte bei richtigen Antworten
(Konfetti, Sternenregen, Funken, Feuerwerk am Rundenende), Töne und Farben.
Das Sammelalbum zeigt alle Figuren, noch fehlende grau. Jede Figur gibt es
zusätzlich als **Sticker** (halber Preis, Stanzrand, bei seltenen Figuren und
Clombo mit Glanz); bis zu drei davon klebt man im Stickerbuch auf Startseite und
Profil. Katalog und
Preise stehen in `js/engine.js` (`SHOP`), das Aussehen in `js/cosmetics.js`.

### Fortnite-Sammlung
Eigene Zeichnungen (Fan-Art, keine Originalgrafiken, `js/fortnite.js`): Tiere ab
Rang Gold II, Rang-Kristalle ab Elite und Champion, die Unreal-Stücke erst ab
Unreal. Jede Figur gibt es als Album-Figur und als Sticker; eigener Shop-Reiter
„Fortnite“, Fortnite-Album und Fortnite-Stickerbuch.

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
