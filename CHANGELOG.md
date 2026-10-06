# Änderungsprotokoll

Versionsnummer nach dem Schema **Hauptversion.Nebenversion.Fehlerkorrektur**:

- **Hauptversion** – große Umbauten oder Brüche (z. B. neues Speicherformat).
- **Nebenversion** – neue Funktionen (neuer Aufgabentyp, neue Rubrik, neue Shop-Kategorie).
- **Fehlerkorrektur** – Korrekturen und kleine Anpassungen.

Die Nummer steht nur in `package.json` (`version`) und wird bei jeder ausgelieferten Änderung hochgezählt (Funktion = Nebenversion, Korrektur = Fehlerkorrektur). `node build.js` übernimmt sie in die App,
sie erscheint unten im Setup zusammen mit der Build-Kennung (wechselt bei jeder Codeänderung).

## 2.9.1 – 2026-10-06

- Server: `deploy.sh` testet und sichert jetzt mit demselben Node wie der Dienst (aus dessen systemd-Datei, sonst `NODE_BIN`), nicht mit dem alten System-Node. Behebt, dass der Selbsttest auf dem Server mit `MODULE_NOT_FOUND` (node:child_process) scheiterte und Stände abgelehnt wurden.

## 2.9.0 – 2026-10-06

- Ziele und Lernpläne im Dashboard: Die Einheiten-Auswahl enthält jetzt **alle** Einheiten (Headlight 2, Klassen 6–8, Business Basis/Aufbau/Profi/Smalltalk/Redewendungen, eigene Listen). Bisher fehlten die Business-Einheiten, und ein frisches Profil ohne Lernstand sendete gar keine Einheitenliste. Die Liste und die Wörter der Einheiten werden jetzt auch von einem leeren Profil gesendet (Wörter und Übersicht weiterhin nicht, damit nichts überschrieben wird). Dashboard: Einheiten in sinnvoller Reihenfolge (Headlight 2, 6, 7, 8, Basis, Aufbau, Profi, Smalltalk, Redewendungen, Eigene Listen). Die App muss einmal geöffnet werden, damit die Liste ankommt; für die Reihenfolge ist ein **Server-Update** nötig (läuft automatisch).

## 2.8.0 – 2026-10-06

- Start: Jedes offene Wochenziel hat jetzt einen Knopf „Jetzt üben →“, der direkt eine passende Runde startet: Minuten-Ziel = gemischte Runde in der Länge des Rests (5 bis 15 Min.), Tage-Ziel = Runde in Tagesziel-Länge (mind. 5 Min.), Neue-Wörter-Ziel = Runde mit neuen Wörtern, Einheiten-Ziel = Runde aus den Wörtern dieser Einheit. Lernpläne hatten den Knopf „Lernplan üben“ schon. Geschaffte Ziele zeigen keinen Knopf.

## 2.7.2 – 2026-10-06

- Server: `deploy.sh` findet den Git-Ordner jetzt ohne Git (als root meldete Git bei fremdem Besitzer „dubious ownership“ und das Skript brach mit „kein Git-Ordner“ ab). Mit Besitzer-Wechsel (root führt aus, Dateien gehören `wordy`) getestet.

## 2.7.1 – 2026-10-06

- Dashboard: Am Ende steht „Server-Version … · Stand (Git) … · Dienst gestartet …“, damit man sieht, was auf dem Server wirklich läuft. Neuer Endpunkt `GET /api/admin/info`. **Server-Update nötig.**

## 2.7.0 – 2026-10-06

- Server: Automatische Updates per Pull. `server/deploy.sh` mit systemd-Timer (alle 5 Minuten) holt neue Stände aus GitHub, führt den Selbsttest aus, sichert die Datenbank, startet den Dienst neu und prüft `/healthz`; bei Fehlern automatisch zurück auf den alten Stand. Optional nur freigegebene Tags (`DEPLOY_MODE=tag`). Anleitung in `server/README.md`. **Einmalige Einrichtung auf dem Server nötig.**

## 2.6.0 – 2026-10-06

- Dashboard: Neue Karte „Tage einzeln“ – jeder Tag der gewählten Zeitspanne (14/30/90) als Zeile mit Balken, Zeit, Aufgaben und Richtig-Quote; Tage ohne Üben sind sichtbar. Antippen zeigt Runden mit Uhrzeit und Art sowie die Fehlerwörter des Tages. Darüber eine Muster-Zeile (aktive Tage, Schnitt, Tagesziel-Tage, Aufgaben/Runde, übliche Uhrzeit, Arten, längste Pause). **Server-Update nötig.**

## 2.5.0 – 2026-10-06

- Dashboard: Neue Karten „Heute · Datum“ (geübte Zeit mit Tagesziel-Balken, Aufgaben, richtig %, neue Wörter, Münzen, Runden mit Uhrzeit, Fehlerwörter heute) und „Woche · Mo bis So“ (Kalenderwoche mit Daten von–bis, Zeit/Aufgaben/neue Wörter mit Vergleich zur Vorwoche, Tagesbalken Mo–So mit Tagesziel-Markierung, Fehlerwörter der Woche). **Server-Update nötig.**

## 2.4.1 – 2026-10-06

- Update-Sicherheit: Die Skripte der Website tragen jetzt die Build-Kennung (`?v=…`) in der Adresse. Eine neue Seite holt dadurch immer die passenden Dateien statt alter aus dem Cache. Behebt, dass Setup die neue Version anzeigte, die Oberfläche aber noch die alte war (z. B. fehlte die Wunsch-Silhouette).

## 2.4.0 – 2026-10-06

- Wunsch als Silhouette: Auf dem Start-Tab (Heute) und im Shop (Karte „Dein Wunsch“) erscheint das Wunsch-Element zuerst grau und füllt sich mit dem Fortschritt von unten mit Farbe. Fehlt noch Rang-XP, zeigt ein 🔒 das an. Hell und Dunkel unterstützt.

## 2.3.1 – 2026-10-06

- Smalltalk: „how did you two meet“ heißt jetzt „Wie haben Sie sich kennengelernt?“.

## 2.3.0 – 2026-10-06

- App: Der Zeitpunkt, an dem ein Wort „gemeistert“ wird, wird gespeichert. Die Wörterliste zeigt „… und X Wörter gemeistert 🎉“ für die letzten 7 Tage (gilt für Wörter, die ab jetzt gemeistert werden).
- Server/Dashboard: Neue Karte „Alle Wörter“ mit Suche, Filtern (Schwierig, Diese Woche gemeistert, Gemeistert, Noch nicht geübt) und Sortierung nach Fehlern, Fehlerquote, zuletzt geübt oder A–Z. Neuer Endpunkt `GET /api/admin/players/:id/words`. **Server-Update nötig.**

## 2.2.0 – 2026-10-06

- Fortschritt > Wörter: Verteilung (Neu bis Gemeistert) und eine Liste aller geübten Wörter mit Suche (englisch/deutsch) und Filtern „Schwierig“, „Gerade gelernt“, „Lange nicht geübt“ und „Gemeistert“. Pro Wort: Stufe, zuletzt geübt, nächste Wiederholung, Treffer und Fehler. Zeile „In den letzten 7 Tagen X Wörter geübt“.

## 2.1.0 – 2026-10-06

- Headlight 2 hat jetzt eigene Sätze (123, passend zu Unit 1–6: simple past, Vergleiche, if-Sätze, present perfect, will-Future …). Bisher wurden die Sätze der Klasse 6 genutzt; sie bleiben der Rückfall, falls ein Buch keine eigenen Sätze hat.
- Üben: Die Kacheln (Neue Wörter, Fehlerkartei, Sätze, Verben, Gezielt üben) zeigen jetzt die ungefähre Aufgabenzahl und folgen der Dauerwahl (3/5/10/15 Min), statt fest 5 Minuten zu nehmen.

## 2.0.4 – 2026-10-06

- Satzbau: rund 570 neue Sätze – jetzt mindestens 100 pro Klasse (6/7/8) und pro Business-Gruppe (Basis, Aufbau, Profi, Smalltalk, Redewendungen). Bestehende Sätze und ihr Lernstand bleiben unverändert.

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
