# Änderungsprotokoll

Versionsnummer nach dem Schema **Hauptversion.Nebenversion.Fehlerkorrektur**:

- **Hauptversion** – große Umbauten oder Brüche (z. B. neues Speicherformat).
- **Nebenversion** – neue Funktionen (neuer Aufgabentyp, neue Rubrik, neue Shop-Kategorie).
- **Fehlerkorrektur** – Korrekturen und kleine Anpassungen.

Die Nummer steht nur in `package.json` (`version`) und wird bei jeder ausgelieferten Änderung hochgezählt (Funktion = Nebenversion, Korrektur = Fehlerkorrektur). `node build.js` übernimmt sie in die App,
sie erscheint unten im Setup zusammen mit der Build-Kennung (wechselt bei jeder Codeänderung).

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
