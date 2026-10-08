# Wordy-Server

Nimmt den Lernverlauf der Wordy-App entgegen und zeigt ihn den Eltern im Dashboard.
Keine Abhängigkeiten: nur **Node.js ab 22.13** (eingebautes SQLite). Daten liegen in einer einzigen Datei.

## Funktionen im Dashboard
- **Wochenziele:** Minuten üben, Übungstage (ab 5 Minuten), Wörter wiedererkennen (am Folgetag richtig beantwortet; reines Ansehen zählt nicht) oder eine Einheit zu x % sicher gelernt (Stufe „Sitzt“ oder höher). Mit Bonusmünzen. Die App holt die Ziele ab und zeigt sie auf der Startseite. Die Münzen werden automatisch gutgeschrieben, genau einmal.
- **Lernplan für Klassenarbeiten:** Datum und Einheiten festlegen. Die App zeigt, wie viele neue Wörter heute dran sind, und übt gezielt nur diese Einheiten. Bonus bei 90 % sicher.
- **Einzelansicht pro Einheit:** Tippe im Dashboard auf eine Einheit, dann siehst du alle Wörter mit Stand, richtigen und falschen Antworten.
- **Wochenmail:** siehe unten.

## Wochenmail
Im Dashboard unten steht danach „Geht jeden Sonntag um 18 Uhr an …“ und die Schaltfläche **Testmail jetzt senden**. Nach jeder Änderung an `.env`: `sudo systemctl restart wordy-server`.
Wenn der Versand an einem Tag dreimal scheitert, wird er bis zur nächsten Woche nicht erneut versucht. Die Ursache steht im Protokoll: `sudo journalctl -u wordy-server -n 30`.

### Microsoft 365 (empfohlen): Versand über Microsoft Graph
Ohne SMTP-Passwort, mit einer App-Registrierung. Einmalig im Entra-Admin-Center (`entra.microsoft.com`):
1. **Identität → Anwendungen → App-Registrierungen → Neue Registrierung.** Name „Wordy Mail“, nur dieses Verzeichnis. Notiere **Anwendungs-ID (Client-ID)** und **Verzeichnis-ID (Mandanten-ID)**.
2. **Zertifikate & Geheimnisse → Neuer geheimer Clientschlüssel.** Den **Wert** sofort kopieren (er wird nur einmal angezeigt).
3. **API-Berechtigungen → Berechtigung hinzufügen → Microsoft Graph → Anwendungsberechtigungen → Mail.Send.** Danach **Administratorzustimmung erteilen**.
4. In `.env` eintragen: `GRAPH_TENANT`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `MAIL_FROM` (nur die Adresse des sendenden Postfachs) und `MAIL_TO`.
5. **Sicherheit:** Mail.Send als Anwendungsberechtigung erlaubt dieser App, im Namen *jedes* Postfachs zu senden. Beschränke sie in Exchange Online auf das eine Postfach (`New-ApplicationAccessPolicy`, siehe Microsoft-Dokumentation „Limiting application permissions to specific Exchange Online mailboxes“), oder nimm ein eigenes Absenderpostfach.

### Anderes Mailkonto: SMTP
`SMTP_HOST`, `SMTP_PORT` (587 STARTTLS oder 465), `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM`, `MAIL_TO` in `.env`. Bei Microsoft 365 ist „SMTP AUTH“ meist gesperrt oder nur mit Zusatzeinstellungen möglich.

## Nur sichern, nicht anzeigen
Für Erwachsene, die nur ihre Sicherung wollen: Beim Anlegen im Dashboard „Nur sichern, nicht anzeigen“ ankreuzen. Der Server nimmt dann nur den Lernstand an (Wiederherstellen funktioniert wie sonst), speichert aber keine Antworten, Zeiten, Käufe oder Ziele. Der Spieler ist in der Übersicht und der Wochenmail unsichtbar und steht unter „＋ Spieler → Nur gesicherte Spieler“.

## Adressen
- **App:** `https://wordy.explusmore.com` bleibt unverändert (GitHub Pages).
- **Server und Dashboard:** eigene Subdomain `https://track.wordy.explusmore.com` (ein zusätzlicher DNS-Eintrag auf den Server, die App-Adresse wird nicht berührt).
  `wordy.explusmore.com` selbst darf nicht auf den Server zeigen, sonst wäre die App weg.

## Völlig eigenständig
Der Wordy-Server teilt sich nichts mit anderen Diensten auf dem Rechner (auch nicht mit dem Admintool):
eigener Systembenutzer `wordy`, eigener Port, eigene Datenbankdatei, eigene Zugangsdaten, eigene Subdomain, eigener systemd-Dienst.
Er liest keine fremden Daten und stellt keine Verbindung zu anderen Diensten her. Zum Entfernen genügt:
`systemctl disable --now wordy-server`, den Ordner `/opt/wordy` und `/var/lib/wordy` löschen, nginx-Eintrag entfernen.

## Was gespeichert wird
Nur Lerndaten: welches Wort wann richtig oder falsch beantwortet wurde, Übungszeit pro Runde, Stand der Wörter und Einheiten,
Münzen, Käufe im Shop. Keine Klarnamen, keine Standorte. Die App zeigt dem Kind unter Setup an, dass die Eltern den Fortschritt sehen.

## So funktioniert die Anmeldung
1. Eltern öffnen das Dashboard (Adresse des Servers, Benutzername und Passwort aus `.env`).
2. „＋ Spieler“ → Name eingeben → es erscheint ein **Code** wie `https://track.wordy.explusmore.com#AB12-CD34`.
3. In der App: Setup → Auto-Save / Lernfortschritt → Code einfügen → Verbinden. Der Code gilt 7 Tage und nur einmal.
4. Das Gerät merkt sich danach einen geheimen Schlüssel. „Geräte trennen“ im Dashboard sperrt ihn sofort.

Jeder Spieler (jedes Gerät, jedes Profil in der App) wird einzeln verbunden, die Daten bleiben getrennt.

## Installation auf dem Server (Beispiel Linux mit systemd und nginx)
```bash
node -v        # muss v22.13 oder neuer sein (für Wordy reicht ein eigenes Node, am System ändert sich nichts)
ss -ltn | grep 8787   # darf nichts ausgeben, sonst in .env einen freien PORT wählen

sudo useradd --system --home /opt/wordy wordy
sudo mkdir -p /opt/wordy /var/lib/wordy && sudo chown wordy: /var/lib/wordy
# Ordner server/ aus dem Repository nach /opt/wordy/server kopieren (git clone oder scp)
cd /opt/wordy/server
cp .env.example .env && nano .env          # Passwort und ALLOW_ORIGIN eintragen
chmod 600 .env && sudo chown -R wordy: /opt/wordy

node test.js                               # Selbsttest, sollte "Alle Prüfungen bestanden." melden

sudo cp wordy-server.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now wordy-server
sudo systemctl status wordy-server
```
Danach nginx einrichten (`nginx.conf.example`, Zertifikat per `certbot --nginx -d track.wordy.explusmore.com`).
Der Server hört nur auf `127.0.0.1`, von außen erreichbar ist er ausschließlich über nginx mit HTTPS.
**Ohne HTTPS nicht betreiben:** Die App darf nur über https senden, und das Passwort wird sonst im Klartext übertragen.

## Variante: Server mit Bitnami-Apache (statt nginx)
Läuft auf dem Rechner bereits ein Bitnami-Apache auf Port 80/443, gibt es keinen nginx. Dann übernimmt Apache die Rolle von nginx:
`apache-bitnami-http.conf.example` (vor dem Zertifikat) und `apache-bitnami-https.conf.example` (danach) sind die Vorlagen, je ein eigener virtueller Host nur für die Wordy-Subdomain. Zertifikat per Let's Encrypt im Webroot-Verfahren, ohne bestehende Seiten anzufassen.

## Sicherung
Es gibt drei Ebenen:
1. **Lernstand pro Spieler:** Die App schickt nach jeder Runde den kompletten Stand an den Server (`PUT /api/state`). Pro Spieler bleiben die letzten 30 Tage (`states`). Wiederherstellen in der App: beim Verbinden eines leeren Geräts oder unter Setup → Auto-Save / Lernfortschritt → „Lernstand wiederherstellen“. Im Dashboard kann jeder Stand als Datei heruntergeladen werden. Ein leerer Stand ersetzt nie eine vorhandene Sicherung (Antwort 409).
2. **Datenbankdatei:** `backup.js` (unten), täglich per Cron.
3. **Ganzer Server:** Lightsail-Snapshots (Instanz → Snapshots → Automatische Snapshots).

### Datenbankkopie
Alles steht in `DB_FILE`. `backup.js` legt eine konsistente Kopie an (auch im laufenden Betrieb) und löscht Kopien nach 30 Tagen.
Täglich um 3:15 Uhr per Cron, ohne das Programm `sqlite3`:
```bash
sudo mkdir -p /var/backups/wordy && sudo chown wordy: /var/backups/wordy
echo '15 3 * * * wordy /opt/node22/bin/node /opt/wordy/server/backup.js >> /var/backups/wordy/backup.log 2>&1' | sudo tee /etc/cron.d/wordy-backup
```
Von Hand testen: `sudo -u wordy /opt/node22/bin/node /opt/wordy/server/backup.js`.

## Sicherheit in Kürze
- Dashboard und Verwaltung: HTTP-Anmeldung (Benutzer und Passwort aus `.env`), Fehlversuche werden begrenzt.
- App-Schnittstelle: pro Gerät ein zufälliger Schlüssel (256 Bit), in der Datenbank nur als Hash.
- Eingaben werden begrenzt (Größe, Anzahl), doppelt gesendete Ereignisse werden erkannt.
- `ALLOW_ORIGIN` auf die Adresse der App einschränken (nicht `*`).

## Elternkonten (mehrere Familien)
Außer dem Betreiber-Zugang (`/`, Basic-Anmeldung) gibt es Konten für Familien. Jede Familie verwaltet **nur ihre eigenen Kinder**; der Betreiber sieht fremde Kinder nicht (nur Konten).
- **Einladung:** Betreiber-Dashboard → „👪 Familien“ → Einladungslink erstellen (Notiz, 1/3/10 Familien). Der Link `…/f/join?i=CODE` gilt 14 Tage.
- **Registrierung:** Die Eltern geben E-Mail-Adresse und Einwilligung ein, bekommen einen **Anmeldelink per Mail** (20 Minuten gültig, nur einmal nutzbar, ohne Passwort) und sind danach unter `…/f/` im Dashboard (30 Tage angemeldet, Cookie `wf`: HttpOnly, SameSite=Lax, Secure bei https).
- **Kinder:** bis zu 6 pro Konto. Verbindungscode wie bisher, Kinder koppeln ihr Gerät in der App unter Profil › Setup › Auto-Save.
- **Konto:** Wochenmail an die Eltern an/aus (am gleichen Wochentag wie die Betreiber-Mail), Daten als Datei herunterladen, Konto samt allen Kindern endgültig löschen.
- **Betreiber:** Konten sperren/entsperren/löschen, Einladungen löschen.
- **Voraussetzung:** Mailversand (SMTP oder Graph mit `MAIL_FROM`) und `DASHBOARD_URL` müssen gesetzt sein, sonst kann sich niemand anmelden. Die Datenschutzerklärung `server/public/datenschutz.html` ist ein **Entwurf**: Verantwortlichen eintragen und rechtlich prüfen lassen, bevor fremde Familien eingeladen werden.
- Technik: Tabellen `families`, `family_links`, `family_sessions`, `family_invites`, Spalte `players.family` (leer = Spieler des Betreibers). Familien-Schnittstelle: `/api/fam/…` (gleiche Routen wie `/api/admin/…`, mit Besitzprüfung), schreibende Aufrufe brauchen den Kopf `X-Wordy: 1`.

## Freunde, Duelle, Ranglisten
Optional und **aus**, bis die Eltern es im Dashboard beim Kind einschalten („Freunde & Duelle“).
- **Freundescode:** Jedes freigeschaltete Kind bekommt einen Code (`F…`). Das andere Kind gibt ihn in der App ein (Spielen › Freunde). Eine Freundschaft gilt erst, wenn die **Eltern beider Kinder** im Dashboard zugestimmt haben (Betreiber für eigene Spieler, Familien für ihre Kinder, je nur für die eigene Seite).
- **Sichtbar** für Freunde sind nur der von den Eltern vergebene Name, die gewählte Figur und Punkte. Kein Chat, kein Freitext, nur sechs Emoji-Reaktionen.
- **Duelle:** Das Kind spielt zuerst (Match-Rausch, Blitzrunde oder Letztes Herz) mit 60 zufälligen Schulwörtern, der Freund bekommt dieselben Wörter in derselben Reihenfolge und muss das Ergebnis schlagen. Antworten sind 7 Tage möglich, es gibt Revanche. Plausibilitätsgrenzen je Spiel, höchstens 30 Herausforderungen pro Tag.
- **Liga:** Wochen-Rangliste je Spiel (Montag bis Sonntag, bester Wert) nur unter bestätigten Freunden.
- Tabellen `friends`, `challenges`, `scores`, Spalten `players.social/fcode/avatar`. Schnittstellen (Gerät, Bearer): `/api/social/me|friends|challenges|inbox|score|board|profile`. Eltern: `/api/admin/players/:id/social` (an/aus, Code, Freunde) und `/friends/:fid` (approve/remove).

## Schnittstellen (zur Information)
App: `POST /api/pair`, `/api/events`, `/api/snapshot`, `/api/ping` · Eltern: `GET /`, `/api/admin/players`, `/api/admin/players/:id/report?days=30` u. a.

## Automatische Updates aus GitHub (Pull, ohne offenen Zugang)
Der Server fragt alle 5 Minuten selbst bei GitHub nach (nur lesen). Gibt es einen neuen Stand, der `server/` ändert, passiert das Folgende (`deploy.sh`):
1. Stand holen, `node server/test.js` laufen lassen (Selbsttest).
2. Datenbank sichern (`backup.js`), Dienst neu starten.
3. `/healthz` prüfen. Antwortet der Dienst nicht oder schlägt der Test fehl, **geht der Server automatisch auf den alten Stand zurück**, startet den alten Stand neu und versucht den abgelehnten Stand nicht noch einmal.
Änderungen nur an der App (`docs/`, `js/`, `data/`) holt er sich ebenfalls, startet aber nichts neu. Es kommt nichts von außen auf den Server, es gibt kein offenes SSH und keine Geheimnisse in GitHub.

**Einmalig einrichten** (Annahme: der Ordner `/opt/wordy` ist ein `git clone` des Repositories, dann liegt der Server unter `/opt/wordy/server`):
```bash
# 1. Aktuellen Stand holen, damit deploy.sh vorhanden ist (dein bisheriger Weg)
cd /opt/wordy && sudo -u wordy git pull
ls -l server/deploy.sh        # muss ausführbar sein (-rwxr-xr-x)

# 2. Adresse prüfen: muss mit https:// beginnen (Repository ist öffentlich, es ist kein Schlüssel nötig)
git -C /opt/wordy remote -v

# 3. Probelauf von Hand (gibt nichts aus, wenn alles aktuell ist; sonst zeigt er den Ablauf)
sudo /opt/wordy/server/deploy.sh; echo "Ende: $?"

# 4. Zeitgeber einschalten
sudo cp /opt/wordy/server/wordy-deploy.service /opt/wordy/server/wordy-deploy.timer /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now wordy-deploy.timer
systemctl list-timers wordy-deploy.timer
```
*Nur falls das Repository einmal privat wird:* Nur-Lesen-Schlüssel anlegen (`sudo mkdir -p /etc/wordy-deploy && sudo ssh-keygen -t ed25519 -N "" -C wordy-server -f /etc/wordy-deploy/id_ed25519 && sudo chown -R wordy: /etc/wordy-deploy`), den Inhalt von `id_ed25519.pub` bei GitHub unter Settings -> Deploy keys eintragen (ohne Schreibrecht), `sudo -u wordy git -C /opt/wordy remote set-url origin git@github.com:EXPLUSMORE/wordy.git` und `DEPLOY_KEY=/etc/wordy-deploy/id_ed25519` in `/etc/default/wordy-deploy` setzen.

**Beobachten:** `journalctl -u wordy-deploy -n 50 --no-pager` zeigt jeden Lauf („Neuer Stand …“, „Selbsttest bestanden“, „ERFOLG …“ oder „ZURÜCK auf …“).

**Nur freigegebene Stände (Variante „Tag“):** In `/etc/default/wordy-deploy` die Zeilen `DEPLOY_MODE=tag` und optional `DEPLOY_TAG_GLOB=server-*` eintragen. Dann geht nur ein Stand live, der mit einem Tag wie `server-2.7.0` versehen ist, nicht jeder Push auf `main`. Beispiel Vorlage: `wordy-deploy.env.example`.

**Wenn ein Stand abgelehnt wurde:** Er steht in `/opt/wordy/.deploy-bad` und wird nicht erneut versucht. Nach einem Korrektur-Push (neuer Stand) läuft es von selbst weiter.

**Pausieren / abschalten:** `sudo systemctl stop wordy-deploy.timer` (wieder starten mit `start`, dauerhaft aus mit `disable --now`).

**Nicht automatisch:** Änderungen an den systemd-Dateien (`wordy-server.service`, `wordy-deploy.*`), der Apache-Konfiguration und der `.env` bleiben Handarbeit. Der Dienst-Benutzer `wordy` braucht kein sudo, denn der Zeitgeber läuft als root und führt Git-Befehle als `wordy` aus.
