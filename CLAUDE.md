# Wordy – Projektleitfaden für Claude

Deutscher Vokabeltrainer (PWA) für Magnus (Englisch, Headlight 2 / Klassen 6–8) plus Business-Spur.
Live: https://wordy.explusmore.com (GitHub Pages, `main`, Ordner `docs/`).
Lernfortschritts-Server: https://track.wordy.explusmore.com (eigenständig, Node, SQLite).

## Arbeitsweise (Standard nach jeder Änderung)
1. `node build.js` (erzeugt `docs/` + `wordy.html`; Service-Worker-Cache aus Inhalts-Hash).
2. Im Headless-Chromium testen (Playwright, `/opt/pw-browsers/chromium`, Start mit `NODE_PATH=$(npm root -g)`). Frisches Gerät = neuer Browser-Kontext, nicht `localStorage.clear()`.
3. `node server/test.js` (muss „Alle Prüfungen bestanden.“ melden).
4. Version in `package.json` erhöhen (Fehlerkorrektur/Neben-/Hauptversion, siehe CHANGELOG), Eintrag oben in `CHANGELOG.md`.
5. Commit (mit Co-Authored-By- und Claude-Session-Trailer) und Push auf `main` UND `claude/practical-fermat-2b3l8m`. Nie `pkill -f` mit Mustern, die die eigene Shell treffen.
6. Bericht an den Nutzer auf Deutsch, knapp. Erwähnen: App zeigt beim nächsten Öffnen „Neue Version verfügbar“; ob Server-Schritte nötig sind.
- Bei Designentscheidungen vorher Vorschau-Bilder zeigen (Scratchpad, per SendUserFile).

## Harte Regeln
- Wordy-Server NIEMALS mit dem Admintool mischen – völlig unabhängig.
- Nichts selbst auf PROD ausführen; stattdessen Schritt-für-Schritt-Anleitung geben.
- Bestehende Datenstrukturen nur anhängen (Sätze/Wörter-IDs bleiben stabil, sonst geht Lernstand verloren).

## Struktur
- `index.html` (CSS, 5 Hauptreiter `home|lernen|spielen|beute|parent`; Unterbereiche per `segBar`: lernen = ueben/units/stats, spielen = challenge/arena, beute = pass/shop/showroom; alte Tabnamen `ueben|stats|shop|showroom` werden in `render()` über `TABMAP` umgeleitet), `js/engine.js` (Lernlogik, SM-2, Sessions, Pace), `js/app.js` (alle Ansichten), `js/sync.js` (WordySync: Events, Snapshot, Pairing, Backup/Restore), `js/cosmetics.js`, `js/fortnite.js`, `js/figur.js` (ganze Figuren für die Siegertänze, Outfits), `js/loot.js` (Beute-Animationen und Pfad-Symbole), `js/stila.js` (Figuren im Stil Fortnite-Cartoon, `VTA`), Pass: `passInfo()` in engine.js, Server-Endpunkt `season`, `js/arena.js`.
- Daten: `data/*.js`. Wörter: `lernbuch.js` (Headlight 2, 17 Units, `k:"Headlight 2"`), Klassen 6/7/8, Business-Gruppen. Sätze: `saetze.js` + angehängt `saetze2.js`, Format `[track, gruppe, en, de, regel]`, ID = „s“+Index. Hinweis: `BOOK_CLASS` mappt Headlight 2 auf Klasse 6.
- Zustand in localStorage pro Profil (`state.w` Wörter, `state.s` Sätze, `daily/history/pace/goalsDone`, Einstellungen `klassen`, `hl2`, `readPace`).
- `server/`: `server.js` (Node ≥22.13, `node:sqlite`, Bearer-Tokens, Admin-Dashboard per Basic-Auth, Endpunkte /api/pair, /events, /snapshot, /sync, /state), `mail.js` (Wochenmail über Microsoft Graph oder SMTP), `backup.js` (VACUUM INTO, Cron 03:15, 30 Tage), `test.js`, `README.md` (Deployment: Lightsail Bitnami Apache, systemd `wordy-server`, Node in /opt/node22).
- Tageswechsel lokal (`today()`), Server Europe/Berlin.

## Hinweise
- Sprache der App und Antworten: Deutsch, Magnus ist Kind → motivierend (Shop/Münzen/Wochenziele).
- Sprachausgabe: `speechClean()` entfernt Abkürzungen wie „sb.“ vor dem Vorlesen.
- Offene Idee: eigene Headlight-Sätze statt Klasse 6. (Erledigt: Üben-Kacheln zeigen die Dauer statt der Aufgabenzahl.)
- Shop-Preise stehen in `engine.js` (SHOP) in Stufen; `OLD_PRICES` + `priceMigrate()` zahlen bei Preissenkungen einmalig die Differenz zurück (`profile.priceVer`). Bei künftigen Preisänderungen die Version erhöhen und `OLD_PRICES` aktualisieren. Sets: `SETS` (Eis-Set), Belohnung `reward: ...`. Verdienst: `boost()` (erste Woche ×1,5, Eltern-Regler `coinFactor`).
- Showroom (Reiter `showroom`, `viewShowroom()` in app.js): Logik in engine.js (`collection()`, `medalList()`, `favs()/toggleFav()` max. 3, `CUP_TIERS` mit einmaliger Münzbelohnung über `state.cups`). `profile.seen` steuert die NEU-Marke. Startseite: `viewHome()` schlank: Hero-Bühne (`.hh`, Himmel nach Uhrzeit), Lernpfad, Lernplan (`parentCards("plans")`), Tagesaufgaben. Pass steht im Showroom, Wochenplan/Wochenziele in Fortschritt › Verlauf.
- Erklärfilme: `js/film.js` (`VTFILM`, Szenenlisten je Modus, live aus Figuren/Emoji/CSS gespielt, kein Video). Karte in `modiHtml()`, Handler `film`. Neuer Modus = neuer Eintrag in `FILMS`.
- Figuren: `js/stila.js` (Eisbär, Pinguin, Robbe, König) und `js/stilb.js` (alle übrigen, Katalog `D` mit Farben/Ohren/Gesicht/Zusätzen). Neue Figur = Eintrag in `D` bzw. `VTA.register`; `avatarHtml` nimmt gezeichnete Köpfe auch für Emoji-Werte.
- Neues Set: Eintrag in `SETS` (engine.js) mit `fig` (Figur im Eisblock der Abschluss-Szene `openSetReveal`), `items`, `reward`.
- Film-Stimme: `tools/film-voice.js` erzeugt `audio/film/*.mp3` + `index.json` (Anleitung `tools/README-film-voice.md`); `film.js` spielt sie (Blob, wegen iOS-Range), sonst Gerätestimme. Nie echte Schlüssel einchecken.

## Erzählerstimme der Erklärfilme (Stand: bewusst bei der Gerätestimme geblieben)
- Aktuell spricht die **Gerätestimme** (`speak(..., "de")`): `narratorVoice()` in app.js bewertet die deutschen Stimmen (natürliche wie Siri/Enhanced/Premium/Neural/Google vorn, Computerstimmen hinten), Setup › Töne: Erzählerstimme Automatisch / Frau / Mann / Nur Gerätestimme, dazu freie Stimmenwahl und „Erzähler testen“. Frau = höher/langsamer, Mann = tiefer/ruhig (`narratorTune()`).
- **Aufgenommene Stimme (fertig gebaut, aber noch nicht erzeugt):** `film.js` spielt `audio/film/<f|m>-<Prüfsumme>.mp3` (Liste in `audio/film/index.json`, Wiedergabe als Blob wegen iOS), sonst Gerätestimme. Der Ordner `audio/` existiert noch nicht im Repository.
- Erzeugen: `tools/film-voice.js` (OpenAI `gpt-4o-mini-tts`, Frau = `coral`, Mann = `onyx`; alternativ `PROVIDER=eleven`), Anleitung `tools/README-film-voice.md`, `--dry` zeigt Texte ohne Schlüssel (52 Texte, ca. 5.600 Zeichen je Stimme). Veraltete Dateien werden gelöscht, geänderte Texte neu vertont.
- GitHub-Workflow `.github/workflows/film-voice.yml` („Film-Stimme erzeugen“, manuell, Eingaben `voice` f/m/both und `voice_name`): braucht das Repository-Secret **`OPENAI_API_KEY`**. Der erste Lauf (Run 37640335127) brach deshalb planmäßig ab. Zum Aktivieren: Secret anlegen, Workflow starten (oder `OPENAI_API_KEY=… node tools/film-voice.js --voice f`, `node build.js`, pushen). Schlüssel nie einchecken und nie im Chat nennen lassen.
- Ton der Stimme: warm, lässig, selbstbewusst, humorvoll (Magnus ist ein Kind), nicht anzüglich.
- Neue Filmtexte in `FILMS` (js/film.js) brauchen nach dem Ändern einen neuen Vertonungslauf, sonst fällt die App für diese Szene auf die Gerätestimme zurück.
- Elternkonten (v2.46): Server-Tabellen `families/family_links/family_sessions/family_invites`, `players.family`. Betreiber (Basic) = `/` + `/api/admin`, Familien (Cookie `wf`, E-Mail-Link) = `/f/` + `/api/fam` (gleicher Handler mit `scope`, Besitzprüfung `famPlayer`). Seiten `server/public/family.html` (Registrierung/Anmeldung), `datenschutz.html` (Entwurf). Tests in `server/test.js` (Isolation, Sperren, Export, Löschen). Familien sehen nur ihre Kinder, der Betreiber nur eigene Spieler.
- Freunde/Duelle (v2.47): App `soc*`-Funktionen in app.js (Spielen › Freunde/Liga), `WordySync.social()`, Arena-Hooks (`cfg.seed` für gleiche Wörter, `cfg.duel`, `cfg.onFinish`; Achtung: `run.opts` in arena.js sind die Antwortoptionen, die Startoptionen stehen in `run.cfg`). Server `apiSocial()`; Freundschaft braucht die Zustimmung beider Eltern, Standard aus. Medaillen `duel*`/`chal*`, `S.duelDone()` (5 🪙 je Sieg, höchstens 3 am Tag).
- Crew-Wochenziele (v2.48): Server `crewView()/apiCrew()` (Ziele aus Lernereignissen, Stufen 50/100/150 %, Claim mit Beitragsprüfung), App `crewHtml()` (Spielen › Crew), `S.crewReward()`. Crew-Namen nur aus fester Liste. Datenschutzerklärung `server/public/datenschutz.html` mit Platzhaltern aus `PRIVACY_*` (`privacyPage()`), `CONSENT_VER` bei Textänderung erhöhen.
- Klassen-Modus (v2.49): Server-Tabellen `classes/class_members/class_tasks`, Rolle `families.role` (`teacher`, Einladung `role:"teacher"`, Link mit `&l=1`). Lehrkraft-Dashboard (`window.WT`, `viewClass()` in `server/public/index.html`) sieht nur Klassen-Zahlen (`classOverview()`); Kind: App `classHtml()` in Spielen › Challenge, Server `/api/social/class[/join|/leave]`; Eltern stimmen per `/api/admin|fam/players/:id/class` zu. Wochenaufgaben kommen als virtuelle Lernpläne (`id:"c<taskId>"`, `cls:true`) in `/api/sync` an; Start über `startplan` mit `cls` (zählt als Daily Challenge). Einheitenkatalog des Servers liest `data/klasse6-8,lernbuch.js` per `vm`. Tests in `server/test.js`.
- Fahrplan Fremdsprachen (nicht gebaut): Sprache je Wortschatz, Sprachausgabe je Sprache, Verben/Grammatik englischspezifisch.
- Designs (v2.51): `html[data-design]` = `gold` (Standard), `sun`, `aurora`; `klassisch` = kein Attribut (Shop-Farbwelten greifen nur dort, sonst `data-x`). Variablen und Bausteine am Ende von `<style>` in `index.html` („DESIGNS“); `VTC.applyLook(profile, mode, design)` und `VTC.DESIGNS` in cosmetics.js, Einstellung `settings.design`. Neues Design = Variablenblock + Eintrag in `DESIGNS`. Dashboard/`family.html`/`datenschutz.html` folgen Nachtgold (Hell/Dunkel nach Gerät); dort keine Webfonts (CSP).
- App-Symbole (v2.52): `tools/make-icons.js` (Playwright, braucht gebautes `docs/`) erzeugt `icons/*` (Wordy) und `server/public/app/*` (Dashboard); Server liefert `/app/*` öffentlich (`manifest.webmanifest` Betreiber, `family.webmanifest` Eltern). Startbild: `#boot` in index.html, Manifest-Hintergrund = Dunkelblau `#0E1320`.
