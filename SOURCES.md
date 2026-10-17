# Quellen und Herkunft der Business-Vokabeln

Diese Datei wird mit `node tools/gen_sources.js` aus den Daten erzeugt. Rechtlich offene Punkte stehen unten unter „Offene Punkte“.

## Zugelassene Quellen (Whitelist)

| Kürzel | Quelle | Lizenz |
|---|---|---|
| `ngsl` | NGSL (New General Service List) | CC-BY-SA-4.0 |
| `bsl` | BSL (Business Service List) | CC-BY-SA-4.0 |
| `wikt` | Wiktionary / Wiktextract | CC-BY-SA-4.0 |
| `tatoeba` | Tatoeba | CC-BY-2.0-FR / CC0-1.0 |
| `ewn` | Open English WordNet | CC-BY-4.0 |
| `own` | eigene Formulierung | CC-BY-SA-4.0 |

Alles andere ist nicht zulässig. `node build.js` bricht ab, wenn ein Eintrag in `data/open` kein `src` und `lic` von dieser Liste hat.

## Altbestand (vor Einführung der Herkunftsangaben)

Diese Einheiten haben **keine** `src`/`lic`-Angaben. Ihre Herkunft ist nicht belegt; sie fallen nicht unter die Datenlizenz in LICENSE-DATA.md. Status: **ungeprüft, Entscheidung des Betreibers offen**.

| Datei | Einheiten (ID, Titel, Stufe, Wörter) |
|---|---|
| `data/business.js` | b-01 Meetings & Termine (Basis, 15); b-02 Telefonieren (Basis, 15); b-03 E-Mails & Korrespondenz (Basis, 15); b-04 Firma & Abteilungen (Basis, 15); b-05 Verkauf & Kunden (Aufbau, 15); b-06 Zahlen & Finanzen (Aufbau, 15); b-07 Verhandlungen (Aufbau, 15); b-08 Projekte & Fristen (Aufbau, 15); b-09 Personal & Bewerbung (Profi, 15); b-10 Präsentationen (Profi, 15); b-11 Verträge & Recht (Profi, 15); b-12 Logistik & Beschaffung (Profi, 15) |
| `data/business-basis2.js` | b-13 Büro & Arbeitsmittel (Basis, 15); b-14 Arbeitszeit & Abwesenheit (Basis, 15); b-15 Videokonferenz & Homeoffice (Basis, 15); b-16 Termine & Kalender (Basis, 15); b-17 Geschäftsreise & Hotel (Basis, 15); b-18 Empfang & Besucher (Basis, 15); b-19 Zahlen, Maße & Daten (Basis, 15); b-20 Höflich formulieren (Basis, 15) |
| `data/business-aufbau2.js` | b-21 Marketing & Werbung (Aufbau, 15); b-22 Markt & Wettbewerb (Aufbau, 15); b-23 Produkt & Entwicklung (Aufbau, 15); b-24 Kundenservice & Beschwerden (Aufbau, 15); b-25 Bank & Zahlungsverkehr (Aufbau, 15); b-26 Buchhaltung & Controlling (Aufbau, 15); b-27 Angebot & Ausschreibung (Aufbau, 15); b-28 Qualität & Prozesse (Aufbau, 15) |
| `data/business-profi2.js` | b-29 Führung & Team (Profi, 15); b-30 Strategie & Entwicklung (Profi, 15); b-31 Fusionen & Beteiligungen (Profi, 15); b-32 Steuern & Prüfung (Profi, 15); b-33 Datenschutz & IT-Sicherheit (Profi, 15); b-34 Digitalisierung & KI (Profi, 15); b-35 Nachhaltigkeit & Verantwortung (Profi, 15); b-36 Krise & Veränderung (Profi, 15) |
| `data/smalltalk.js` | s-01 Begrüßen & Vorstellen (Smalltalk, 15); s-02 Wetter & Jahreszeiten (Smalltalk, 15); s-03 Wochenende & Freizeit (Smalltalk, 15); s-04 Reisen & Herkunft (Smalltalk, 15); s-05 Geschäftsessen (Smalltalk, 15); s-06 Kultur, Film & Lesen (Smalltalk, 15); s-07 Sport & Fitness (Smalltalk, 15); s-08 Konferenz & Networking (Smalltalk, 15); s-09 Loben & Reagieren (Smalltalk, 15); s-10 Heikles elegant umgehen (Smalltalk, 15); s-11 Wohnen & Lebenslage (Smalltalk, 15); s-12 Abschied & Kontakt halten (Smalltalk, 15) |
| `data/idioms.js` | i-01 Lebensweisheiten (Redewendungen, 15); i-02 Zeit & Gelegenheit (Redewendungen, 15); i-03 Geld & Kosten (Redewendungen, 15); i-04 Arbeit & Einsatz (Redewendungen, 15); i-05 Risiko & Entscheidung (Redewendungen, 15); i-06 Erfolg & Scheitern (Redewendungen, 15); i-07 Menschen & Charakter (Redewendungen, 15); i-08 Reden & Streiten (Redewendungen, 15); i-09 Verhandeln & Abschließen (Redewendungen, 15); i-10 Körper-Redewendungen (Redewendungen, 15); i-11 Tier-Redewendungen (Redewendungen, 15); i-12 Wetter & Wasser (Redewendungen, 15) |

## Offene Einheiten (data/open)

| Einheit | Titel | Stufe | Wörter | Quellen der Wörter | Beispielsätze | Status |
|---|---|---|---|---|---|---|
| b-39 | 🧾 Rechnung & Zahlung | Basis | 16 | own 16 | own 16 | Muster (zur Prüfung): eigene Formulierung (src own); Häufigkeit nicht gegen NGSL/BSL belegt; Mehrdeutigkeiten: change = Wechselgeld, deposit = Anzahlung, tip = Trinkgeld |

## Offene Punkte (rechtlich und fachlich, keine Rechtsberatung)

- Altbestand ohne Herkunftsangaben: bleibt bis zu einer Entscheidung des Betreibers unverändert und ist nicht unter CC BY-SA 4.0 gestellt.
- BSL: Lizenz und Weitergabebedingungen vor der Aufnahme auf der Originalseite erneut prüfen und hier mit Datum eintragen.
- Tatoeba steht unter CC BY 2.0 FR (einzelne Sätze CC0). Ob Sätze unter dieser Lizenz in einer CC BY-SA 4.0-Sammlung weitergegeben werden dürfen, sollte jemand mit juristischer Fachkenntnis bestätigen.
- Tatoeba-Übersetzungen haben eigene Autoren: für Englisch und Deutsch werden Autor und Satznummer getrennt festgehalten.
- Wiktionary-Lautschrift und Übersetzungen: je Eintrag ist die gewählte Bedeutung (Sense) im Feld `note` der Einheit zu vermerken, wenn das Wort mehrdeutig ist.
