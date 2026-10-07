# Erklärfilme vertonen (aufgenommene Stimme)

Die App spielt für jeden Erzähltext eine MP3 aus `audio/film/`, wenn sie existiert. Sonst spricht die Gerätestimme.
Kosten: rund 5.600 Zeichen je Stimme, bei OpenAI im Cent-Bereich. Der Schlüssel bleibt auf deinem Rechner und kommt nie ins Repository.

1. Node ≥ 18 und ein API-Schlüssel (OpenAI: platform.openai.com › API keys).
2. Im Projektordner:
   - Vorab prüfen (ohne Schlüssel, ohne Kosten): `node tools/film-voice.js --dry`
   - Beide Stimmen erzeugen: `OPENAI_API_KEY=sk-... node tools/film-voice.js`
   - Nur eine Stimme: `... --voice f` (Frau) oder `--voice m` (Mann)
3. `node build.js`, dann `git add audio docs wordy.html && git commit` und auf `main` pushen.
4. In der App: Setup › Töne › Erzählerstimme „Automatisch“ oder „Frau“/„Mann“ nutzt die Aufnahme, „Nur Gerätestimme“ schaltet sie ab.

Andere Stimmen: `VOICE_F=nova VOICE_M=echo` (OpenAI: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer, verse).
Anderer Anbieter: `PROVIDER=eleven ELEVEN_API_KEY=... ELEVEN_VOICE_F=<id> ELEVEN_VOICE_M=<id> node tools/film-voice.js`.
Änderst du Filmtexte in `js/film.js`, den Befehl einfach noch einmal laufen lassen: nur geänderte Texte werden neu vertont, veraltete Dateien werden gelöscht.
