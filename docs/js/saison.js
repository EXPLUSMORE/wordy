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
  global.VTS = { spider: spider, busy: function () { return running; } };
})(window);
