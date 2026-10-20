/* Saison-Effekte: Halloween-Spinne zum Antippen (3D-Pendel auf Canvas, Perspektivprojektion).
   Ablauf: Spinne seilt sich ab, schwingt als Kegelpendel durch den Raum (kommt dem Betrachter riesig entgegen), springt auf den Bildschirm und platzt in einen Schwarm kleiner Spinnen, Fledermäuse und Funken; Spinnennetze wachsen in die Ecken. */
(function (global) {
  "use strict";
  var running = false;
  function spiderSvg(f) {
    var j = f ? 6 : -6, legs = "";
    for (var side = -1; side <= 1; side += 2) for (var i = 0; i < 4; i++) {
      var jig = (i % 2 ? -j : j), kx = 60 + side * (30 + (i % 2) * 6), ky = 46 + i * 11 + jig * 0.5, fx = 60 + side * (52 + (i % 2) * 2), fy = 34 + i * 20 + jig * 1.6;
      legs += "M" + (60 + side * 10) + " " + (50 + i * 5) + "L" + kx + " " + ky + "L" + fx + " " + fy;
    }
    var s = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><defs><radialGradient id='b' cx='.35' cy='.3'><stop offset='0' stop-color='#4A3A66'/><stop offset='.5' stop-color='#1A1026'/><stop offset='1' stop-color='#07030C'/></radialGradient></defs>" +
      "<path d='" + legs + "' fill='none' stroke='#0A0510' stroke-width='4.2' stroke-linecap='round' stroke-linejoin='round'/><path d='" + legs + "' fill='none' stroke='#5B4580' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' opacity='.55'/>" +
      "<ellipse cx='60' cy='76' rx='25' ry='29' fill='url(#b)'/><path d='M60 58l8 14-8 8-8-8z M60 80l6 8-6 8-6-8z' fill='#FF8A1F' opacity='.9'/><ellipse cx='50' cy='64' rx='6' ry='10' fill='#fff' opacity='.12' transform='rotate(-20 50 64)'/>" +
      "<circle cx='60' cy='40' r='17' fill='url(#b)'/><circle cx='52' cy='37' r='5.2' fill='#FFB347'/><circle cx='68' cy='37' r='5.2' fill='#FFB347'/><circle cx='52' cy='37' r='2.4' fill='#2A0F00'/><circle cx='68' cy='37' r='2.4' fill='#2A0F00'/><circle cx='50.5' cy='35.5' r='1.3' fill='#fff'/><circle cx='66.5' cy='35.5' r='1.3' fill='#fff'/>" +
      "<circle cx='57' cy='31' r='1.6' fill='#FF8A1F'/><circle cx='63' cy='31' r='1.6' fill='#FF8A1F'/><path d='M55 47q-2 6 1 8M65 47q2 6-1 8' stroke='#FFE2BC' stroke-width='2' fill='none' stroke-linecap='round'/></svg>";
    var im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s); return im;
  }
  function batSvg() {
    var im = new Image(); im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 20'><path fill='#FFB066' d='M20 6c-2-3-5-4-8-2C9 2 5 3 0 8c4-1 6 0 8 3 1-2 3-3 5-1 1-3 4-3 5-1l2 3 2-3c1-2 4-2 5 1 2-2 4-1 5 1 2-3 4-4 8-3-5-5-9-6-12-4-3-2-6-1-8 2z'/></svg>"); return im;
  }
  function webSvg() {
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none' stroke='#FFE2BC' stroke-width='1.6' stroke-linecap='round'><path pathLength='1' d='M0 0L100 0M0 0L40 92M0 0L92 40M0 0L70 70'/><path pathLength='1' d='M24 0Q24 24 0 24M50 0Q48 48 0 50M76 0Q72 72 0 76M98 0Q94 94 0 98'/></svg>";
  }
  var IMG = null;
  function imgs() { return IMG || (IMG = { s: [spiderSvg(0), spiderSvg(1)], bat: batSvg() }); }
  function ease(x) { return x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x); }

  /* rect: Rechteck der Header-Spinne (Position und Fadenlänge). onEnd: wird nach dem Effekt aufgerufen. */
  function spider(rect, onEnd, silent) {
    if (running) return false; running = true;
    var reduce = global.matchMedia && global.matchMedia("(prefers-reduced-motion:reduce)").matches;
    var I = imgs(), W = global.innerWidth, H = global.innerHeight, dpr = Math.min(2, global.devicePixelRatio || 1);
    var cv = document.createElement("canvas"); cv.id = "hwCv"; cv.width = W * dpr; cv.height = H * dpr;
    cv.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;z-index:9998;touch-action:none;background:rgba(10,3,18,0)";
    document.body.appendChild(cv);
    var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var px = rect.left + rect.width / 2, L0 = Math.max(60, rect.bottom), D = 620, cx = W / 2, cy = H * 0.36, L = Math.min(H * 0.55, 380);
    var T1 = reduce ? 0 : 4.5, T2 = reduce ? 0 : 5.05, END = T2 + 2.6, t0 = 0, done = false, skip = false, parts = [], fired = false, trail = [], prev = 0;
    function proj(X, Y, Z) { var s = D / (D - Z); return { x: cx + (X - cx) * s, y: cy + (Y - cy) * s, s: s }; }
    function pos(t) {   // Kegelpendel: Länge wächst, Auslenkung steigt, Umlauf durch den Raum
      var len = L0 + (L - L0) * ease(t / 0.8), amp = (0.2 + 0.9 * ease((t - 0.4) / 3.4)) * (1 - 0.06 * Math.max(0, t - 3.6)), ph = Math.max(0, t - 0.5) * (2.2 + 0.25 * t);
      var th = Math.min(1.05, amp) * (t < 0.5 ? t / 0.5 : 1) * 0.75;
      var pc = px + (cx - px) * ease(t / 1.6);   // Pendelmitte wandert in die Bildmitte, damit die Spinne im Bild bleibt
      return { X: pc + len * Math.sin(th) * Math.cos(ph) * 0.6, Y: len * Math.cos(th) * 0.9, Z: len * Math.sin(th) * Math.sin(ph) * 1.05, len: len, pc: pc };
    }
    try { if (!silent && global.VTC && global.VTC.spiderSound) global.VTC.spiderSound(reduce); } catch (e) {}
    var boo = null, webs = null;
    function burst(x, y) {
      var n = reduce ? 18 : 64;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * 6.283, v = 220 + Math.random() * 620, kind = i % 5 === 0 ? "bat" : i % 7 === 0 ? "pump" : i % 3 === 0 ? "spark" : "spi";
        parts.push({ k: kind, x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 260, r: Math.random() * 6.283, vr: (Math.random() - .5) * 12, sz: kind === "bat" ? 26 + Math.random() * 18 : kind === "pump" ? 22 + Math.random() * 12 : kind === "spark" ? 2 + Math.random() * 3.5 : 16 + Math.random() * 20, f: Math.random() * 2 | 0, life: 1.6 + Math.random() * 1.2, age: 0 });
      }
      boo = document.createElement("div"); boo.className = "hwBoo"; boo.textContent = "BUH!"; document.body.appendChild(boo);
      webs = document.createElement("div"); webs.className = "hwWebs";
      [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (q) { webs.innerHTML += "<i style='" + (q[0] ? "right:0" : "left:0") + ";" + (q[1] ? "bottom:0" : "top:0") + ";transform:scale(" + (q[0] ? -1 : 1) + "," + (q[1] ? -1 : 1) + ")'>" + webSvg() + "</i>"; });
      document.body.appendChild(webs);
      document.body.classList.add("hwShake"); setTimeout(function () { document.body.classList.remove("hwShake"); }, 650);
      try { if (global.navigator && navigator.vibrate) navigator.vibrate([60, 40, 140]); } catch (e) {}
    }
    function finish() {
      if (done) return; done = true;
      cv.style.transition = "opacity .25s"; cv.style.opacity = "0";
      setTimeout(function () { cv.remove(); if (boo) boo.remove(); if (webs) webs.remove(); running = false; if (onEnd) onEnd(); }, 300);
    }
    cv.addEventListener("pointerdown", function () { skip = true; });
    function drawSpider(x, y, size, rot, f, glow) {
      var im = I.s[f]; if (!im.complete) return;
      c.save(); c.translate(x, y); c.rotate(rot); if (glow) { c.shadowColor = "rgba(255,138,31," + glow + ")"; c.shadowBlur = 24; }
      c.drawImage(im, -size / 2, -size / 2, size, size); c.restore();
    }
    function frame(now) {
      if (done) return; if (!t0) { t0 = now; prev = now; }
      var t = (now - t0) / 1000, dt = Math.min(0.05, (now - prev) / 1000); prev = now; if (skip && t < T2) { t = T2; t0 = now - T2 * 1000; skip = false; }
      c.clearRect(0, 0, W, H);
      var dark = t < T2 ? Math.min(0.62, t * 0.9) : Math.max(0, 0.62 - (t - T2) * 0.5); c.fillStyle = "rgba(10,3,18," + dark + ")"; c.fillRect(0, 0, W, H);
      if (t < T2) {
        var p, q, sz, rot, fl = (t * (t > T1 ? 16 : 8) | 0) % 2;
        if (t < T1) { var w = pos(t); p = proj(w.X, w.Y, w.Z); }
        else {   // Sprung auf den Bildschirm
          var k = ease((t - T1) / (T2 - T1)), w0 = pos(T1), a = proj(w0.X, w0.Y, w0.Z), z = w0.Z + (D * 0.9 - w0.Z) * k * k;
          p = { x: a.x + (cx - a.x) * k, y: a.y + (H * 0.5 - a.y) * k, s: D / (D - z) };
        }
        sz = 96 * p.s; var pv = proj(t < T1 ? pos(t).pc : cx, 0, 0); rot = t < T1 ? Math.atan2(pv.x - p.x, -(pv.y - p.y)) : 0;
        trail.push({ x: p.x, y: p.y, s: sz, r: rot }); if (trail.length > 7) trail.shift();
        var tx = p.x + Math.sin(rot) * sz * 0.2, ty = p.y - Math.cos(rot) * sz * 0.2;   // Fadenansatz oben an der Spinne
        if (t < T1 + 0.08) { c.strokeStyle = "rgba(225,210,195," + (t > T1 ? 0.5 : 0.9) + ")"; c.lineWidth = Math.max(1, 1.6 * Math.min(2.2, p.s)); c.beginPath(); c.moveTo(pv.x, pv.y - 4); c.lineTo(tx, ty); c.stroke(); }
        trail.forEach(function (g, i) { if (i < trail.length - 1 && t > 0.8) { c.globalAlpha = 0.05 + 0.03 * i; drawSpider(g.x, g.y, g.s, g.r, 0, 0); } });
        c.globalAlpha = 1;
        // Schatten-Ellipse am Boden verstärkt den Raumeindruck
        c.fillStyle = "rgba(0,0,0,.28)"; c.beginPath(); c.ellipse(p.x, H * 0.9, sz * 0.5, sz * 0.12, 0, 0, 6.283); c.fill();
        drawSpider(p.x, p.y, sz, rot, fl, Math.min(0.9, 0.25 + p.s * 0.2));
      } else {
        if (!fired) { fired = true; burst(cx, H * 0.5); }
        var f0 = Math.max(0, 1 - (t - T2) * 2.4); if (f0 > 0) { var g = c.createRadialGradient(cx, H * 0.5, 0, cx, H * 0.5, Math.max(W, H) * 0.8); g.addColorStop(0, "rgba(255,240,200," + f0 + ")"); g.addColorStop(0.4, "rgba(255,138,31," + f0 * 0.7 + ")"); g.addColorStop(1, "rgba(255,138,31,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); }
        parts.forEach(function (o) {
          o.age += dt; if (o.age > o.life) return;
          o.vy += 900 * dt; o.vx *= (1 - 0.9 * dt); o.x += o.vx * dt; o.y += o.vy * dt; o.r += o.vr * dt;
          if (o.y > H - 20 && o.vy > 0) { o.y = H - 20; o.vy *= -0.38; }
          var al = Math.min(1, (o.life - o.age) * 2.2); c.globalAlpha = al;
          if (o.k === "spark") { c.fillStyle = o.f ? "#FFD166" : "#FF8A1F"; c.beginPath(); c.arc(o.x, o.y, o.sz, 0, 6.283); c.fill(); }
          else if (o.k === "pump") { c.font = o.sz + "px serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.save(); c.translate(o.x, o.y); c.rotate(o.r); c.fillText("🎃", 0, 0); c.restore(); }
          else if (o.k === "bat") { var fw = Math.sin(o.age * 22) * .35 + .65; if (I.bat.complete) { c.save(); c.translate(o.x, o.y); c.rotate(Math.atan2(o.vy, o.vx) * 0.25); c.scale(1, fw); c.drawImage(I.bat, -o.sz / 2, -o.sz / 4, o.sz, o.sz / 2); c.restore(); } }
          else { var fr = (o.age * 14 + o.f | 0) % 2; drawSpider(o.x, o.y, o.sz, o.r, fr, 0); }
        });
        c.globalAlpha = 1;
        if (t > END - 0.4) c.globalAlpha = Math.max(0, (END - t) / 0.4);
        if (t >= END || skip) { finish(); return; }
      }
      global.requestAnimationFrame(frame);
    }
    global.requestAnimationFrame(frame);
    return true;
  }

  /* ---------- Startseite: 3D-Friedhofsszene (Grabsteine, Kürbisse, Fledermäuse), alles antippbar ---------- */
  var SC = null;
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function spark(x, y, n, colors) {
    for (var i = 0; i < n; i++) {
      var d = el("i", "hwsp3"); d.style.cssText = "position:fixed;left:" + x + "px;top:" + y + "px;width:6px;height:6px;border-radius:50%;pointer-events:none;z-index:9990;background:" + colors[i % colors.length] + ";box-shadow:0 0 8px " + colors[i % colors.length];
      document.body.appendChild(d); var a = Math.random() * 6.283, v = 40 + Math.random() * 90;
      d.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: "translate(" + Math.cos(a) * v + "px," + (Math.sin(a) * v - 40) + "px) scale(.2)", opacity: 0 }], { duration: 650 + Math.random() * 350, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = (function (n2) { return function () { n2.remove(); }; })(d);
    }
  }
  function tone(kind) { try { global.VTC && global.VTC.homeSound && global.VTC.homeSound(kind); } catch (e) {} }
  function ghostUp(x, y) {
    var g = el("div", "hwGhost", "<svg viewBox='0 0 40 48'><path fill='#fff' d='M4 44V20C4 7 12 2 20 2s16 5 16 18v24l-5-5-5 5-6-5-6 5-5-5z'/><circle cx='14' cy='20' r='3.4' fill='#2B1763'/><circle cx='26' cy='20' r='3.4' fill='#2B1763'/><ellipse cx='20' cy='30' rx='4' ry='5' fill='#2B1763'/></svg>");
    g.style.left = (x - 18) + "px"; g.style.top = (y - 40) + "px"; document.body.appendChild(g); setTimeout(function () { g.remove(); }, 2300);
  }
  function buildScene(navH) {
    var W = global.innerWidth, root = el("div", "hs3"); root.id = "hwScene"; root.style.bottom = navH + "px";
    root.appendChild(el("div", "hs3g"));
    root.appendChild(el("div", "hs3tree", "<svg viewBox='0 0 60 70'><g stroke='#0A0510' stroke-linecap='round' fill='none'><path d='M30 70V34M30 46L14 30M30 40L46 24M14 30L8 18M14 30L22 20M46 24L54 12M46 24L38 14M30 34L30 14' stroke-width='5'/><path d='M8 18L3 10M22 20L24 8M54 12L58 6M38 14L36 4M30 14L26 5' stroke-width='2.5'/></g></svg>"));
    var shapes = ["gs-r", "gs-c", "gs-o", "gs-r", "gs-c", "gs-o", "gs-r"], xs = [0.1, 0.26, 0.42, 0.55, 0.7, 0.84, 0.95], zs = [-90, -30, -110, -40, -100, -20, -70], sizes = [[34, 46], [38, 54], [30, 60], [36, 48], [40, 56], [32, 50], [34, 44]];
    for (var i = 0; i < 7; i++) {
      var g = el("div", "gs " + shapes[i]); g.style.cssText = "left:" + (xs[i] * W - sizes[i][0] / 2) + "px;--w:" + sizes[i][0] + "px;--h:" + sizes[i][1] + "px;--z:" + zs[i] + "px;--dl:" + (-i * 0.9) + "s;--dr:" + (5 + i % 3) + "s";
      var L = ""; for (var k = 1; k <= 7; k++) L += "<b style='transform:translateZ(" + (-k * 1.6) + "px)'></b>";
      g.innerHTML = L + "<i><u>R.I.P</u></i>"; g.setAttribute("data-k", "gs"); root.appendChild(g);
    }
    var ps = [[0.2, 34, 0], [0.62, 48, 1], [0.88, 40, 2]];
    ps.forEach(function (q, i) {
      var pk = el("div", "pk"); pk.style.cssText = "left:" + (q[0] * W - q[1] / 2) + "px;--s:" + q[1] + "px;--dl:" + (-i * 1.3) + "s"; pk.setAttribute("data-k", "pk");
      var r = ""; for (var k = 0; k < 5; k++) r += "<i class='rib' style='--i:" + k + "'></i>";
      pk.innerHTML = "<div class='pkb'>" + r + "<s class='st'></s><u class='fc'><em></em><em></em><b></b></u></div><span class='pks'></span>"; root.appendChild(pk);
    });
    document.body.appendChild(root);
    root.addEventListener("pointerdown", function (e) {
      var o = e.target.closest("[data-k]"); if (!o) return; var r = o.getBoundingClientRect(), k = o.getAttribute("data-k");
      if (k === "pk") { if (o.classList.contains("jump")) return; o.classList.add("jump"); spark(r.left + r.width / 2, r.top + r.height * 0.3, 14, ["#FFD166", "#FF8A1F", "#FFF3E3"]); tone("pk"); setTimeout(function () { o.classList.remove("jump"); }, 900); }
      else { if (o.classList.contains("wob")) return; o.classList.add("wob"); ghostUp(r.left + r.width / 2, r.top); tone("gs"); setTimeout(function () { o.classList.remove("wob"); }, 1100); }
    });
    return root;
  }
  function buildBats() {
    var lay = el("div", "hwBats"); lay.id = "hwBats"; document.body.appendChild(lay);
    var W = global.innerWidth, H = global.innerHeight, alive = true, timers = [];
    function batSvgC(c) { return "<svg viewBox='0 0 40 20'><path fill='" + c + "' d='M20 6c-2-3-5-4-8-2C9 2 5 3 0 8c4-1 6 0 8 3 1-2 3-3 5-1 1-3 4-3 5-1l2 3 2-3c1-2 4-2 5 1 2-2 4-1 5 1 2-3 4-4 8-3-5-5-9-6-12-4-3-2-6-1-8 2z'/></svg>"; }
    function mk(i) {
      var b = el("div", "hwb"), col = ["#FFB066", "#FFD9A8", "#FF8A1F", "#E6A8FF", "#FFC857"][i % 5];
      b.innerHTML = "<div class='bd'>" + batSvgC(col) + "</div>"; lay.appendChild(b);
      var anim = null;
      function fly() {
        if (!alive) return; var dir = Math.random() < 0.5 ? 1 : -1, y0 = 70 + Math.random() * H * 0.4, dur = 8000 + Math.random() * 6000, kf = [];
        for (var k = 0; k <= 8; k++) { var f = k / 8, x = dir > 0 ? -80 + (W + 160) * f : W + 80 - (W + 160) * f, z = 360 * Math.sin(f * 6.283 * 1.1 + i) - 40, y = y0 + 38 * Math.sin(f * 18 + i) + 60 * Math.sin(f * 4.2); kf.push({ transform: "translate3d(" + x + "px," + y + "px," + z + "px) rotateY(" + (dir > 0 ? 0 : 180) + "deg) rotateZ(" + 10 * Math.sin(f * 18) + "deg)", offset: f }); }
        anim = b.animate(kf, { duration: dur, easing: "linear" }); anim.onfinish = function () { if (alive) timers.push(setTimeout(fly, 600 + Math.random() * 2500)); };
      }
      b.addEventListener("pointerdown", function (e) {
        if (b.classList.contains("zap")) return; e.preventDefault(); var r = b.getBoundingClientRect(); b.classList.add("zap"); if (anim) anim.pause(); spark(r.left + r.width / 2, r.top + r.height / 2, 10, ["#FFD166", "#FF8A1F", "#fff"]); tone("bat");
        var cur = getComputedStyle(b).transform; b.animate([{ transform: cur, opacity: 1 }, { transform: cur + " rotateZ(720deg) scale(1.8)", opacity: 1, offset: .4 }, { transform: cur + " rotateZ(1440deg) scale(.1) translateY(260px)", opacity: 0 }], { duration: 900, easing: "ease-in" }).onfinish = function () { b.style.visibility = "hidden"; timers.push(setTimeout(function () { b.style.visibility = ""; b.classList.remove("zap"); fly(); }, 2500)); };
      });
      timers.push(setTimeout(fly, i * 1400));
    }
    for (var i = 0; i < 4; i++) mk(i);
    return { stop: function () { alive = false; timers.forEach(clearTimeout); lay.remove(); } };
  }
  function home(on) {
    if (on && !SC) { var nav = document.getElementById("tabs"); SC = { root: buildScene(nav ? nav.offsetHeight : 56), bats: buildBats() }; }
    else if (!on && SC) { SC.root.remove(); SC.bats.stop(); SC = null; }
  }


  /* ---------- Figur schlägt die Spinne mit dem Baseballschläger weg: 3D-Schwung von rechts nach links ---------- */
  var whacking = false;
  function bat(c, hand, th, L, ws) {   // Schläger zeichnen: Griff am Drehpunkt, Fass wird von der Perspektive (ws) dicker oder dünner
    c.save(); c.translate(hand.x, hand.y); c.rotate(th);
    var w = 13.5 * ws, g = c.createLinearGradient(-w, 0, w, 0); g.addColorStop(0, "#F3D49A"); g.addColorStop(0.45, "#D9A55B"); g.addColorStop(1, "#8F5A22");
    c.shadowColor = "rgba(0,0,0,.5)"; c.shadowBlur = 10;
    c.beginPath(); c.moveTo(-4.4, 8); c.lineTo(-4.4, -L * 0.3); c.quadraticCurveTo(-6.5 * Math.max(.8, ws * .8), -L * 0.6, -w, -L * 0.8); c.quadraticCurveTo(-w * 1.15, -L * 0.99, 0, -L); c.quadraticCurveTo(w * 1.15, -L * 0.99, w, -L * 0.8); c.quadraticCurveTo(6.5 * Math.max(.8, ws * .8), -L * 0.6, 4.4, -L * 0.3); c.lineTo(4.4, 8); c.closePath();
    c.fillStyle = g; c.fill(); c.shadowBlur = 0;
    c.fillStyle = "#2A1A12"; c.fillRect(-4.6, -L * 0.28, 9.2, L * 0.3 + 6);   // Griffband
    c.fillStyle = "#5C3A18"; c.beginPath(); c.arc(0, 9, 5.4, 0, 6.283); c.fill();   // Knauf
    c.strokeStyle = "rgba(255,255,255,.4)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-5, -L * 0.45); c.quadraticCurveTo(-w * .55, -L * 0.72, -w * .45, -L * 0.92); c.stroke();
    c.strokeStyle = "rgba(90,50,10,.5)"; c.lineWidth = 1; for (var k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-w * .6, -L * (0.55 + k * 0.1)); c.lineTo(w * .6, -L * (0.57 + k * 0.1)); c.stroke(); }
    c.restore();
  }
  function whack(figEl, spiderEl, onEnd, silent) {
    if (running || whacking || !figEl || !spiderEl) return false; whacking = true;
    var I = imgs(), W = global.innerWidth, H = global.innerHeight, dpr = Math.min(2, global.devicePixelRatio || 1), fr = figEl.getBoundingClientRect(), sr = spiderEl.getBoundingClientRect();
    var cv = document.createElement("canvas"); cv.width = W * dpr; cv.height = H * dpr; cv.style.cssText = "position:fixed;left:0;top:0;width:100%;height:100%;z-index:9996;pointer-events:none";
    document.body.appendChild(cv); var c = cv.getContext("2d"); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var D = 460, L = 138, DEG = Math.PI / 180, hand = { x: fr.left + fr.width * 0.88, y: fr.top + fr.height * 0.62 }, pivot = { x: sr.left + sr.width / 2, y: 0 };
    var T_WIND = 1.05, T_SW = 1.3, T_HIT = 1.56, PSI_W = -20, PSI_H = 148, PSI_END = 215;   // Winkel in der Waagerechten: 0° = nach rechts, 90° = zum Betrachter, 180° = nach links
    function tip(psi, yoff) { var r = psi * DEG, z = L * Math.sin(r), sc = D / (D - z); return { x: hand.x + L * Math.cos(r) * sc, y: hand.y + yoff * sc, s: sc, z: z }; }
    var HIT = tip(PSI_H, -L * 0.2), A = { x: HIT.x, y: HIT.y }, S0 = { x: pivot.x, y: Math.max(40, sr.bottom - 18) };
    var t0 = 0, last = 0, hit = false, fx = { x: A.x, y: A.y, vx: -430, vy: -520, z: 0, r: 0 }, ring = 0, endAt = 0, trail = [], size = 66;
    setTimeout(function () { figEl.classList.add("hwFigSwing"); setTimeout(function () { figEl.classList.remove("hwFigSwing"); }, 1000); }, T_WIND * 1000 - 60);
    try { if (!silent && global.VTC && global.VTC.batSound) global.VTC.batSound(); } catch (e) {}
    function done() { cv.remove(); whacking = false; if (onEnd) onEnd(); }
    function frame(now) {
      if (!t0) { t0 = now; last = now; } var t = (now - t0) / 1000, dt = Math.min(0.05, (now - last) / 1000); last = now; c.clearRect(0, 0, W, H);
      var psi = null, yoff = -L * 0.5;
      if (t >= T_WIND) {
        if (t < T_SW) { var kw = (t - T_WIND) / (T_SW - T_WIND); psi = 28 + (PSI_W - 28) * (kw * kw * (3 - 2 * kw)); yoff = -L * (0.62 - 0.08 * kw); }   // Ausholen nach hinten rechts, Schläger hoch
        else if (t < T_HIT) { var k = (t - T_SW) / (T_HIT - T_SW); psi = PSI_W + (PSI_H - PSI_W) * (k * k * (1.6 - 0.6 * k)); yoff = -L * (0.54 - 0.34 * k); }   // Schwung von rechts nach links, beschleunigt
        else { var kt = Math.min(1, (t - T_HIT) / 0.3); psi = PSI_H + (PSI_END - PSI_H) * (1 - Math.pow(1 - kt, 2)); yoff = -L * (0.2 + 0.1 * kt); }
      }
      // Spinne gleitet langsam an ihrem Faden herab und pendelt leicht
      if (t < T_HIT) {
        var ks = Math.min(1, t / T_HIT), es = ks * ks * (3 - 2 * ks), sx = S0.x + (A.x - S0.x) * es + Math.sin(t * 2.6) * 7 * (1 - es * 0.8), sy = S0.y + (A.y - S0.y) * es;
        c.strokeStyle = "rgba(225,210,195,.9)"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(pivot.x, pivot.y); c.lineTo(sx, sy - size * 0.3); c.stroke();
        if (I.s[0].complete) c.drawImage(I.s[(t * 5 | 0) % 2], sx - size / 2, sy - size / 2, size, size);
      } else {
        if (!hit) {
          hit = true; ring = t;
          var bx = document.createElement("div"); bx.className = "hwBoo hwKrack"; bx.textContent = "KRACK!"; bx.style.left = Math.max(80, A.x) + "px"; bx.style.top = Math.max(90, A.y - 10) + "px"; document.body.appendChild(bx); setTimeout(function () { bx.remove(); }, 1300);
          spark(A.x, A.y, 18, ["#FFD166", "#FF8A1F", "#fff", "#FFE2BC"]); document.body.classList.add("hwShake2"); setTimeout(function () { document.body.classList.remove("hwShake2"); }, 320);
          try { if (global.navigator && navigator.vibrate) navigator.vibrate([40, 30, 60]); } catch (e) {}
        }
        var rk = (t - ring) / 0.42; if (rk < 1) { c.strokeStyle = "rgba(255,230,160," + (1 - rk) + ")"; c.lineWidth = 6 * (1 - rk) + 1; c.beginPath(); c.arc(A.x, A.y, 8 + 120 * rk, 0, 6.283); c.stroke(); }
        var tt = t - T_HIT; fx.vy += 260 * dt; fx.x += fx.vx * dt; fx.y += fx.vy * dt; fx.z += 700 * dt; fx.r -= 14 * dt; var sc = 1 / (1 + fx.z / 220);
        if (sc > 0.03) {
          c.save(); c.translate(fx.x, fx.y); c.rotate(fx.r); c.globalAlpha = Math.min(1, sc * 3 + 0.3); var sz = size * 1.5 * sc;
          c.shadowColor = "rgba(255,200,100,.9)"; c.shadowBlur = 16 * sc; if (I.s[0].complete) c.drawImage(I.s[(tt * 16 | 0) % 2], -sz / 2, -sz / 2, sz, sz); c.restore();
          c.fillStyle = "rgba(255,210,120," + 0.6 * sc + ")"; for (var q = 1; q <= 5; q++) { c.beginPath(); c.arc(fx.x - fx.vx * dt * q * 2, fx.y - fx.vy * dt * q * 2, Math.max(1, 5 * sc - q * 0.6), 0, 6.283); c.fill(); }
        } else if (!endAt) { endAt = t; spark(fx.x, fx.y, 8, ["#fff", "#FFD166"]); }
        if (endAt && t - endAt > 0.4) { done(); return; }
      }
      if (psi != null) {
        var tp = tip(psi, yoff), dx = tp.x - hand.x, dy = tp.y - hand.y, len = Math.max(26, Math.sqrt(dx * dx + dy * dy)), th = Math.atan2(dx, -dy), al = t > T_HIT + 0.5 ? Math.max(0, 1 - (t - T_HIT - 0.5) / 0.3) : 1;
        trail.push({ x: tp.x, y: tp.y, s: tp.s, t: t }); while (trail.length && t - trail[0].t > 0.14) trail.shift();
        if (t >= T_SW && trail.length > 1) { c.save(); c.lineCap = "round"; for (var i = 1; i < trail.length; i++) { c.strokeStyle = "rgba(255,255,255," + 0.5 * i / trail.length + ")"; c.lineWidth = 5 + 14 * tp.s * i / trail.length; c.beginPath(); c.moveTo(trail[i - 1].x, trail[i - 1].y); c.lineTo(trail[i].x, trail[i].y); c.stroke(); } c.restore(); }
        c.globalAlpha = al; bat(c, hand, th, len, tp.s); c.globalAlpha = 1;
      }
      if (t > 6) { done(); return; }
      global.requestAnimationFrame(frame);
    }
    global.requestAnimationFrame(frame); return true;
  }

  global.VTS = { whack: whack, whacking: function () { return whacking; }, home: home, spider: spider, busy: function () { return running; } };
})(window);
