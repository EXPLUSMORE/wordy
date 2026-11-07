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
| b-40 | 🧑‍💼 Bewerbung & Vorstellungsgespräch | Aufbau | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-42 | 🐞 Software-Projekte & Fehler | Aufbau | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-43 | 🛡️ Versicherung: Police & Schaden | Aufbau | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-45 | 🏦 Kredit, Zinsen & Anlage | Aufbau | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-47 | 🛎️ Hotel: Rezeption & Beschwerde | Aufbau | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-49 | 🏗️ Baustelle: Angebot & Termin | Aufbau | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-51 | 🧑‍⚕️ Pflege & Betreuung | Aufbau | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-53 | 🧴 Sortiment & Kundenberatung | Aufbau | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-55 | 🏭 Lager & Fuhrpark | Aufbau | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-58 | 🦺 Wartung & Sicherheit am Arbeitsplatz | Aufbau | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-59 | 📲 Online-Vertrieb & Social Media | Aufbau | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-37 | 🛒 Bestellen & Liefern | Basis | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-38 | 🏷️ Preise, Rabatt & Angebot | Basis | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-39 | 🧾 Rechnung & Zahlung | Basis | 16 | own 16 | own 16 | Muster (geprüft): eigene Formulierung (src own); Häufigkeit nicht gegen NGSL/BSL belegt; Mehrdeutigkeiten: change = Wechselgeld, deposit = Anzahlung, tip = Trinkgeld |
| b-41 | 💻 IT-Support & Geräte | Basis | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-44 | 💳 Konto, Karte & Geld abheben | Basis | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-46 | 🍽️ Restaurant: Reservierung & Bestellung | Basis | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-48 | 🔧 Werkzeug & Material | Basis | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-50 | 🩺 Praxis & Termin beim Arzt | Basis | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-52 | 🛍️ Laden & Kasse | Basis | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-54 | 📦 Versand & Transport | Basis | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-56 | 🗃️ Verwaltung: Formulare & Post | Basis | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-57 | ⚙️ Produktion: Maschinen & Arbeitsschritte | Basis | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-77 | 🚢 Außenhandel & Zoll | Branchen | 18 | wikt 18 | wikt 4 | Entwurf |
| b-78 | 🏢 Immobilien & Vermietung | Branchen | 20 | wikt 20 | wikt 4 | Entwurf |
| b-79 | ⚡ Energie & Versorger (1) | Branchen | 15 | wikt 15 | wikt 4 | Entwurf |
| b-80 | ⚡ Energie & Versorger (2) | Branchen | 15 | wikt 15 | wikt 5 | Entwurf |
| b-81 | 🚗 Automobil & Werkstatt | Branchen | 20 | wikt 20 | wikt 7 | Entwurf |
| b-82 | 🍽️ Lebensmittel & Gastronomie-Betrieb | Branchen | 20 | wikt 20 | wikt 11 | Entwurf |
| b-83 | 🌾 Landwirtschaft & Agrarhandel (1) | Branchen | 16 | wikt 16 | wikt 8 | Entwurf |
| b-84 | 🌾 Landwirtschaft & Agrarhandel (2) | Branchen | 16 | wikt 16 | wikt 9 | Entwurf |
| b-85 | 💊 Medizin & Pharma (1) | Branchen | 12 | wikt 12 | wikt 5 | Entwurf |
| b-86 | 💊 Medizin & Pharma (2) | Branchen | 12 | wikt 12 | wikt 5 | Entwurf |
| b-87 | 🎪 Handel, Tourismus & Veranstaltungen (1) | Branchen | 17 | wikt 17 | wikt 8 | Entwurf |
| b-88 | 🎪 Handel, Tourismus & Veranstaltungen (2) | Branchen | 17 | wikt 17 | wikt 6 | Entwurf |
| b-89 | 📰 Medien, PR & Presse | Branchen | 20 | wikt 20 | wikt 11 | Entwurf |
| b-90 | 🔧 Handwerk & Installation | Branchen | 16 | wikt 16 | wikt 4 | Entwurf |
| b-91 | 🏛️ Behörden & öffentlicher Dienst | Branchen | 16 | wikt 16 | wikt 11 | Entwurf |
| b-69 | 🚀 Start-up & Finanzierung | Fachgebiete | 14 | wikt 14 | wikt 2 | Entwurf |
| b-70 | 📊 Agiles Arbeiten & Kennzahlen (1) | Fachgebiete | 13 | wikt 13 | wikt 12 | Entwurf |
| b-71 | 📊 Agiles Arbeiten & Kennzahlen (2) | Fachgebiete | 13 | wikt 13 | wikt 4 | Entwurf |
| b-72 | 🤝 Kundenbindung & Beratung | Fachgebiete | 17 | wikt 17 | wikt 8 | Entwurf |
| b-73 | ©️ Patente, Marken & Urheberrecht | Fachgebiete | 20 | wikt 20 | wikt 15 | Entwurf |
| b-74 | ⚖️ Arbeitsrecht & Betriebsrat (1) | Fachgebiete | 13 | wikt 13 | wikt 5 | Entwurf |
| b-75 | ⚖️ Arbeitsrecht & Betriebsrat (2) | Fachgebiete | 13 | wikt 13 | wikt 3 | Entwurf |
| b-76 | 📬 Mahnwesen & Forderungen | Fachgebiete | 13 | wikt 13 | wikt 3 | Entwurf |
| b-61 | 🔤 Akronyme & Buzzwords | Jargon | 20 | wikt 20 | wikt 5 | Entwurf |
| b-62 | ⚙️ Phrasal Verbs im Büro (1) | Jargon | 13 | wikt 13 | wikt 12 | Entwurf |
| b-63 | ⚙️ Phrasal Verbs im Büro (2) | Jargon | 12 | wikt 12 | wikt 10 | Entwurf |
| b-64 | 🔗 Wortpaare & Formulierungen | Jargon | 20 | wikt 20 | wikt 14 | Entwurf |
| b-65 | 🗣️ Meeting-Sprache | Jargon | 12 | wikt 12 | wikt 8 | Entwurf |
| b-66 | 🔢 Zahlen & Anteile (1) | Jargon | 16 | wikt 16 | wikt 10 | Entwurf |
| b-67 | 🔢 Zahlen & Anteile (2) | Jargon | 15 | wikt 15 | wikt 12 | Entwurf |
| b-68 | 🛠️ Probleme ansprechen & lösen | Jargon | 18 | wikt 18 | wikt 15 | Entwurf |
| b-60 | 🛰️ IT-Sicherheit im Alltag | Profi | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-92 | 📜 Sprichwörter & Weisheiten | Sprüche | 20 | wikt 20 | - | Entwurf |
| b-93 | 🏗️ Bauen, Farben & Zahlen (Redewendungen) (1) | Sprüche | 13 | wikt 13 | wikt 8 | Entwurf |
| b-94 | 🏗️ Bauen, Farben & Zahlen (Redewendungen) (2) | Sprüche | 13 | wikt 13 | wikt 3 | Entwurf |
| b-95 | 🎲 Redewendungen: Sport, Spiel & See | Sprüche | 17 | wikt 17 | wikt 6 | Entwurf |
| b-96 | 🍳 Essen & Kochen (Redewendungen) | Sprüche | 12 | wikt 12 | wikt 7 | Entwurf |

## Offene Punkte (rechtlich und fachlich, keine Rechtsberatung)

- Altbestand ohne Herkunftsangaben: bleibt bis zu einer Entscheidung des Betreibers unverändert und ist nicht unter CC BY-SA 4.0 gestellt.
- BSL: Lizenz und Weitergabebedingungen vor der Aufnahme auf der Originalseite erneut prüfen und hier mit Datum eintragen.
- Tatoeba steht unter CC BY 2.0 FR (einzelne Sätze CC0). Ob Sätze unter dieser Lizenz in einer CC BY-SA 4.0-Sammlung weitergegeben werden dürfen, sollte jemand mit juristischer Fachkenntnis bestätigen.
- Tatoeba-Übersetzungen haben eigene Autoren: für Englisch und Deutsch werden Autor und Satznummer getrennt festgehalten.
- Wiktionary-Lautschrift und Übersetzungen: je Eintrag ist die gewählte Bedeutung (Sense) im Feld `note` der Einheit zu vermerken, wenn das Wort mehrdeutig ist.
