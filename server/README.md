# Wordy-Server

Nimmt den Lernverlauf der Wordy-App entgegen und zeigt ihn den Eltern im Dashboard.
Keine Abhängigkeiten: nur **Node.js ab 22.13** (eingebautes SQLite). Daten liegen in einer einzigen Datei.

## Funktionen im Dashboard
- **Wochenziele:** Minuten üben, Übungstage (ab 5 Minuten), neue Wörter oder eine Einheit zu x % sicher gelernt (Stufe „Sitzt“ oder höher). Mit Bonusmünzen. Die App holt die Ziele ab und zeigt sie auf der Startseite. Die Münzen werden automatisch gutgeschrieben, genau einmal.
- **Lernplan für Klassenarbeiten:** Datum und Einheiten festlegen. Die App zeigt, wie viele neue Wörter heute dran sind, und übt gezielt nur diese Einheiten. Bonus bei 90 % sicher.
- **Einzelansicht pro Einheit:** Tippe im Dashboard auf eine Einheit, dann siehst du alle Wörter mit Stand, richtigen und falschen Antworten.
- **Wochenmail:** siehe unten.

## Wochenmail
Zugangsdaten eines Mailkontos in die `.env` eintragen (Vorlage am Ende von `.env.example`), dann `sudo systemctl restart wordy-server`.
Im Dashboard unten steht danach „Geht jeden Sonntag um 18 Uhr an …“ und eine Schaltfläche **Testmail jetzt senden**.
Der Versand nutzt SMTP mit Anmeldung (Port 587 STARTTLS oder 465). Bei Microsoft 365 ist „SMTP AUTH“ oft gesperrt. Dann ein anderes Konto oder einen Mailversanddienst nehmen.
Wenn der Versand an einem Tag dreimal scheitert, wird er bis zur nächsten Woche nicht erneut versucht. Die Ursache steht im Protokoll: `sudo journalctl -u wordy-server -n 30`.

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
3. In der App: Setup → Eltern-Dashboard → Code einfügen → Verbinden. Der Code gilt 7 Tage und nur einmal.
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

## Schnittstellen (zur Information)
App: `POST /api/pair`, `/api/events`, `/api/snapshot`, `/api/ping` · Eltern: `GET /`, `/api/admin/players`, `/api/admin/players/:id/report?days=30` u. a.
