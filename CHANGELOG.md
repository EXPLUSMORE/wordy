# Änderungsprotokoll

Versionsnummer nach dem Schema **Hauptversion.Nebenversion.Fehlerkorrektur**:

- **Hauptversion** – große Umbauten oder Brüche (z. B. neues Speicherformat).
- **Nebenversion** – neue Funktionen (neuer Aufgabentyp, neue Rubrik, neue Shop-Kategorie).
- **Fehlerkorrektur** – Korrekturen und kleine Anpassungen.

Die Nummer steht nur in `package.json` (`version`) und wird bei jeder ausgelieferten Änderung hochgezählt (Funktion = Nebenversion, Korrektur = Fehlerkorrektur). `node build.js` übernimmt sie in die App,
sie erscheint unten im Setup zusammen mit der Build-Kennung (wechselt bei jeder Codeänderung).

## 2.27.0 – 2026-10-07

- Einheiten sind überall nach Lernbereich und Gruppe geordnet: Schule (Headlight 2 als Schulbuch zuerst, dann Klasse 6, 7, 8), Business English (Basis bis Redewendungen), Eigene Vokabeln.
- Fortschritt: Eine Karte „Einheiten nach Gruppen“ ersetzt die beiden Rückstand-Karten. Jede Gruppe zeigt Gesamtbalken, „x % sicher“ und „Gruppe üben (5 Min.)“; darin zuerst angefangene, noch nicht gefestigte Einheiten, dann neue, zuletzt gefestigte.
- Dashboard: Fortschritt pro Einheit und alle Einheitenlisten (Ziele, Lernpläne, Lernpfad) mit Überschrift je Lernbereich; Headlight 2 als „Schulbuch“ benannt.

## 2.26.1 – 2026-10-07

- Fortschritt: „Einheiten mit dem größten Rückstand“ heißt jetzt „Angefangen, noch nicht gefestigt“, gemessen am Anteil sicherer Wörter (Stufe 3+), mit Angabe „x von y geübt · z sicher“; alle angefangenen Einheiten (sechs sichtbar, Rest aufklappbar). Neu: Gruppe „Noch nicht angefangen“ mit Üben-Knopf.

## 2.26.0 – 2026-10-07

- Fortschritt › Einheiten mit dem größten Rückstand: Jede Einheit hat einen „Üben“-Knopf (5 Minuten genau mit dieser Einheit).

## 2.25.1 – 2026-10-07

- Fortschritt: oben steht jetzt, um welchen Lernbereich es geht (Schule oder Business English).

## 2.25.0 – 2026-10-07

- Lernpfad (Schule): In jedem Abschnitt gibt es einmal unregelmäßige Verben, als fünfter Schritt „Unregelmäßige Verben" in der Station vor der Boss-Runde (je 4 Verben, fest verteilt, 25 Abschnitte = 100 Verben). Business hat keine Verben.
- Stationen mit Verben werden nur übersprungen, wenn auch die Verben schon sitzen.

## 2.24.0 – 2026-10-07

- Boss-Runden werden mitgeschrieben (Modus, Ziel, richtige Antworten, Versuch) und erscheinen im Dashboard in der Lernpfad-Karte mit Auswertung je Modus.
- Dashboard: Boss-Schwierigkeit leicht / normal / schwer (Ziel × 0,7 / 1 / 1,3), kommt per Sync in die App.
- Sanfte Hilfe: Nach zwei verfehlten Versuchen sinkt das Boss-Ziel um 1, nach vier um 2 (mindestens 3), offen angezeigt.

## 2.23.1 – 2026-10-07

- Weiter-Knopf nach der Antwort bleibt gesperrt, bis die Sprachausgabe fertig ist (höchstens 10 s), damit die Lösung wirklich gehört wird.

## 2.23.0 – 2026-10-07

- **Lernpfad zum Scrollen:** Auf dem Start-Tab zeigt der Pfad jetzt **alle Abschnitte** in einer scrollbaren Karte (der erste unten, der letzte oben). Beim Öffnen steht die aktuelle Station in der Mitte; „↧ zur aktuellen Station“ springt zurück. Jeder Abschnitt hat eine Kopfzeile mit Titel und Stand, die beim Scrollen oben kleben bleibt. Mit der Maus zeigt ein Hinweis beim Darüberfahren Station, Abschnitt, Sterne beziehungsweise bei der Boss-Runde Modus und Ziel; am Handy genügt das Antippen.
- **Alte Stationen und Bosse nochmal spielen:** Erledigte Stationen (auch Boss-Runden) lassen sich jederzeit antippen und wiederholen. Sterne verbessern sich, Fortschritt und Truhen bleiben unverändert (keine zweite Truhe). Gesperrte Stationen wackeln und sagen, was zuerst fehlt.

## 2.22.0 – 2026-10-07

- **Wochenzeitplan:** Im Dashboard (Karte „Wochenzeitplan“) legen die Eltern pro Wochentag fest, wie viele Minuten geübt werden sollen (0 = freier Tag), mit Schnellauswahl (Schultage, täglich, Wochenende frei). Der Plan gilt jede Woche gleich. Das Dashboard zeigt pro Tag geplant gegen geübt, Soll und Ist der Woche und die geschafften Plan-Tage. Dazu ein **Wochenbonus** in Münzen (0, 20, 30, 50; Standard 30) bei mindestens 80 % der Plan-Tage (aufgerundet, z. B. 4 von 5).
- App: Das Tagesziel richtet sich nach dem Plan des Tages („Heute laut Plan: 15 Min.“), Ring, Empfehlung und Tagesziel-Münzen eingeschlossen. Neue Karte „Deine Woche“ mit ✓ / ▶ / ○ / frei. Freie Tage unterbrechen die Serie nicht (kein Streak-Schutz nötig); wer an einem freien Tag übt, bekommt das normale Tagesziel. Ohne Plan bleibt alles wie bisher.
- Server: `GET/POST /api/admin/players/:id/weekplan`, der Plan kommt über `/api/sync` in die App. **Server-Update nötig.**

## 2.21.1 – 2026-10-07

- Dashboard „Fortschritt pro Einheit“: Einheiten im Lernpfad, mit denen noch nicht gelernt wurde, erscheinen grau („noch nicht begonnen“) mit ihren Abschnitten, in Pfad-Reihenfolge. Die App sendet dafür die Gruppe der Abschnitte mit (App-Update und **Server-Update** nötig).

## 2.21.0 – 2026-10-07

- Dashboard „Fortschritt pro Einheit“ neu gegliedert: Gruppen nach Schuljahr bzw. Business-Stufe (Headlight 2, Klassen, Basis, Aufbau, Profi, Smalltalk, Redewendungen, eigene Listen), aufklappbar; die Gruppe mit laufendem Lernen ist offen. Pro Gruppe Balken, Wörter begonnen/gemeistert und Lernpfad-Stationen, pro Einheit der Stand der Wörter und die Lernpfad-Abschnitte als Chips (✓ geschafft, ▶ begonnen, ⚔️ Boss besiegt, 🎁 Truhe geholt). Gesamtzeile oben. Die App sendet die Abschnitte mit; dafür ist die neue App-Version und ein **Server-Update** nötig.

## 2.20.0 – 2026-10-07

- **Boss-Runden im Lernpfad:** Die letzte Station jedes Abschnitts ist jetzt eine Boss-Runde in der Arena, reihum Match-Rausch (10 richtig), Blitzrunde (12 richtig) und Letztes Herz (7 richtig). Gespielt wird mit den Wörtern des ganzen Abschnitts (Fehlauswahl-Antworten kommen aus dem übrigen Stoff). Auf der Pfadkarte ist die Station mit ⚔️ markiert, ein Zähler „Boss 3 / 10“ zeigt den Stand. Geschafft ab der Mindestzahl richtiger Antworten (Sterne: 1 bei Ziel, 2 bei dem 1,5-fachen, 3 bei dem Doppelten), dann öffnet sich die Truhe. Sonst „Nochmal versuchen“, der Pfad bleibt bei der Boss-Runde. Boss-Runden zählen auch für die Arena-Tagesmission und den Lernstand der Wörter.

## 2.19.0 – 2026-10-07

- **Lernpfad auch für Business:** Wer „Business“ wählt, bekommt den Pfad mit den gewählten Stufen (Basis, Aufbau, Profi, Smalltalk, Redewendungen; je Einheit ein Abschnitt mit 2 Stationen und einer Truhe). Der Fortschritt hängt jetzt an den einzelnen Stationen (erste Station ohne Sterne ist dran), eine geänderte Auswahl kostet also keinen Fortschritt.
- **Dashboard → Lernpfad:** Fortschritt („X von Y Stationen“) und Auswahl der Einheiten, die im Pfad erscheinen (alle Schul-, Business- und eigenen Einheiten wählbar; Reihenfolge fest). Leer = Standard (Schule: Headlight 2, Business: in der App gewählte Stufen). Die App übernimmt die Auswahl beim nächsten Öffnen. **Server-Update nötig.**
- Setup → Üben: Schalter „Lernpfad auf dem Start-Tab“ (Standard an). Wochenziele, Lernpläne und Tagesmissionen bleiben unverändert.

## 2.18.0 – 2026-10-07

- **Lernpfad auf dem Start-Tab** (Headlight 2, streng nacheinander): Jede Unit ist ein Abschnitt (längere Units sind in Teile geteilt) aus Stationen mit je etwa 7 Wörtern, am Ende eine Truhe. Eine Station hat vier Schritte mit den Aufgaben der App: Kennenlernen (neue Wörter mit Einführung und Auswahlaufgaben), Tippen oder Rechtschreibung, Hören & finden (ohne Ton: Lückensatz oder Auswahl), Zuordnen. Die letzte Station jedes Abschnitts wiederholt Wörter des ganzen Abschnitts. Sterne nach Treffern (★ bis ★★★). Die Figur läuft auf der Karte zur nächsten Station. Stationen, deren Wörter schon alle „sitzen“, werden automatisch übersprungen. Falsche Antworten werden wie sonst am Ende der Station wiederholt.
- **Truhe** nach jedem Abschnitt mit Animation (wackeln, aufspringen, Konfetti): 15 bis 30 Münzen, mit 40 % Chance ein **XP-Booster**.
- **XP-Booster:** liegt im Vorrat, auf dem Pfad „Starten“; dann 15 Minuten echte Übungszeit doppelte XP (nur XP, nicht Münzen oder Lernstand); Anzeige „⚡×2 mm:ss“ in der Kopfzeile.
- Dashboard zeigt Pfad-Runden als „Lernpfad“. Boss-Runden mit Arena-Modi folgen später.

## 2.17.0 – 2026-10-07

- Sticker einmalig zurückgesetzt: Beim ersten Start mit dieser Version werden bei allen Profilen alle aufgeklebten Sticker abgenommen, und es gibt wieder genau einen freien Platz. Weitere Plätze schalten Münzen frei (2: 100, 3 bis 5: je 150). Gekaufte Sticker bleiben im Besitz und lassen sich wieder aufkleben.

## 2.16.0 – 2026-10-07

- Shop → Sticker: Bis zu fünf Sticker gleichzeitig auf dem Profil. Der erste Platz ist gratis, die weiteren werden nacheinander freigeschaltet: Platz 2 für 100, Platz 3, 4 und 5 für je 150 Münzen („Sticker-Plätze auf deinem Profil“ oben im Sticker-Reiter). Bisher waren es drei Sticker kostenlos; bestehende Profile behalten so viele Plätze, wie sie schon aufgeklebt haben (mindestens einen). Bei mehr als drei Stickern werden sie etwas kleiner dargestellt. Der Kauf erscheint im Dashboard bei den Käufen als „Sticker-Platz n“.

## 2.15.2 – 2026-10-07

- Satzbau: Der Knopf „← Wort zurück“ ist weg. Wörter werden angetippt (legen und zurücklegen) oder gezogen (verschieben). Bei der Rechtschreibung bleibt „⌫ Buchstabe löschen“.

## 2.15.1 – 2026-10-07

- Satzbau: Das gezogene Wort ist beim Schieben klein (eigenes kleines Element statt einer Kopie der großen Kachel) und schwebt über dem Finger, damit man die rosa Einfügemarke sieht und das Wort genau platzieren kann.

## 2.15.0 – 2026-10-07

- Satzbau: Wörter lassen sich per Drag and Drop (Finger oder Maus) schieben. Aus der Auswahl in den Satz ziehen fügt das Wort an der Einfügemarke ein, gelegte Wörter lassen sich innerhalb des Satzes verschieben und aus dem Satz heraus zurück in die Auswahl ziehen. Ein einfaches Antippen funktioniert weiter: Wort in der Auswahl = anhängen, gelegtes Wort = zurücklegen.

## 2.14.0 – 2026-10-07

- Rechtschreibung: Die Buchstaben in der Antwortreihe sind antippbar. Ein Tipp auf einen Buchstaben setzt den Cursor davor (linke Hälfte) oder danach (rechte Hälfte), der nächste Buchstabe wird dort eingefügt. „⌫ Buchstabe löschen“ entfernt den Buchstaben vor dem Cursor (am Ende wie bisher den letzten). Ein Tipp auf die freie Fläche setzt den Cursor ans Ende.

## 2.13.0 – 2026-10-07

- Tagesmissionen mit Link: Jede offene Mission auf dem Start-Tab hat einen Knopf „Los →“, der direkt den passenden Modus startet (mit kurzer Anleitung darunter): Wörter üben = gemischte Runde, Tagesziel = gemischte Runde bis zum Ziel, Fehlerkartei, Neue Wörter, Sätze, 10 in Folge = gemischte Runde.
- Neuer Modus „Meistern“ (Mission „2 Wörter meistern“): Es werden die Wörter getippt, die dem Meistern am nächsten sind (Stufe „Sitzt“, fällige zuerst, dann „Geübt“).
- Arena in den Tagesmissionen: Ab und zu (etwa jeden dritten Tag) ist eine Arena-Runde mit festem Spielmodus eine der drei Missionen (10 🪙). Setup → Üben: Schalter „Arena als Tagesmission“ (Standard an). Das Dashboard kennt den neuen Modus „Meistern“ (Server-Update, läuft automatisch).

## 2.12.0 – 2026-10-07

- Pause nach der Antwort: Der Weiter-Knopf ist nach jeder Antwort kurz gesperrt (mit Füllbalken), damit die Lösung gesehen wird. Richtig: 1 Sekunde, bei Sätzen 1,5. Falsch: 3 Sekunden (Sätze 4), die richtige Lösung wird automatisch vorgelesen. Bei einem falsch beantworteten Wort muss es zusätzlich einmal richtig abgeschrieben werden, erst dann geht es weiter (nicht bei Verben mit mehreren Formen). Ohne Ton bleibt es bei der Pause. Setup → Üben: Schalter „Pause nach der Antwort“ (Standard an).
- Hinweis beim Tippen: Münzen für echten Fortschritt gibt es jetzt auch mit Hinweis, **XP nicht**. Serie und kurzer Wiederholungsabstand wie bisher.

## 2.11.0 – 2026-10-07

- Tippen („Schreib das englische Wort“): Neuer Knopf 💡 Hinweis in zwei Stufen. Erster Tipp: Anfangsbuchstabe und Länge (`c _ _ _`). Zweiter Tipp: Das Wort wird 2 Sekunden gezeigt und wieder ausgeblendet. Mit Hinweis gibt es **keine Münzen**, keine Serie und weniger XP; das Wort zählt als „mit Hilfe“ (kurzer Wiederholungsabstand), nicht als sicher gelernt. Falsch bleibt falsch (kein Extra-Abzug). Im Dashboard-Ereignis steht `h:1`.

## 2.10.1 – 2026-10-06

- Dashboard: Beim letzten Stand steht jetzt die Uhrzeit dabei: „Zuletzt aktiv: vor 5 Min. (heute 14:32 Uhr) · Übersicht von heute 14:30 Uhr“ (gestern und ältere Tage mit Wochentag und Datum), ebenso bei „Letzte Sicherung“ in der Liste der verborgenen Spieler. **Server-Update nötig** (läuft automatisch).

## 2.10.0 – 2026-10-06

- Modus vom Dashboard in die App: Stellt man im Dashboard „Nur sichern“ um oder wieder auf sichtbar, übernimmt die App das beim nächsten Öffnen (spätestens nach einer Minute im Vordergrund) von selbst, ohne Trennen und neu Verbinden. Beim Wechsel auf „nur sichern“ werden wartende Einträge verworfen, beim Wechsel auf sichtbar gehen Einheitenliste, Wörter und Übersicht sofort an den Server. Die App zeigt kurz einen Hinweis. Der Server meldet den Modus über `POST /api/ping`. **Server-Update nötig** (läuft automatisch).

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
