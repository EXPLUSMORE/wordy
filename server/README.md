# Wordy-Server

Nimmt den Lernverlauf der Wordy-App entgegen und zeigt ihn den Eltern im Dashboard.
Keine Abhängigkeiten: nur **Node.js ab 22.13** (eingebautes SQLite). Daten liegen in einer einzigen Datei.

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
2. „＋ Spieler“ → Name eingeben → es erscheint ein **Code** wie `https://wordy.example.com#AB12-CD34`.
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
Danach nginx einrichten (`nginx.conf.example`, Zertifikat per `certbot --nginx -d wordy.example.com`).
Der Server hört nur auf `127.0.0.1`, von außen erreichbar ist er ausschließlich über nginx mit HTTPS.
**Ohne HTTPS nicht betreiben:** Die App darf nur über https senden, und das Passwort wird sonst im Klartext übertragen.

## Sicherung
Alles steht in `DB_FILE`. Eine konsistente Kopie, auch im laufenden Betrieb:
```bash
sqlite3 /var/lib/wordy/wordy.db ".backup '/var/backups/wordy-$(date +%F).db'"
```

## Sicherheit in Kürze
- Dashboard und Verwaltung: HTTP-Anmeldung (Benutzer und Passwort aus `.env`), Fehlversuche werden begrenzt.
- App-Schnittstelle: pro Gerät ein zufälliger Schlüssel (256 Bit), in der Datenbank nur als Hash.
- Eingaben werden begrenzt (Größe, Anzahl), doppelt gesendete Ereignisse werden erkannt.
- `ALLOW_ORIGIN` auf die Adresse der App einschränken (nicht `*`).

## Schnittstellen (zur Information)
App: `POST /api/pair`, `/api/events`, `/api/snapshot`, `/api/ping` · Eltern: `GET /`, `/api/admin/players`, `/api/admin/players/:id/report?days=30` u. a.
