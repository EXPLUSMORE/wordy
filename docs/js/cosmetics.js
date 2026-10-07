/* Wordy – Sammelobjekte: gezeichnete Figuren, Rahmen, Hintergründe, Effekte, Töne.
   Der Katalog (Preise, Namen) steht in engine.js; hier steht nur, wie etwas aussieht und klingt. */
(function (global) {
  "use strict";

  /* ---------- Pummelfiguren ---------- */
  /* Gemeinsame Form: runder Körper, Füße, Augen, Bäckchen, Mund. Varianten ergänzen Ohren und Besonderheiten. */
  function pummel(o) {
    var eye = o.eye || "#3B2A4A", pupil = o.pupil || "#fff";
    var s = '<svg viewBox="0 0 64 64" width="1.25em" height="1.25em" style="display:block" aria-hidden="true">';
    if (o.defs) s += '<defs>' + o.defs + '</defs>';
    s += (o.behind || "");
    s += '<ellipse cx="22" cy="58" rx="7" ry="4" fill="' + o.shade + '"/><ellipse cx="42" cy="58" rx="7" ry="4" fill="' + o.shade + '"/>';
    s += (o.ears || "");
    s += '<ellipse cx="32" cy="39" rx="25" ry="20" fill="' + o.body + '"/>';
    s += (o.front || "");
    if (!o.ownFace) {   // Figuren mit eigenem Gesicht (z. B. Clombo) zeichnen Augen, Wangen und Mund selbst
      s += '<circle cx="23" cy="37" r="3.6" fill="' + eye + '"/><circle cx="41" cy="37" r="3.6" fill="' + eye + '"/>';
      s += '<circle cx="24.2" cy="35.8" r="1.2" fill="' + pupil + '"/><circle cx="42.2" cy="35.8" r="1.2" fill="' + pupil + '"/>';
      s += '<ellipse cx="15" cy="44" rx="4.5" ry="3" fill="#FF8FB8" opacity=".8"/><ellipse cx="49" cy="44" rx="4.5" ry="3" fill="#FF8FB8" opacity=".8"/>';
      s += (o.face || '<path d="M27 46q5 5 10 0" fill="none" stroke="#3B2A4A" stroke-width="2" stroke-linecap="round"/>');
    }
    return s + '</svg>';
  }
  function star(x, y, r, c) {
    return '<path d="M' + x + ' ' + (y - r) + 'l' + (r * .3) + ' ' + (r * .7) + 'l' + (r * .7) + ' ' + (r * .3) + 'l-' + (r * .7) + ' ' + (r * .3) +
      'l-' + (r * .3) + ' ' + (r * .7) + 'l-' + (r * .3) + '-' + (r * .7) + 'l-' + (r * .7) + '-' + (r * .3) + 'l' + (r * .7) + '-' + (r * .3) + 'z" fill="' + c + '"/>';
  }
  var HORN = '<path d="M32 2l-6 19h12z" fill="#FFD34D" stroke="#E0A800" stroke-width="1.5" stroke-linejoin="round"/>';
  var MOUTH_CAT = '<path d="M28 45q2 3 4 0q2 3 4 0" fill="none" stroke="#3B2A4A" stroke-width="1.8" stroke-linecap="round"/>';

  var ART = {
    pummel: pummel({
      body: "#FFC9E3", shade: "#F7A8CF",
      ears: '<circle cx="16" cy="21" r="7" fill="#FFC9E3"/><circle cx="48" cy="21" r="7" fill="#FFC9E3"/><circle cx="16" cy="22" r="3.5" fill="#FF9CC6"/><circle cx="48" cy="22" r="3.5" fill="#FF9CC6"/>',
      front: HORN + '<circle cx="22" cy="23" r="5" fill="#8ED8F8"/><circle cx="32" cy="21" r="5" fill="#B9F0B4"/><circle cx="42" cy="23" r="5" fill="#C9A7F5"/>'
    }),
    pbaer: pummel({
      body: "#D9A877", shade: "#B98557",
      ears: '<circle cx="14" cy="19" r="8" fill="#D9A877"/><circle cx="50" cy="19" r="8" fill="#D9A877"/><circle cx="14" cy="20" r="4" fill="#F1C9A0"/><circle cx="50" cy="20" r="4" fill="#F1C9A0"/>',
      front: '<ellipse cx="32" cy="46" rx="10" ry="7" fill="#F6DDBF"/><ellipse cx="32" cy="43" rx="3.4" ry="2.4" fill="#3B2A4A"/>',
      face: '<path d="M28 48q4 3.5 8 0" fill="none" stroke="#3B2A4A" stroke-width="1.8" stroke-linecap="round"/>'
    }),
    phase: pummel({
      body: "#F4F2FA", shade: "#DAD6EA",
      ears: '<ellipse cx="22" cy="12" rx="6" ry="15" fill="#F4F2FA"/><ellipse cx="42" cy="12" rx="6" ry="15" fill="#F4F2FA"/><ellipse cx="22" cy="13" rx="3" ry="10" fill="#FFB8D4"/><ellipse cx="42" cy="13" rx="3" ry="10" fill="#FFB8D4"/>',
      front: '<ellipse cx="32" cy="43" rx="3" ry="2.2" fill="#FF8FB8"/>',
      face: '<path d="M27 46q5 4.5 10 0" fill="none" stroke="#3B2A4A" stroke-width="1.8" stroke-linecap="round"/><rect x="29.6" y="47" width="2.4" height="4" rx="1" fill="#fff" stroke="#DAD6EA" stroke-width=".6"/><rect x="32" y="47" width="2.4" height="4" rx="1" fill="#fff" stroke="#DAD6EA" stroke-width=".6"/>'
    }),
    pkatze: pummel({
      body: "#FFD9A8", shade: "#F2B676",
      ears: '<path d="M9 28L13 6l17 12z" fill="#FFD9A8"/><path d="M55 28L51 6L34 18z" fill="#FFD9A8"/><path d="M14 22l1.5-10 8 6z" fill="#FF9CB8"/><path d="M50 22l-1.5-10-8 6z" fill="#FF9CB8"/>',
      front: '<path d="M27 22v6M32 21v7M37 22v6" stroke="#E59A4B" stroke-width="2.4" stroke-linecap="round"/><path d="M30 41h4l-2 2.6z" fill="#FF7FA6"/>' +
        '<path d="M8 43l9 1.5M8 48l9-1M56 43l-9 1.5M56 48l-9-1" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>',
      face: MOUTH_CAT
    }),
    pdrache: pummel({
      body: "#9EE6A8", shade: "#6FCB86",
      behind: '<ellipse cx="7" cy="38" rx="8" ry="11" fill="#7FD895" transform="rotate(-18 7 38)"/><ellipse cx="57" cy="38" rx="8" ry="11" fill="#7FD895" transform="rotate(18 57 38)"/>',
      ears: '<path d="M16 22L12 6l12 10z" fill="#FFB84D"/><path d="M48 22L52 6L40 16z" fill="#FFB84D"/>',
      front: '<ellipse cx="32" cy="48" rx="12" ry="8" fill="#C9F5CD"/><path d="M26 22l3-7 3 6 3-6 3 7" fill="#6FCB86"/><circle cx="29" cy="44" r="1" fill="#6FCB86"/><circle cx="35" cy="44" r="1" fill="#6FCB86"/>'
    }),
    /* Clombo-artiges Fantasiewesen: lila Körper, Rückenstacheln, große blaue Augen, riesiges Maul */
    clombo: pummel({
      defs: '<linearGradient id="pmCl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#FF8FD0"/><stop offset=".55" stop-color="#8F7DFF"/><stop offset="1" stop-color="#37C6E8"/></linearGradient>',
      body: "#B063CC", shade: "#8E48AE",
      behind: '<path d="M54 40q10-4 8-14q-8 2-12 10z" fill="#8E48AE"/><path d="M54 40q8-2 8-12" fill="none" stroke="#FF8FD0" stroke-width="1.5" stroke-linecap="round"/>' +
        '<path d="M13 22l3-15 7 11 4-14 6 13 5-13 4 14 7-11 3 15z" fill="url(#pmCl)" stroke="#6E3C97" stroke-width="1" stroke-linejoin="round"/>',
      ears: '<circle cx="21" cy="62" r="1.6" fill="#37C6E8"/><circle cx="43" cy="62" r="1.6" fill="#37C6E8"/>',
      front: '<circle cx="20" cy="27" r="7" fill="#8FE4F7" stroke="#37C6E8" stroke-width="1.5"/><circle cx="44" cy="27" r="7" fill="#8FE4F7" stroke="#37C6E8" stroke-width="1.5"/>' +
        '<circle cx="21" cy="28" r="3.6" fill="#1B1230"/><circle cx="45" cy="28" r="3.6" fill="#1B1230"/><circle cx="22.4" cy="26.4" r="1.3" fill="#fff"/><circle cx="46.4" cy="26.4" r="1.3" fill="#fff"/>' +
        '<path d="M12 40q20 6 40 0q-2 20-20 20q-18 0-20-20z" fill="#7A1630"/>' +
        '<path d="M12 40q20 6 40 0" fill="none" stroke="#FFF1D6" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M17 42l3 6 3-4 3 6 3-5 3 6 3-5 3 6 3-4 3 5 3-5" fill="none"/>' +
        '<path d="M17 41.5l2.6 6.5 2.6-5.6zM25 43l2.6 7 2.6-6zM33 43.5l2.6 7 2.6-6.4zM41 43l2.6 6.6 2.4-6zM46 41.5l2 5 2.4-5z" fill="#FFF1D6"/>' +
        '<ellipse cx="32" cy="55" rx="9.5" ry="4.8" fill="#FF6F8E"/><path d="M32 51v8" stroke="#D84A6C" stroke-width="1.2" stroke-linecap="round"/>',
      ownFace: true
    }),
    pphoenix: pummel({
      body: "#FFB36B", shade: "#F28A3D",
      behind: '<path d="M2 40q4-18 16-14l-3 14z" fill="#F2593D"/><path d="M62 40q-4-18-16-14l3 14z" fill="#F2593D"/>',
      ears: '',
      front: '<path d="M32 3q-5 8-1 12q-8-2-9 6q4-3 10-1q6-2 10 1q-1-8-9-6q4-4-1-12z" fill="#FFD34D"/><path d="M32 8q-2 5 0 9q2-4 0-9z" fill="#F2593D"/><path d="M29 41l3 5 3-5z" fill="#FFD34D" stroke="#E0A800" stroke-width="1" stroke-linejoin="round"/>',
      face: ''
    }),
    pgold: pummel({
      body: "#FFD65C", shade: "#E8B22B",
      ears: '<circle cx="16" cy="21" r="7" fill="#FFD65C"/><circle cx="48" cy="21" r="7" fill="#FFD65C"/><circle cx="16" cy="22" r="3.5" fill="#FFF1B0"/><circle cx="48" cy="22" r="3.5" fill="#FFF1B0"/>',
      front: '<path d="M32 2l-6 19h12z" fill="#FFF8D6" stroke="#E8B22B" stroke-width="1.5" stroke-linejoin="round"/><circle cx="22" cy="23" r="5" fill="#FFF8D6"/><circle cx="32" cy="21" r="5" fill="#FFFFFF"/><circle cx="42" cy="23" r="5" fill="#FFF8D6"/>' +
        star(10, 14, 4, "#FFF") + star(55, 12, 3, "#FFF") + star(56, 50, 3.5, "#FFF1B0")
    }),
    pregen: pummel({
      defs: '<linearGradient id="pmRb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF8FA3"/><stop offset=".25" stop-color="#FFD27A"/><stop offset=".5" stop-color="#9BE8A8"/><stop offset=".75" stop-color="#8ED0F8"/><stop offset="1" stop-color="#C6A4F5"/></linearGradient>',
      body: "url(#pmRb)", shade: "#B9A3E8",
      ears: '<circle cx="16" cy="21" r="7" fill="#FF8FA3"/><circle cx="48" cy="21" r="7" fill="#C6A4F5"/><circle cx="16" cy="22" r="3.5" fill="#FFD6DE"/><circle cx="48" cy="22" r="3.5" fill="#E7DAFB"/>',
      front: HORN + star(10, 16, 4, "#FFD34D") + star(55, 14, 3.5, "#8ED0F8") + star(55, 52, 3, "#FF8FA3")
    }),
    pgalaxie: pummel({
      body: "#4B3B8F", shade: "#3A2D73", eye: "#fff", pupil: "#4B3B8F",
      ears: '<circle cx="16" cy="21" r="7" fill="#4B3B8F"/><circle cx="48" cy="21" r="7" fill="#4B3B8F"/><circle cx="16" cy="22" r="3.5" fill="#7A63D1"/><circle cx="48" cy="22" r="3.5" fill="#7A63D1"/>',
      front: '<path d="M32 2l-6 19h12z" fill="#FFE27A" stroke="#E8B22B" stroke-width="1.5" stroke-linejoin="round"/><circle cx="22" cy="23" r="5" fill="#59D6F0"/><circle cx="32" cy="21" r="5" fill="#FF7FD0"/><circle cx="42" cy="23" r="5" fill="#59D6F0"/>' +
        star(14, 40, 2.2, "#fff") + star(50, 34, 2.6, "#FFE27A") + star(44, 52, 2, "#fff") + star(20, 50, 1.8, "#59D6F0") + star(54, 8, 3, "#fff") + star(9, 12, 2.4, "#FFE27A"),
      face: '<path d="M27 46q5 5 10 0" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>'
    })
  };
  function avatarHtml(v, esc) {
    if (/^svg:/.test(v)) return ART[v.slice(4)] || ART.pummel;
    return esc ? esc(v) : String(v);
  }

  /* ---------- Rahmen und Hintergründe: Aussehen steht als CSS in index.html, hier nur die Auswahl ---------- */
  function frameClass(p) { var f = (p && p.frame) || "none"; return f === "none" ? "" : "fr-" + f; }
  /* mode: "auto" (folgt dem Gerät), "light" oder "dark" */
  function applyLook(p, mode) {
    var root = document.documentElement;
    if (mode === "light" || mode === "dark") root.setAttribute("data-theme", mode); else root.removeAttribute("data-theme");
    root.setAttribute("data-accent", (p && p.theme) || "paper");
    root.setAttribute("data-bg", (p && p.bg) || "none");
  }

  /* ---------- Effekte ---------- */
  var reduce = false;
  try { reduce = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var layer = null;
  function getLayer() {
    if (layer && layer.parentNode) return layer;
    layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:200;overflow:hidden";
    document.body.appendChild(layer);
    return layer;
  }
  var COLORS = ["#FF6B8B", "#FFC94D", "#6BD99B", "#5BB8FF", "#B58CFF", "#FF9A5C"];
  function particle(kind, x, y, power) {
    var el = document.createElement("span"), a = Math.random() * Math.PI * 2, d = (30 + Math.random() * 70) * power;
    var dx = Math.cos(a) * d, dy = Math.sin(a) * d - 20 * power, c = COLORS[Math.floor(Math.random() * COLORS.length)];
    var size = 6 + Math.random() * 6, life = 650 + Math.random() * 500;
    var css = "position:absolute;left:" + x + "px;top:" + y + "px;display:block;";
    if (kind === "stars") { el.textContent = "★"; css += "color:#FFC94D;font-size:" + (size + 8) + "px;line-height:1;"; }
    else if (kind === "sparks") { css += "width:3px;height:" + (size + 6) + "px;border-radius:2px;background:" + c + ";transform:rotate(" + (a * 57.3 + 90) + "deg);"; }
    else { css += "width:" + size + "px;height:" + (size * .6) + "px;background:" + c + ";border-radius:1px;"; }
    el.style.cssText = css;
    getLayer().appendChild(el);
    var rot = (Math.random() - .5) * 720;
    var fall = kind === "confetti" || kind === "stars" ? 60 * power : 0;
    var an = el.animate([
      { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
      { transform: "translate(" + dx + "px," + (dy + fall) + "px) rotate(" + rot + "deg)", opacity: 0 }
    ], { duration: life, easing: "cubic-bezier(.2,.7,.3,1)" });
    an.onfinish = function () { el.remove(); };
  }
  /* kleiner Effekt bei einer richtigen Antwort; x/y in Bildschirmpixeln */
  function burst(kind, x, y, n, power) {
    if (reduce || !kind || kind === "none") return;
    var k = kind === "firework" ? "sparks" : kind;
    for (var i = 0; i < (n || 14); i++) particle(k, x, y, power || 1);
  }
  /* großer Effekt am Rundenende */
  function finale(kind) {
    if (reduce || !kind || kind === "none") return;
    var w = global.innerWidth, h = global.innerHeight;
    if (kind === "firework") {
      [0, 350, 700, 1100].forEach(function (t, i) {
        setTimeout(function () { burst("firework", w * (.2 + .6 * Math.random()), h * (.2 + .3 * Math.random()), 40, 2.2); }, t);
      });
      return;
    }
    for (var i = 0; i < 6; i++) {
      (function (i) { setTimeout(function () { burst(kind, w * (.1 + .8 * Math.random()), h * .25, 22, 2); }, i * 160); })(i);
    }
  }

  /* ---------- Töne (Web Audio, ohne Dateien) ---------- */
  var ac = null;
  function ctx() {
    if (ac) return ac;
    try { var C = global.AudioContext || global.webkitAudioContext; if (C) ac = new C(); } catch (e) {}
    return ac;
  }
  function tone(freq, t0, dur, type, vol) {
    var a = ctx(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
    o.type = type || "sine"; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  var SOUNDS = {
    bell:   { ok: [[1319, 0, .35, "sine"], [1760, .09, .5, "sine"]], no: [[330, 0, .3, "sine"], [262, .12, .4, "sine"]] },
    arcade: { ok: [[523, 0, .08, "square"], [784, .08, .08, "square"], [1047, .16, .16, "square"]], no: [[196, 0, .12, "square"], [147, .12, .24, "square"]] },
    harp:   { ok: [[523, 0, .5, "triangle"], [659, .07, .5, "triangle"], [784, .14, .6, "triangle"]], no: [[392, 0, .4, "triangle"], [330, .12, .5, "triangle"]] }
  };
  function sound(kind, ok) {
    var set = SOUNDS[kind]; if (!set) return;
    var a = ctx(); if (!a) return;
    if (a.state === "suspended") { try { a.resume(); } catch (e) {} }
    (ok ? set.ok : set.no).forEach(function (n) { tone(n[0], n[1], n[2], n[3], ok ? .13 : .1); });
  }

  /* ---------- Lektionsfinale: Zahlen, Balken, Münzen, Effekte nacheinander ---------- */
  function countUp(el, to, ms, suffix) {
    suffix = suffix || "";
    if (reduce || !global.requestAnimationFrame) { el.textContent = to + suffix; return; }
    var t0 = global.performance.now();
    (function f(t) {
      var k = Math.min(1, (t - t0) / ms); k = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * k) + suffix;
      if (k < 1) global.requestAnimationFrame(f);
    })(t0);
  }
  function flyCoins(from, to, n) {
    if (reduce || !from || !to) return;
    var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    for (var i = 0; i < n; i++) {
      (function (i) {
        var c = document.createElement("span"); c.textContent = "🪙";
        c.style.cssText = "position:fixed;left:" + (a.left + a.width / 2) + "px;top:" + (a.top + a.height / 2) + "px;font-size:22px;z-index:210;pointer-events:none;opacity:0";
        document.body.appendChild(c);
        var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
        var an = c.animate([
          { transform: "translate(0,0) scale(.6)", opacity: 0 },
          { transform: "translate(" + dx * .15 + "px," + (dy * .15 - 50) + "px) scale(1.2)", opacity: 1, offset: .25 },
          { transform: "translate(" + dx + "px," + dy + "px) scale(.8)", opacity: 1 }
        ], { duration: 800, delay: i * 90, easing: "cubic-bezier(.4,0,.2,1)", fill: "both" });
        an.onfinish = function () { c.remove(); };
      })(i);
    }
  }
  /* root = Abschlussbildschirm; o = {pct0, pct1, rankUp, coins, perfect, ok, fx, snd, audio} */
  function runFinale(root, o) {
    var secs = root.querySelectorAll(".sbody .stack > section");
    for (var i = 0; i < secs.length; i++) { secs[i].classList.add("fin-in"); secs[i].style.setProperty("--d", (i * 0.2) + "s"); }
    root.querySelectorAll("[data-count]").forEach(function (el) { countUp(el, +el.getAttribute("data-count"), 1000, el.getAttribute("data-suffix") || ""); });
    var bar = root.querySelector(".fin-bar i"), banner = root.querySelector(".fin-rankup");
    if (bar) {
      var set = function (w, anim) { bar.style.transition = anim ? "width 1s cubic-bezier(.2,.8,.2,1)" : "none"; bar.style.width = w + "%"; };
      set(o.pct0, false); void bar.offsetWidth;
      global.setTimeout(function () { set(o.rankUp ? 100 : o.pct1, !reduce); }, 700);
      if (o.rankUp) global.setTimeout(function () {
        set(0, false); void bar.offsetWidth; set(o.pct1, !reduce);
        if (banner) banner.classList.add("show");
        burst("stars", global.innerWidth / 2, global.innerHeight * .3, 24, 1.8);
        if (global.navigator.vibrate) { try { global.navigator.vibrate([30, 50, 30]); } catch (e) {} }
      }, 1900);
    }
    if (o.coins > 0) {
      var chip = root.querySelector(".fin-coin b");
      if (chip) countUp(chip, o.coins, 900, "");
      global.setTimeout(function () { flyCoins(root.querySelector(".fin-xp"), root.querySelector(".fin-coin"), Math.min(9, o.coins)); }, 900);
    }
    if (o.ok) {
      global.setTimeout(function () { finale(o.fx && o.fx !== "none" ? o.fx : "confetti"); }, 500);
      if (o.perfect) global.setTimeout(function () { finale("firework"); }, 1500);
      if (o.snd && o.audio) global.setTimeout(function () { sound(o.snd, true); }, 450);
    }
  }

  /* ---------- Sticker: Stanzrand, Schatten, Glanz ---------- */
  var cutDone = false, maskCache = {};
  function ensureCutFilters() {
    if (cutDone || !document.body) return; cutDone = true;
    var d = document.createElement("div");
    d.setAttribute("aria-hidden", "true"); d.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
    var f = function (id, r) {
      return '<filter id="' + id + '" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="' + r + '" result="d"/>' +
        '<feGaussianBlur in="d" stdDeviation="' + (r / 6).toFixed(2) + '" result="db"/><feFlood flood-color="#fff"/><feComposite in2="db" operator="in" result="w"/>' +
        '<feMerge><feMergeNode in="w"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';
    };
    d.innerHTML = '<svg width="0" height="0">' + f("cutS", 2.2) + f("cutL", 5) + '</svg>';
    document.body.appendChild(d);
  }
  function maskUrl(val) {   // Umriss der Figur als Maske, damit der Glanz nur auf der Figur läuft
    if (maskCache[val]) return maskCache[val];
    var svg = ART[val.slice(4)]; if (!svg) return "";
    svg = svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace('width="1.25em" height="1.25em"', 'width="200" height="200"');
    return (maskCache[val] = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")');
  }
  /* size in px; shine = Glanz (nur für gezeichnete Figuren); tilt = Neigung in Grad */
  function stickerHtml(val, size, tilt, shine, esc) {
    ensureCutFilters();
    var drawn = /^svg:/.test(val), big = size >= 90;
    var inner = drawn ? (ART[val.slice(4)] || ART.pummel) : (esc ? esc(val) : String(val));
    var holo = drawn && shine && size >= 44 ? '<span class="stk-holo" style="-webkit-mask-image:' + maskUrl(val) + ';mask-image:' + maskUrl(val) + '"></span>' : "";
    return '<span class="stk" style="--s:' + size + 'px;--r:' + (tilt || 0) + 'deg;--f:' + (drawn ? 1 : 0.62) + '">' +
      '<span class="stk-cut" style="filter:url(#' + (big ? "cutL" : "cutS") + ')">' + inner + '</span>' + holo + '</span>';
  }

  /* Siegertanz: Figur tanzt kurz auf einer Bühne; Tippen beendet ihn. Bei „Bewegung reduzieren“ nur ein kleiner Hüpfer. */
  function dance(o) {
    var old = document.getElementById("dnOv"); if (old) old.remove();
    var ov = document.createElement("div"); ov.id = "dnOv"; ov.className = "dn-ov" + (reduce ? " dn-reduce" : "");
    var conf = "", cols = ["#ff3d9a", "#35e0ff", "#ffd23d", "#7cff6b", "#fff"], D = { wackler: 1, huepfer: 2, drehung: 3, roboter: 4, moonwalk: 5, sieg: 6 };
    if (!reduce && (o.big || o.dance === "sieg")) for (var i = 0; i < 18; i++) conf += '<i style="left:' + (i * 5.5 + Math.random() * 3).toFixed(1) + '%;background:' + cols[i % 5] + ';animation-delay:' + (Math.random() * 1.6).toFixed(2) + 's"></i>';
    var fig = global.VTFIG.figure(o.av, o.outfit, o.avatar).replace('class="fig ', 'class="fig d' + (D[o.dance] || 1) + ' ');
    ov.innerHTML = '<div class="dn-stage"><div class="dn-beam dn-b1"></div><div class="dn-beam dn-b2"></div><div class="dn-floor"></div><div class="dn-conf">' + conf + '</div>' +
      '<div class="dn-sh"></div><div class="dn-fw">' + fig + '</div>' + (o.title ? '<div class="dn-title">' + o.title + '</div>' : "") + '</div>';
    document.body.appendChild(ov);
    var done = function () { if (!ov.parentNode) return; ov.classList.add("out"); global.setTimeout(function () { if (ov.parentNode) ov.remove(); }, 300); };
    ov.addEventListener("click", done);
    global.setTimeout(done, reduce ? 1800 : 4200);
  }
  global.VTC = { dance: dance, stickerHtml: stickerHtml, runFinale: runFinale, avatarHtml: avatarHtml, frameClass: frameClass, applyLook: applyLook, burst: burst, finale: finale, sound: sound, ART: ART };
})(window);
