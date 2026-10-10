/* Prüft data/grammatik.js auf typische Fehler: falsches Wort im Fehlersatz, Lücken, doppelte Antworten, erfundene Formen als richtige Lösung.
   Aufruf: node tools/check-grammatik.js */
global.window = global; require("../data/grammatik.js");
var BAD = ["goed", "buyed", "haved", "likeed", "didn't went", "didn't saw", "did went", "did saw", "we was", "they was", "she were", "he were", "it were", "i were"];
var errs = 0, n = 0;
function fail(t, i, msg) { errs++; console.log("FEHLER", t.id, "#" + i, msg); }
function strip(w) { return w.replace(/[.,!?]+$/, ""); }
GRAMMAR.filter(function (t) { return !t.soon; }).forEach(function (t) {
  t.items.forEach(function (it, i) {
    n++;
    var full = null;
    if (it.t === "choice") {
      if (it.q.split("____").length !== 2) fail(t, i, "genau eine Lücke nötig: " + it.q);
      if (new Set(it.opts.map(function (o) { return o.toLowerCase(); })).size !== it.opts.length) fail(t, i, "doppelte Antwort");
      if (it.opts.length < 3) fail(t, i, "zu wenige Antworten");
      full = it.q.replace("____", it.opts[0]);
    } else if (it.t === "type") {
      if (it.q.split("____").length !== 2) fail(t, i, "genau eine Lücke nötig: " + it.q);
      if (it.full.toLowerCase().indexOf(it.a[0].toLowerCase()) < 0) fail(t, i, "full enthält die Antwort nicht");
      if (it.full.replace(it.a[0], "____") !== it.q.replace(/\s*\([^)]*\)/, "") && it.full.replace(new RegExp(it.a[0], "i"), "____") !== it.q.replace(/\s*\([^)]*\)/, "")) fail(t, i, "q und full passen nicht zusammen: " + it.q + " / " + it.full);
      full = it.full;
    } else if (it.t === "order") {
      full = it.w.join(" ");
      if (!/[.?!]$/.test(it.w[it.w.length - 1])) fail(t, i, "letztes Wort ohne Satzzeichen");
      if (!/^[A-Z]/.test(it.w[0])) fail(t, i, "erstes Wort klein");
    } else if (it.t === "error") {
      var tk = it.s.split(" "), w = strip(tk[it.bad] || "");
      if (!w) fail(t, i, "bad zeigt ins Leere");
      if (w.toLowerCase() === it.fix[0].toLowerCase()) fail(t, i, "das markierte Wort ist schon richtig: " + w);
      if (it.fix.some(function (f, j) { return j && f.toLowerCase() === w.toLowerCase(); })) fail(t, i, "falsches Wort steht in den Antworten");
      tk[it.bad] = it.fix[0] + (/[.,!?]+$/.test(tk[it.bad]) ? tk[it.bad].match(/[.,!?]+$/)[0] : ""); full = tk.join(" ");
      console.log("  Fehlersatz:", it.s, " → markiert:", w, " → richtig:", full);
    }
    if (full) BAD.forEach(function (b) { if (full.toLowerCase().indexOf(b) >= 0) fail(t, i, "richtige Lösung enthält falsche Form „" + b + "“: " + full); });
    if (!it.why) fail(t, i, "Begründung fehlt");
  });
});
console.log(n + " Aufgaben geprüft, " + errs + " Fehler.");
process.exit(errs ? 1 : 0);
