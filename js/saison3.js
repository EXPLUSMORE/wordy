/* Wordy – Saison-Look „Arcade 3000“ (v2.180): Neon-Spielhalle. Hängt sich in VTS2 ein (gleiche Aufrufe wie die anderen Looks),
   CSS-Block SEASON-ARCADE aus tools/season_themes.py. UFO in der Kopfzeile (Antippen = Laser-Show, Bild-Glitch, einmal am Tag eine Münze),
   Szene in der Bühne (Sonne, Gitter, Berge, Invader, HI-SCORE), fallende Pixel-Blöcke, Chiptune, Combo-Anzeige und Invader-Leiste in der Übung. */
(function (global) {
  "use strict";
  var V2 = global.VTS2; if (!V2) return;
  var ID = "arcade", busy = false, WX = null, AMB = null, COLS = ["#00F0FF", "#FF2BD6", "#FFE14D", "#5CFF8A", "#FF8A3D"];
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function uri(svg) { return "url(\"data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg).replace(/'/g, "%27") + "\")"; }
  function ufo() { return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 54 34'><ellipse cx='27' cy='12' rx='11' ry='9' fill='#9FF6FF' opacity='.85'/><circle cx='24' cy='10' r='2' fill='#07021A'/><circle cx='30' cy='10' r='2' fill='#07021A'/><ellipse cx='27' cy='19' rx='25' ry='8' fill='#FF2BD6'/><ellipse cx='27' cy='17' rx='25' ry='6' fill='#FF7BEA'/><circle cx='10' cy='19' r='2.2' fill='#FFE14D'/><circle cx='27' cy='22' r='2.2' fill='#FFE14D'/><circle cx='44' cy='19' r='2.2' fill='#FFE14D'/><path d='M18 26L10 34H44L36 26z' fill='#00F0FF' opacity='.35'/></svg>"; }
  function inv(c, cls, style) { return "<svg class='" + (cls || "") + "' style='color:" + c + ";" + (style || "") + "' viewBox='0 0 11 8' shape-rendering='crispEdges'><path fill='" + c + "' d='M2 0h1v1H2zM8 0h1v1H8zM3 1h1v1H3zM7 1h1v1H7zM2 2h7v1H2zM1 3h2v1H1zM4 3h3v1H4zM8 3h2v1H8zM0 4h11v1H0zM0 5h1v1H0zM2 5h7v1H2zM10 5h1v1h-1zM0 6h1v1H0zM2 6h1v1H2zM8 6h1v1H8zM10 6h1v1h-1zM3 7h2v1H3zM6 7h2v1H6z'/></svg>"; }
  var THEME = { id: ID, name: "Arcade 3000", boo: "GAME ON!", cheer: "Geschafft! HIGH SCORE! 🕹️🎉", spark: COLS, hint: "Tipp das UFO an! 🛸", ambient: ID, mascot: ufo, mini: ufo, flyer: ufo,
    bubbles: { weg: ["Pew pew! 🛸"], loop: ["Looping! 🌀"], pinball: ["Bing! 🔔"], splat: ["Zack! 💥"] } };

  /* ---------- 8-Bit-Töne (Rechteckwelle) ---------- */
  function AC() { var a = global.VTC && global.VTC.ctx ? global.VTC.ctx() : null; if (a && a.state === "suspended") { try { a.resume(); } catch (e) {} } return a; }
  function beep(f, t, d, vol, type, out) { var a = AC(); if (!a) return; var o = a.createOscillator(), g = a.createGain(); o.type = type || "square"; o.frequency.setValueAtTime(f, a.currentTime + t); g.gain.setValueAtTime(vol || 0.05, a.currentTime + t); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + d); o.connect(g); g.connect(out || a.destination); o.start(a.currentTime + t); o.stop(a.currentTime + t + d + 0.02); return o; }
  function sfx(k) {
    try {
      if (k === "laser") [0, 0.09, 0.18].forEach(function (t) { var a = AC(); if (!a) return; var o = a.createOscillator(), g = a.createGain(); o.type = "sawtooth"; o.frequency.setValueAtTime(1500, a.currentTime + t); o.frequency.exponentialRampToValueAtTime(180, a.currentTime + t + 0.16); g.gain.setValueAtTime(0.05, a.currentTime + t); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + t + 0.17); o.connect(g); g.connect(a.destination); o.start(a.currentTime + t); o.stop(a.currentTime + t + 0.2); });
      else if (k === "coin") { beep(988, 0, 0.08, 0.06); beep(1319, 0.08, 0.28, 0.06); }
      else if (k === "zap") { beep(660, 0, 0.05, 0.045); beep(330, 0.05, 0.09, 0.045); }
      else if (k === "combo") [523, 659, 784, 1047].forEach(function (f, i) { beep(f, i * 0.06, 0.09, 0.05); });
      else if (k === "wave") [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, i) { beep(f, i * 0.09, 0.14, 0.055); });
    } catch (e) {}
  }
  function ambientStart() {   // leiser Chiptune-Lauf (Bass + Arpeggio), endlos
    var a = AC(); if (!a || AMB) return; var m = a.createGain(); m.gain.value = 0.35; m.connect(a.destination);
    var SEQ = [[110, [440, 523, 659, 523]], [87.3, [349, 440, 523, 440]], [130.8, [523, 659, 784, 659]], [98, [392, 494, 587, 494]]], step = 0;
    function bar() { var s = SEQ[step++ % SEQ.length]; beep(s[0], 0, 0.5, 0.05, "triangle", m); beep(s[0], 0.6, 0.5, 0.05, "triangle", m); s[1].concat(s[1]).forEach(function (f, i) { beep(f, i * 0.15, 0.12, 0.018, "square", m); }); }
    bar(); AMB = { m: m, iv: setInterval(bar, 1200) };
  }
  function ambientStop() { if (!AMB) return; clearInterval(AMB.iv); try { AMB.m.disconnect(); } catch (e) {} AMB = null; }

  /* ---------- Kopfzeile: UFO ---------- */
  function mount(host) { if (host) { host.style.setProperty("--sp", uri(ufo())); host.setAttribute("data-th", ID); } }
  function tap(rect, onEnd, silent) {   // Laser-Show + Glitch; einmal am Tag beamt das UFO eine Münze herunter
    if (busy) return false; busy = true;
    var x = rect.left + rect.width / 2, lay = [];
    [-38, -18, 12, 30, 46].forEach(function (r, i) { var l = el("i", "arcLaser"); l.style.cssText = "left:" + x + "px;--r:" + r + "deg;--c:" + COLS[i % COLS.length] + ";animation-delay:" + i * 0.07 + "s"; document.body.appendChild(l); lay.push(l); });
    document.body.classList.add("arcGlitch"); if (!silent) sfx("laser");
    try { if (global.navigator && navigator.vibrate) navigator.vibrate([20, 40, 20]); } catch (e) {}
    var got = global.VT && global.VT.arcBeam ? global.VT.arcBeam() : 0;
    if (got) { var c = el("i", "arcCoin", "🪙"); c.style.cssText = "left:" + (x - 13) + "px;top:" + rect.bottom + "px"; document.body.appendChild(c); lay.push(c); setTimeout(function () { if (!silent) sfx("coin"); if (V2.hooks && V2.hooks.arcBeam) V2.hooks.arcBeam(got); }, 900); }
    setTimeout(function () { lay.forEach(function (n) { n.remove(); }); document.body.classList.remove("arcGlitch"); busy = false; if (onEnd) onEnd(); }, 1500);
    return true;
  }

  /* ---------- Bühne auf der Startseite ---------- */
  function scene(on) {
    var old = document.getElementById("arcScene"); if (!on) { if (old) old.remove(); return; }
    var sky = document.querySelector(".hh .hhsky"); if (!sky) return; if (old && sky.contains(old)) return; if (old) old.remove();
    var I = global.VT && global.VT.arcInfo ? global.VT.arcInfo() : { hi: 0, n: 0, need: 8 }, s = el("div"); s.id = "arcScene";
    var left = Math.max(0, I.need - I.n), row = "";
    for (var i = 0; i < Math.min(left, 8); i++) row += inv(COLS[(i + 3) % 5], "arcInv", "left:" + (5 + i * 6.3) + "%;top:" + (104 + (i % 2) * 5) + "px;width:18px;animation-delay:-" + (i * 0.3) + "s");
    s.innerHTML = "<div class='arcStars'></div><div class='arcSun'></div><svg class='arcMt' viewBox='0 0 390 70' preserveAspectRatio='none'><path d='M0 70L40 30 70 52 120 8 170 56 215 28 260 60 300 18 345 50 390 26V70z' fill='#0B0326' stroke='#00F0FF' stroke-width='2'/><path d='M120 8L112 70M120 8L140 70M300 18L288 70M300 18L318 70M40 30L44 70M215 28L212 70' stroke='#00F0FF' stroke-width='1' opacity='.6'/></svg><div class='arcGrid'></div><div class='arcScore'>HI-SCORE " + ("000000" + I.hi).slice(-6) + "</div>" + row;
    sky.appendChild(s);
  }
  /* ---------- „Wetter“: fallende Pixel-Blöcke ---------- */
  function weather(on) {
    if (!on) { if (WX) { clearInterval(WX.iv); document.querySelectorAll(".arcBlk").forEach(function (n) { n.remove(); }); WX = null; } return; }
    if (WX) return;
    function drop() { if (document.hidden || document.querySelectorAll(".arcBlk").length > 7) return; var b = el("i", "arcBlk"), c = COLS[Math.random() * 5 | 0]; b.style.cssText = "left:" + (Math.random() * 92 | 0) + "vw;--c:" + c + ";--bx:" + (Math.random() < 0.5 ? "0" : "14px") + ";--d:" + (7 + Math.random() * 6).toFixed(1) + "s"; document.body.appendChild(b); b.addEventListener("animationend", function () { b.remove(); }); }
    WX = { iv: setInterval(drop, 1700) }; drop();
  }
  /* ---------- Übung: Invader-Leiste und Combo ---------- */
  function hud(host, info) {
    var old = document.getElementById("arcHud"); if (old) old.remove(); if (!host || !info) return;
    var h = el("div", "arcHud"), s = ""; h.id = "arcHud";
    for (var i = 0; i < info.need; i++) s += inv(COLS[i % 5], i < info.n ? "dead" : "");
    h.innerHTML = s + "<b>" + (info.cleared ? "WELLE GESCHAFFT" : "WELLE " + info.n + "/" + info.need) + "</b>"; host.appendChild(h);
  }
  function zap(n) { var h = document.getElementById("arcHud"); if (!h) return; var s = h.querySelectorAll("svg")[n - 1]; if (s) { s.classList.add("zap"); setTimeout(function () { s.classList.remove("zap"); s.classList.add("dead"); }, 480); } }
  function combo(n, silent) { var c = el("div", "arcCombo", "COMBO x" + n); document.body.appendChild(c); setTimeout(function () { c.remove(); }, 1150); if (!silent) sfx("combo"); }
  function banner(txt, silent) { var c = el("div", "arcCombo", txt); c.style.top = "34%"; c.style.fontSize = "26px"; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 1150); if (!silent) sfx("wave"); }

  /* ---------- in VTS2 einhängen ---------- */
  var o = { theme: V2.theme, themes: V2.themes, mount: V2.mount, tap: V2.tap, whack: V2.whack, home: V2.home, weather: V2.weather, ambientStart: V2.ambientStart, ambientStop: V2.ambientStop, ambientOn: V2.ambientOn, busy: V2.busy };
  V2.theme = function (id) { return id === ID ? THEME : o.theme(id); };
  V2.mount = function (host, id) { return id === ID ? mount(host) : o.mount(host, id); };
  V2.tap = function (id, rect, onEnd, silent) { return id === ID ? tap(rect, onEnd, silent) : o.tap(id, rect, onEnd, silent); };
  V2.whack = function (id) { return id === ID ? false : o.whack.apply(V2, arguments); };
  V2.home = function (id, on) { scene(id === ID && on); return o.home(id === ID ? "" : id, on); };
  V2.weather = function (id, on) { weather(id === ID && on); return o.weather(id === ID ? "" : id, on); };
  V2.ambientStart = function (id) { return id === ID ? ambientStart() : o.ambientStart(id); };
  V2.ambientStop = function () { ambientStop(); return o.ambientStop(); };
  V2.ambientOn = function () { return !!AMB || o.ambientOn(); };
  V2.busy = function () { return busy || o.busy(); };
  global.VTS3 = { id: ID, hud: hud, zap: zap, combo: combo, banner: banner, sfx: sfx, scene: scene, inv: inv };
})(window);
