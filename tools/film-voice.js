#!/usr/bin/env node
/* Vertont die Erzähltexte der Erklärfilme (js/film.js) mit einer Sprach-KI und legt die MP3-Dateien in audio/film/.
   Danach `node build.js`, committen, pushen. Die App spielt die Aufnahmen; fehlt eine Datei, spricht die Gerätestimme.

   Aufruf:  OPENAI_API_KEY=sk-... node tools/film-voice.js            (beide Stimmen, f = Frau, m = Mann)
            OPENAI_API_KEY=sk-... node tools/film-voice.js --voice f
            node tools/film-voice.js --dry                              (nur zeigen, was erzeugt würde, ohne Schlüssel)
   Anbieter: PROVIDER=openai (Standard) oder PROVIDER=eleven (ELEVEN_API_KEY, ELEVEN_VOICE_F, ELEVEN_VOICE_M)
   Stimmen (OpenAI): VOICE_F=coral, VOICE_M=onyx  – andere: alloy, ash, ballad, echo, fable, nova, sage, shimmer, verse
   Bereits vorhandene Dateien werden übersprungen; geänderte Texte bekommen automatisch eine neue Datei (Prüfsumme im Namen). */
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.join(__dirname, "..");
const args = process.argv.slice(2), has = f => args.includes(f), val = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const provider = (process.env.PROVIDER || "openai").toLowerCase();
const outDir = path.join(root, "audio", "film");

/* Filmtexte laden (film.js ist ein Browser-Skript, hier nur gelesen, nicht ausgeführt außer dem Katalog) */
const win = {};
vm.runInNewContext(fs.readFileSync(path.join(root, "js", "film.js"), "utf8"), { window: win, Math, Date, document: {}, fetch: () => {} });
const films = win.VTFILM.list, hash = win.VTFILM.hash;
const texts = [...new Set(films.flatMap(f => f.scenes.map(s => s.nar)))];

const STYLE = {
  f: "Sprich Deutsch wie eine Muttersprachlerin. Warm, charmant und selbstbewusst, mit einem Schmunzeln in der Stimme, ruhig und lässig, nicht zu schnell. Klingt wie eine coole große Schwester, die Kindern ab 10 etwas Spannendes erklärt. Humor leicht betonen.",
  m: "Sprich Deutsch wie ein Muttersprachler. Cool, tief und entspannt, trockener Humor, ruhiges Tempo. Klingt wie ein lässiger großer Bruder oder Streamer, der Kindern ab 10 etwas Spannendes erklärt. Humor leicht betonen."
};
const voices = (val("--voice") ? [val("--voice")] : ["f", "m"]);

async function tts(text, v) {
  if (provider === "eleven") {
    const id = process.env["ELEVEN_VOICE_" + v.toUpperCase()]; if (!id) throw new Error("ELEVEN_VOICE_" + v.toUpperCase() + " fehlt");
    const r = await fetch((process.env.ELEVEN_BASE || "https://api.elevenlabs.io") + "/v1/text-to-speech/" + id + "?output_format=mp3_44100_64", {
      method: "POST", headers: { "xi-api-key": process.env.ELEVEN_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: "eleven_multilingual_v2", language_code: "de", voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35 } })
    });
    if (!r.ok) throw new Error("ElevenLabs " + r.status + " " + (await r.text()).slice(0, 200));
    return Buffer.from(await r.arrayBuffer());
  }
  const r = await fetch((process.env.OPENAI_BASE || "https://api.openai.com") + "/v1/audio/speech", {
    method: "POST", headers: { authorization: "Bearer " + process.env.OPENAI_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-4o-mini-tts", voice: v === "f" ? (process.env.VOICE_F || "coral") : (process.env.VOICE_M || "onyx"), input: text, instructions: STYLE[v], response_format: "mp3" })
  });
  if (!r.ok) throw new Error("OpenAI " + r.status + " " + (await r.text()).slice(0, 200));
  return Buffer.from(await r.arrayBuffer());
}

(async () => {
  const jobs = []; voices.forEach(v => texts.forEach(t => jobs.push({ v, t, file: v + "-" + hash(t) + ".mp3" })));
  const chars = texts.reduce((n, t) => n + t.length, 0) * voices.length;
  console.log(films.length + " Filme, " + texts.length + " Texte, " + voices.length + " Stimme(n) → " + jobs.length + " Dateien (" + chars + " Zeichen), Anbieter: " + provider);
  if (has("--dry")) { jobs.forEach(j => console.log(j.file + "  " + j.t)); return; }
  if (provider === "eleven" ? !process.env.ELEVEN_API_KEY : !process.env.OPENAI_API_KEY) { console.error("API-Schlüssel fehlt (OPENAI_API_KEY bzw. ELEVEN_API_KEY)."); process.exit(1); }
  fs.mkdirSync(outDir, { recursive: true });
  let made = 0, skipped = 0;
  for (const j of jobs) {
    const f = path.join(outDir, j.file);
    if (fs.existsSync(f) && fs.statSync(f).size > 500) { skipped++; continue; }
    process.stdout.write("… " + j.file + " ");
    fs.writeFileSync(f, await tts(j.t, j.v)); made++; console.log("ok");
  }
  /* Index = alle Dateien, die zu aktuellen Texten gehören; alte, nicht mehr gebrauchte Dateien werden entfernt */
  const want = new Set(["f", "m"].flatMap(v => texts.map(t => v + "-" + hash(t) + ".mp3")));
  const have = fs.readdirSync(outDir).filter(x => /\.mp3$/.test(x));
  have.filter(x => !want.has(x)).forEach(x => { fs.unlinkSync(path.join(outDir, x)); console.log("entfernt (veraltet): " + x); });
  const list = have.filter(x => want.has(x)).sort();
  fs.writeFileSync(path.join(outDir, "index.json"), JSON.stringify(list, null, 1));
  console.log("Fertig: " + made + " neu, " + skipped + " vorhanden, Index mit " + list.length + " Dateien.");
})().catch(e => { console.error(e.message); process.exit(1); });
