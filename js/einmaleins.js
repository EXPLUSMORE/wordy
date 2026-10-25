/* Einmaleins-Training (kein Bestandteil des Vokabellernens, im Profil ein-/ausblendbar: settings.einmaleins).
   Kleines Einmaleins = Reihen 1–10 mal 1–10, großes = Reihen 11–25 mal 2–25 (zweiter Faktor wahlweise nur bis 10). Zwei Übungen: Blitz-Einmaleins (60 Sekunden, Zifferntasten)
   und Match gegen die Zeit (Aufgaben und Ergebnisse verbinden, Fehler kosten 2 Sekunden). Schwache Aufgaben kommen häufiger.
   Lernstand: state.mal = { f: { "7x8": { ok, no } }, best: { "blitz-klein": Punkte, "match-klein": Millisekunden } }. XP und Münzen mit eigenem Tageslimit (80 XP, 25 Münzen), keine Lernzeit. */
(function (global) {
  "use strict";
  var VT = global.VT, ov = null, tick = null, keyH = null;

  function st() { var s = VT.state; if (!s.mal) s.mal = {}; if (!s.mal.f) s.mal.f = {}; if (!s.mal.best) s.mal.best = {}; return s.mal; }
  function cfg() {
    var s = VT.state.settings, lv = s.malLevel === "gross" ? "gross" : "klein", lo = lv === "gross" ? 11 : 1, hi = lv === "gross" ? 25 : 10, rows = [], bs = [], i;
    var bmax = lv === "gross" && s.malMax === 10 ? 10 : hi;   // großes Einmaleins: zweiter Faktor bis 25 (oder nur bis 10)
    (Array.isArray(s.malRows) ? s.malRows : []).forEach(function (r) { if (r >= lo && r <= hi && rows.indexOf(r) < 0) rows.push(r); });
    if (!rows.length) for (i = lo; i <= hi; i++) rows.push(i);
    for (i = lv === "gross" ? 2 : 1; i <= bmax; i++) bs.push(i);
    return { lv: lv, lo: lo, hi: hi, n: hi - lo + 1, bmax: bmax, rows: rows.sort(function (a, b) { return a - b; }), bs: bs };
  }
  function rk(c) { return c.lv === "gross" ? "gross" + c.bmax : "klein"; }   // Rekorde getrennt je Stufe (groß bis 10 und bis 25 sind nicht vergleichbar)
  function facts(c) { var l = []; c.rows.forEach(function (a) { c.bs.forEach(function (b) { l.push({ a: a, b: b, k: a + "x" + b, p: a * b }); }); }); return l; }
  function weight(k) { var f = st().f[k] || { ok: 0, no: 0 }; return Math.max(0.4, 1 + 1.5 * Math.min(f.no, 4) - 0.4 * Math.min(f.ok, 5)); }
  function pick(list, notKey) {
    var pool = list.filter(function (x) { return x.k !== notKey; }), sum = 0, r;
    pool.forEach(function (x) { sum += weight(x.k); }); r = Math.random() * sum;
    for (var i = 0; i < pool.length; i++) { r -= weight(pool[i].k); if (r <= 0) return pool[i]; }
    return pool[pool.length - 1];
  }
  function rec(k, ok) { var f = st().f[k] || (st().f[k] = { ok: 0, no: 0 }); if (ok) f.ok++; else f.no++; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function term(x) { return x.a + " × " + x.b; }
  function fmtT(ms) { var s = ms / 1000, m = Math.floor(s / 60); return m + ":" + (s - m * 60 < 10 ? "0" : "") + (s - m * 60).toFixed(1).replace(".", ","); }

  function close() {
    if (tick) { clearInterval(tick); tick = null; }
    if (keyH) { document.removeEventListener("keydown", keyH); keyH = null; }
    if (ov) { ov.remove(); ov = null; }
    document.documentElement.classList.remove("mal-lock");
  }
  function open(inner) {
    close(); ov = document.createElement("div"); ov.className = "mal-ov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Einmaleins");
    ov.innerHTML = '<div class="mal-in">' + inner + '</div>'; document.body.appendChild(ov);
    document.documentElement.classList.add("mal-lock"); try { global.scrollTo(0, 0); } catch (e) {}   // Seite dahinter festhalten: nichts darf seitlich wegrutschen
    ["gesturestart", "gesturechange", "dblclick"].forEach(function (t) { ov.addEventListener(t, function (e) { e.preventDefault(); }); });   // kein Pinch- oder Doppeltipp-Zoom (iOS)
    ov.addEventListener("touchmove", function (e) { if (ov.scrollHeight <= ov.clientHeight + 1) e.preventDefault(); }, { passive: false });   // passt alles auf den Schirm, gibt es nichts zu verschieben
    return ov;
  }
  function rwLine(rw) {   // Belohnung unter dem Ergebnis
    if (!rw) return "";
    if (!rw.xp && !rw.coins) return '<div class="mal-sub">Für heute sind die Einmaleins-Belohnungen aufgebraucht – morgen gibt es wieder XP und Münzen. 😊</div>';
    return '<div class="mal-rw">✨ +' + rw.xp + ' XP' + (rw.coins ? ' · 🪙 +' + rw.coins + ' Münzen' : '') + (rw.capped ? ' <span class="mal-sub">(Tageslimit erreicht)</span>' : '') + '</div>';
  }
  function pay(o, r) {
    var rw = null; try { rw = VT.malReward ? VT.malReward(r) : null; } catch (e) {}
    try { if (global.WordySync && global.WordySync.malEnd) global.WordySync.malEnd({ k: r.kind, lv: r.lv, score: r.score, err: r.errors || 0, sec: r.sec || 0, ms: r.ms || 0, rec: r.record ? 1 : 0, tm: r.timed === false ? 0 : 1, n: r.n || 0, xp: rw ? rw.xp : 0, coins: rw ? rw.coins : 0 }); } catch (e) {}
    if (o && o.refresh) o.refresh(); return rw;
  }
  function timed() { return VT.state.settings.malTimed !== false; }   // Mit Zeit (Standard) oder ohne Zeit (in Ruhe üben)
  var NQ = 20;   // Aufgaben je Runde ohne Zeit
  function save() { try { VT.save(true); } catch (e) {} }
  function vib(ok) { try { if (navigator.vibrate) navigator.vibrate(ok ? 12 : [30, 40, 30]); } catch (e) {} }

  /* ---------- Blitz-Einmaleins: 60 Sekunden, so viele richtige wie möglich ---------- */
  function blitz(o) {
    var c = cfg(), list = facts(c), score = 0, miss = 0, last = "", cur = null, typed = "", locked = false, missed = {}, DUR = 60000, t0 = Date.now(), over = false, free = !timed(), asked = 0;
    function scTxt() { return free ? score + "/" + NQ : String(score); }
    open('<div class="mal-top"><button class="mal-x" data-m="close" aria-label="Schließen">✕</button><b>⚡ Blitz' + (free ? " · ohne Zeit" : "") + '</b><span class="mal-sc" id="malSc">0</span></div>' +
      '<div class="mal-bar"><i id="malBar"></i></div><div class="mal-q" id="malQ"></div><div class="mal-a" id="malA" aria-live="polite">&nbsp;</div>' +
      '<div class="mal-pad">' + [1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (d) { return '<button data-d="' + d + '">' + d + '</button>'; }).join("") + '<button data-d="back" aria-label="Löschen">⌫</button><button data-d="0">0</button><button data-d="ok" class="mal-ok" aria-label="Fertig">OK</button></div>');
    function next() { cur = pick(list, last); last = cur.k; typed = ""; locked = false; paint(); }
    function paint(cls) {
      ov.querySelector("#malQ").textContent = term(cur) + " = ?";
      var a = ov.querySelector("#malA"); a.textContent = typed || " "; a.className = "mal-a" + (cls ? " " + cls : "");
      ov.querySelector("#malSc").textContent = scTxt();
      if (free) ov.querySelector("#malBar").style.width = (asked / NQ * 100) + "%";
    }
    function after(ms) { setTimeout(function () { if (over) return; if (free && asked >= NQ) end(); else next(); }, ms); }
    function submit() {
      if (locked || over || !typed) return;
      var ok = +typed === cur.p; locked = true; asked++; rec(cur.k, ok); vib(ok); if (o && o.sfx) o.sfx(ok);
      if (ok) { score++; paint("ok"); after(free ? 380 : 220); }
      else { miss++; missed[cur.k] = cur; var a = ov.querySelector("#malA"); a.textContent = typed + " ✗  " + cur.p; a.className = "mal-a no"; after(free ? 1800 : 1300); }
    }
    function press(d) {
      if (locked || over) return;
      if (d === "back") typed = typed.slice(0, -1);
      else if (d === "ok") return submit();
      else if (typed.length < 4) typed += d;
      paint(); if (typed.length >= String(cur.p).length) submit();
    }
    function end() {
      over = true; clearInterval(tick); tick = null; var b = st().best, key = "blitz-" + rk(c), had = !!b[key], rec0 = !free && (!b[key] || score > b[key]);
      if (rec0 && score > 0) b[key] = score; save();
      var rw = pay(o, { kind: "blitz", lv: rk(c), score: score, errors: miss, sec: free ? Math.round((Date.now() - t0) / 1000) : 60, timed: !free, n: asked, record: rec0 && had, complete: true });
      var ml = Object.keys(missed).map(function (k) { return '<span class="mal-chip">' + term(missed[k]) + " = " + missed[k].p + "</span>"; }).join("");
      ov.querySelector(".mal-in").innerHTML = '<div class="mal-res"><div class="mal-big">' + score + '</div><div class="mal-sub">' + (free ? "von " + NQ + " richtig, ohne Zeit" : "richtig in 60 Sekunden") + (miss ? " · " + miss + " Fehler" : "") + '</div>' +
        (free ? "" : rec0 && score > 0 ? '<div class="mal-rec">🏆 Neuer Rekord!</div>' : (b[key] ? '<div class="mal-sub">Rekord: ' + b[key] + '</div>' : "")) + rwLine(rw) +
        (ml ? '<div class="mal-sub" style="margin-top:14px">Das üben wir nochmal:</div><div class="mal-chips">' + ml + '</div>' : '<div class="mal-sub" style="margin-top:14px">Alles richtig – stark! 💪</div>') +
        '<div class="mal-act"><button class="btn" data-m="again">Nochmal</button><button class="btn soft" data-m="close">Fertig</button></div></div>';
    }
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return; var m = b.getAttribute("data-m"), d = b.getAttribute("data-d");
      if (m === "close") { over = true; close(); save(); if (o && o.onClose) o.onClose(); } else if (m === "again") blitz(o); else if (d) press(d);
    });
    keyH = function (e) { if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === "Backspace") press("back"); else if (e.key === "Enter") press("ok"); else if (e.key === "Escape") { over = true; close(); save(); if (o && o.onClose) o.onClose(); } };
    document.addEventListener("keydown", keyH);
    if (!free) tick = setInterval(function () {
      var left = Math.max(0, DUR - (Date.now() - t0)), bar = ov && ov.querySelector("#malBar"); if (!bar) return;
      bar.style.width = (left / DUR * 100) + "%"; bar.parentNode.className = "mal-bar" + (left < 10000 ? " low" : "");
      if (left <= 0 && !over) end();
    }, 100);
    else ov.querySelector("#malBar").style.width = "0%";
    next();
  }

  /* ---------- Stimmt's?: Ist die Rechnung richtig? Etwa die Hälfte der Ergebnisse ist falsch (nah dran, damit man rechnen muss) ---------- */
  function fake(x) {
    var p = x.p, cands = [(x.a + 1) * x.b, (x.a - 1) * x.b, x.a * (x.b + 1), x.a * (x.b - 1), p + 1, p - 1, p + 2, p - 2, p + 10, p - 10], pool, i;
    pool = cands.filter(function (v) { return v > 0 && v !== p; });
    for (i = 0; i < pool.length; i++) if (pool.indexOf(pool[i]) !== i) { pool.splice(i, 1); i--; }
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : p + 1;
  }
  function stimmts(o) {
    var c = cfg(), list = facts(c), score = 0, miss = 0, last = "", cur = null, shown = 0, locked = false, missed = {}, DUR = 60000, t0 = Date.now(), over = false, free = !timed(), asked = 0;
    function scTxt() { return free ? score + "/" + NQ : String(score); }
    open('<div class="mal-top"><button class="mal-x" data-m="close" aria-label="Schließen">✕</button><b>🤔 Stimmt\'s?' + (free ? " · ohne Zeit" : "") + '</b><span class="mal-sc" id="malSc">0</span></div>' +
      '<div class="mal-bar"><i id="malBar"></i></div><div class="mal-q mal-eq" id="malQ"></div><div class="mal-a" id="malA" aria-live="polite">&nbsp;</div>' +
      '<div class="mal-yn"><button data-yn="no" class="mal-no" aria-label="Stimmt nicht">✗ Stimmt nicht</button><button data-yn="yes" class="mal-yes" aria-label="Stimmt">✓ Stimmt</button></div>');
    function next() { cur = pick(list, last); last = cur.k; shown = Math.random() < 0.5 ? cur.p : fake(cur); locked = false; ov.querySelector("#malQ").innerHTML = term(cur) + " = <span>" + shown + "</span>"; var a = ov.querySelector("#malA"); a.textContent = "\u00a0"; a.className = "mal-a"; ov.querySelector("#malSc").textContent = String(score); }
    function answer(yes) {
      if (locked || over) return; locked = true;
      var truth = shown === cur.p, ok = yes === truth, a = ov.querySelector("#malA"); asked++; rec(cur.k, ok); vib(ok); if (o && o.sfx) o.sfx(ok);
      var after = function (ms) { setTimeout(function () { if (over) return; if (free && asked >= NQ) end(); else next(); }, ms); };
      if (free) ov.querySelector("#malBar").style.width = (asked / NQ * 100) + "%";
      if (ok) { score++; a.textContent = "✓"; a.className = "mal-a ok"; ov.querySelector("#malSc").textContent = scTxt(); after(free ? 420 : 260); }
      else { miss++; missed[cur.k] = cur; a.textContent = "✗  " + term(cur) + " = " + cur.p; a.className = "mal-a no"; ov.querySelector("#malSc").textContent = scTxt(); after(free ? 2000 : 1400); }
    }
    function end() {
      over = true; clearInterval(tick); tick = null; var b = st().best, key = "stimmts-" + rk(c), had = !!b[key], rec0 = !free && (!b[key] || score > b[key]);
      if (rec0 && score > 0) b[key] = score; save();
      var rw = pay(o, { kind: "stimmts", lv: rk(c), score: score, errors: miss, sec: free ? Math.round((Date.now() - t0) / 1000) : 60, timed: !free, n: asked, record: rec0 && had, complete: true });
      var ml = Object.keys(missed).map(function (k) { return '<span class="mal-chip">' + term(missed[k]) + " = " + missed[k].p + "</span>"; }).join("");
      ov.querySelector(".mal-in").innerHTML = '<div class="mal-res"><div class="mal-big">' + score + '</div><div class="mal-sub">' + (free ? "von " + NQ + " richtig beurteilt, ohne Zeit" : "richtig beurteilt in 60 Sekunden") + (miss ? " · " + miss + " Fehler" : "") + '</div>' +
        (free ? "" : rec0 && score > 0 ? '<div class="mal-rec">🏆 Neuer Rekord!</div>' : (b[key] ? '<div class="mal-sub">Rekord: ' + b[key] + '</div>' : "")) + rwLine(rw) +
        (ml ? '<div class="mal-sub" style="margin-top:14px">Das üben wir nochmal:</div><div class="mal-chips">' + ml + '</div>' : '<div class="mal-sub" style="margin-top:14px">Kein Fehler – du hast alle Fallen erkannt! 💪</div>') +
        '<div class="mal-act"><button class="btn" data-m="again">Nochmal</button><button class="btn soft" data-m="close">Fertig</button></div></div>';
    }
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return; var m = b.getAttribute("data-m"), yn = b.getAttribute("data-yn");
      if (m === "close") { over = true; close(); save(); if (o && o.onClose) o.onClose(); } else if (m === "again") stimmts(o); else if (yn) answer(yn === "yes");
    });
    keyH = function (e) { if (e.key === "ArrowRight" || e.key === "j" || e.key === "J") answer(true); else if (e.key === "ArrowLeft" || e.key === "n" || e.key === "N") answer(false); else if (e.key === "Escape") { over = true; close(); save(); if (o && o.onClose) o.onClose(); } };
    document.addEventListener("keydown", keyH);
    if (!free) tick = setInterval(function () {
      var left = Math.max(0, DUR - (Date.now() - t0)), bar = ov && ov.querySelector("#malBar"); if (!bar) return;
      bar.style.width = (left / DUR * 100) + "%"; bar.parentNode.className = "mal-bar" + (left < 10000 ? " low" : "");
      if (left <= 0 && !over) end();
    }, 100);
    else ov.querySelector("#malBar").style.width = "0%";
    next();
  }

  /* ---------- Match gegen die Zeit: 18 Aufgaben, es liegen immer 6 Paare aus; ein gelöstes Paar verschwindet und eine neue Aufgabe samt Ergebnis rückt nach.
     Dazu zwei falsche Ergebnisse zur Auswahl. Fehler (auch ein Tipp auf ein falsches Ergebnis) kosten 2 Sekunden. ---------- */
  function match(o) {
    var c = cfg(), list = facts(c), TOTAL = 18, SHOWN = 6, done = 0, errs = 0, sel = null, t0 = Date.now(), over = false, active = {}, decoys = [], used = {}, free = !timed();
    open('<div class="mal-top"><button class="mal-x" data-m="close" aria-label="Schließen">✕</button><b>🔗 Match' + (free ? " · ohne Zeit" : "") + '</b><span class="mal-sc" id="malSc">' + (free ? "" : "0:00,0") + '</span></div>' +
      '<div class="mal-sub" id="malRound" style="text-align:center"></div><div class="mal-grid"><div id="malL"></div><div id="malR"></div></div>');
    var L = ov.querySelector("#malL"), R = ov.querySelector("#malR");
    function visible(v) { return !!used[v]; }
    function nextFact() {   // nächste Aufgabe, deren Ergebnis gerade nicht ausliegt (Ergebnisse sind sichtbar eindeutig)
      var inUse = {}; Object.keys(active).forEach(function (k) { inUse[k] = 1; });
      var pool = list.filter(function (x) { return !inUse[x.k] && !visible(x.p); });
      if (!pool.length) pool = list.filter(function (x) { return !inUse[x.k]; });
      var f = pick(pool.length ? pool : list, ""); return f;
    }
    function addFact(x) {
      active[x.k] = x; used[x.p] = (used[x.p] || 0) + 1;
      var t = document.createElement("button"); t.setAttribute("data-t", x.k); t.textContent = term(x); L.appendChild(t);
      var r = document.createElement("button"); r.setAttribute("data-r", x.k); r.textContent = x.p;
      var kids = R.children, at = Math.floor(Math.random() * (kids.length + 1)); R.insertBefore(r, kids[at] || null);   // Ergebnis an zufälliger Stelle einmischen
    }
    function addDecoy(i) {
      var tries = 0, v, base = Object.keys(active).map(function (k) { return active[k]; });
      do { v = fake(base[Math.floor(Math.random() * base.length)] || list[0]); } while ((visible(v) || decoys.indexOf(v) >= 0) && tries++ < 60);
      decoys[i] = v; used[v] = (used[v] || 0) + 1;
      var r = document.createElement("button"); r.setAttribute("data-r", "d" + i); r.textContent = v; var kids = R.children; R.insertBefore(r, kids[Math.floor(Math.random() * (kids.length + 1))] || null);
    }
    function label() { ov.querySelector("#malRound").textContent = done + " von " + TOTAL + " · zwei Ergebnisse passen zu keiner Aufgabe"; }
    function elapsed() { return Date.now() - t0 + (free ? 0 : errs * 2000); }   // ohne Zeit: keine Strafsekunden
    function end() {
      over = true; clearInterval(tick); tick = null; var t = elapsed(), b = st().best, key = "match-" + rk(c), had = !!b[key], rec0 = !free && (!b[key] || t < b[key]);
      if (rec0) b[key] = t; save();
      var rw = pay(o, { kind: "match", lv: rk(c), score: TOTAL, errors: errs, sec: Math.round((Date.now() - t0) / 1000), ms: free ? 0 : t, timed: !free, n: TOTAL, record: rec0 && had, complete: true });
      ov.querySelector(".mal-in").innerHTML = '<div class="mal-res"><div class="mal-big">' + (free ? "✓" : fmtT(t)) + '</div><div class="mal-sub">' + (free ? "alle " : "für ") + TOTAL + ' Aufgaben' + (free ? " ohne Zeit" : "") + (errs ? " · " + errs + " Fehler" + (free ? "" : " (+" + errs * 2 + " s)") : " · keine Fehler") + '</div>' +
        (free ? "" : rec0 ? '<div class="mal-rec">🏆 Neue Bestzeit!</div>' : '<div class="mal-sub">Bestzeit: ' + fmtT(b[key]) + '</div>') + rwLine(rw) +
        '<div class="mal-act"><button class="btn" data-m="again">Nochmal</button><button class="btn soft" data-m="close">Fertig</button></div></div>';
    }
    ov.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b || over && !b.getAttribute("data-m")) return; var m = b.getAttribute("data-m");
      if (m === "close") { over = true; close(); save(); if (o && o.onClose) o.onClose(); return; }
      if (m === "again") return match(o);
      if (b.disabled) return;
      var t = b.getAttribute("data-t"), r = b.getAttribute("data-r");
      if (t) { L.querySelectorAll("button").forEach(function (x) { x.classList.remove("sel"); }); b.classList.add("sel"); sel = { k: t, el: b }; return; }
      if (r && sel) {
        var f = active[sel.k], ok = f && f.k === r, selEl = sel.el; sel = null;   // Ergebnisse liegen je Aufgabe eindeutig aus, also reicht der Aufgaben-Schlüssel
        if (ok) {
          rec(f.k, true); vib(true); if (o && o.sfx) o.sfx(true); b.classList.add("ok"); selEl.classList.remove("sel"); selEl.classList.add("ok"); b.disabled = true; selEl.disabled = true;
          delete active[f.k]; used[f.p]--; done++; label();
          setTimeout(function () {   // Paar verschwindet, die nächste Aufgabe rückt nach
            if (over || !ov) return; if (b.parentNode) b.remove(); if (selEl.parentNode) selEl.remove();
            if (done >= TOTAL) return end();
            if (done + Object.keys(active).length < TOTAL) addFact(nextFact());
          }, 320);
        } else { errs++; if (f) rec(f.k, false); vib(false); if (o && o.sfx) o.sfx(false); b.classList.add("no"); setTimeout(function () { b.classList.remove("no"); }, 450); selEl.classList.remove("sel"); }
      }
    });
    keyH = function (e) { if (e.key === "Escape") { over = true; close(); save(); if (o && o.onClose) o.onClose(); } };
    document.addEventListener("keydown", keyH);
    if (!free) tick = setInterval(function () { var s = ov && ov.querySelector("#malSc"); if (s && !over) s.textContent = fmtT(elapsed()); }, 100);
    for (var n = 0; n < SHOWN; n++) addFact(nextFact());
    addDecoy(0); addDecoy(1); label();
  }

  /* ---------- Übersicht im Reiter Lernen ---------- */
  function panel() {
    var c = cfg(), b = st().best, f = st().f, i, lv = c.lv;
    var rowsAll = []; for (i = c.lo; i <= c.hi; i++) rowsAll.push(i);
    var weak = facts(c).filter(function (x) { var q = f[x.k]; return q && q.no > 0; }).sort(function (x, y) { return (f[y.k].no - f[y.k].ok * 0.5) - (f[x.k].no - f[x.k].ok * 0.5); }).slice(0, 6);
    var tm = timed(), bl = b["blitz-" + rk(c)], bm = b["match-" + rk(c)], bs = b["stimmts-" + rk(c)];
    return '<section class="card"><div class="eyebrow">Einmaleins</div><h2 style="margin:4px 0 6px">✖️ Einmaleins trainieren</h2>' +
      '<p class="small muted" style="margin:0 0 10px">Kurz und schnell: jeden Tag ein paar Minuten, dann sitzt es. Dafür gibt es XP und Münzen (mit Tageslimit), nur zum Üben zählt es nicht als Lernzeit.</p>' +
      '<div class="row wrap" style="gap:6px;margin-bottom:10px">' + [["klein", "Kleines Einmaleins (1–10)"], ["gross", "Großes Einmaleins (11–25)"]].map(function (x) { return '<button class="chip" data-act="mallevel" data-v="' + x[0] + '" aria-pressed="' + (lv === x[0]) + '">' + x[1] + '</button>'; }).join("") + '</div>' +
      (lv === "gross" ? '<div class="row wrap" style="gap:6px;margin-bottom:10px"><span class="small muted">Zweiter Faktor:</span>' + [10, 25].map(function (m) { return '<button class="chip" data-act="malmax" data-v="' + m + '" aria-pressed="' + (c.bmax === m) + '">bis ' + m + '</button>'; }).join("") + '</div>' : "") +
      '<div class="row wrap" style="gap:6px;margin-bottom:10px"><span class="small muted">Spielweise:</span>' + [[1, "⏱ Mit Zeit"], [0, "🧘 Ohne Zeit"]].map(function (x) { return '<button class="chip" data-act="maltimed" data-v="' + x[0] + '" aria-pressed="' + ((x[0] === 1) === tm) + '">' + x[1] + '</button>'; }).join("") + '</div>' +
      '<div class="small muted" style="margin-bottom:4px">Welche Reihen? <span class="muted">(nichts gewählt = alle)</span></div>' +
      '<div class="row wrap" style="gap:6px;margin-bottom:12px">' + rowsAll.map(function (r) { var on = c.rows.length < c.n && c.rows.indexOf(r) >= 0; return '<button class="chip" data-act="malrow" data-v="' + r + '" aria-pressed="' + on + '">' + r + 'er</button>'; }).join("") + '</div>' +
      '<div class="mal-cards"><button class="mal-card" data-act="malgo" data-v="blitz"><span class="mal-ic">⚡</span><b>Blitz-Einmaleins</b><span class="small muted">' + (tm ? "60 Sekunden, so viele richtig wie möglich" + (bl ? " · Rekord " + bl : "") : NQ + " Aufgaben in Ruhe, ohne Uhr") + '</span></button>' +
      '<button class="mal-card" data-act="malgo" data-v="stimmts"><span class="mal-ic">🤔</span><b>Stimmt\'s?</b><span class="small muted">Ist die Rechnung richtig? Manche Ergebnisse sind falsch – ' + (tm ? '60 Sekunden' : NQ + ' Aufgaben, ohne Uhr') + (bs && tm ? " · Rekord " + bs : "") + '</span></button>' +
      '<button class="mal-card" data-act="malgo" data-v="match"><span class="mal-ic">🔗</span><b>' + (tm ? 'Match gegen die Zeit' : 'Match') + '</b><span class="small muted">Aufgabe und Ergebnis verbinden, 18 Paare – gelöste verschwinden, neue rücken nach; Vorsicht: zwei Ergebnisse sind falsch' + (tm ? "" : " · ohne Uhr und ohne Strafzeit") + (bm && tm ? " · Bestzeit " + fmtT(bm) : "") + '</span></button></div>' +
      (weak.length ? '<div class="small muted" style="margin:14px 0 4px">Hier hakt es noch:</div><div class="mal-chips">' + weak.map(function (x) { return '<span class="mal-chip">' + term(x) + " = " + x.p + "</span>"; }).join("") + '</div>' : "") +
      '</section>';
  }
  function setTimed(v) { VT.state.settings.malTimed = !!v; VT.save(true); }
  function setLevel(v) { VT.state.settings.malLevel = v === "gross" ? "gross" : "klein"; VT.state.settings.malRows = []; VT.save(true); }
  function toggleRow(n) {
    var s = VT.state.settings, c = cfg(), sel = (c.rows.length < c.n ? c.rows : []).slice(), i = sel.indexOf(n);
    if (i >= 0) sel.splice(i, 1); else sel.push(n);
    s.malRows = sel; VT.save(true);
  }
  function setMax(v) { VT.state.settings.malMax = +v === 10 ? 10 : 25; VT.save(true); }
  function start(kind, o) { if (kind === "match") match(o || {}); else if (kind === "stimmts") stimmts(o || {}); else blitz(o || {}); }

  global.VTM = { panel: panel, setLevel: setLevel, toggleRow: toggleRow, setMax: setMax, setTimed: setTimed, start: start, close: close };
})(window);
