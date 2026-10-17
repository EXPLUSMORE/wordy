# Änderungsprotokoll

Versionsnummer nach dem Schema **Hauptversion.Nebenversion.Fehlerkorrektur**:

- **Hauptversion** – große Umbauten oder Brüche (z. B. neues Speicherformat).
- **Nebenversion** – neue Funktionen (neuer Aufgabentyp, neue Rubrik, neue Shop-Kategorie).
- **Fehlerkorrektur** – Korrekturen und kleine Anpassungen.

Die Nummer steht nur in `package.json` (`version`) und wird bei jeder ausgelieferten Änderung hochgezählt (Funktion = Nebenversion, Korrektur = Fehlerkorrektur). `node build.js` übernimmt sie in die App,
sie erscheint unten im Setup zusammen mit der Build-Kennung (wechselt bei jeder Codeänderung).

## 2.106.1 – 2026-10-17
- **Dashboard: Münzen und XP in allen Reitern**: Überblick: XP und Münzen pro Wochentag unter dem Wochenbalken, Münzen-Spalte in „Runden heute“. Verlauf: Gesamtsumme in der Legende, XP und Münzen im Balken-Tooltip und eine zweite Zeile je Tag bei „Tage einzeln“, Münzen-Spalte in den Tagesrunden. Wörter: neue Karte „Verdient mit Wörtern“ (Lernrunden im Zeitraum) und XP/Münzen je Einheit und Gruppe, soweit die Runde einer Einheit zugeordnet ist. Aktivität: Summe der ausgegebenen Münzen bei den Käufen im Shop.
- **App meldet die Einheit mit**: Lernpfad-Stationen, Runden mit gewählter Einheit und Spiele mit einer einzelnen Einheit schicken die Einheit mit, damit das Dashboard XP und Münzen je Einheit zuordnen kann. Ältere Runden und gemischte Runden haben keine Einheit und fehlen in dieser Zuordnung.
- **Server-Schritt nötig** für die neuen Anzeigen (`sudo /opt/wordy/server/deploy.sh`). Die App läuft auch ohne.

## 2.106.0 – 2026-10-17
- **Dashboard: XP-Statistik**: Der Überblick zeigt jetzt neben den Münzen auch die XP (heute und Kalenderwoche, Wochenvergleich); die Tageszeilen im Verlauf nennen die XP des Tages. In allen Rundenlisten (heute, pro Tag, Letzte Runden) gibt es eine XP-Spalte. Neue Karte „XP und Münzen nach Aktivität“ im Reiter Aktivität: je Art (Gemischt, Sätze, Verben, Arena-Modi, Spiele, Grammatik) Runden, Zeit, XP, Anteil, XP pro Minute und Münzen, dazu eine Summe.
- **App meldet XP für alle Runden**: Bisher kamen nur bei Lernrunden XP an. Jetzt melden auch Arena, Wortspiele und Grammatik-Lektionen ihre XP (inklusive Booster) an den Server. Ältere Runden haben keine XP-Angabe und stehen mit „–“ da.
- **Server-Schritt nötig** (Dashboard-Anzeige): Server auf 2.106.0 aktualisieren (`sudo /opt/wordy/server/deploy.sh`), danach in der Dashboard-Fußzeile die Version prüfen. Ohne Update fehlen die XP-Spalten, die App läuft weiter.

## 2.105.0 – 2026-10-17
- **Neu: 23 weitere Business-Einheiten (b-37 bis b-60 ohne die Muster-Einheit b-39)** mit Themen aus Handel, IT, Versicherung, Bank, Gastronomie und Hotel, Handwerk und Bau, Gesundheit und Pflege, Einzelhandel, Logistik, Verwaltung und Produktion: je 16 Wörter mit Beispielsatz und 4 Sätze für den Satzbau, insgesamt 384 Wörter und 96 Sätze. Stufen: Basis, Aufbau und Profi. Alles ist selbst formuliert (Herkunft `own`, CC BY-SA 4.0); die Häufigkeit ist nicht gegen NGSL/BSL belegt. Wörter, die es im Altbestand schon gibt, sind nicht doppelt. Bestehende Einheiten, Wort- und Satz-IDs bleiben unverändert. Server-Schritt nicht nötig.

## 2.104.0 – 2026-10-17
- **Neu: Muster-Einheit „Rechnung & Zahlung“ (b-39, Business Basis)** aus der neuen offenen Datenreihe `data/open`: 16 Wörter und 4 Sätze, selbst formuliert (Herkunft `own`, Lizenz CC BY-SA 4.0), Herkunft und Lizenz stehen je Eintrag in den Daten. Die Häufigkeit ist nicht gegen NGSL/BSL belegt (siehe SOURCES.md). Der Build prüft Herkunft und Lizenz aller Einträge in `data/open`. Bestehende Einheiten, Wort- und Satz-IDs bleiben unverändert. Server-Schritt nicht nötig.

## 2.103.2 – 2026-10-15
- **Vorlesen vollständig**: Nach jeder Antwort (richtig oder falsch) wird jetzt die englische Lösung vorgelesen, in allen Aufgabenarten (Tippen, Rechtschreibung, Deutsch→Englisch, Was passt nicht, Zuordnen, Verben, Lückensätze, Satzbau). Bisher kam das nur bei falschen Antworten und nur bei eingeschalteter Pause, bei richtigen nur in zwei Aufgabenarten. Vor der Antwort wird jedes englische Wort bzw. jeder englische Satz vorgelesen, der zu sehen ist: neu dazugekommen sind „Was heißt das auf Deutsch?“, die Verb-Aufgaben (Infinitiv, Lückensatz mit Pause an der Lücke). Bei Aufgaben mit deutscher Frage (Tippen, Deutsch→Englisch, Satzbau) bleibt das Englische vorher stumm, sonst wäre die Lösung verraten.
- **Rechtschreibung: vier Buchstaben pro Reihe**: Die Buchstabenkacheln standen wegen eines alten Stilkonflikts mit den Startseiten-Kacheln nur zu zweit in einer Reihe und sehr breit. Jetzt vier pro Reihe, größer zum Antippen und Ziehen. Satzbau-Wörter laufen wieder in natürlicher Breite um. Server-Schritt nicht nötig.

## 2.103.1 – 2026-10-15
- **Fehler behoben: gekaufte Farbwelt (Pflaume, Minze, Bernstein) wirkte nicht**: Die Farbwelten aus dem Shop griffen nur im Design „Klassisch“. Im Standard-Design Nachtgold (und in Sonnenschein und Aurora) passierte beim Auswählen nichts, obwohl sie gekauft war. Jetzt färben sie in jedem Design Akzent, Knöpfe und Beschriftungen (hell und dunkel); Hintergrund und Karten bleiben die des Designs. Server-Schritt nicht nötig.

## 2.103.0 – 2026-10-15
- **Neu: Später weitermachen**: Runden, Spiele und Lektionen lassen sich pausieren. Beim Verlassen (✕) fragt Wordy: „Später weitermachen“, „Beenden“ (zählt nicht als geschafft, nur XP) oder „Weiterspielen“. Gepausierte Runden stehen auf der Startseite in der Karte „Angefangen – mach weiter“ (Weiter / ✕ beenden) und gelten bis Tagesende. Gilt für Lernrunden (auch Daily Challenge und Lernpfad-Stationen), alle Arena-Modi (Match-Rausch, Blitzrunde, Letztes Herz, Fehlerjagd), Wort-Detektiv, Freezy, Xing, Letters, Blast, Blast 3D und Grammatik-Lektionen. Es wird ab der laufenden Aufgabe weitergespielt (Punkte, Treffer, Herzen, Zeit und Buchstabenfelder bleiben). Nicht pausierbar: Duelle und Herausforderungen. Wechselt man in der Arena die App, wird die Runde jetzt gespeichert statt abgebrochen. Es werden bis zu drei Runden gemerkt; dieselbe Spielart ersetzt die ältere. Server-Schritt nicht nötig.

## 2.102.3 – 2026-10-15
- **Fehler behoben: abgehacktes „OK“ vor dem Vorlesen**: Zum Anwärmen der Sprachausgabe sprach die App unhörbar das Wort „Okay“ (Lautstärke fast 0). Viele Handy-Stimmen ignorieren die Lautstärke, dann war ein kurzes „OK“ in einer anderen Stimme zu hören, bevor die gewählte Stimme die Aufgabe las. Jetzt wird nur ein stiller Punkt mit derselben Stimme und Sprache angewärmt, und nur noch nach mehr als 30 Sekunden Pause (vorher 8). Server-Schritt nicht nötig. Wird der Satzanfang abgeschnitten, hilft der Regler „Vorlauf“ im Setup.

## 2.102.2 – 2026-10-15
- **Fehler behoben: Abbrechen zählte als geschafft**: Wer die Daily Challenge (oder jede gemischte Runde) nach mindestens 8 Aufgaben abbrach, bekam die Challenge des Tages, den Challenge-Bonus, die Challenge-Serie und Bonus-Runden gutgeschrieben. Jetzt gilt für **alle Übungen**: Nur komplett gespielte Runden zählen als geschafft. Bei Abbruch (oder wenn die Herzen alle sind) bleiben **Zeit, Antworten und XP für die Antworten** erhalten, es gibt aber **keine Challenge, keine Münzen-Boni, keinen Stern, kein Abzeichen für fehlerfreie Runde**. Arena-Spiele und Wortspiele: bei Abbruch keine Münzen, kein Bestwert und keine gezählte Spielrunde; Boss-Runden gelten bei Abbruch nicht als bestanden. Grammatik-Lektion: bei Abbruch keine Münzen und keine gezählte Lektion (XP bleiben). Die Abschlussseite sagt „Runde beendet“ bzw. „Lektion beendet“ und erklärt es. Hinweis: Missionen und das Tagesziel richten sich weiter nach der geübten Zeit bzw. den Antworten, nicht nach dem Rundenabschluss. Nur App-Änderung.

## 2.102.1 – 2026-10-15
- **Monatspass: Lesbarkeit**: Im hellen Modus standen „Geheimes Geschenk“ und „Sammel-Set“ als weiße Schrift auf hellem Grund. Die beiden Karten haben im Pass jetzt einen dunklen, leicht durchscheinenden Grund mit heller Schrift (in allen Designs und im Dunkelmodus gleich lesbar). Nur App-Änderung.

## 2.102.0 – 2026-10-15
- **Erinnerung alle 2 Stunden (Standard) mit Zeitfenster**: Statt einer Mitteilung am Tag kommt sie jetzt im Fenster von **15:00 bis 20:00 Uhr (Berlin) alle 2 Stunden**, also etwa 15, 17 und 19 Uhr, solange das Tagesziel offen ist; der Spruch wechselt je Stunde. Im Dashboard (Einstellungen › Erinnerung) stellst du „von“, „bis“ und den Abstand ein (nur einmal am Tag, jede Stunde, alle 2, 3 oder 4 Stunden). Neu: Knopf **„Jetzt starten (sofort senden)“** sendet sofort eine Mitteilung und rechnet den Abstand von da an. Die Karte zeigt, wann zuletzt gesendet wurde (Datum und Uhrzeit). Server: `pushState` mit `until`, `every`, `lastTs`; Tick-Logik für Intervall und einmal am Tag; `POST /api/admin/players/:id/push` mit `action:"startnow"`. Test-Hilfe: `ADMIN_RATE` (Anfragen je Minute am Dashboard, Standard 120). Server-Update nötig.

## 2.101.0 – 2026-10-14
- **Drag and drop bei Rechtschreibung und Grammatik**: In der Übung **Rechtschreibung** lassen sich die Buchstaben jetzt mit Maus oder Finger aus dem Vorrat in die Reihe ziehen, in der Reihe an eine andere Stelle schieben und wieder herausziehen (zurück in den Vorrat). Eine Einfügemarke zeigt, wo der Buchstabe landet. In der **Grammatik**-Übung „Wörter in die richtige Reihenfolge bringen“ gilt dasselbe für die Wörter (Vorrat → Antwort, in der Antwort umsortieren, zurück in den Vorrat). Antippen funktioniert weiter wie bisher; die Satzbau-Übung („Sätze bauen“) konnte schon ziehen. Nur App-Änderung.

## 2.100.2 – 2026-10-13
- **Mitlesen kürzer**: Die Vorlese-Schleife vorab ist weg. Es gibt nur noch einen Durchgang: Jedes Wort wird vorgelesen, dann spricht das Kind laut nach („Wort 3 von 15“), danach „Geschafft“. Das halbiert die Dauer. Tempo-Regler, Pause, Vor und Zurück bleiben. Gilt überall (Lernen, Einheit, Lernpfad, Tagesplan); als erledigt zählt der Plan-Baustein erst am Ende des Durchgangs. Nur App-Änderung.

## 2.100.1 – 2026-10-13
- **Automatischer Tagesplan: Sätze immer dabei**: Der Plan hat jetzt bis zu fünf Bausteine: Wiederholen, schwächste Einheit, **Sätze (immer, bei schwacher Trefferquote mit mehr Zeit)**, eine weitere Aufgabenart (Verben bei Schwäche, sonst abwechselnd Verben/Tippen) und ein Spiel (entfällt bei über 70 % Spielzeit). Bei 10 Minuten sind das meist je 2 Minuten. Server-Update nötig.

## 2.100.0 – 2026-10-13
- **Plan-Generator pro Wochentag**: Im Reiter „10-Min-Plan“ gibt es oben eine Tagesleiste „Alle Tage · Mo … So“ (• = eigener Plan). „Alle Tage“ ist der Standardplan; jeder Wochentag kann einen eigenen Plan bekommen, sonst gilt der Standard (ohne Standard der automatische Plan). Dazu „Standardplan als Vorlage“, „Kopieren nach … (Mo–Fr, Sa/So, alle)“ und „Eigenen Plan entfernen“. Server: Speicher `{raw, days}` (ältere Daten gelten als Standard), `POST /customplan` mit `day` (`all` oder 0–6, Mo = 0) und `clear`, `/api/sync` liefert `dayplanWeek` (7 Pläne) und `dayplanAuto`; die App wählt den Plan des lokalen Wochentags.
- **Erledigt nur, wenn komplett gemacht**: Ein Start oder Abbruch zählt nicht mehr. Abgehakt wird erst, wenn die Runde bis zum Ende gespielt wurde (Lernrunde „fertig“, nicht Abbruch oder „Pause“ ohne Herzen), das Mitlesen beide Teile durchlaufen hat, das Spiel zu Ende gespielt wurde (nicht ✕/Verlassen), die Grammatik-Lektion abgeschlossen ist oder ein Duell gesendet bzw. gespielt wurde. Es zählt auch, wenn die Aktivität nicht über den Plan gestartet wurde; je Aktivität wird der erste passende offene Baustein abgehakt. Technik: `planComplete()` in app.js, Hook `WordyHooks.onSession` aus `WordySync.sessionEnd`, Spiele melden `end` mit. Server-Update nötig (Wochentage).

## 2.99.0 – 2026-10-13
- **Dashboard: 10-Minuten-Plan-Generator** (neuer Reiter „10-Min-Plan“ pro Kind): Eltern setzen den Tagesplan aus bis zu 12 Bausteinen zusammen, jeder mit Minuten, Reihenfolge per ↑/↓. Bausteine: **Mitlesen** (je Einheit oder alle gelernten Wörter), **Einheit üben**, Fehlerkartei, Daily Challenge, Neue Wörter, Sätze, Verben, Hören/Tippen/Lücken/Zuordnen, **Grammatik-Thema**, **Spiel** (alle 4 Arena-Spiele und 6 Wortspiele, die Arena-Spiele optional mit Wörtern einer Einheit) und **Duell nach Wahl**. Einheiten aus allen Bereichen (Headlight 2, Klassen, Business) wählbar. Dazu „Vorlage: schwächste 3 Einheiten mitlesen + Duell“ (aus der Analyse), „Vorschlag aus der Analyse“ und Anzeige Summe gegen Tagesziel. Der Plan erscheint in der App auf der Startseite als „Dein Plan von den Eltern“ (ersetzt den automatischen Plan, bis „Automatischen Plan verwenden“ gewählt wird); jeder Baustein startet direkt (Mitlesen, Spiel, Grammatik, Duell öffnet Freunde; ohne freigegebenen Freund kommt ein Hinweis). Server: `planBlocks()`, `GET/POST /api/admin/players/:id/customplan` (prüft Bausteine, Einheiten, Minuten 1–30), `dayplan` in `/api/sync` bevorzugt den Elternplan. Test in `server/test.js`. Server-Update nötig.

## 2.98.0 – 2026-10-12
- **Persönlicher Tagesplan („Dein 10-Minuten-Plan“)**: Aus der Analyse des Kindes baut der Server täglich (Zwischenspeicher 20 Min.) einen Plan mit vier Bausteinen, deren Minuten das Tagesziel ergeben (5–20, Standard 10): ① Wiederholen (Fehlerkartei bei ≥ 3 hängenden Wörtern, sonst Daily Challenge), ② schwächste Einheit (unter 85 %, sonst Neue Wörter), ③ schwächere Aufgabenart (Sätze/Verben unter 80 %, sonst abwechselnd Sätze, Verben, Tippen), ④ ein Spiel (Fehlerjagd bei hängenden Wörtern, sonst das meistgespielte; entfällt, wenn schon über 70 % der Zeit Spiele sind – dann bekommt die Einheit die Minuten). Ab etwa 15 Antworten oder Runden. App: Karte auf der Startseite über „Dein Tag“ mit „Los ▶“ je Baustein (startet direkt mit passendem Modus, Einheit oder Spiel); ein Baustein zählt als erledigt, wenn die Runde beendet wurde (Spiele: beim Start). Dashboard › Analyse: Karte „Tagesplan“ mit Schalter „in der App zeigen“. Server: `buildDayplan()`, `dayplan` in `/api/sync`, `GET/POST /api/admin/players/:id/dayplan`; Metadaten melden jetzt `track`. Server-Update nötig.

## 2.97.0 – 2026-10-12
- **Dashboard: neuer Reiter „Analyse“** (pro Kind, neben Überblick/Verlauf/Wörter/Aktivität): wertet die letzten 30 oder 90 Tage aus. Kennzahlen (Antworten, Trefferquote, Runden, Zeit, aktive Tage von 14), **Spiele (Arena)** je Spiel mit Runden, Zeit, Ø und Bestpunkten, Trend und Trefferquote, Lernarten, Aufgabenarten (Wörter/Sätze/Verben), schwächste Einheiten, Wörter, die hängen bleiben (≥ 3 Fehler), Trefferquote nach Uhrzeit. Dazu **Vorschläge** als Regeln mit Mindestmengen (z. B. schwache Aufgabenart oder Einheit → Lernplan/Wochenziel, zu viele oder zu wenige Spiele, nie gespielte Spiele, Regelmäßigkeit, Rundenlänge, Hilfen, Trend, beste Uhrzeit für die Erinnerung). Server: `analysis()` und `GET /api/admin/players/:id/analysis` (nur Lesen, speichert nichts; Familien sehen nur ihre Kinder). Test in `server/test.js`. Server-Update nötig.

## 2.96.0 – 2026-10-12
- **Crew-Einladung als Wolke auf der Startseite**: Lädt jemand dein Kind in eine Crew ein, schwebt eine violette Wolke „<Name> lädt dich ein!“ (Crew-Name und -Symbol) auf der Startseite. Tippen öffnet Spielen › Crew mit „Beitreten“ oder ✕; die Wolke verschwindet dabei bis zum nächsten Öffnen der App und endgültig, sobald die Einladung beantwortet ist. Rangfolge der Duell-Wolken: offene Herausforderung, Crew-Einladung, Ergebnis, gesendet. Kein Server-Update nötig.

## 2.95.2 – 2026-10-12
- **Dashboard › Verlauf: letzte Aktivität zuerst**: In „Tage einzeln“ steht der neueste Tag oben (wie bisher), jetzt stehen auch die Runden eines aufgeklappten Tages mit der letzten Runde zuerst. Das Balkendiagramm bleibt zeitlich von links (alt) nach rechts (neu). Server-Update nötig (Dashboard-Datei).

## 2.95.1 – 2026-10-12
- **Duell-Wolke auch für gesendete Duelle**: Hat dein Kind jemanden herausgefordert und es kommt noch keine Antwort, zeigt die Startseite eine blaue Wolke „📨 Duell an <Name> läuft“ (Spielart, dein Wert, „wartet auf Antwort“) für 2 Tage. Sie verschwindet nach dem Antippen (öffnet Spielen › Freunde), nach ✕ oder beim Ansehen der Freunde-Seite. Rangfolge der Wolken: offene Herausforderung, dann Ergebnis, dann gesendet. Nach dem Senden wird die Freunde-Abfrage sofort neu geladen. Kein Server-Update nötig.

## 2.95.0 – 2026-10-12
- **Duell-Wolke auf der Startseite**: Wird dein Kind herausgefordert, schwebt eine Wolke „⚔️ <Name> fordert dich heraus!“ (Spielart, Wert zum Schlagen) im Hero; Tippen startet das Duell. Hat ein Freund eine Herausforderung gespielt, die du gestartet hast, zeigt die Wolke das Ergebnis („Du hast … besiegt!“ / „… war besser!“ / Unentschieden, mit Stand). Sie verschwindet nach dem Antippen (öffnet Spielen › Freunde), nach ✕ oder wenn man die Freunde-Seite ansieht (`profile.duelSeen`); eine offene Herausforderung blendet ✕ nur für diese Sitzung aus. Läuft über die vorhandene Freunde-Abfrage (alle 2 Minuten und beim Öffnen), kein Server-Update nötig.

## 2.94.1 – 2026-10-12
- **Privat-Betrieb vorbereitet (Phase 0)**: Apache-Vorlagen `apache-bitnami-app-http/https.conf.example` (App aus `/opt/wordy/docs` hinter Anmeldung, Manifest und Symbole frei, noindex), Schritt-für-Schritt-Anleitung in `server/README.md` (Deploy-Schlüssel, Zugänge, DNS, Zertifikat, GitHub Pages aus, Repository privat, Rückweg). Im Test (Anmeldung, Service Worker, Offline) geprüft. Keine App-Änderung; umgeschaltet wird erst durch den Betreiber.

## 2.94.0 – 2026-10-12
- **Datenschutzerklärung aktualisiert** (Prüfung): neue Abschnitte 5a „Tägliche Erinnerung (Push)“ und 5b „Feedback“, Tabellenzeilen für Arena-Spiele, Push-Adresse und Feedback, Push-Dienste als Empfänger und Drittland-Übermittlung, Speicherdauer ergänzt, Aussage „keine freien Texte“ präzisiert, Rechtsgrundlage Art. 6 Abs. 1 lit. b bei den Kinderdaten entfernt. `CONSENT_VER` auf 2026-10e: Eltern stimmen der neuen Fassung neu zu. App: Hinweis im Feedback-Formular („keine Namen, Adressen, Telefonnummern“). Server-Update nötig.

## 2.93.3 – 2026-10-12
- **Serien-Spruch „Lass die Serie nicht sterben“ entfernt** (Server). Es bleiben 4 Serien-Sprüche.

## 2.93.2 – 2026-10-12
- **Erinnerungssprüche nur noch im Schülerjargon**: Die Tagessprüche sind jetzt alle in Jugendsprache (25 Stück, neu u. a. Rizz, mid, Skill-Issue, Bruh, Flex, Glow-up, Main Character). Die Serien-Sprüche bleiben. Nur Server-Änderung.

## 2.93.1 – 2026-10-12
- **Mehr Erinnerungssprüche**: 10 neue freigegebene Sprüche und 10 im Schülerjargon (Digga, Aura, lowkey, NPC, slay, sus, Bro, Sigma …), dazu 2 neue Serien-Sprüche. Jetzt 42 Tagessprüche plus 5 Serien-Sprüche. Nur Server-Änderung (`PUSH_LINES`/`PUSH_STREAK`).

## 2.93.0 – 2026-10-12
- **Erinnerung als Fenster zum Wegklicken**: Ist Wordy gerade offen, erscheint der Spruch als Fenster in der App („Los geht’s“ / „Später“). Ist Wordy im Hintergrund, bleibt die Mitteilung stehen, bis man sie wegwischt (mit Knöpfen „Los geht’s“ und „Später“, Vibration). Der Server sendet jetzt mit hoher Dringlichkeit (`Urgency: high`).
- **Erinnerung standardmäßig an**: Hat das Gerät die Erlaubnis schon, meldet es sich still an. Sonst fragt einmal ein freundliches Fenster („Soll Wordy dich erinnern?“). Ausschalten unter Profil › Ton & Aussehen bleibt dauerhaft aus (`profile.pushOff`). Server-Update nötig (nur Dringlichkeit).

## 2.92.0 – 2026-10-12
- **Tägliche Erinnerung per Mitteilung (Web Push)**: Jeden Tag zur eingestellten Uhrzeit (Standard 15:00, nach der Schule) kommt ein persönlicher, frecher Spruch aufs Handy („Na Magnus, die Vokabeln warten schon. Fünf Minuten, dann hast du Ruhe. 😏“; 22 Sprüche plus Serien-Sprüche ab 2 Tagen). Er kommt nicht, wenn das Tagesziel schon geschafft ist. Das Gerät schaltet es in der App unter Profil › Ton & Aussehen › „Tägliche Erinnerung“ frei (mit „Test senden“); die Eltern stellen Uhrzeit und An/Aus im Dashboard unter Einstellungen › „Tägliche Erinnerung“ ein. Auf dem iPhone nur, wenn Wordy auf dem Home-Bildschirm installiert ist. Technik: neues `server/push.js` (VAPID und Verschlüsselung nach RFC 8291 mit `node:crypto`, keine Fremdbibliothek), Tabelle `push_subs`, Schlüsselpaar wird beim ersten Start automatisch erzeugt (kv `vapid`), Endpunkte `/api/push[/key]` und `/api/admin|fam/players/:id/push`, Service Worker zeigt die Mitteilung. **Server-Update nötig**, der Server muss ins Internet senden dürfen (Google/Apple-Push-Dienste).

## 2.91.0 – 2026-10-11
- Dashboard: Bei Arena-Runden steht jetzt, **welches Spiel gespielt wurde**, samt Punkten, zum Beispiel „Arena · Blast 3D (88 Pkt.)“ (Match-Rausch, Blitzrunde, Letztes Herz, Fehlerjagd, Wort-Detektiv, Freezy, Xing, Letters, Blast, Blast 3D, Grammatik). Gilt in den Rundenlisten (Heute, Verlauf, Aktivität) für Eltern- und Betreiber-Dashboard. Die App sendete Spiel und Punkte schon; der Server gibt sie jetzt im Bericht mit (`sub`, `score`). **Server-Update nötig** (keine neuen Spalten, kein Datenumbau; ältere Runden zeigen das Spiel ebenfalls, soweit sie es mitgeschickt haben).

## 2.90.2 – 2026-10-11
- Neuheiten-Wolke mit mehr Action: schwebt schneller und weiter (4,6 s pro Runde, mit leichtem Schaukeln), pulsiert mit gelbem Leuchten, ein rotes „NEU“-Schild blinkt, das UFO wippt, drei Sternchen funkeln. Bei „Bewegung reduzieren“ bleibt alles ruhig.

## 2.90.1 – 2026-10-11
- Neuheiten-Wolke: Wer das neue Spiel schon gespielt hat, sieht die Wolke bewusst nicht mehr. Damit man sie trotzdem ansehen kann, gibt es unter Profil › Ton & Aussehen › „Neuheiten-Wolke“ den Knopf **„Wieder anzeigen“**.

## 2.90.0 – 2026-10-11
- Startseite: **Neuheiten-Wolke** auf der Hero-Bühne („🛸 NEU: Blast 3D · Weich den Wörtern aus!“). Sie schwebt ruhig (bei „Bewegung reduzieren“ steht sie still), ein Tipp öffnet das Spiel direkt, ✕ blendet sie aus. Sie verschwindet außerdem nach dem ersten Spielen und nach 14 Tagen; pro Profil gemerkt (`profile.cloudSeen`). Neue Spiele werden in der Liste `NEWS` in app.js eingetragen (eine Wolke zur Zeit).

## 2.89.7 – 2026-10-11
- Blast 3D: Unter dem gesuchten Wort steht jetzt eine **Vorschau auf die nächsten zwei Wörter** („Danach: …“). Sie ist verbindlich: Genau diese Wörter (in genau dieser Sprache) sind als Nächstes dran.

## 2.89.6 – 2026-10-11
- Blast 3D: Die Wörter erscheinen jetzt **sofort ganz hinten am Horizont** (der Horizont liegt weiter oben, im oberen Teil des Felds, ohne langes Einblenden) und **wachsen stetig**, je näher sie kommen (von etwa 30 % bis 125 % der Schrift), passend zur Perspektive. Dafür gibt es **drei statt vier Spuren** (breiter, kaum Überlappung); eine Welle hat zwei Wörter (richtig und falsch), im Hardcore-Modus drei, sodass immer eine Spur frei zum Ausweichen bleibt.

## 2.89.5 – 2026-10-11
- Blast 3D: Das gesuchte Wort steht jetzt **unten**, direkt über den Pfeiltasten, statt oben. Das Spielfeld ist dadurch höher.

## 2.89.4 – 2026-10-11
- Blast 3D: Das Raumschiff **springt pro Tipp eine Spur** (◀ ▶ oder Pfeiltasten / A, D; Gedrückthalten wiederholt nicht). Es gleitet kurz in die Spur und kippt dabei leicht. Berührt wird, was in der Spur des Schiffs liegt.

## 2.89.3 – 2026-10-11
- Blast 3D: Wörter deutlich größer (flachere Perspektive: in der Ferne etwa 29 % statt 14 % der Größe, nahe am Schiff 120 %; Schrift passt sich dem längsten Wort an, ohne mitten im Wort umzubrechen). Anfangstempo etwa halb so schnell: eine Welle braucht 8,5 Sekunden (vorher 4,6) und wird pro Level 8 % schneller, höchstens bis 2,4 Sekunden.

## 2.89.2 – 2026-10-11
- Blast 3D startete nicht: Beim ersten Öffnen fehlte die Kurzerklärung (Hilfetext) des Spiels, dadurch brach die Einführung ab und das Spiel kam nicht. Hilfetext ergänzt (gilt auch für das „?“ im Spiel).

## 2.89.1 – 2026-10-11
- Blast: Wörter überlappen sich nicht mehr. Holt ein schnelleres Wort ein langsameres ein oder erscheint ein neues über einem anderen, wartet es dahinter, bis Platz ist. Im Test mit Level 8: 440 Wortpaare über 16 Sekunden, keine Überlappung.

## 2.89.0 – 2026-10-11
- Neues Spiel **Blast 3D** (Arena › Wortspiele, 🛸): In einer 3D-Perspektive mit Fluchtpunkt kommen Wellen aus drei Wörtern in vier Spuren auf dich zu. Oben steht ein Wort (englisch oder deutsch), die Übersetzung steht in der Welle, mal deutsch, mal englisch, dazu zwei falsche Wörter. Mit ◀ ▶ (oder Pfeiltasten, A / D) steuerst du das Raumschiff in die richtige Spur und weichst den falschen aus. Falsches Wort berührt: ein Herz weg, bis die Herzen leer sind. Richtiges verpasst: nur die Serie reißt ab. Alle 5 richtigen Wörter wird es schneller (Level), alle 10 gibt es ein Extra-Herz, ab mehr als 10 in Folge wird es schwerer. Zählt wie die anderen Wortspiele für Münzen, XP, Bestwert und Lernstand. Spielbeschreibung und Erklärfilm („Blast 3D“) inklusive.

## 2.88.1 – 2026-10-11
- Blast, ruhiger: Die Wörter bleiben **komplett im Feld** (links und rechts, auch gedreht und wackelnd). Fehler aus 2.88.0 behoben: Die Drehung lief als eigene Eigenschaft und drehte die Fallbewegung mit, dadurch drifteten Wörter zur Seite aus dem Bild; jetzt steckt die Drehung im `transform`. Tempo langsamer (Start 30 statt 44 Pixel pro Sekunde, je Wort 80 bis 110 %), das Level-Tempo steigt wie bisher alle 5 Treffer um 12 %. Drehung nur noch leicht (bis 12°, nie hochkant oder auf dem Kopf); manche Wörter wiegen langsam hin und her (±6 bis ±14°) statt sich zu drehen.

## 2.88.0 – 2026-10-11
- Blast: Die Wörter sind **zufällig gedreht**: meist leicht schief (bis 15°), manchmal hochkant (±75 bis 90°), selten auf dem Kopf oder stark geneigt. Etwa jedes fünfte Wort **dreht sich langsam weiter** (12 bis 42° pro Sekunde, links oder rechts). Die Berührung mit dem Raumschiff rechnet mit dem gedrehten Feld des Wortes.

## 2.87.0 – 2026-10-11
- Blast, noch mehr Abwechslung: Jedes Wort bekommt zufällig eine eigene Form (eckig, rund, Pille, schräge Ecken), leichte Neigung (bis 8°), Strichstärke, Buchstabenabstand und Innenabstand; die Größe schwankt von 75 bis 150 % (bei langen Texten begrenzt).
- Blast: Jedes Wort fällt mit **eigener Geschwindigkeit** (82 bis 122 % des Level-Tempos), nicht zu schnell, aber nicht im Gleichschritt. Eis-Sterne und Bomben fallen wie bisher.

## 2.86.3 – 2026-10-11
- Blast, mehr Abwechslung: Wortgruppen erscheinen zufällig **alle Wörter untereinander** (ein Wort pro Zeile), schmal umgebrochen, einzeilig kleiner oder groß und mehrzeilig. Die Größe schwankt stärker (85 bis 125 %, bei langen Texten begrenzt). Zu breite Wörter werden auf Feldbreite verkleinert.

## 2.86.2 – 2026-10-11
- Blast: Die Wörter sehen nicht mehr alle gleich aus. Jedes bekommt eine leicht zufällige Größe; Wortgruppen werden zufällig entweder **umgebrochen** (schmaler Block, mehrzeilig) oder **einzeilig kleiner** geschrieben. Zu breite Einzeiler werden so weit verkleinert, dass sie ins Feld passen.

## 2.86.1 – 2026-10-11
- Die Schriftverkleinerung für lange Texte aus 2.86.0 gilt jetzt **nur noch in Blast** (überall sonst wieder wie vorher). In Blast schrumpfen lange Wörter und Redewendungen in Stufen: bis 12 Zeichen normal, bis 18 Zeichen 90 %, bis 22 Zeichen 80 %, darüber 70 %. Die Wörter brechen bei Bedarf in zwei Zeilen um (höchstens 76 % der Feldbreite). Erlaubt sind weiterhin Wörter und Wortgruppen bis 26 Zeichen (vorher 14).

## 2.85.0 – 2026-10-11
- Bildschirm bleibt an, solange Wordy offen und sichtbar ist (Screen Wake Lock): kein Abdunkeln, kein Ruhezustand. Beim Zurückkehren in die App wird die Sperre neu angefordert. Abschaltbar unter Profil › Ton & Aussehen › „Bildschirm anlassen“ (Standard: an). Geräte oder Browser ohne diese Funktion verhalten sich wie bisher.

## 2.84.0 – 2026-10-11
- Blast: **Hardcore-Modus** ab mehr als 10 Treffern in Folge („🔥 Hardcore!“): Wörter 30 % schneller, zwei Wörter mehr gleichzeitig, schnellerer Nachschub und stark wackelnde Bahnen (28 statt 6 Pixel). Er endet mit dem ersten Fehler, einem verpassten oder berührten Wort („Hardcore vorbei“). In der Serien-Anzeige steht dann 🔥.

## 2.83.1 – 2026-10-11
- Blast: Die Rakete schaut jetzt immer nach oben (das Emoji war von Haus aus schräg) und kippt nur leicht (14°) nach links oder rechts, solange man eine Pfeiltaste hält. Beim Schießen dreht sie sich nicht mehr zum Ziel.

## 2.83.0 – 2026-10-11
- Blast: Das **Raumschiff lässt sich steuern**. Zwei große Pfeiltasten ◀ ▶ unter dem Spielfeld (gedrückt halten), am Rechner auch Pfeiltasten oder A / D. Die Wörter fliegen jetzt auf das Schiff zu: Wer eins berührt, verliert ein Herz („Autsch! Ausweichen!“), bis die Herzen weg sind und die Runde endet. Wird dabei das gesuchte Wort getroffen, zählt es als verpasst. Eis-Sterne und Bomben bleiben harmlos. Der Laser schießt von der aktuellen Position des Schiffs. Spielbeschreibung und Erklärfilm sind ergänzt.

## 2.82.1 – 2026-10-11
- Blast: Das Tempo steigt jetzt deutlich mit jedem Level, also alle 5 richtigen Wörter um etwa 12 % (vorher nur kleine Schritte und früh am Deckel). Obergrenze höher, Meldung „Level n · schneller!“.

## 2.82.0 – 2026-10-11
- Grammatik: **alle geplanten Themen sind fertig**, jeweils mit Erklärkarte (Merksatz, Beispiele) und 15 Aufgaben (Auswählen, Tippen, Ordnen, Fehler finden): Simple Present und Present Progressive, have to / should / can / could, will / going to, Steigerung, some / any / there is / there are, If-Sätze (Typ 1). Zusammen mit Simple Past (2 Themen) sind es 8 Themen und 120 Aufgaben; geprüft mit `tools/check-grammatik.js`. Die Themen mit Einheit bekommen eine Grammatik-Station im Lernpfad (Zuordnung `unit` in `data/grammatik.js`, aus der Reihenfolge von Headlight 2 abgeleitet, bitte am Buch prüfen). Bestehender Pfadfortschritt bleibt erhalten.

## 2.81.0 – 2026-10-10
- Erklärfilme: sieben neue Filme (How-to und Üben › Spielmodi): **Was lernen? Wie?** (Schule oder Business, Schuljahr und Einheiten, Pfad oder selbst wählen, alle Lern- und Spielmodi, Münzen; „Jetzt ausprobieren“ öffnet Was lernen?), **Grammatik**, **Wort-Detektiv**, **Freezy**, **Xing**, **Letters** und **Blast** („Jetzt ausprobieren“ startet das Spiel bzw. die Lektion). Neue Ziel-Arten in `go`: `tab`, `game`, `gram`. Für die aufgenommene Stimme müssen die neuen Texte beim nächsten Vertonungslauf mit erzeugt werden (bis dahin spricht die Gerätestimme).

## 2.80.1 – 2026-10-10
- Belohnungen für Lernpläne und Wochenziele sind jetzt besser zu finden: Lernen › Fortschritt › Verlauf zeigt neben den Wochenzielen auch den Lernplan mit Belohnung (🪙 und 🎁), und der Schritt „Lernplan“ in „Dein Tag“ auf der Startseite nennt den Bonus. Vorher stand die Belohnung eines Lernplans nirgends in der App.

## 2.80.0 – 2026-10-10
- Shop: **Kitty-Outfits** für Siegertanz und Avatar, je Stufe eines: Kitty-Schleife (gewöhnlich, 80 🪙), Kitty-Regenbogen (selten, 200), Kitty-Prinzessin (episch, 400), Kitty-Sternenzauber (legendär, 1.000). Jede Figur trägt dann Schleife, Haarreifen, bunten Pony, Glitzersterne (und bei der Sternenzauber-Stufe goldene Flügel) plus passende Jacke. Technik: `VTA.outfit()` in `js/stila.js` legt Zubehör über Kopf bzw. hinter den Körper (gilt für alle gezeichneten Figuren; die wenigen Emoji-Figuren ohne Zeichnung bekommen nur den Namen). Auch im Pass-Dashboard auswählbar.

## 2.79.1 – 2026-10-10
- Shop: Kitty Sternenzauber (legendär) kostet jetzt 2.500 🪙 statt 500.

## 2.79.0 – 2026-10-10
- Dashboard: Die vier **Kitty-Figuren** stehen jetzt auch in der Auswahl für den Wochenpass (Standardliste; Geräte mit neuer App liefern sie ohnehin mit).
- Dashboard: Bei **Wochenzielen** und **Lernplänen** kann der Betreiber zusätzlich zu Münzen (oder statt Münzen) einen **Gegenstand aus dem Shop** als Belohnung festlegen (Figur, Tanz, Outfit, Rahmen …). Das Kind bekommt ihn mit Sticker automatisch beim Erreichen, die App zeigt „🎁 …“ bei der Belohnung und in der Meldung. Nur Betreiber (Elternkonten ignorieren das Feld wie die Bonusmünzen). Neue Spalten `goals.item`, `plans.item`, Sync-Felder `item`. **Server-Update nötig.**

## 2.78.0 – 2026-10-10
- Shop: neue **Kitty-Reihe** im Start-Sortiment, je Stufe eine Figur mit Sticker: Kitty Schleife (gewöhnlich, 50 🪙), Kitty Regenbogen (selten, 150), Kitty Prinzessin (episch, 250), Kitty Sternenzauber (legendär, 500). Weiße bzw. pastellige Katzen ohne Mund, mit Schleife, Haarreifen, bunten Haaren, Flügeln und Glitzer. Neues Gesicht `kit` und Augen `kit` in `js/stilb.js`. Seltenheit fest je Artikel (`rar`).

## 2.77.0 – 2026-10-10
- Eltern: **zweiter Elternzugang**. Im Eltern-Dashboard (Konto) erstellt das Hauptkonto einen Einladungslink (7 Tage, einmal nutzbar, bis zu 2 weitere Zugänge). Wer ihn öffnet, bekommt eine eigene Anmeldung (E-Mail-Link, optional Passwort) und sieht dieselben Kinder, Berichte und Einstellungen. Wochenmail geht an jeden Zugang einzeln, abschaltbar. Das Hauptkonto kann Zugänge und offene Einladungen entfernen; der zweite Zugang kann niemanden einladen. Löscht der zweite Zugang sein Konto, bleiben die Kinder erhalten. **Server-Update nötig** (neue Spalten werden beim Start automatisch angelegt).

## 2.76.2 – 2026-10-10
- Lernen › Was lernen?: Die Umschaltung 🎒 Schule / 💼 Business steht jetzt immer oben, auch wenn die Einheiten vom Betreiber vorgegeben sind. Im Profil entfällt dafür der Bereich „Lernbereich“ (Abschnitt heißt nur noch „Spieler“).

## 2.76.1 – 2026-10-10
- Lernen › Was lernen?: „✏️ Grammatik“ ist jetzt eine Kachel links neben „🔀 Unregelmäßige Verben“ direkt unter den Schuljahr-Karten (nicht mehr im oberen Reiter). Die Grammatik-Seite hat oben „← Was lernen?“. Die Verben-Kachel öffnet die Verbenliste (dort „Verben üben“).

## 2.76.0 – 2026-10-10
- Lernpfad: neue **Grammatik-Station** ✏️. Je Abschnitt gibt es nach den Wort- und Verben-Stationen eine Grammatik-Lektion zur passenden Einheit, direkt vor dem Boss (Simple Past in Unit 1b, Fragen und Verneinung in Unit 1c). Sie wird nicht automatisch übersprungen; Sterne wie bei den anderen Stationen (3 ab 85 %, 2 ab 60 %). Nach der Lektion geht es mit „Weiter auf dem Pfad“ zurück. Wer den Boss schon geschafft hat, behält seinen Fortschritt: die Station gilt dann als erledigt. Themen bekommen dafür das Feld `unit` in `data/grammatik.js`. Keine Server-Änderung nötig.

## 2.75.3 – 2026-10-10
- Grammatik: Fehler im Thema „Simple Past: Das ist passiert“ behoben. Beim Satz „Yesterday we goed to the cinema.“ zeigte die Markierung auf das falsche Wort („to“ statt „goed“), und die Korrektur stand dadurch im falschen Satz. Alle 30 Aufgaben beider Themen geprüft. Erfundene Formen (goed, buyed, haved, likeed) kommen nur noch als Fehler im Fehlersatz vor, nicht mehr als Antwortmöglichkeit. Neues Prüfwerkzeug `tools/check-grammatik.js` (`node tools/check-grammatik.js`) kontrolliert Markierung, Lücken, doppelte Antworten und falsche Formen in richtigen Lösungen.

## 2.75.2 – 2026-10-10
- Lernen öffnet jetzt mit „Was lernen?“ (vorher Pfad).

## 2.75.1 – 2026-10-10
- Lernen: „Lernbereich“ heißt jetzt **„Was lernen?“** und steht ganz links als erster Reiter (danach Pfad, Üben, Grammatik, Fortschritt). Hinweistexte angepasst.

## 2.75.0 – 2026-10-10
- Neu: **Grammatik** (Lernen › Grammatik), Gerüst mit zwei Themen nach Headlight 2, Unit 1: „Simple Past: Das ist passiert“ (-ed, unregelmäßige Verben, was/were) und „Simple Past: Fragen und Verneinung“ (did / didn't + Grundform). Themen und Übungen stehen in `data/grammatik.js` (`window.GRAMMAR`), die Lektionen in `js/grammatik.js` (`VTGR`). Eine Lektion besteht aus einer Erklärkarte (mit Beispielen zum Anhören und Merksatz) und 8 Übungen aus vier Formen: Lücke zum Auswählen, Lücke tippen, Satz bauen, Fehler finden. Falsche Aufgaben kommen am Ende der Lektion noch einmal. Je Thema 15 Aufgaben, die Lektion zieht zuerst noch nicht sichere. Lernstand je Thema in `state.gram` (Prozent „sitzt“), Zeit zählt aufs Tagesziel, Münzen wie bei den Wortspielen (Tageslimit gemeinsam). Weitere Themen stehen als „kommt bald“ in der Liste (have to / should / can, will / going to, Steigerung, some / any, if-Sätze).

## 2.74.0 – 2026-10-10
- Wortspiele (Wort-Detektiv, Freezy, Xing, Blast, Letters): Kurzerklärung. Beim ersten Start jedes Spiels erscheint eine Karte „So geht’s“ mit 3 bis 4 kurzen Punkten und dem Knopf „Los geht’s“. Danach öffnet der Knopf „?“ oben im Spiel jederzeit die Regeln (bei Blast hält das Spiel dabei an). `settings.gameIntro` merkt, welche Karten schon gezeigt wurden.

## 2.73.1 – 2026-10-10
- Lernbereich: Jede Gruppe (Schulbuch, Klassen-Liste, eigene Listen) hat unter „Gruppe üben“ jetzt auch die Spiele (Match-Rausch, Blitzrunde, Letztes Herz, Wort-Detektiv, Freezy, Blast, Letters, Xing) mit allen Wörtern der Gruppe. Die Wortspiele nehmen dafür mehrere Einheiten auf einmal (`opts.units`).

## 2.73.0 – 2026-10-10
- Einheit (Lernen › Lernbereich › Einheit): unter „Wie möchtest du üben?“ gibt es neu „Oder als Spiel“ mit Match-Rausch, Blitzrunde, Letztes Herz, Wort-Detektiv, Freezy, Blast, Letters und Xing, jeweils mit den Wörtern genau dieser Einheit (auch wenn sie nicht im aktiven Lernbereich liegt). Ab 5 Wörtern in der Einheit.

## 2.72.1 – 2026-10-10
- Letters: Wörter überschneiden sich jetzt gezielt. Beim Platzieren wird die Stelle mit den meisten gemeinsamen Buchstaben bevorzugt (kein Wort steckt komplett in einem anderen). Im Test hatte jedes Rätsel Kreuzungen, im Schnitt etwa 4 gemeinsame Felder, immer 7 Wörter und alle 8 Richtungen.

## 2.72.0 – 2026-10-10
- Neu: **Letters**, der Buchstabensalat (Spielen › Arena, `lettersStart()` in js/spiele.js). 7 englische Wörter verstecken sich in einem 9 × 9 Raster, waagerecht, senkrecht und diagonal, vorwärts und rückwärts (jedem Wort wird eine eigene Richtung zugewiesen). Die Liste zeigt die deutschen Bedeutungen mit Buchstabenzahl, das englische Wort erscheint beim Fund. Markieren per Wischen oder per Tippen auf Anfang und Ende, die Linie rastet auf die acht Richtungen ein. Tipp (Tippen auf einen Hinweis) markiert den Anfang des Wortes. Punkte mit Tempo-Bonus, Lernstand wie bei den anderen Wortspielen.

## 2.71.0 – 2026-10-10
- Neu: **Blast**, der Wörter-Shooter (Spielen › Arena, `blastStart()` in js/spiele.js). Oben steht ein deutsches Wort, englische Wörter fliegen von oben auf die Rakete zu: das richtige antippen (Laserstrahl, Explosion), ein falsches kostet ein Herz, ein verpasstes richtiges Wort auch. Drei Herzen, alle 10 Treffer ein Extra-Herz (bis 5), alle 5 Treffer ein Level (schneller, mehr Wörter). Eis-Sterne ❄️ bremsen alles 5 Sekunden, Bomben 💣 räumen die falschen Wörter weg. Serien-Multiplikator, Lernstand wie bei den anderen Wortspielen, Zeit zählt aufs Tagesziel. Am Rechner schießen die Zifferntasten 1 bis 9 (von links nach rechts).

## 2.70.1 – 2026-10-10
- Wortspiele: **Wort-Kreuz heißt jetzt „Xing“**, **Rette Eisi heißt „Freezy“**, der Eisbär heißt **Icy**. Das Kreuzworträtsel ließ sich in etwa jedem dritten Versuch nicht bauen (Raster zu groß); das Raster bleibt jetzt beim Bauen im Rahmen (höchstens 9 × 9), es entstehen immer 8 Wörter. Wort-Detektiv: eigener, deutlicher Knopf „✓ Prüfen“ (leuchtet, sobald alle Felder gefüllt sind), damit man nicht nach der Eingabe suchen muss.

## 2.70.0 – 2026-10-10
- Neu: drei Wortspiele unter Spielen › Arena (`js/spiele.js`, `VTG`): **Wort-Detektiv** (Wordle mit deutschem Hinweis, 5 Wörter, 6 Versuche, Farbfeedback), **Rette Eisi** (Galgenmännchen mit schmelzendem Eis, 5 Wörter) und **Wort-Kreuz** (Kreuzworträtsel aus den Wörtern, deutsche Hinweise, englische Lösungen, Prüfen und Tipp). Sie nutzen nur einzelne Wörter ab 3 Buchstaben, Fehlerkartei und Fälliges zuerst, geben Lernstand über `S.grade`, zählen aufs Tagesziel und teilen sich mit der Arena das Münzlimit (30 am Tag).

## 2.69.7 – 2026-10-10
- Kopfzeile: Die Herzen ragten bei schmalen Handys und großen Zahlen (Münzen, Serie, XP, Booster) rechts über den Rand. Die Zeile schrumpft jetzt (kleinere Abstände und Schrift unter 400 px, Rangname mit Auslassung), die Herzen bleiben immer sichtbar.

## 2.69.6 – 2026-10-10
- Mitlesen: Der Knopf „Los geht’s“ (und „Nochmal“/„Fertig“ am Ende) lag in der niedrigen Wortkarte und war abgeschnitten, deshalb ging Teil 2 nie los. Die Knöpfe stehen jetzt in einer eigenen Zeile unter der Karte.

## 2.69.5 – 2026-10-10
- Mitlesen: Eigene Anzeige „👂 Zuhören“ / „🎤 Jetzt du! Sprich laut nach“ (grün, Balken läuft grün mit) unter der Wortkarte, statt in der niedrigen Karte unterzugehen. Die letzten Wörter der Liste bleiben sichtbar (Platzhalter am Listenende, mehr Abstand nach unten).

## 2.69.4 – 2026-10-10
- Mitlesen: Vorlesen bleibt nicht mehr hängen. Die Sprachausgabe-Äußerung wird festgehalten (Chrome/Android feuerte „Ende“ sonst manchmal nicht) und eine Notbremse geht nach einigen Sekunden zum nächsten Wort weiter.

## 2.69.3 – 2026-10-10
- Mitlesen: Tempo-Regler und Tasten (Zurück, Pause, Weiter) stehen jetzt direkt unter der Wortkarte und über der Liste. Sie waren auf manchen Handys unter der Browserleiste verdeckt. Die Liste füllt den Rest.

## 2.69.2 – 2026-10-10
- Mitlesen: Alles passt auf eine Seite, ohne seitliches Überlaufen. Lange deutsche Wörter und Übersetzungen (z. B. „der Cousin / die Cousine“) brechen in Karte und Liste um, Schrift und Kartenhöhe passen sich der Bildschirmgröße an (geprüft bei 320, 393 und 444 px Breite).

## 2.69.1 – 2026-10-10
- Zurückgenommen: die Fenstergrößen-Änderungen aus 2.68.1 (Zoom-Sperre, Vollbild-Höhe) und 2.69.0 (breitere App, zwei Spalten, Querformat). Index und App-Code stehen wieder auf dem Stand von 2.68.0 (fester Kopf und Tempo-Regler beim Mitlesen bleiben).

## 2.69.0 – 2026-10-10
- Fensteranpassung: Auf breiten Bildschirmen (ab 900 px) wird die App bis 1040 px breit statt 780 px. Mitlesen nutzt im Querformat und am Rechner zwei Spalten (Wortkarte, Regler und Knöpfe links, Liste rechts). Flache Querformate (Handy quer): kompakte Kopfzeile, Menüleiste und Übungsrunde, damit mehr vom Inhalt sichtbar bleibt. Der Zoom-Zwang aus 2.68.1 bleibt nur noch beim Mitlesen.

## 2.68.1 – 2026-10-10
- Mitlesen startet immer ganz herausgezoomt: Zoom wird zurückgesetzt und während der Übung gesperrt, danach wieder freigegeben. Vollbild mit 100dvh und Sicherheitsabständen, kompaktere Karte auf niedrigen Bildschirmen.

## 2.68.0 – 2026-10-10
- Mitlesen: Kopfbereich (Titel, Teil, Wortkarte, Balken) bleibt fest, nur die Wortliste darunter scrollt. Neuer Tempo-Regler 🐢 bis 🐇 (5 Stufen, Standard Mitte, wird gemerkt; `settings.mlSpeed`).

## 2.67.2 – 2026-10-10
- Mitlesen: Auf der Karte „Jetzt du“ lagen Knopf, Balken und Liste übereinander und die Texte waren dunkel auf dunkel. Eigene helle Farben, feste Höhe der Wortkarte; Pause/Vor/Zurück sind auf den Übergangs- und Endkarten ausgeblendet.

## 2.67.1 – 2026-10-10
- Korrektur Lernpfad: Seit 2.64.0 überschrieb der Stil des „Geheimen Geschenks“ (`.psec`) die Pfad-Abschnitte, die Karte war verschoben und leer. Das Geschenk heißt jetzt `.psgift`, der Pfad ist wieder wie vorher.

## 2.67.0 – 2026-10-10
- Lernpfad: Jeder Abschnitt hat den optionalen Knopf „🗣️ Mitlesen“ (alle Wörter des Abschnitts hören, dann laut mitsprechen). Zählt wie bisher nicht fürs Tagesziel.

## 2.66.1 – 2026-10-10
- Daily-Challenge-Karte kompakter (Schrift und Abstände passend zum Rest der App). Dauer-Auswahl bricht nicht mehr um („Dauer in Min“ mit 3/5/10/15), „ca. 10 Min“ in den Kacheln bleibt zusammen.

## 2.66.0 – 2026-10-10
- Neu: Übung „Mitlesen“ (`openMitlesen()` in app.js). Teil 1: alle Wörter werden gezeigt und vorgelesen, Teil 2: „Jetzt du“, jedes Wort wird vorgesprochen, danach Pause zum lauten Nachsprechen. Pause, Vor/Zurück, Tempo aus „Tempo bei Alle vorlesen“. Zu finden in der Einheit (🗣️ Mitlesen) und unter Lernen › Gezielt üben (alle gelernten Wörter, z. B. vor einer Arbeit). Zählt weder Münzen noch Lernzeit.

## 2.65.0 – 2026-10-09
- Pass: Nachholen (doppeltes Tagesziel heute holt einen weiteren verpassten Tag der Woche nach), Crew-Bonus (+10 🪙 pro Woche, wenn ein Crew-Wochenziel geholt wurde; `state.crew.days`), Wochenthema (Motto je Woche), Sammel-Set-Anzeige (Wochen-Figuren x/4) und Siegerbild zum Teilen (Bild mit Stempeln und Stufen, Teilen-Menü oder Download).

## 2.64.0 – 2026-10-09
- Pass: Wochenstufen Bronze (3 Tage, +5 🪙), Silber (5 Tage, +10 🪙) und Gold (7 Tage, +20 🪙), einzeln abholbar (`claimPassTier`, `state.pass.tiers`). Auch wer nur 3 bis 4 Tage schafft, geht nicht leer aus.
- Pass: „Geheimes Geschenk“ als Silhouette mit Seltenheit und „kommt Montag, TT.MM.“ für die nächste Woche.

## 2.63.0 – 2026-10-09
- Pass: Joker-Tag (pro Woche zählt ein verpasster, vergangener Tag trotzdem mit, sobald mindestens ein Tag geschafft ist, keine Strafe) und Stempelkarte statt der kleinen Tagespunkte: sieben Stempel mit dem Symbol der Saison, Joker als 🃏, heutiger Tag pulsiert, der neue Stempel „knallt“ einmal mit Ton und Funken ein. Auf der Ergebnisseite steht „Pass-Stempel: Woche N, x von y Tagen“.

## 2.62.1 – 2026-10-09
- Willkommenspaket: Die erste Figur wählt das Kind aus Fuchs, Schildkröte und Panda (vorher Panda, Eule, Pummelbär). Dazu wie bisher Sticker, 50 Münzen, Konfetti und Titel Wortjäger.

## 2.62.0 – 2026-10-09
- Shop im ersten Jahr nach Kalender: Start-Sortiment mit 22 Artikeln (Woche 0), danach schaltet sich jeden Montag frei, was „ab Woche N“ dran ist (selten ab Monat 1–2, episch ab Monat 3, erste legendäre Figur ab Woche 14, Eis-Set ab Woche 17, Pass-Figuren erst nach mehreren Monaten). Silhouetten „Kommt bald“ im Shop, Alben, Tagesangebot und Kauf folgen dem Kalender; gekaufte Artikel bleiben immer sichtbar. Dashboard (Familien › Shop-Kalender, nur Betreiber): Go-live-Datum und Termine je Artikel einstellbar. Standard-Go-live: 12.10.2026.
- Willkommenspaket für jedes neue Kind: erste Figur zur Wahl (Panda, Eule, Pummelbär) mit Sticker, 50 Münzen, Effekt Konfetti und Titel Wortjäger. Bestehende Profile bekommen es nicht. Server-Update nötig (Shop-Kalender).

## 2.61.0 – 2026-10-09
- Season-Pässe: Neuer, sparsamer Aufbau mit 2 bis 3 Highlights je Saison (Woche 2 Figur selten, Woche 4 Figur legendär, Finale Rahmen oder Effekt), dazwischen nur Münzen und Booster. Im Dashboard (Belohnungen › Pass) gibt es Vorlagen zum Laden: Eiswelt, Zauberwald (Pummel-Reihe), Beute-Insel (Fortnite-Reihe), Sternenreise (Weltall); Titel und Hintergründe sind jetzt wählbar. In der App zeigt die Pass-Seite die Highlights als große Karten mit Silhouette für noch nicht abgeholte Geschenke. Server-Update nötig (Dashboard).

## 2.60.0 – 2026-10-09
- XP-Booster gibt es nur noch ab und zu: Boss-Truhen enthalten nur noch mit 10 % Wahrscheinlichkeit einen (vorher 40 %). Dafür ist der Booster ein Geschenk im Monatspass (Standard: Woche 2 und Finale, je 1). Beim Wochenpass-Zusammenstellen im Dashboard gibt es dafür das Feld „+n ⚡ XP-Booster“ (0 bis 3 je Woche/Finale). Server-Update nötig für das neue Feld.

## 2.59.3 – 2026-10-09
- Lernpfad: Pro Boss höchstens 25 Münzen. Die Boss-Truhe bringt 10 bis 25 (statt 30 bis 60), auch mit Booster und Münzfaktor nie mehr als 25; schon angelegte Truhen zahlen ebenfalls höchstens 25. Boss-Runden in der Arena geben selbst keine Münzen mehr, sondern nur die Truhe. Anzeigetext in den Münz-Hinweisen angepasst.

## 2.59.2 – 2026-10-09
- Arena abgesichert: Ein Fehler beim Auswerten einer Antwort (Lernstand, Ton, Effekt, Ergebnis) kann eine Runde nicht mehr festhalten. Treffer und Fehler zählen weiter, Zeit- und Fehler-Ende laufen weiter, bei leerem Wortstapel wird neu gemischt, und die Ergebnisseite erscheint auch dann, wenn die Auswertung scheitert. (Meldung: „Letztes Herz“ reagierte nach 540 Punkten nicht mehr.)

## 2.59.1 – 2026-10-09
- „Letztes Herz“: Die große Zahl oben zeigte nach jeder Antwort „0.0“, als wäre die Zeit abgelaufen. Jetzt steht dort durchgehend die Zahl der Treffer. Die Runde endet unverändert bei einem Fehler oder wenn der Balken eines Worts abläuft.

## 2.59.0 – 2026-10-09
- Kinder melden ihr Gerät selbst an: In der App (Profil › Auto-Save) „Meine Eltern fragen“ zeigt einen kurzen Code (z. B. K7M-4PX, 15 Minuten gültig) und lässt sich teilen. Eltern geben ihn im Dashboard frei („Gerät eines Kindes freigeben“, auch über den Link …/f/?koppeln=CODE), wählen das Kind oder legen ein neues an. Danach verbindet sich das Gerät automatisch, ohne Mail und Passwort für das Kind. Server-Update nötig.

## 2.58.0 – 2026-10-09
- Eltern und Lehrkräfte können sich mit E-Mail und Passwort anmelden (Dashboard-Anmeldeseite). Der Anmeldelink per Mail bleibt als Alternative und für „Passwort vergessen“. Passwort festlegen oder ändern unter Konto (mindestens 10 Zeichen, scrypt-Hash, Sperre nach 6 Fehlversuchen für 15 Minuten, Ändern nach älterer Sitzung nur mit dem aktuellen Passwort). Datenschutzerklärung ergänzt (Fassung 2026-10d, noch rechtlich prüfen lassen). Server-Update nötig.

## 2.57.1 – 2026-10-09
- Feedback-Datenschutz: Das App-Gerät eines Kindes sieht in Profil › Feedback nur Rückmeldungen, die von diesem Gerät kamen, nicht die, die die Eltern im Dashboard geschrieben haben. Server-Update nötig.

## 2.57.0 – 2026-10-09
- Feedback: Eltern und Lehrkräfte können in der App (Profil › Feedback) und im Dashboard (Reiter Feedback) Idee, Fehler, Lob oder Frage senden. Alles landet in einer Datenbanktabelle; der Betreiber bearbeitet im Dashboard (Status, Antwort, Notiz), Absender sehen Status und Antwort. Täglich um 18 Uhr (wählbar) eine Mail mit allen neuen Rückmeldungen, nur wenn es welche gibt; „Jetzt senden“ zum Testen. Server-Update nötig.

## 2.56.0 – 2026-10-09
- Track Wordy aufgeräumt: pro Kind zwei Reiter. **Dashboard** mit Unterreitern Überblick (heute, Woche), Verlauf (Übungszeit, Tage einzeln), Wörter (Einheiten, alle Wörter, Problemwörter) und Aktivität (Runden, Käufe). **Einstellungen** nach Wichtigkeit als aufklappbare Gruppen: Verbindung & Geräte, Lernstoff steuern, Tagesziel & Wochenzeitplan, Belohnungen, Freunde/Klasse, Sicherung & Daten, Name & Spieler. Die Wochenmail-Einstellung steht jetzt auf der Konto-Seite (Familien). Server-Update nötig.

## 2.55.0 – 2026-10-09
- Start-Reiter „Dein Tag“: feste Reihenfolge mit Häkchen und Weg (Daily Challenge, Pfad-Station, Lernplan/Klassenaufgabe, Tagesziel), Hero mit Status und Streak bleibt. Der Lernpfad liegt jetzt unter Lernen › Pfad.
- Gesteuertes Lernen: Ist die App mit dem Server verbunden, kommen Challenge, Üben und Pfad aus den im Dashboard gewählten Pfad-Einheiten (Standard: Headlight 2), ohne Hinweis für das Kind. Neuer Dashboard-Schalter „Kind wählt den Stoff selbst“ (Spieler › Pfad) gibt die Lernbereiche frei.
- Lernbereich neu geordnet: Schulbücher (nach Schuljahr und Schulzweig, Headlight 2 = Klasse 6 · Realschule), dann Klassen-Listen, dann eigene Listen. Server-Update für den Schalter nötig.

## 2.54.6 – 2026-10-09
- Dashboard „Heute“: Fehlt zum Tagesziel nur ein kleiner Rest (z. B. 9:40 statt 10:00 Min., gerundet „10 Min.“), steht jetzt die genaue Zeit und „Noch 20 Sek. bis zum Tagesziel“ statt eines unerklärlich gelben Balkens. Server-Update nötig.

## 2.54.5 – 2026-10-09
- Auslieferung: Die Versionen 2.53.8 bis 2.54.4 wurden von GitHub Pages nicht veröffentlicht (Push auf zwei Zweige in einem Befehl). Enthält alle Änderungen dieser Versionen.

## 2.54.4 – 2026-10-09
- Profil: „Design“ ist eine eigene zugeklappte Zeile direkt unter „Lernen“ (nicht mehr darin).

## 2.54.3 – 2026-10-09
- Profil: „Design“ ist jetzt eine zugeklappte Zeile im Bereich „Lernen“ (zeigt das gewählte Design) statt einer großen Karte oben.

## 2.54.2 – 2026-10-09
- „Was passt nicht?“: Die vier Wörter werden beim Start automatisch nacheinander vorgelesen (mit Lautsprecher-Knopf zum Wiederholen), bevor man antwortet. Nur wenn Ton an ist.

## 2.54.1 – 2026-10-08
- Korrektur: Im Dashboard fehlten durch einen Fehler in 2.54.0 zwei Funktionen („inviteCard is not defined“); Spieler anlegen und „Neuer Code“ zeigen Link und Code wieder an. Server-Update nötig.

## 2.54.0 – 2026-10-08
- Verbindungslink: Das Dashboard zeigt nach dem Anlegen (und bei „Neuer Code“) einen Link, den man dem Kind schickt. Antippen öffnet Wordy, nach einer Bestätigung ist das Gerät verbunden; der Code von Hand bleibt möglich. Neu: Server-Einstellung `APP_URL` (Standard https://wordy.explusmore.com).
- Gleiche Namen: Innerhalb eines Kontos (bzw. beim Betreiber) lässt der Server keinen zweiten Spieler mit gleichem Namen zu (Groß-/Kleinschreibung egal), auch beim Umbenennen. Server-Update nötig.

## 2.53.10 – 2026-10-08
- Dashboard: Empfänger-Adresse(n) der Sonntagsmail direkt unter „Wochenzusammenfassung per Mail“ eintragen (mehrere mit Komma). Hat Vorrang vor `MAIL_TO` in der `.env`; leer speichern = `.env` gilt wieder. Server-Update nötig.

## 2.53.9 – 2026-10-08
- Wordy-Symbol wieder mit bunten Buchstaben (rosa, orange, grün, blau, lila) auf dem bunten Verlauf, dazu der ganze Clombo-Sticker. Das Dashboard-Symbol bleibt unverändert.

## 2.53.8 – 2026-10-08
- Clombo wieder wie vorher (Stacheln, großes Maul, Schwanz) statt mit rundem Gesicht, überall (Kopf, Sticker, Bühne, Tänze).
- Wordy-Symbol zeigt den ganzen Clombo als Sticker unter den goldenen WORDY-Kacheln, kein runder Ring mehr.

## 2.53.7 – 2026-10-08
- **Grauer Halbkreis am Kopf weg:** Der weiße Glanzstrich links am Kopf (wirkte auf hellen Figuren wie ein grauer Halbkreis) ist bei allen Figuren und Stickern entfernt. App-Symbole neu erzeugt.

## 2.53.6 – 2026-10-08
- **Shop:** Die Sticker-Kacheln sitzen wieder über dem Namen statt in der Schrift. Der Shop und die Sammlung im Showroom sind immer nach Seltenheit sortiert (gewöhnlich, selten, episch, legendär), danach nach Preis.
- **Plan:** `PLAN-Belohnungen.md` mit Zielkatalog, Preisen je Stufe und Nachschub-Kalender (noch nicht umgesetzt).

## 2.53.5 – 2026-10-08
- **Dashboard nennt den Spieler beim Namen** (Server-Update nötig): Statt „das Kind“ steht in den Texten der Name des gewählten Spielers (Wochenpass, Lernplan, Ziele, Geschenke, Klassen-Hinweis); ohne Namen bleibt „das Kind“ als Rückfall. Pronomen sind dabei vermieden.

## 2.53.4 – 2026-10-08
- **Dashboard mit neutralem Wording** (Server-Update nötig): Statt „Magnus“ stehen jetzt „das Kind“ bzw. der Name des jeweiligen Spielers (z. B. beim Wochenpass), das Namensfeld zeigt „Vorname des Kindes“.

## 2.53.3 – 2026-10-08
- **Extramünzen nur für den Betreiber** (Server-Update nötig): Im Elternbereich entfallen „Extramünzen schenken“, der Münzfaktor und die Bonusmünzen bei Zielen und Lernplänen. Der Server lehnt Geschenke und Münzfaktor über Elternkonten ab und setzt Bonusmünzen bei Zielen und Plänen aus Elternkonten auf 0. Der Betreiber behält alles; die Münzen, die Kinder durch Lernen verdienen, bleiben unverändert.

## 2.53.2 – 2026-10-08
- **Wochenpass nur für den Betreiber** (Server-Update nötig): Die Karte „Pass: Wochen-Sets zusammenbauen“ erscheint im Eltern-Dashboard nicht mehr, und der Server lehnt das Zusammenstellen und Lesen des Wochenpasses über Elternkonten ab. Der Betreiber stellt ihn wie bisher ein; Kinder sehen den Pass unverändert in der App. Lehrkräfte haben keine Kinder und damit keinen Zugriff; ob es Belohnungen für Klassenaufgaben geben soll, ist noch offen.

## 2.53.1 – 2026-10-08
- **„Welches Wort fehlt?“ liest den richtigen Satz vor:** Nach der Antwort (richtig oder falsch) steht das gesuchte Wort im Satz (grün bei richtig, rot bei falsch) und der ganze Satz wird noch einmal vorgelesen. Bisher wurde bei einer falschen Antwort nur das einzelne Wort gesprochen.

## 2.53.0 – 2026-10-08
- **Erklärfilme hinter eigenem „▶ How-to“-Knopf:** Die Filmkarte ist aus dem Üben-Bereich verschwunden, damit sie den Lernfluss nicht stört. Der Knopf sitzt oben neben den Reitern in Lernen und Spielen, öffnet eine Auswahl aller Filme und startet den gewählten.

## 2.52.2 – 2026-10-08
- **Track-Wordy-Symbol:** goldene WORDY-Kacheln über einer Wochenstatistik „4 von 7 Tagen“ (vier Balken mit Stern, drei offene) statt des einzelnen W.

## 2.52.1 – 2026-10-08
- **Dashboard heißt „Track Wordy“** (Server-Update nötig): Name der installierbaren App, Seitentitel und Kopfzeile von Dashboard und Elternbereich („Track Wordy Eltern“), dazu das Dashboard-Symbol statt des Bücher-Emojis in der Kopfzeile.

## 2.52.0 – 2026-10-08
- **Neue App-Symbole und Startbild im Nachtgold-Stil:** Wordy mit goldenen Buchstaben-Kacheln und Clombo im goldenen Ring auf Dunkelblau (192, 512, maskierbar, Apple-Symbol, Favicon). Das Startbild der installierten App nutzt jetzt dasselbe Dunkelblau (Manifest `background_color`/`theme_color`), das Symbol verschmilzt mit dem Hintergrund statt als bunte Kachel auf Lila zu stehen; dazu ein kurzer Startbildschirm in der App, der nach dem Aufbau ausblendet.
- **Eigenes Symbol fürs Dashboard** (Server-Update nötig): Petrol mit goldenem W und Balkendiagramm, „ähnlich wie Wordy, aber anders“. Dashboard und Elternbereich sind als eigene App installierbar („Wordy Dashboard“ bzw. „Wordy Eltern“), Symbole und Manifest liegen öffentlich unter `/app/`. Erzeugt von `tools/make-icons.js`.

## 2.51.2 – 2026-10-08
- **Fehlerwörter im Dashboard mit Klartext statt Nummern** (Server-Update nötig): Bei Sätzen („s123“) und unregelmäßigen Verben („v#7“) kam bisher nur die interne ID im Ereignis an. Die App schickt jetzt Englisch und Deutsch mit (Verben als „be, was, been“), und der Server löst alte Ereignisse über den Katalog der Datendateien (Wörter, Sätze, Verben) nach. Dadurch zeigen auch die bisherigen Fehler sofort Texte. Gilt ebenso für die Stolperwörter der Klasse.

## 2.51.1 – 2026-10-08
- **Design im Profil wählbar:** Eigene Karte „🎨 Design“ ganz oben im Profil mit den vier Designs als Vorschau-Kacheln; Wechsel sofort, bleibt gespeichert.

## 2.51.0 – 2026-10-08
- **Neue Designs, durchgängig** (Einstellungen › Ton & Aussehen › Design): **Nachtgold** (Standard; dunkles Marineblau mit Gold, bei „Hell“ cremefarben mit Petrol und Gold), **Sonnenschein** (hell, warm, bunt, dicke Knöpfe) und **Aurora** (Nachthimmel mit Polarlicht, glasige Karten, Mint) sowie **Klassisch** (bisheriges Papier-Design, dort gelten die Shop-Farbwelten). Das Design färbt Kopfzeile, Reiter, Karten, Knöpfe, Balken, Auswahlfelder, Challenge-Kachel, Duell-Auswahl, Arena-, Shop- und Crew-Bausteine, dazu je Design eine eigene Überschriftenschrift. Die Auswahl steht pro Gerät in den Einstellungen.
- **Dashboard und Anmeldeseiten im selben Stil:** Nachtgold dunkel/hell (folgt dem Gerät), goldene bzw. petrolfarbene Knöpfe, rundere Karten; Datenschutzerklärung und Anmeldeseite ebenso.

## 2.50.2 – 2026-10-08
- **Ranglisten sauber ausgerichtet:** Medaille, Figur, Name und Punkte stehen in festen Spalten untereinander (auch bei der eigenen, hervorgehobenen Zeile); Trennlinien gleichmäßig.

## 2.50.1 – 2026-10-08
- **Duell-Auswahl im Stil der Daily Challenge:** dunkle Karte mit goldenem Rahmen, goldene Modus-Knöpfe, ruhiger Abbrechen-Knopf; offene Herausforderungen haben jetzt einen goldenen statt pinken Rahmen.

## 2.50.0 – 2026-10-08
- **Mehr üben wird belohnt:** Die Dauer-Wahl (3/5/10/15 Min) in der Daily Challenge entfällt, weil sie am Bonus nichts änderte. Die Runde hat die Länge des Tagesziels; wer keine Zeit hat, nimmt die „Blitz-Challenge“ (4 Min) und rettet trotzdem die Serie. Neu: **Bonus-Runden** – nach der Daily Challenge gibt jede weitere gemischte Runde +5 🪙 (mindestens 8 Aufgaben und 60 % richtig, höchstens 3 am Tag; erste Woche ×1,5 wie sonst). Die Kachel zeigt, wie viele noch offen sind, das Rundenende zeigt die Belohnung.

## 2.49.3 – 2026-10-08
- **Freunde:** Das Eingabefeld für den Freundescode passt jetzt auf kleine Bildschirme (kleinere Schrift, kurzer Platzhalter „Freundescode“).

## 2.49.2 – 2026-10-08
- **Daily-Challenge-Kachel neu** („Goldene Belohnung“): dunkle Karte mit goldenem Rahmen im Farbklang der App, Serie als Flammen-Pille, Belohnungsfeld mit Tagesbonus und Weg zum nächsten Serienbonus, goldener Start-Knopf, Wochentage und Dauer-Wahl in der Karte. Die zweite Serien-Karte entfällt.

## 2.49.1 – 2026-10-08
- **Testphase Freunde** (Server-Update nötig): Spieler, die der Betreiber selbst anlegt (Magnus, Chrissi …), haben Freunde, Crew und Liga von Anfang an eingeschaltet; bestehende Spieler des Betreibers werden beim Start einmalig eingeschaltet. Eltern-Konten bleiben bei „aus“; im Dashboard lässt es sich pro Kind wieder ausschalten.

## 2.49.0 – 2026-10-08
- **Klassen-Modus** (Server-Update nötig; rein freiwillig): Der Betreiber lädt Lehrkräfte per Einladungslink ein (Einladung mit Rolle „Lehrkraft“). Die Lehrkraft legt im Dashboard eine Klasse an (Klassencode), stellt Wochenaufgaben ein (Einheiten, Zeitraum, Ziel je Kind) und sieht nur Klassen-Zahlen: je Kind Minuten, aktive Tage, erkannte Wörter, dazu Lernstand der gewählten Einheiten und die häufigsten Stolperwörter der ganzen Klasse (keine Einzelfehler, keine Einzel-Rangliste). Kinder treten in Spielen › Challenge mit dem Code bei, die Eltern stimmen im Dashboard zu. Die Aufgabe erscheint als Klassen-Challenge (fragt genau diese Einheiten ab, zählt als Daily Challenge mit Tagesbonus), mit persönlichem Balken, Klassenziel-Balken und Crew-Liga der Klasse. Datenschutzerklärung um Abschnitt 7a ergänzt.
- Fahrplan (noch nicht gebaut): weitere Sprachen (Französisch, Spanisch …). Nötig: Sprache je Wortschatz (Felder en/de, Sprachausgabe, Unregelmäßige Verben und Grammatikregeln sind englischspezifisch), Klassen-Modus bleibt unverändert nutzbar.

## 2.48.0 – 2026-10-08
- **Crew-Wochenziele** (Server-Update nötig; Spielen › Crew): Freunde gründen eine Crew (Name und Zeichen aus fester Auswahl) und schaffen jede Woche drei gemeinsame Ziele: Übungszeit, wiedererkannte Wörter, aktive Tage. Bronze/Silber/Gold mit leuchtenden Belohnungsfeldern, farbiger Fortschrittsbalken mit Beitrag jedes Mitglieds, MVP-Krone, Crew-Serie in Wochen, Anfeuern mit Emojis, Rückblick auf die letzte Woche, roter Punkt am Reiter. Münzen (3/6/12) nur mit eigenem Beitrag. Medaillen „Crew-Mitglied“ und „Team-Gold“. Eltern sehen die Crew im Dashboard und können das Kind herausnehmen.
- **Datenschutzerklärung** nach Art. 13 DSGVO neu geschrieben (Verantwortlicher, Zwecke und Rechtsgrundlagen, Kinder und Einwilligung der Sorgeberechtigten, Empfänger, Drittländer, Speicherdauer, Sicherheit, Betroffenenrechte). Die Angaben des Betreibers kommen aus `.env` (`PRIVACY_*`), fehlende werden gelb markiert. Verlinkt in der App (Profil › Über Wordy) und bei der Registrierung. Hinweis: rechtlich prüfen lassen.

## 2.47.0 – 2026-10-08
- **Freunde, Duelle und Liga** (Server-Update nötig; Spielen › Freunde / Liga): Freundescode, Anfragen, Herausforderungen in Match-Rausch, Blitzrunde und Letztes Herz mit denselben Wörtern in derselben Reihenfolge, Antwort bis zu 7 Tage, Revanche, Emoji-Reaktionen, roter Punkt am Reiter bei neuen Herausforderungen, Wochen-Rangliste je Spiel unter Freunden.
- **Eltern behalten die Kontrolle**: Funktion pro Kind im Dashboard (Karte „Freunde & Duelle“) ein-/ausschaltbar, jede Freundschaft braucht die Zustimmung beider Eltern, sichtbar sind nur Name, Figur und Punkte.
- Duell-Sieg: +5 Münzen (höchstens 3 am Tag), neue Medaillen „Erstes Duell“, „Duell-Held“, „Duell-König“, „Challenge 7“, „Challenge 30“ im Showroom.
- Fehler behoben: „Noch mal“ und „Nochmal versuchen“ in der Arena nutzten die Antwortoptionen statt der Startoptionen (z. B. ging beim Boss-Wiederholen der Boss verloren).
- Server-Tests für Freundschaft, Zustimmung beider Eltern, Duell, Ergebnis, Reaktion, Liga und Plausibilität.

## 2.46.0 – 2026-10-08
- **Elternkonten für mehrere Familien** (Server-Update nötig): Einladungslink vom Betreiber → Registrierung mit E-Mail und Einwilligung → Anmeldung per Einmal-Link aus der Mail (ohne Passwort). Jede Familie verwaltet nur ihre eigenen Kinder (bis zu 6) im bekannten Dashboard unter `/f/`. Konto-Seite: Wochenmail an/aus, Daten herunterladen, Konto samt Kindern löschen. Betreiber-Dashboard: Reiter „👪 Familien“ mit Einladungen, Sperren und Löschen. Fremde Kinder sind für den Betreiber nicht sichtbar. Wochenmail pro Familie. Datenschutzerklärung als Entwurf unter `/f/datenschutz`.
- Neue Server-Tests: Registrierung, Einmal-Link, Isolation zwischen Familien und Betreiber, Sperren, Export, Löschen.

## 2.45.0 – 2026-10-08
- **Neues Hauptmenü** (Start · Lernen · Spielen · Beute · Profil): 
  - **Lernen**: Üben (Modi, Erklärfilme, Gezielt üben), Lernbereich, Fortschritt.
  - **Spielen**: **Challenge** (Daily Challenge groß, mit Tagesbonus) und **Arena** (die vier Spiele).
  - **Beute**: **Monatspass**, Shop, Showroom.
  - **Profil**: Spielerkarte mit Rang und Favoriten, darunter wie bisher Setup und Eltern-Bereiche (Zahnrad im Kopf entfällt).
- **Challenge-Serie** (neu): Tage in Folge mit geschaffener Daily Challenge, Wochenleiste mit Flammen, Serienbonus bei 3, 7, 14 und 30 Tagen (+10, +30, +60, +150 Münzen), Anzeige im Abschluss-Bildschirm.
- Der Pass heißt in der App „Monatspass“ und hat eine eigene Seite mit Erklärung. Der Showroom enthält ihn nicht mehr.

## 2.44.1 – 2026-10-07
- Üben: Die Kacheln zeigen die gewählte Dauer („ca. 5 Min“) statt einer Aufgabenzahl, denn die Runde hat kein Zeitlimit und die Anzahl richtet sich nach dem Tempo.

## 2.44.0 – 2026-10-07
- **Aufgenommene Erzählerstimme für die Erklärfilme**: Die App spielt MP3-Dateien aus `audio/film/` (Stimme Frau oder Mann, Dateiname mit Textprüfsumme, `index.json`), wenn sie vorhanden sind, sonst die Gerätestimme. Die Szene wartet, bis die Aufnahme zu Ende ist. Neue Auswahl „Nur Gerätestimme“ im Setup.
- Neues Werkzeug `tools/film-voice.js` (OpenAI oder ElevenLabs): vertont alle Filmtexte, überspringt Vorhandenes, entfernt Veraltetes. Anleitung in `tools/README-film-voice.md`. `build.js` nimmt `audio/film` in die Website und den Offline-Cache auf.
- Noch keine Aufnahmen im Repository: bis sie erzeugt sind, bleibt es bei der Gerätestimme.

## 2.43.0 – 2026-10-07
- **Bessere Erzählerstimme** (Erklärfilme und alle deutschen Ansagen): Die App wählt statt der ersten die natürlichste deutsche Stimme des Geräts (Siri, Enhanced, Premium, Neural, Google vor alten Computerstimmen).
- Setup › Töne: **Erzählerstimme Automatisch / Frau / Mann** (Frau warm und etwas langsamer, Mann tief und ruhig), Auswahl einer bestimmten Stimme des Geräts und „🎬 Erzähler testen“.

## 2.42.0 – 2026-10-07
- **Startseite aufgeräumt**: nur noch Begrüßung (kleinere Bühne mit Figur, Tagesziel, Rang, Streak, Münzen), Lernpfad, Lernplan für die Klassenarbeit (nur wenn die Eltern einen angelegt haben) und die Tagesaufgaben mit Links zu den Übungen. Die Daily Challenge ist die erste Tagesaufgabe.
- Umgezogen: Battle-Pass → Showroom (oben), Wochenplan und Wochenziele der Eltern → Fortschritt › Verlauf. Entfallen sind Favoriten-Leiste und große Start-Karte (Daily Challenge steht unter Üben und in den Tagesaufgaben).

## 2.41.1 – 2026-10-07
- Eisblock-Szene: Die Figur im Eis passt zum Set. Jedes Set in `SETS` hat ein Feld `fig` (Eis-Set: Eisbär); ohne Angabe bleibt es der Eisbär. Auch die Pass-Wochen nutzen weiter den Eisbär.

## 2.41.0 – 2026-10-07
- **Eisblock-Szene**: Wer ein Set komplett hat (Eis-Set), sieht statt der Meldung eine Szene: Der Eisbär steckt im Eisblock, antippen lässt ihn knacken und zersplittern, danach erscheint die Belohnungskarte (Eiskristall-Rahmen). Gilt beim Kauf eines Teils, beim Set-Kauf und für Meldungen, die erst später ankommen (z. B. Rang-Geschenk).

## 2.40.0 – 2026-10-07
- **Seltenheits-Karten im Shop**: Figuren, Sticker, Rahmen, Tänze, Outfits, Trikots, Sets usw. erscheinen als Karten im Zweierraster statt als Liste. Farbe, Etikett (Gewöhnlich/Selten/Episch/Legendär), Leuchten bei Episch und Legendär, großes Symbol, Wunsch-Stern, Vorschau ▶ bei Tänzen und Outfits, „✓ aktiv“, Preis (mit durchgestrichenem Altpreis), 🔒 Rang, 🎁 Pass/Set. Die Aktionen (Kaufen, Auswählen, Wunsch, Vorschau) sind unverändert.

## 2.39.1 – 2026-10-07
- Gelbe Rahmen um die Favoriten entfernt (Startseite und Showroom). Leere Plätze im Showroom behalten ihren gestrichelten Rand.

## 2.39.0 – 2026-10-07
- **Alle Figuren im Fortnite-Cartoon-Stil**: die 8 Emoji-Figuren (Fuchs, Panda, Schildkröte, Eule, Krake, Dino, Hai, Einhorn), alle Pummel-Figuren (Bär, Hase, Katze, Einhorn, Drache, Clombo, Phönix, Gold, Regenbogen, Galaxie) und die Fortnite-Reihe (Huhn, Wildschwein, Frosch, Wolf, Raptor, Beute-Lama, Kristall-Lama, Elite-, Champion-, Unreal-Kristall) sind als ganze Figuren gezeichnet, mit allen Tänzen und Outfits. Neue Datei `js/stilb.js` (ein gemeinsamer Körper, je Tier eigene Ohren, Gesicht, Zusätze).
- Avatar-Werte und IDs bleiben unverändert, der Lernstand ist nicht betroffen. Emoji-Avatare erscheinen jetzt überall als gezeichnete Figur (Kopfleiste, Sticker, Showroom).

## 2.38.1 – 2026-10-07
- Favoriten stehen nicht mehr in der Kopfleiste (zu voll). Sie bleiben auf der Startseite und im Showroom.

## 2.38.0 – 2026-10-07
- **Daily Challenge** statt „Weiterlernen“: die bunte Mischrunde (auch Startseiten-Empfehlung „Wiederholen“). Die erste Challenge des Tages (mind. 8 Aufgaben) gibt einmalig 10 Bonus-Münzen (mit Booster/Faktor), danach heißt der Knopf „Zusatz-Runde“. Hinweis auf der Kachel und im Abschluss-Bildschirm.
- „Lieblinge“ heißen jetzt **Favoriten** (Showroom, Startseite, Kopfleiste).
- Erklärfilm „Weiterlernen“ → „Daily Challenge“.

## 2.37.0 – 2026-10-07
- **Erklärfilme**: 13 kurze, witzige Trickfilme (Üben → Spielmodi → 🎬 Erklärfilme) zu Weiterlernen, Neue Wörter, Fehlerkartei, Sätze, Verben, Hören, Tippen, Lücken, Zuordnen und den vier Arena-Spielen. Bruno, Pingo, Robbi und Eisi im Fortnite-Cartoon-Stil, Sprechblasen, Untertitel, optional vorgelesen, Pause/Weiter/Zurück per Tipp, am Ende „Jetzt ausprobieren“. Neue Datei `js/film.js`.

## 2.36.2 – 2026-10-07
- Wochenziel „Neue Wörter“ heißt jetzt „Wörter wiedererkennen“ und zählt nur Wörter, die am Folgetag (nach dem Abstand) richtig beantwortet wurden. App (`deep` im Tagesverlauf), Server-Auswertung und Dashboard sind angepasst.

## 2.36.1 – 2026-10-07
- **Münzen nur fürs Behalten, nicht fürs Durchklicken**: Das erste Ansehen eines neuen Worts bringt keine Münze und kaum XP (2 statt 10). Die Münzen (jetzt 2) gibt es erst, wenn das Wort nach dem Abstand wirklich wieder erkannt wird.
- Entdecker-Bonus einer Einheit erst, wenn 5 Wörter wiedererkannt wurden (Stufe „Geübt“), nicht schon beim Ansehen.
- Tagesaufgabe „6 neue Wörter kennenlernen“ heißt jetzt „6 Wörter von früher wiedererkennen“ und zählt nur wiedererkannte Wörter.
- „Neue Wörter“ pausiert, solange 30 oder mehr Wörter fällig sind: erst wiederholen.

## 2.36.0 – 2026-10-07
- **Showroom** als eigener Reiter: Trophäenschrank mit Regalen (Pokale & Medaillen, Figuren, Tänze, Outfits & Trikots, Sticker, Extras), Seltenheitsstufen, gesperrte Stücke als Silhouette, „NEU“-Marke, Detailansicht (Liebling, Tragen, Ansehen, Zum Shop/Pass).
- **Sammler-Pokale** Bronze/Silber/Gold/Platin (25/50/75/100 % der Sammlung) mit einmaliger Münzbelohnung.
- **Lieblingsstücke**: bis zu 3, auf der Bühne im Showroom, auf der Startseite und im Kopf der App.
- **Neue Startseite**: Hero-Bühne mit Himmel je nach Tageszeit, tippbare tanzende Figur mit Sprechblase, Tagesziel-Ring, Rang-Balken, Streak/Münzen, Lieblingsleiste und große „Los geht’s“-Karte.

## 2.35.0 – 2026-10-07

- Pass „Eiswelt“: ein Monat aus vier Wochen-Sets plus Finale. Jede Woche gibt es eine Aufgabe (Tage mit Tagesziel in 7 Tagen); wer sie schafft, holt das Set ab: Figur mit passendem Sticker, Tanz, +1 Stickerplatz und Münzen. Abholen läuft als Beute-Animation (Eisblock bzw. Tresor beim Finale) mit Seltenheits-Karten. Karte „Eiswelt“ auf der Startseite.
- Neue Figuren im Stil „Fortnite-Cartoon“ (Dicke Konturen, Verläufe, Glanzlichter), ganze Figuren mit Armen, Beinen und Kopf: Eisbär (neu gezeichnet), Eis-Pinguin, Eis-Robbe, Eiskönig mit Krone, Umhang und Zepter. Sie tanzen mit allen sieben Tänzen. Neue Datei `js/stila.js`.
- Dashboard: Karte „Pass: Wochen-Sets zusammenbauen“ (Titel, Start, je Woche Aufgabe, bis zu vier Belohnungen, Stickerplatz, Münzen, Finale). Server: Endpunkt `season`, `/api/sync` liefert `season`. Die Figuren Pinguin, Robbe und Eiskönig gibt es nur im Pass.

## 2.34.0 – 2026-10-07

- Beute statt Truhe: Die Belohnung am Ende eines Lernpfad-Abschnitts öffnet sich jetzt als Animation. Vier Szenen im Wechsel nach Abschnitt: Piñata, Nachschub-Kiste am Fallschirm, Tresor, Beute-Kapsel (fünfte Szene Eisblock steht für das Eis-Set bereit). Antippen startet, danach kommen Münzen, Booster und Überraschung. Neue Datei `js/loot.js`.
- Im Lernpfad zeigen die Knoten die passende Beute (zu, wartet, geplündert) statt der Schatztruhe.

## 2.33.2 – 2026-10-07

- Start: Die Wochenübersicht „Deine Woche“ mit den abgehakten Tagen ist jetzt immer sichtbar. Ohne Wochenzeitplan der Eltern zählt jeder Tag mit dem Tagesziel (vorher fehlte die Karte ganz).

## 2.33.1 – 2026-10-07

- Extramünzen: freie Nachricht bis 240 Zeichen (mehrzeilig) mit Textvorschlägen und Zeichenzähler im Dashboard. In der App erscheint das Geschenk als Karte „Post von den Eltern“ mit der Nachricht (statt nur als kurzer Hinweis), erst wenn gerade keine Runde läuft.

## 2.33.0 – 2026-10-07

- Dashboard: Im Kopf der Spielerkarte stehen jetzt Münzen und XP (Stand der letzten Übertragung). Neue Karte „Extramünzen schenken“ (1 bis 500 Münzen, mit Nachricht): kommt beim nächsten Abgleich der App genau einmal als Münzgeschenk an, Magnus sieht die Nachricht. Der Verlauf zeigt ⏳ wartet oder ✅ angekommen.
- Server: Endpunkt `gifts`, `/api/sync` liefert `gifts`. Die App meldet angekommene Geschenke im Übersichts-Snapshot (`meta.gifts`).

## 2.32.0 – 2026-10-07

- Set-Angebot: Am 07.10.2026 kostet jedes Teil des Eis-Sets nur 50 Münzen (zusammen 200). Hinweis oben im Shop, im Reiter „Sets“ ein Knopf „Set kaufen“, die Einzelpreise sind durchgestrichen. Rang-Sperren bleiben bestehen (Eisbär ab Silber II). Weitere Set-Angebote lassen sich in `SET_DEALS` (engine.js) eintragen.

## 2.31.1 – 2026-10-07

- Lernpfad: Die Truhen sind jetzt gezeichnete Schatztruhen statt Geschenkbox und Pappkarton (grau = noch gesperrt, wackelnd = wartet). Eine schon geholte Truhe sieht geplündert aus: Deckel schief, Schloss abgesprungen, Splitter, eine Münze herausgerollt. Antippen zeigt Staubwölkchen und „Schon geplündert! Die nächste Truhe wartet nach dem nächsten Boss.“

## 2.31.0 – 2026-10-07

- Neue Shop-Rubrik „Trikots ⚽“: sechs Fußballtrikots mit den Farben und Streifen von München, Barcelona, Turin, Deutschland, Argentinien und Portugal, je 50 Münzen, Rückennummer immer 7. Ohne Wappen, Sponsoren und Logos. Die Figur trägt das Trikot beim Siegertanz, Vorschau mit ▶︎. Trikot und Outfit schließen sich aus (eins von beiden).

## 2.30.0 – 2026-10-07

- Preise neu in vier Stufen (Gewöhnlich 60–120, Selten 200–350, Episch 500–800, Legendär 1500–2500; die Stufe steht im Shop). Wurde etwas günstiger, gibt es die Differenz für schon Gekauftes einmalig als Münzen zurück.
- Neu: Eisbär (episch, ab Silber II) mit ganzem Körper, dazu Polarjacke, Tanz „Eislauf“, Effekt „Schneefall“ und die Rubrik „Sets ⭐“. Wer das Eis-Set komplett hat, bekommt den Eiskristall-Rahmen geschenkt.
- Mehr Belohnung: erste Woche ×1,5 Münzen, Rangaufstieg (50 + 10 je Rang plus ein passendes Geschenk), Boss-Truhen 30–60 Münzen mit 12 % Überraschungs-Stück.
- Tagesangebot (ein Stück täglich 20 % günstiger, mit Restzeit), Wunsch zeigt „etwa x Lerntage“.
- Dashboard: Münzfaktor 0,5 / 1 / 1,5 / 2 pro Profil (Lernpfad-Karte). Server: Endpunkt `coinfactor`, `/api/sync` liefert `coinFactor`.

## 2.29.0 – 2026-10-07

- Tänze mit ganzer Figur: Jede Figur hat einen eigenen Körper (Farben, Schwanz, Flügel, Panzer, Flossen, Stacheln, Tentakel, Kristallkörper), Arme, Beine und Schwanz bewegen sich einzeln. Neue Datei `js/figur.js` (32 Figuren). Für acht Figuren, deren Emoji schon ein ganzes Tier zeigt (Schildkröte, Krake, Dino, Hai, Pinguin, Biene, beide Lamas), gibt es eigene Köpfe.
- Neue Shop-Rubrik „Outfits 👕“: Natur pur (gratis), T-Shirt 60, Hoodie 90, Fußball-Trikot 110, Superheld mit Umhang 160, Raumanzug 220, Rockstar 260. Vorschau mit ▶︎ (Outfit und Tänze).

## 2.28.0 – 2026-10-07

- Neue Shop-Rubrik „Tänze 💃“: Die gewählte Figur (Emoji oder gezeichnet) tanzt bei großen Siegen auf einer Bühne mit Scheinwerfern und Disco-Boden. Sechs Tänze: Wackler (gratis), Hüpfer 120, Drehung 150, Roboter 200, Moonwalk 250, Epischer Sieg 400 (ab Silber I). Jeder Tanz hat im Shop eine Vorschau (▶︎).
- Auslöser: Boss besiegt (epischer Tanz, wenn gekauft), Rangaufstieg, fehlerfreie Runde. Tippen beendet den Tanz; bei „Bewegung reduzieren“ nur ein kleiner Hüpfer.

## 2.27.1 – 2026-10-07

- Üben: Der Reiter „Einheiten“ heißt jetzt „Lernbereich“. Oben Wahl Schule/Business, darunter Gruppen wie im Fortschritt (Headlight 2 als Schulbuch, Klassen, Eigene Vokabeln bzw. Business-Stufen) mit „x % sicher“, „x von y Wörtern geübt“ und „Gruppe üben (5 Min.)“.

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
