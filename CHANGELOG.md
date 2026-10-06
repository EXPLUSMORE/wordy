# Änderungsprotokoll

Versionsnummer nach dem Schema **Hauptversion.Nebenversion.Fehlerkorrektur**:

- **Hauptversion** – große Umbauten oder Brüche (z. B. neues Speicherformat).
- **Nebenversion** – neue Funktionen (neuer Aufgabentyp, neue Rubrik, neue Shop-Kategorie).
- **Fehlerkorrektur** – Korrekturen und kleine Anpassungen.

Die Nummer steht nur in `package.json` (`version`) und wird bei jeder ausgelieferten Änderung hochgezählt (Funktion = Nebenversion, Korrektur = Fehlerkorrektur). `node build.js` übernimmt sie in die App,
sie erscheint unten im Setup zusammen mit der Build-Kennung (wechselt bei jeder Codeänderung).

## 2.0.3 – 2026-10-06

- **Fehlerkorrektur: Sätze waren bei „Headlight 2“ leer.** Die Satzübungen gehören zu den Klassen, Headlight 2 hatte keine eigenen. Jetzt nutzt Headlight 2 die Sätze der Klasse 6, damit funktionieren die Kachel „Sätze“ und die Satzaufgaben in normalen Runden wieder.

## 2.0.2 – 2026-10-06

- **Aussprache:** Abkürzungen werden ausgeschrieben („agree with sb.“ → „agree with somebody“, „sth.“ → „something“, „e.g.“ → „for example“, „etc.“ → „et cetera“, „£10“ → „10 pounds“, „the 90s“ → „the nineties“). Klammern, Schrägstriche und deutsche Hinweise wie „(Nomen)“ oder „(Verb)“ werden nicht mehr mitgesprochen.

## 2.0.1 – 2026-10-06

- **Dauer ehrlicher:** Die Dauer auf Start ist kein Zeitlimit, sondern bestimmt die Rundenlänge. Unter den Dauer-Knöpfen steht jetzt „≈ 27 Aufgaben · ohne Zeitlimit“.
- **Eigenes Tempo:** Aus den fertig gespielten Runden lernt die App, wie schnell man pro Wort ist (ab 50 Wörtern), und plant die Aufgabenzahl danach. Bis dahin gilt die Schätzung von 11 Sekunden pro Wort.

## 2.0.0 – 2026-10-06

**Neues Menü, aufgeräumte Seiten.** Vier Reiter: Start · Üben · Fortschritt · Shop. Das Setup erreichst du über das Zahnrad ⚙️ oben rechts.

- **Start:** Die App schlägt die beste Runde für heute vor (Lernplan, Fehlerkartei, Wiederholung, neue Wörter oder Weiterlernen) und startet sie mit einem Knopf. Dauer wählbar. Missionen und Wunsch in einer Karte.
- **Üben:** Arena und Einheiten sind zusammengezogen. **Spielmodi** (Lernen, Spielen, Gezielt üben) und **Einheiten** (nach Buch bzw. Schuljahr einklappbar, Unregelmäßige Verben eingeklappt).
- **Gezielt üben (neu):** Nur Hören, Tippen, Lücken oder Zuordnen, auch pro Einheit.
- **Fortschritt:** Drei Ansichten (Übersicht, Wörter, Verlauf). „Lernstand im Überblick“, „Einheiten mit dem größten Rückstand“ und „Schwierigste Wörter“ sind aus dem Setup hierher gezogen.
- **Shop & Abzeichen:** Eigener Reiter mit Shop, Sammlung (Alben und Stickerbuch), Abzeichen und Rängen.
- **Setup:** Aufklappbare Gruppen (Spieler & Lernbereich, Lernen, Ton & Aussehen, Auto-Save, Eigene Vokabeln, Über Wordy).
- Anleitung („So funktioniert Wordy“) an die neue Struktur angepasst.

## 1.9.3 – 2026-10-06

- **Setup aufgeräumt:** Die Karten „Auto-Save / Lernfortschritt“, „Automatische Sicherung“ und „Sichern & übertragen“ sind eine Karte mit drei Teilen: 🌐 Auf dem Server, 📱 Auf diesem Gerät und eingeklappt „Manuell sichern oder auf ein anderes Gerät übertragen“ (dort auch „Fortschritt zurücksetzen“).

## 1.9.2 – 2026-10-06

- **Tageswechsel um Mitternacht:** Missionen, Tagesziel und Serie wechselten bisher nach UTC, also um 1 Uhr (Winter) bzw. 2 Uhr (Sommer) nachts. Jetzt zählt der Kalendertag in der Ortszeit des Geräts.
- Startseite: „Deine persönlichen Wochenziele“.

## 1.9.1 – 2026-10-06

- Setup: Die Karte „Eltern-Dashboard“ heißt jetzt „Auto-Save / Lernfortschritt“, der Text lautet „Der Fortschritt wird gespeichert.“

## 1.9.0 – 2026-10-06

- **„Nur sichern, nicht anzeigen“:** Beim Anlegen eines Spielers im Dashboard wählbar (oder später per „Nur sichern“). Der Server speichert dann nur den Lernstand als Sicherung, keine Antworten, Zeiten oder Ziele. Der Spieler taucht weder in der Übersicht noch in der Wochenmail auf. Unter „＋ Spieler“ lassen sich Code, Download, Anzeigen und Löschen für ihn verwalten. Die App zeigt „nur Sicherung“ an.

## 1.8.0 – 2026-10-06

- **Lernstand-Sicherung auf dem Server:** Die App sichert nach jeder Runde den kompletten Stand (Wörter, Münzen, Shop, Einstellungen). Die letzten 30 Tage bleiben erhalten.
- **Wiederherstellen:** Beim Verbinden eines leeren Geräts bietet die App die Sicherung an. Außerdem unter Setup → Auto-Save / Lernfortschritt → „Lernstand wiederherstellen“ (Sicherung nach Tag wählbar).
- **Schutz:** Ein leerer Stand (neues Gerät, gelöschte Daten) überschreibt weder die Sicherung noch die Fortschrittsübersicht im Dashboard.
- Dashboard: Karte „Lernstand-Sicherung“ mit Download jedes Standes als Datei.

## 1.7.0 – 2026-10-06

- **Wochenziele von den Eltern:** Im Dashboard festgelegt (Minuten, Übungstage, neue Wörter oder eine Einheit zu x % sicher), mit Bonusmünzen. Die App zeigt sie auf der Startseite mit Fortschritt und schreibt die Münzen automatisch gut.
- **Lernplan für Klassenarbeiten:** Datum und Einheiten festlegen, die App zeigt „Heute dran“ und übt gezielt nur diese Einheiten. Bonus bei 90 % sicher.
- **Dashboard:** Einzelansicht pro Einheit mit allen Wörtern und ihrem Stand, Wochenmail (Zeitplan, Testversand), Tab-Titel „Wordy Lernfortschritt“.
- Server: neue Schnittstelle zum Abholen der Ziele, Mailversand ohne Zusatzpakete.

## 1.6.0 – 2026-10-05

- **Eltern-Dashboard (Grundlage):** Neuer Ordner `server/` mit Server (Node, SQLite) und Dashboard. Die App sendet auf Wunsch den Lernverlauf: beantwortete Aufgaben, Runden, Käufe, Stand der Wörter und Einheiten. Verbindung per Einladungscode unter Setup → Auto-Save / Lernfortschritt, optional und offline-sicher.

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
