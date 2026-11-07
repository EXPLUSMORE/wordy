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
| b-79 | 🚢 Außenhandel & Zoll | Branchen | 16 | own 16 | own 16 | Entwurf |
| b-80 | 🏢 Immobilien & Vermietung | Branchen | 16 | own 16 | own 16 | Entwurf |
| b-81 | ⚡ Energie & Versorger | Branchen | 16 | own 16 | own 16 | Entwurf |
| b-82 | 🚗 Automobil & Werkstatt | Branchen | 16 | own 16 | own 16 | Entwurf |
| b-83 | 🍽️ Lebensmittel & Gastronomie-Betrieb | Branchen | 16 | own 16 | own 16 | Entwurf |
| b-84 | 🌾 Landwirtschaft & Agrarhandel | Branchen | 16 | own 16 | own 16 | Entwurf |
| b-85 | 💊 Medizin & Pharma | Branchen | 16 | own 16 | own 16 | Entwurf |
| b-86 | 🛍️ Einzelhandel & Retoure | Branchen | 16 | own 16 | own 16 | Entwurf |
| b-87 | 🎪 Tourismus & Veranstaltungen | Branchen | 16 | own 16 | own 16 | Entwurf |
| b-88 | 📰 Medien, PR & Presse | Branchen | 16 | own 16 | own 16 | Entwurf |
| b-89 | 🔧 Handwerk & Installation | Branchen | 16 | own 16 | own 16 | Entwurf |
| b-90 | 🏛️ Behörden & öffentlicher Dienst | Branchen | 16 | own 16 | own 16 | Entwurf |
| b-71 | 🚀 Start-up & Finanzierung | Fachgebiete | 16 | own 16 | own 16 | Entwurf |
| b-72 | 🏃 Agiles Arbeiten (Scrum) | Fachgebiete | 16 | own 16 | own 16 | Entwurf |
| b-73 | 📊 Kennzahlen & Reporting | Fachgebiete | 16 | own 16 | own 16 | Entwurf |
| b-74 | 🤝 Kundenbindung & CRM | Fachgebiete | 16 | own 16 | own 16 | Entwurf |
| b-75 | ©️ Patente, Marken & Urheberrecht | Fachgebiete | 16 | own 16 | own 16 | Entwurf |
| b-76 | ⚖️ Arbeitsrecht & Betriebsrat | Fachgebiete | 16 | own 16 | own 16 | Entwurf |
| b-77 | 📬 Mahnwesen & Forderungen | Fachgebiete | 16 | own 16 | own 16 | Entwurf |
| b-78 | 💼 Beratung & Freelance | Fachgebiete | 16 | own 16 | own 16 | Entwurf |
| b-61 | 🔤 Akronyme & Abkürzungen | Jargon | 18 | own 18 | own 18 | Entwurf |
| b-62 | 💬 Buzzwords & Business-Jargon | Jargon | 16 | own 16 | own 16 | Entwurf |
| b-63 | ⚙️ Phrasal Verbs im Büro | Jargon | 16 | own 16 | own 16 | Entwurf |
| b-64 | 🔗 Typische Wortpaare im Beruf | Jargon | 16 | own 16 | own 16 | Entwurf |
| b-65 | ⚠️ Falsche Freunde (Denglisch) | Jargon | 16 | own 16 | own 16 | Entwurf |
| b-66 | 🌍 Britisch & amerikanisch | Jargon | 16 | own 16 | own 16 | Entwurf |
| b-67 | ✉️ E-Mail-Bausteine | Jargon | 16 | own 16 | own 16 | Entwurf |
| b-68 | 🗣️ Meeting-Bausteine | Jargon | 16 | own 16 | own 16 | Entwurf |
| b-69 | 🔢 Zahlen & Anteile sagen | Jargon | 16 | own 16 | own 16 | Entwurf |
| b-70 | 🛠️ Probleme ansprechen & lösen | Jargon | 16 | own 16 | own 16 | Entwurf |
| b-60 | 🛰️ IT-Sicherheit im Alltag | Profi | 16 | own 16 | own 16 | Entwurf zur Prüfung: eigene Formulierung; Häufigkeit nicht gegen NGSL/BSL geprüft |
| b-91 | 📜 Sprichwörter | Sprüche | 16 | own 16 | own 16 | Entwurf |
| b-92 | ⚽ Sport-Metaphern | Sprüche | 16 | own 16 | own 16 | Entwurf |
| b-93 | 🏗️ Bauen & Handwerk | Sprüche | 16 | own 16 | own 16 | Entwurf |
| b-94 | 🃏 Spiel, Karten & Glück | Sprüche | 16 | own 16 | own 16 | Entwurf |
| b-95 | 🍳 Essen & Kochen | Sprüche | 16 | own 16 | own 16 | Entwurf |
| b-96 | ⚓ Seefahrt & Wasser | Sprüche | 16 | own 16 | own 16 | Entwurf |
| b-97 | 🎨 Farben & Zahlen im Business | Sprüche | 16 | own 16 | own 16 | Entwurf |
| b-98 | 💡 Kurze Arbeits-Weisheiten | Sprüche | 16 | own 16 | own 16 | Entwurf |

## Offene Punkte (rechtlich und fachlich, keine Rechtsberatung)

- Altbestand ohne Herkunftsangaben: bleibt bis zu einer Entscheidung des Betreibers unverändert und ist nicht unter CC BY-SA 4.0 gestellt.
- BSL: Lizenz und Weitergabebedingungen vor der Aufnahme auf der Originalseite erneut prüfen und hier mit Datum eintragen.
- Tatoeba steht unter CC BY 2.0 FR (einzelne Sätze CC0). Ob Sätze unter dieser Lizenz in einer CC BY-SA 4.0-Sammlung weitergegeben werden dürfen, sollte jemand mit juristischer Fachkenntnis bestätigen.
- Tatoeba-Übersetzungen haben eigene Autoren: für Englisch und Deutsch werden Autor und Satznummer getrennt festgehalten.
- Wiktionary-Lautschrift und Übersetzungen: je Eintrag ist die gewählte Bedeutung (Sense) im Feld `note` der Einheit zu vermerken, wenn das Wort mehrdeutig ist.
