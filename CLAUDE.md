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
- `index.html` (CSS, 4 Tabs `home|ueben|stats|shop` + Zahnrad `parent`), `js/engine.js` (Lernlogik, SM-2, Sessions, Pace), `js/app.js` (alle Ansichten), `js/sync.js` (WordySync: Events, Snapshot, Pairing, Backup/Restore), `js/cosmetics.js`, `js/fortnite.js`, `js/figur.js` (ganze Figuren für die Siegertänze, Outfits), `js/loot.js` (Beute-Animationen und Pfad-Symbole), `js/stila.js` (Figuren im Stil Fortnite-Cartoon, `VTA`), Pass: `passInfo()` in engine.js, Server-Endpunkt `season`, `js/arena.js`.
- Daten: `data/*.js`. Wörter: `lernbuch.js` (Headlight 2, 17 Units, `k:"Headlight 2"`), Klassen 6/7/8, Business-Gruppen. Sätze: `saetze.js` + angehängt `saetze2.js`, Format `[track, gruppe, en, de, regel]`, ID = „s“+Index. Hinweis: `BOOK_CLASS` mappt Headlight 2 auf Klasse 6.
- Zustand in localStorage pro Profil (`state.w` Wörter, `state.s` Sätze, `daily/history/pace/goalsDone`, Einstellungen `klassen`, `hl2`, `readPace`).
- `server/`: `server.js` (Node ≥22.13, `node:sqlite`, Bearer-Tokens, Admin-Dashboard per Basic-Auth, Endpunkte /api/pair, /events, /snapshot, /sync, /state), `mail.js` (Wochenmail über Microsoft Graph oder SMTP), `backup.js` (VACUUM INTO, Cron 03:15, 30 Tage), `test.js`, `README.md` (Deployment: Lightsail Bitnami Apache, systemd `wordy-server`, Node in /opt/node22).
- Tageswechsel lokal (`today()`), Server Europe/Berlin.

## Hinweise
- Sprache der App und Antworten: Deutsch, Magnus ist Kind → motivierend (Shop/Münzen/Wochenziele).
- Sprachausgabe: `speechClean()` entfernt Abkürzungen wie „sb.“ vor dem Vorlesen.
- Offene Ideen: „5-Min“-Kacheln in Üben ohne Aufgabenanzahl; eigene Headlight-Sätze statt Klasse 6.
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

