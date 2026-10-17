#!/bin/sh
# Schaltet den versionierten pre-commit-Hook ein (einmal je Klon).
cd "$(git rev-parse --show-toplevel)" || exit 1
chmod +x tools/hooks/pre-commit
git config core.hooksPath tools/hooks
echo "Hook aktiv: core.hooksPath = tools/hooks"
