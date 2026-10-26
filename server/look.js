/* Figuren und Sticker als Bild für das Dashboard (nur Zeichnen, keine Spielerdaten).
   Lädt die Zeichen-Dateien der App (stila/stilb/acc) in einer leeren Sandbox und liefert eigenständiges SVG. */
"use strict";
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, "..");
let ctx = null;
function load() {
  if (ctx !== null) return ctx;
  try {
    const eng = fs.readFileSync(path.join(ROOT, "js", "engine.js"), "utf8"), slot = {};
    for (const m of eng.matchAll(/\["(\w+)",\s*"(head|face|ears|neck)",\s*"[^"]*"/g)) slot[m[1]] = m[2];   // Zubehör-Katalog ACC: Wert → Platz
    const noop = () => {}, el = () => ({ style: {}, setAttribute: noop, appendChild: noop, addEventListener: noop, classList: { add: noop, remove: noop } });
    const c = { console: { log() {}, error() {} }, document: { body: null, documentElement: el(), createElement: el, getElementById: () => null, addEventListener: noop, querySelector: () => null }, navigator: {}, matchMedia: () => ({ matches: false, addEventListener: noop }), setTimeout: noop, setInterval: noop }; c.window = c; c.global = c;
    c.VT = { itemById: id => { const v = String(id).replace(/^ac:/, ""); return slot[v] ? { slot: slot[v] } : null; }, accOf: () => ({}) };
    vm.createContext(c);
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, "js", "cosmetics.js"), "utf8"), c, { filename: "cosmetics.js", timeout: 5000 }); } catch (e) { console.error("cosmetics.js nicht geladen (Sticker wie Clombo ohne Bild):", e.message); }   // Köpfe wie Clombo stehen nur dort
    for (const f of ["stila.js", "stilb.js", "acc.js"]) vm.runInContext(fs.readFileSync(path.join(ROOT, "js", f), "utf8"), c, { filename: f, timeout: 5000 });
    ctx = c.VTA && c.VTA.headA ? c : false;
  } catch (e) { console.error("Dashboard-Bilder nicht verfügbar:", e.message); ctx = false; }
  return ctx;
}
const SLOTS = ["head", "face", "ears", "neck"];
function cleanAcc(s) {   // "head:beanie,face:sonne"
  const o = {};
  String(s || "").split(",").slice(0, 4).forEach(x => { const [k, v] = x.split(":"); if (SLOTS.includes(k) && /^[a-z0-9]{1,12}$/.test(v || "")) o[k] = v; });
  return o;
}
/* kind: "fig" (Kopf mit Oberkörper, wie in der App) oder "stk" (Sticker-Kopf, mit weißem Rand per CSS im Dashboard) */
function render(av, acc, kind) {
  const c = load(); if (!c) return null;
  if (!c.VTA.has(av)) {   // Köpfe ohne Figur-Baukasten (z. B. Clombo): fertiges Kopfbild aus cosmetics.js, ohne Zubehör
    const art = c.VTC && c.VTC.ART && c.VTC.ART[/^svg:/.test(av) ? av.slice(4) : av];
    if (typeof art !== "string" || !art.startsWith("<svg")) return null;
    let one = art.replace(/ style="[^"]*"/, "");
    if (!/xmlns=/.test(one.slice(0, 120))) one = one.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
    one = one.replace(/ (width|height)="[^"]*"/g, (m, k) => (k === "width" || k === "height") && one.indexOf(m) < 200 ? "" : m);
    return one.replace("<svg ", '<svg width="176" height="176" ');
  }
  const lo = cleanAcc(acc);
  let svg = c.VTA.headA(av, lo);
  svg = svg.replace('style="display:block;width:1.25em;height:1.25em"', 'width="220" height="232"');
  if (!/xmlns=/.test(svg.slice(0, 120))) svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
  svg = svg.replace(/(<svg [^>]*>)/, "$1<style>.acc-spin{animation:accSpin .5s linear infinite}@keyframes accSpin{to{transform:rotate(360deg)}}.acc-pulse{animation:accPulse 1.6s ease-in-out infinite}@keyframes accPulse{50%{opacity:.65}}</style>");   // Animationen im eigenständigen Bild
  if (kind === "stk") svg = svg.replace('viewBox="0 -52 220 232"', 'viewBox="22 -46 176 222"').replace('width="220" height="232"', 'width="176" height="222"');
  return svg;
}
module.exports = { render, cleanAcc, ready: () => !!load() };
