#!/usr/bin/env bash
# Wordy-Server: holt neue Stände aus GitHub, prüft sie und startet den Dienst neu. Läuft per systemd-Timer (siehe README).
#   Es kommt nichts von außen auf den Server: der Server fragt selbst bei GitHub nach (nur lesen).
#   Ablauf: neuen Stand holen -> Selbsttest -> Sicherung -> Neustart -> Gesundheitsprüfung -> sonst automatisch zurück auf den alten Stand.
# Einstellungen (alle optional) in /etc/default/wordy-deploy oder als Umgebungsvariablen:
#   DEPLOY_MODE=branch|tag    branch: jeder neue Stand auf DEPLOY_BRANCH (Standard main); tag: nur Tags passend zu DEPLOY_TAG_GLOB
#   DEPLOY_BRANCH=main        DEPLOY_TAG_GLOB='server-*'
#   DEPLOY_KEY=/etc/wordy-deploy/id_ed25519   Nur-Lesen-Deploy-Schlüssel (bei öffentlichem Repository nicht nötig)
#   SERVICE=wordy-server      NODE_BIN=/opt/node22/bin/node (sonst: Node aus der Dienst-Datei)      RUN_AS=wordy (Benutzer, dem die Dateien gehören)
set -uo pipefail

main() {
  [ -f /etc/default/wordy-deploy ] && . /etc/default/wordy-deploy
  local HERE REPO MODE BRANCH GLOB SERVICE NODE RUN_AS KEY BAD
  HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  # Git-Ordner ohne Git suchen (als root würde Git bei fremdem Besitzer "dubious ownership" melden)
  REPO="$HERE"; while [ "$REPO" != / ] && [ ! -e "$REPO/.git" ]; do REPO="$(dirname "$REPO")"; done
  [ "$REPO" != / ] || { echo "FEHLER: $HERE liegt in keinem Git-Ordner. Der Server muss per git clone angelegt sein."; return 2; }
  MODE="${DEPLOY_MODE:-branch}"; BRANCH="${DEPLOY_BRANCH:-main}"; GLOB="${DEPLOY_TAG_GLOB:-server-*}"
  SERVICE="${SERVICE:-wordy-server}"; KEY="${DEPLOY_KEY:-}"
  # Node: dasselbe Programm, mit dem der Dienst läuft (steht in dessen systemd-Datei), sonst das erste node im Pfad
  NODE="${NODE_BIN:-$(systemctl show -p ExecStart --value "$SERVICE" 2>/dev/null | sed -n 's/.*path=\([^ ;]*\).*/\1/p' | head -n1)}"
  [ -x "${NODE:-}" ] || NODE="$(command -v node || echo /usr/bin/node)"
  RUN_AS="${RUN_AS:-$(stat -c %U "$REPO")}"
  BAD="$REPO/.deploy-bad"
  local RESTART="${RESTART_CMD:-systemctl restart $SERVICE}"

  # Als anderer Benutzer ausführen (Dateien gehören dem Dienst-Benutzer), falls wir root sind
  as() { if [ "$(id -u)" = 0 ] && [ "$RUN_AS" != root ]; then runuser -u "$RUN_AS" -- "$@"; else "$@"; fi; }
  local GENV=(GIT_TERMINAL_PROMPT=0)
  [ -n "$KEY" ] && GENV+=("GIT_SSH_COMMAND=ssh -i $KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new")
  g() { as env "${GENV[@]}" git -C "$REPO" "$@"; }

  exec 9>"/tmp/wordy-deploy.lock"; flock -n 9 || { echo "läuft schon"; return 0; }

  g fetch --quiet --tags --prune origin "$BRANCH" || { echo "WARNUNG: GitHub nicht erreichbar, nächster Versuch später"; return 0; }
  local OLD NEW
  if [ "$MODE" != tag ] && [ "$(g rev-parse --abbrev-ref HEAD)" != "$BRANCH" ]; then g checkout --quiet "$BRANCH" || { echo "FEHLER: Zweig $BRANCH nicht auswählbar"; return 3; }; fi
  OLD="$(g rev-parse HEAD)"
  if [ "$MODE" = tag ]; then
    local TAG; TAG="$(g tag -l "$GLOB" --sort=-v:refname | head -n1)"
    [ -n "$TAG" ] || { echo "kein Tag passend zu $GLOB"; return 0; }
    NEW="$(g rev-list -n1 "$TAG")"
  else
    NEW="$(g rev-parse "origin/$BRANCH")"
  fi
  [ "$OLD" = "$NEW" ] && return 0
  if [ -f "$BAD" ] && grep -qx "$NEW" "$BAD"; then echo "Stand ${NEW:0:8} wurde bereits abgelehnt, übersprungen"; return 0; fi
  g merge-base --is-ancestor "$OLD" "$NEW" || { echo "FEHLER: $NEW baut nicht auf $OLD auf (Verlauf umgeschrieben?). Bitte von Hand prüfen."; return 3; }

  local CHANGED; CHANGED="$(g diff --name-only "$OLD" "$NEW" -- server package.json)"
  echo "Neuer Stand ${NEW:0:8} (vorher ${OLD:0:8})"
  g merge --ff-only --quiet "$NEW" || { echo "FEHLER: Aktualisieren nicht möglich"; return 3; }
  if [ -z "$CHANGED" ]; then echo "Nur App-Dateien geändert, kein Neustart nötig"; return 0; fi
  echo "Server-Dateien geändert: $(echo "$CHANGED" | tr '\n' ' ')"

  back() {   # zurück auf den alten Stand, den Stand merken und nicht erneut versuchen
    echo "ZURÜCK auf ${OLD:0:8}: $1"
    g reset --hard --quiet "$OLD"; echo "$NEW" >> "$BAD"
    if [ -n "${2:-}" ]; then eval "$RESTART" || true; fi
    return 1
  }

  ( cd "$REPO" && as "$NODE" server/test.js >/tmp/wordy-deploy-test.log 2>&1 ) || { tail -n 15 /tmp/wordy-deploy-test.log; back "Selbsttest fehlgeschlagen"; return 1; }
  echo "Selbsttest bestanden"
  [ -f "$REPO/server/backup.js" ] && ( cd "$REPO/server" && as "$NODE" backup.js ) >/dev/null 2>&1 && echo "Sicherung angelegt"

  eval "$RESTART" || { back "Neustart fehlgeschlagen" 1; return 1; }
  local PORT HOST URL i ok=0
  PORT="$(grep -E '^PORT=' "$REPO/server/.env" 2>/dev/null | tail -n1 | cut -d= -f2 | tr -d '[:space:]')"; PORT="${PORT:-8787}"
  HOST="$(grep -E '^HOST=' "$REPO/server/.env" 2>/dev/null | tail -n1 | cut -d= -f2 | tr -d '[:space:]')"; HOST="${HOST:-127.0.0.1}"
  URL="${HEALTH_URL:-http://$HOST:$PORT/healthz}"
  for i in $(seq 1 20); do
    if curl -fsS -m 3 "$URL" 2>/dev/null | grep -q '"ok":true'; then ok=1; break; fi
    sleep 1
  done
  [ "$ok" = 1 ] || { back "Dienst antwortet nach dem Neustart nicht" 1; return 1; }
  echo "ERFOLG: ${NEW:0:8} ist live"
  return 0
}
main "$@"
exit $?
