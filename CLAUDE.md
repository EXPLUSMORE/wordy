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
- `index.html` (CSS, 4 Tabs `home|ueben|stats|shop` + Zahnrad `parent`), `js/engine.js` (Lernlogik, SM-2, Sessions, Pace), `js/app.js` (alle Ansichten), `js/sync.js` (WordySync: Events, Snapshot, Pairing, Backup/Restore), `js/cosmetics.js`, `js/fortnite.js`, `js/arena.js`.
- Daten: `data/*.js`. Wörter: `lernbuch.js` (Headlight 2, 17 Units, `k:"Headlight 2"`), Klassen 6/7/8, Business-Gruppen. Sätze: `saetze.js` + angehängt `saetze2.js`, Format `[track, gruppe, en, de, regel]`, ID = „s“+Index. Hinweis: `BOOK_CLASS` mappt Headlight 2 auf Klasse 6.
- Zustand in localStorage pro Profil (`state.w` Wörter, `state.s` Sätze, `daily/history/pace/goalsDone`, Einstellungen `klassen`, `hl2`, `readPace`).
- `server/`: `server.js` (Node ≥22.13, `node:sqlite`, Bearer-Tokens, Admin-Dashboard per Basic-Auth, Endpunkte /api/pair, /events, /snapshot, /sync, /state), `mail.js` (Wochenmail über Microsoft Graph oder SMTP), `backup.js` (VACUUM INTO, Cron 03:15, 30 Tage), `test.js`, `README.md` (Deployment: Lightsail Bitnami Apache, systemd `wordy-server`, Node in /opt/node22).
- Tageswechsel lokal (`today()`), Server Europe/Berlin.

## Hinweise
- Sprache der App und Antworten: Deutsch, Magnus ist Kind → motivierend (Shop/Münzen/Wochenziele).
- Sprachausgabe: `speechClean()` entfernt Abkürzungen wie „sb.“ vor dem Vorlesen.
- Offene Ideen: „5-Min“-Kacheln in Üben ohne Aufgabenanzahl; eigene Headlight-Sätze statt Klasse 6.
