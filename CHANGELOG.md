# Änderungsprotokoll

Versionsnummer nach dem Schema **Hauptversion.Nebenversion.Fehlerkorrektur**:

- **Hauptversion** – große Umbauten oder Brüche (z. B. neues Speicherformat).
- **Nebenversion** – neue Funktionen (neuer Aufgabentyp, neue Rubrik, neue Shop-Kategorie).
- **Fehlerkorrektur** – Korrekturen und kleine Anpassungen.

Die Nummer steht nur in `package.json` (`version`) und wird bei jeder ausgelieferten Änderung hochgezählt (Funktion = Nebenversion, Korrektur = Fehlerkorrektur). `node build.js` übernimmt sie in die App,
sie erscheint unten im Setup zusammen mit der Build-Kennung (wechselt bei jeder Codeänderung).

## 1.7.0 – 2026-10-06

- **Wochenziele von den Eltern:** Im Dashboard festgelegt (Minuten, Übungstage, neue Wörter oder eine Einheit zu x % sicher), mit Bonusmünzen. Die App zeigt sie auf der Startseite mit Fortschritt und schreibt die Münzen automatisch gut.
- **Lernplan für Klassenarbeiten:** Datum und Einheiten festlegen, die App zeigt „Heute dran“ und übt gezielt nur diese Einheiten. Bonus bei 90 % sicher.
- **Dashboard:** Einzelansicht pro Einheit mit allen Wörtern und ihrem Stand, Wochenmail (Zeitplan, Testversand), Tab-Titel „Wordy Lernfortschritt“.
- Server: neue Schnittstelle zum Abholen der Ziele, Mailversand ohne Zusatzpakete.

## 1.6.0 – 2026-10-05

- **Eltern-Dashboard (Grundlage):** Neuer Ordner `server/` mit Server (Node, SQLite) und Dashboard. Die App sendet auf Wunsch den Lernverlauf: beantwortete Aufgaben, Runden, Käufe, Stand der Wörter und Einheiten. Verbindung per Einladungscode unter Setup → Eltern-Dashboard, optional und offline-sicher.

## 1.5.0 – 2026-10-05

- **Tempo beim Vorlesen:** „Alle vorlesen“ liest jedes Wort einzeln mit Pause dazwischen. Neue Auswahl in den Einstellungen: Schnell, Mittel (Standard), Langsam. Der Knopf wird zum „Stopp“.

## 1.4.2 – 2026-10-05

- **Schulbuch zuerst:** „Headlight 2“ steht in Auswahl und Liste ganz oben und ist für alle Profile (einmalig) vorgewählt. Die Klassen 6 bis 8 lassen sich optional dazuschalten.

## 1.4.1 – 2026-10-05

- Bestehende Profile mit Klasse 6 bekommen „Headlight 2“ einmalig automatisch dazugewählt (danach frei abwählbar).

## 1.4.0 – 2026-10-05

- **Eigenes „Schuljahr“ Headlight 2:** Die offiziellen Buch-Units stehen getrennt von Klasse 6 und lassen sich gezielt allein üben (Auswahl oben bei „Schuljahr“).
- Headlight 2, Unit 5 und 6 ergänzt (jetzt Unit 1–6, 17 Einheiten).

## 1.3.1 – 2026-10-05

- **Buchkachel:** Die Headlight-2-Einheiten stehen unter einem selbst gezeichneten Buchcover mit Gesamtfortschritt.

## 1.3.0 – 2026-10-05

- **Headlight 2, Unit 4 „Feeling good“** (S. 217–221) als 3 weitere Einheiten.

## 1.2.0 – 2026-10-05

- **Schulbuch Headlight 2 (Klasse 6):** Vocabulary Unit 1–3 (S. 202–216) als 10 Einheiten unter „Einheiten“ erfasst, mit Beispielsätzen.

## 1.1.1 – 2026-10-05

- **Fehlerkorrektur: Updates kamen auf Geräten nicht an.** Seit dem neuen Symbol hatte der Offline-Cache einen festen Namen, deshalb erkannten Geräte keine neue Version mehr. Die Build-Kennung wird wieder aus dem Inhalt berechnet und der Build bricht ab, wenn sie ungültig ist.
- Setup: „Nach Updates suchen“ und „App-Cache leeren“ (Lernstand bleibt erhalten); Version und Build jetzt auch in der Einzeldatei `wordy.html`
- How-to um Missionen und Sticker erweitert (zehn Schritte)

## 1.1.0 – 2026-10-05

- „Münzen heute“ im Fortschritt: Quellen, Tageslimit der Arena, nächster Serien-Bonus, Regeln
- Neues App-Symbol (Clombo als Sticker mit W-O-R-D-Y-Kacheln), alle Größen
- How-to im Setup (eingeklappt): Modi, Wörter aussuchen, Verben, Arena, Münzen, Missionen, Sticker
- Updates: Die App lädt sich im Leerlauf selbst neu; Setup zeigt Version und Build

## 1.0.0 – 2026-10-05

Erste ausgezeichnete Version.

- Vokabeltrainer mit 1440 Vokabeln (Schule Klasse 6–8, Business, Redewendungen), Satzbau, Arena, Wiederholungsplanung
- Mehrere Spieler mit getrennten Lernständen, automatische Sicherung, Offline-Betrieb und Installation als App
- Unregelmäßige Verben mit Beispielsätzen, Lückenaufgabe und Tippen
- Shop mit Figuren, Stickern, Rahmen, Titeln, Hintergründen, Effekten, Tönen und Farben, Sammelalbum und Stickerbuch, Fortnite-Sammlung
- Belohnungssystem für echten Fortschritt, Wunschkarte, Missionen, Ränge bis Unreal Gold
- Animationen nach der Lektion
