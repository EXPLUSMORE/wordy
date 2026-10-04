# Repository auf GitHub bringen

Das Verzeichnis ist bereits ein Git-Repository mit zwei Commits auf `main`.
Es fehlt nur das Gegenstück auf GitHub.

## 1. Repository anlegen und pushen

Mit der GitHub CLI in einem Schritt:

    gh repo create wordy --public --source=. --remote=origin --push

Oder von Hand: auf github.com/new ein öffentliches Repository `wordy`
anlegen — ohne README, ohne .gitignore, ohne Lizenz — und dann:

    git remote add origin https://github.com/EXPLUSMORE/wordy.git
    git branch -M main
    git push -u origin main

## 2. GitHub Pages einschalten

Im Repository: Settings → Pages

    Source:  Deploy from a branch
    Branch:  main      Ordner: /docs
    Save

Die Datei `docs/CNAME` enthält schon `wordy.explusmore.com`, GitHub trägt
die Domain daher automatisch unter „Custom domain" ein.

## 3. DNS beim Domain-Anbieter

Ein CNAME-Eintrag auf die GitHub-Pages-Adresse des Kontos:

    Typ    Name    Ziel
    CNAME  wordy   explusmore.github.io.

Kein A-Record nötig, das ist nur für die nackte Domain ohne Subdomain.
TTL: Standard. Bis es greift, vergehen je nach Anbieter ein paar Minuten
bis zu einer Stunde.

## 4. HTTPS erzwingen

Zurück in Settings → Pages: sobald unter „Custom domain" ein grüner Haken
steht, ist das Zertifikat ausgestellt. Dann „Enforce HTTPS" ankreuzen.
Das ist nicht optional — ohne HTTPS gibt es keinen Service Worker und
damit keine Installation und keinen Offline-Betrieb.

## 5. Prüfen

    https://wordy.explusmore.com

In Chrome unter Entwicklertools → Application sollten „Manifest" und
„Service Workers" gefüllt sein. Auf dem Handy erscheint im Browsermenü
„Installieren" beziehungsweise in Safari über das Teilen-Symbol
„Zum Home-Bildschirm".

## Danach: Änderungen ausliefern

    node build.js
    git add -A && git commit -m "..." && git push

Pages baut automatisch neu. Der Service Worker bekommt bei jeder
Inhaltsänderung eine neue Cache-Version und ersetzt die alte beim
nächsten Start der App.
