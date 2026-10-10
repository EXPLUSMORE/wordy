/* Wortspiele – Wort-Detektiv, Rette Eisi, Wort-Kreuz.
   Nutzen die Arena-Fläche (#arena) und deren Optik, aber eigene Logik. Zählen aufs Tagesziel, Lernstand über S.grade. */
(function (global) {
  "use strict";
  var S = global.VT, el = document.getElementById("arena"), G = null;

  var GAMES = [
    { id: "detective", icon: "🔎", name: "Wort-Detektiv", tag: "5 Wörter · 6 Versuche", claim: "Errate das englische Wort.",
      desc: "Du bekommst die deutsche Bedeutung und die Länge. Rate das englische Wort: Grün heißt richtig, Gelb richtig aber an anderer Stelle, Grau kommt nicht vor." },
    { id: "eisi", icon: "🐻‍❄️", name: "Rette Eisi", tag: "5 Wörter · 6 Eisschollen", claim: "Rate Buchstabe für Buchstabe.",
      desc: "Eisi steht auf schmelzendem Eis. Tippe Buchstaben, die im englischen Wort vorkommen. Jeder falsche Buchstabe lässt ein Stück Eis schmelzen." },
    { id: "kreuz", icon: "🧩", name: "Wort-Kreuz", tag: "Kreuzworträtsel", claim: "Deutsche Hinweise, englische Lösungen.",
      desc: "Ein Kreuzworträtsel aus deinen Wörtern. Die Hinweise sind deutsch, geschrieben wird englisch. Tippe ein Feld, dann die Buchstaben." }
  ];

  /* ---------- Hilfen ---------- */
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function $(s, r) { return (r || el).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || el).querySelectorAll(s)); }
  function key(id) { return "g_" + id + ":" + S.state.settings.track; }
  function best(id) { var a = S.state.arena || {}; return a[key(id)] || { best: 0, plays: 0 }; }
  function snd(ok) { try { if (S.state.settings.audio) global.VTC.sound(S.state.profile.snd, ok); } catch (e) {} }
  function burst(n) { try { global.VTC.burst(S.state.profile.fx, global.innerWidth / 2, global.innerHeight * .4, n || 10, .9); } catch (e) {} }
  function say(t) { try { if (global.VTUI && global.VTUI.speak) global.VTUI.speak(t); } catch (e) {} }
  function toast(m) { try { global.VTUI.toast(m); } catch (e) {} }
  function clean(en) { return String(en).toLowerCase().trim().replace(/^(to|a|an|the)\s+/, ""); }
  function plainDe(de) { return String(de).replace(/\s*\([^)]*\)/g, "").trim() || String(de); }

  /* Wörter für ein Spiel: nur einzelne Wörter aus Buchstaben, Fehlerkartei und Fälliges zuerst */
  function pickWords(n, min, max, unit) {
    var p = S.pools(), order = S.shuffle(p.box.slice()).concat(S.shuffle(p.due.slice()), S.shuffle(p.learning.slice()), S.shuffle(p.fresh.slice()), S.shuffle(p.all.slice()));
    var seenEn = {}, seenDe = {}, out = [];
    order.forEach(function (w) {
      if (unit && w.unit !== unit) return;
      var s = clean(w.en);
      if (!/^[a-z]+$/.test(s) || s.length < min || s.length > max || seenEn[s] || seenDe[w.de]) return;
      seenEn[s] = seenDe[w.de] = 1; out.push({ id: w.id, en: s, de: plainDe(w.de), unit: w.unit, raw: w.en });
    });
    return out.slice(0, n);
  }

  /* ---------- Tastatur ---------- */
  var ROWS = ["QWERTZUIOP", "ASDFGHJKL", "YXCVBNM"];
  function keysHtml(o) {
    return '<div class="wg-keys" id="wgKeys">' + ROWS.map(function (r, i) {
      var k = r.split("").map(function (ch) { return '<button class="wk" data-g="k" data-k="' + ch + '">' + ch + '</button>'; }).join("");
      if (i === 2) k = (o.enter ? '<button class="wk wide" data-g="k" data-k="ENTER" aria-label="Prüfen">⏎</button>' : "") + k + (o.back ? '<button class="wk wide" data-g="k" data-k="BACK" aria-label="Löschen">⌫</button>' : "");
      return '<div class="wk-row">' + k + '</div>';
    }).join("") + '</div>';
  }
  function setKey(ch, cls) {
    var b = $("[data-k='" + ch.toUpperCase() + "']"); if (!b) return;
    var rank = { n: 1, y: 2, g: 3 }, old = b.getAttribute("data-s");
    if (old && rank[old] >= rank[cls]) return;
    b.setAttribute("data-s", cls); b.classList.remove("n", "y", "g"); b.classList.add(cls);
  }

  /* ---------- Rahmen ---------- */
  function top(title) {
    return '<div class="ar-top"><button class="ar-x" data-g="quit" aria-label="Spiel verlassen">✕</button>' +
      '<div class="wg-title">' + esc(title) + '</div>' +
      '<div class="ar-score"><b class="tnum" id="wgScore">' + G.score + '</b><span>Punkte</span></div></div>';
  }
  function paintScore() { var s = $("#wgScore"); if (s) s.textContent = G.score; }
  function dots() {
    return '<div class="wg-dots">' + G.words.map(function (w, i) { return '<i class="' + (i < G.i ? (G.res[i] ? "ok" : "no") : i === G.i ? "now" : "") + '"></i>'; }).join("") + '</div>';
  }

  /* ---------- Start ---------- */
  function start(id, opts) {
    var min = 3, max = id === "kreuz" ? 8 : 8, n = id === "kreuz" ? 14 : 5, words = pickWords(n, min, max, opts && opts.unit);
    if (words.length < (id === "kreuz" ? 6 : 3)) return toast("Dafür brauchst du mehr Wörter im gewählten Bereich (einzelne Wörter ab 3 Buchstaben).");
    S.rollDay();
    G = { id: id, words: words, i: 0, score: 0, res: [], items: 0, correct: 0, wrong: 0, hints: 0, start: Date.now(), done: false, opts: opts || null, maxStreak: 0, streak: 0, cleared: 0 };
    el.hidden = false; document.documentElement.classList.add("ar-open");
    if (id === "detective") return detRound();
    if (id === "eisi") return eisRound();
    if (id === "kreuz") return kreuzStart();
  }

  /* ================= Wort-Detektiv ================= */
  function detRound() {
    var w = G.words[G.i], n = w.en.length;
    G.det = { rows: [], cur: "", hinted: false, over: false, shown: "" };
    var tiles = ""; for (var r = 0; r < 6; r++) { tiles += '<div class="wt-row" data-row="' + r + '">'; for (var c = 0; c < n; c++) tiles += '<div class="wt"></div>'; tiles += '</div>'; }
    el.innerHTML = top("Wort-Detektiv") + dots() +
      '<div class="wg-body"><div class="wg-hint">' + esc(w.de) + '<small>' + n + ' Buchstaben · Wort ' + (G.i + 1) + ' von ' + G.words.length + '</small></div>' +
      '<div class="wt-grid" id="wtGrid" style="--n:' + n + '">' + tiles + '</div>' +
      '<div class="wg-msg" id="wgMsg"></div>' + keysHtml({ enter: true, back: true }) +
      '<div class="wg-acts"><button class="wg-btn ghost" data-g="hint">💡 Erster Buchstabe (−25)</button><button class="wg-btn ghost" data-g="giveup">Aufgeben</button></div></div>';
    detPaint();
  }
  function detPaint() {
    var d = G.det, n = G.words[G.i].en.length, row = $("[data-row='" + d.rows.length + "']");
    if (!row) return;
    var cells = $$(".wt", row), i;
    for (i = 0; i < n; i++) { cells[i].textContent = (d.cur[i] || "").toUpperCase(); cells[i].classList.toggle("on", i === d.cur.length && !d.over); }
  }
  function detType(k) {
    var d = G.det; if (!d || d.over) return;
    var w = G.words[G.i], n = w.en.length;
    if (k === "BACK") { if (d.cur.length > (d.hinted ? 1 : 0)) d.cur = d.cur.slice(0, -1); return detPaint(); }
    if (k === "ENTER") {
      if (d.cur.length < n) { var m = $("#wgMsg"); if (m) m.textContent = "Noch " + (n - d.cur.length) + " Buchstaben fehlen."; var rowE = $("[data-row='" + d.rows.length + "']"); if (rowE) { rowE.classList.remove("shake"); void rowE.offsetWidth; rowE.classList.add("shake"); } return; }
      return detGuess();
    }
    if (d.cur.length < n && /^[A-Z]$/.test(k)) { d.cur += k.toLowerCase(); var mm = $("#wgMsg"); if (mm) mm.textContent = ""; detPaint(); }
  }
  function evalGuess(guess, target) {   // Wordle-Regel: erst Grüne, dann Gelbe nach Restzahl
    var n = target.length, res = [], left = {}, i;
    for (i = 0; i < n; i++) { res[i] = "n"; if (guess[i] === target[i]) res[i] = "g"; else left[target[i]] = (left[target[i]] || 0) + 1; }
    for (i = 0; i < n; i++) if (res[i] === "n" && left[guess[i]] > 0) { res[i] = "y"; left[guess[i]]--; }
    return res;
  }
  function detGuess() {
    var d = G.det, w = G.words[G.i], guess = d.cur, res = evalGuess(guess, w.en), rowEl = $("[data-row='" + d.rows.length + "']"), cells = $$(".wt", rowEl);
    d.rows.push(guess);
    res.forEach(function (c, i) { setTimeout(function () { if (!cells[i]) return; cells[i].classList.remove("on"); cells[i].classList.add("f", c); setKey(guess[i], c); }, i * 110); });
    var wait = res.length * 110 + 100;
    if (guess === w.en) { d.over = true; G.items++; G.correct++; setTimeout(function () { detEnd(true); }, wait); return; }
    G.wrong++;
    if (d.rows.length >= 6) { d.over = true; setTimeout(function () { detEnd(false); }, wait); return; }
    d.cur = d.hinted ? w.en[0] : ""; setTimeout(detPaint, wait);
  }
  function detEnd(win) {
    var d = G.det, w = G.words[G.i], tries = d.rows.length;
    var pts = win ? Math.max(20, 100 - 15 * (tries - 1) - (d.hinted ? 25 : 0)) : 0;
    G.score += pts; G.res[G.i] = win; if (!win) G.items++;
    G.streak = win ? G.streak + 1 : 0; G.maxStreak = Math.max(G.maxStreak, G.streak);
    try {
      if (global.WordySync) global.WordySync.ctx = { mode: "arena" };
      S.grade(w.id, win ? (tries <= 3 && !d.hinted ? 2 : 1) : 0, win && d.hinted ? { hint: true } : undefined);
    } catch (e) {}
    snd(win); if (win) burst(14);
    paintScore();
    var msg = win ? "✓ Richtig in " + tries + (tries === 1 ? " Versuch" : " Versuchen") + "! +" + pts : "Gesucht war: <b>" + esc(w.en) + "</b>";
    var m = $("#wgMsg"); if (m) m.innerHTML = '<span class="' + (win ? "good" : "bad") + '">' + msg + '</span> · ' + esc(w.en) + ' = ' + esc(w.de);
    var acts = $(".wg-acts"); if (acts) acts.innerHTML = '<button class="wg-btn" data-g="say">🔊 Anhören</button><button class="wg-btn" data-g="next">' + (G.i + 1 >= G.words.length ? "Fertig ▶" : "Weiter ▶") + '</button>';
    say(w.raw);
  }

  /* ================= Rette Eisi ================= */
  function eisRound() {
    var w = G.words[G.i];
    G.eis = { guessed: {}, wrong: 0, over: false, hinted: false };
    el.innerHTML = top("Rette Eisi") + dots() +
      '<div class="wg-body"><div class="wg-hint">' + esc(w.de) + '<small>Wort ' + (G.i + 1) + ' von ' + G.words.length + '</small></div>' +
      '<div class="eis-stage"><div class="eis-bear" id="eisBear">🐻‍❄️</div><div class="eis-ice" id="eisIce"></div></div>' +
      '<div class="eis-word" id="eisWord"></div><div class="wg-msg" id="wgMsg"></div>' + keysHtml({}) +
      '<div class="wg-acts"><button class="wg-btn ghost" data-g="hint">💡 Buchstabe aufdecken (−1 Eis)</button><button class="wg-btn ghost" data-g="giveup">Aufgeben</button></div></div>';
    eisPaint();
  }
  function eisPaint(reveal) {
    var e = G.eis, w = G.words[G.i], i, h = "";
    for (i = 0; i < w.en.length; i++) { var ch = w.en[i], show = e.guessed[ch] || reveal; h += '<span class="eis-l' + (reveal && !e.guessed[ch] ? " miss" : "") + '">' + (show ? ch.toUpperCase() : "") + '</span>'; }
    $("#eisWord").innerHTML = h;
    var ice = ""; for (i = 0; i < 6; i++) ice += '<span class="' + (i < 6 - e.wrong ? "" : "melt") + '">' + (i < 6 - e.wrong ? "🧊" : "💧") + '</span>';
    $("#eisIce").innerHTML = ice;
    var b = $("#eisBear"); if (b) b.textContent = e.wrong >= 6 ? "🌊" : e.wrong >= 4 ? "😰" : "🐻‍❄️";
  }
  function eisType(k) {
    var e = G.eis; if (!e || e.over || !/^[A-Z]$/.test(k)) return;
    var ch = k.toLowerCase(), w = G.words[G.i]; if (e.guessed[ch] !== undefined) return;
    var inWord = w.en.indexOf(ch) >= 0;
    e.guessed[ch] = inWord; setKey(k, inWord ? "g" : "n");
    if (!inWord) { e.wrong++; G.wrong++; snd(false); } else snd(true);
    eisPaint();
    var all = w.en.split("").every(function (c) { return e.guessed[c]; });
    if (all) return eisEnd(true);
    if (e.wrong >= 6) eisEnd(false);
  }
  function eisEnd(win) {
    var e = G.eis, w = G.words[G.i]; e.over = true;
    var pts = win ? Math.max(20, 100 - 12 * e.wrong - (e.hinted ? 10 : 0)) : 0;
    G.score += pts; G.res[G.i] = win; G.items++; if (win) G.correct++;
    G.streak = win ? G.streak + 1 : 0; G.maxStreak = Math.max(G.maxStreak, G.streak);
    try { if (global.WordySync) global.WordySync.ctx = { mode: "arena" }; S.grade(w.id, win ? (e.wrong <= 1 && !e.hinted ? 2 : 1) : 0, win && e.hinted ? { hint: true } : undefined); } catch (x) {}
    snd(win); if (win) burst(14); paintScore(); eisPaint(!win);
    var m = $("#wgMsg"); if (m) m.innerHTML = win ? '<span class="good">✓ Eisi ist gerettet! +' + pts + '</span> · ' + esc(w.en) + ' = ' + esc(w.de) : '<span class="bad">Eisi ist ins Wasser gefallen.</span> Gesucht war: <b>' + esc(w.en) + '</b>';
    var b = $("#eisBear"); if (b) b.textContent = win ? "🥳" : "🌊";
    var acts = $(".wg-acts"); if (acts) acts.innerHTML = '<button class="wg-btn" data-g="say">🔊 Anhören</button><button class="wg-btn" data-g="next">' + (G.i + 1 >= G.words.length ? "Fertig ▶" : "Weiter ▶") + '</button>';
    say(w.raw);
  }

  /* ================= Wort-Kreuz ================= */
  var DIRS = [[0, 1], [1, 0]];   // 0 = waagerecht, 1 = senkrecht
  function canPlace(map, dirAt, word, r, c, dir) {
    var dr = DIRS[dir][0], dc = DIRS[dir][1], i, cross = 0;
    if (map[(r - dr) + "," + (c - dc)] || map[(r + dr * word.length) + "," + (c + dc * word.length)]) return -1;
    for (i = 0; i < word.length; i++) {
      var rr = r + dr * i, cc = c + dc * i, k = rr + "," + cc, ex = map[k];
      if (ex) { if (ex !== word[i] || dirAt[k] === dir) return -1; cross++; }
      else if (map[(rr + dc) + "," + (cc + dr)] || map[(rr - dc) + "," + (cc - dr)]) return -1;   // keine Nachbarn seitlich
    }
    return cross;
  }
  function layout(cands, target, maxDim) {
    var bestL = null, att, i;
    for (att = 0; att < 80; att++) {
      var ws = S.shuffle(cands.slice()).sort(function (a, b) { return (b.en.length - a.en.length) + (Math.random() - .5) * 3; }), map = {}, dirAt = {}, placed = [];
      var first = ws[0]; for (i = 0; i < first.en.length; i++) { map["0," + i] = first.en[i]; dirAt["0," + i] = 0; }
      placed.push({ w: first, r: 0, c: 0, dir: 0 });
      ws.slice(1).forEach(function (w) {
        if (placed.length >= target) return;
        var opts = [];
        placed.forEach(function (p) {
          for (var a = 0; a < p.w.en.length; a++) for (var b = 0; b < w.en.length; b++) {
            if (p.w.en[a] !== w.en[b]) continue;
            var dir = 1 - p.dir, r = p.r + DIRS[p.dir][0] * a, c = p.c + DIRS[p.dir][1] * a;
            var sr = r - DIRS[dir][0] * b, sc = c - DIRS[dir][1] * b;
            if (canPlace(map, dirAt, w.en, sr, sc, dir) >= 1) opts.push({ r: sr, c: sc, dir: dir });
          }
        });
        if (!opts.length) return;
        var pick = opts[Math.floor(Math.random() * opts.length)];
        for (var j = 0; j < w.en.length; j++) { var kk = (pick.r + DIRS[pick.dir][0] * j) + "," + (pick.c + DIRS[pick.dir][1] * j); map[kk] = w.en[j]; dirAt[kk] = dirAt[kk] === undefined ? pick.dir : dirAt[kk]; }
        placed.push({ w: w, r: pick.r, c: pick.c, dir: pick.dir });
      });
      var minR = 1e9, minC = 1e9, maxR = -1e9, maxC = -1e9;
      placed.forEach(function (p) { var er = p.r + DIRS[p.dir][0] * (p.w.en.length - 1), ec = p.c + DIRS[p.dir][1] * (p.w.en.length - 1); minR = Math.min(minR, p.r); minC = Math.min(minC, p.c); maxR = Math.max(maxR, er); maxC = Math.max(maxC, ec); });
      var rows = maxR - minR + 1, cols = maxC - minC + 1;
      if (rows > maxDim || cols > maxDim) continue;
      var score = placed.length * 100 - rows * cols;
      if (!bestL || score > bestL.score) bestL = { score: score, placed: placed, rows: rows, cols: cols, minR: minR, minC: minC };
      if (placed.length >= target && rows * cols <= 60) break;
    }
    return bestL;
  }
  function kreuzStart() {
    var cands = G.words, L = layout(cands, 8, 9), tries = 0;
    while ((!L || L.placed.length < 5) && tries++ < 6) { cands = pickWords(16, 3, 8); var L2 = layout(cands, 8, 9); if (L2 && (!L || L2.placed.length > L.placed.length)) L = L2; }
    if (!L || L.placed.length < 3) { close(); return toast("Das Rätsel ließ sich nicht bauen. Versuch es gleich noch einmal."); }
    var cells = {}, words = [], num = 0;
    L.placed.forEach(function (p) { p.r -= L.minR; p.c -= L.minC; });
    var starts = L.placed.slice().sort(function (a, b) { return (a.r - b.r) || (a.c - b.c) || (a.dir - b.dir); }), numAt = {};
    starts.forEach(function (p) { var k = p.r + "," + p.c; if (!numAt[k]) numAt[k] = ++num; p.n = numAt[k]; });
    L.placed.forEach(function (p) {
      var ks = [];
      for (var i = 0; i < p.w.en.length; i++) { var k = (p.r + DIRS[p.dir][0] * i) + "," + (p.c + DIRS[p.dir][1] * i); ks.push(k); if (!cells[k]) cells[k] = { r: p.r + DIRS[p.dir][0] * i, c: p.c + DIRS[p.dir][1] * i, ch: p.w.en[i], ent: "", ws: [] }; cells[k].ws.push(words.length); }
      words.push({ w: p.w, dir: p.dir, n: p.n, keys: ks, done: false, r: p.r, c: p.c });
    });
    G.words = words.map(function (x) { return x.w; }); G.res = []; G.i = 0;
    G.kr = { rows: L.rows, cols: L.cols, cells: cells, words: words, sel: { wi: 0, k: words[0].keys[0] }, checks: 0, hinted: {}, over: false, numAt: numAt };
    kreuzDraw();
  }
  function kreuzDraw() {
    var K = G.kr, size = Math.max(26, Math.min(42, Math.floor((Math.min(global.innerWidth, 520) - 28) / K.cols)));
    var h = top("Wort-Kreuz") +
      '<div class="wg-body"><div class="kr-clue" id="krClue"></div>' +
      '<div class="kr-grid" id="krGrid" style="grid-template-columns:repeat(' + K.cols + ',' + size + 'px);grid-template-rows:repeat(' + K.rows + ',' + size + 'px);--cs:' + size + 'px">';
    var r, c;
    for (r = 0; r < K.rows; r++) for (c = 0; c < K.cols; c++) {
      var k = r + "," + c, cell = K.cells[k];
      h += cell ? '<div class="kc" data-g="cell" data-k="' + k + '">' + (K.numAt[k] ? '<i>' + K.numAt[k] + '</i>' : "") + '<b></b></div>' : '<div class="kc x"></div>';
    }
    h += '</div><div class="kr-list" id="krList"></div>' + keysHtml({ back: true }) +
      '<div class="wg-acts"><button class="wg-btn ghost" data-g="hint">💡 Tipp (−8)</button><button class="wg-btn" data-g="check">✓ Prüfen</button></div></div>';
    el.innerHTML = h; kreuzPaint();
  }
  function kreuzPaint() {
    var K = G.kr, sel = K.words[K.sel.wi];
    Object.keys(K.cells).forEach(function (k) {
      var cell = K.cells[k], d = $("[data-k='" + k + "']"); if (!d) return;
      d.querySelector("b").textContent = cell.ent.toUpperCase();
      d.className = "kc" + (sel.keys.indexOf(k) >= 0 ? " inw" : "") + (K.sel.k === k ? " cur" : "") + (cell.bad ? " bad" : "") + (cell.ok ? " ok" : "") + (K.hinted[k] ? " hn" : "");
    });
    var cl = $("#krClue"); if (cl) cl.innerHTML = '<b>' + sel.n + (sel.dir ? " ↓" : " →") + '</b> ' + esc(sel.w.de) + ' <small>(' + sel.w.en.length + ')</small>';
    var lst = $("#krList"); if (lst) {
      lst.innerHTML = [0, 1].map(function (dir) {
        var items = K.words.map(function (x, i) { return { x: x, i: i }; }).filter(function (o) { return o.x.dir === dir; }).sort(function (a, b) { return a.x.n - b.x.n; });
        return items.length ? '<div class="kr-col"><div class="kr-h">' + (dir ? "Senkrecht ↓" : "Waagerecht →") + '</div>' + items.map(function (o) {
          return '<button class="kr-it' + (o.i === K.sel.wi ? " on" : "") + (o.x.done ? " done" : "") + '" data-g="word" data-wi="' + o.i + '"><b>' + o.x.n + '</b> ' + esc(o.x.w.de) + '</button>'; }).join("") + '</div>' : "";
      }).join("");
    }
  }
  function kreuzSelect(k) {
    var K = G.kr, cell = K.cells[k]; if (!cell) return;
    var cur = K.words[K.sel.wi];
    if (K.sel.k === k && cell.ws.length > 1) { K.sel.wi = cell.ws[0] === K.sel.wi ? cell.ws[1] : cell.ws[0]; }
    else if (cell.ws.indexOf(K.sel.wi) < 0) K.sel.wi = cell.ws[0];
    K.sel.k = k; kreuzPaint();
  }
  function kreuzType(kk) {
    var K = G.kr; if (K.over) return;
    var cell = K.cells[K.sel.k], w = K.words[K.sel.wi], idx = w.keys.indexOf(K.sel.k);
    if (kk === "BACK") {
      if (!cell.ent && idx > 0) { K.sel.k = w.keys[idx - 1]; cell = K.cells[K.sel.k]; }
      if (!K.hinted[K.sel.k]) cell.ent = "";
      cell.bad = false; return kreuzPaint();
    }
    if (!/^[A-Z]$/.test(kk) || K.hinted[K.sel.k]) { if (/^[A-Z]$/.test(kk) && idx < w.keys.length - 1) { K.sel.k = w.keys[idx + 1]; kreuzPaint(); } return; }
    cell.ent = kk.toLowerCase(); cell.bad = false;
    if (idx < w.keys.length - 1) K.sel.k = w.keys[idx + 1];
    kreuzCheckWords(false); kreuzPaint(); kreuzWin();
  }
  function kreuzCheckWords(mark) {
    var K = G.kr;
    K.words.forEach(function (w) {
      var ok = w.keys.every(function (k) { return K.cells[k].ent === K.cells[k].ch; });
      if (ok && !w.done) { w.done = true; w.keys.forEach(function (k) { K.cells[k].ok = true; }); try { if (global.WordySync) global.WordySync.ctx = { mode: "arena" }; if (!w.graded) { w.graded = 1; var anyHint = w.keys.some(function (k) { return K.hinted[k]; }); S.grade(w.w.id, anyHint ? 1 : 2, anyHint ? { hint: true } : undefined); G.items++; G.correct++; G.score += anyHint ? 12 : 20; G.res.push(true); paintScore(); snd(true); } } catch (e) {} }
    });
    if (mark) {
      var wrong = 0;
      Object.keys(K.cells).forEach(function (k) { var c = K.cells[k]; if (c.ent && c.ent !== c.ch && !K.hinted[k]) { c.bad = true; wrong++; } });
      K.checks++; if (wrong) { G.wrong += wrong; G.score = Math.max(0, G.score - 3); paintScore(); snd(false); } else toast(K.words.every(function (w) { return w.done; }) ? "Alles richtig!" : "Bisher alles richtig. Weiter so!");
    }
  }
  function kreuzWin() {
    var K = G.kr; if (K.words.every(function (w) { return w.done; })) { K.over = true; G.score += 30; burst(18); setTimeout(function () { finish("done"); }, 900); }
  }
  function kreuzHint() {
    var K = G.kr, cell = K.cells[K.sel.k]; if (K.over || !cell || cell.ent === cell.ch) return;
    cell.ent = cell.ch; K.hinted[K.sel.k] = 1; cell.bad = false; G.hints++; G.score = Math.max(0, G.score - 8); paintScore();
    var w = K.words[K.sel.wi], idx = w.keys.indexOf(K.sel.k); if (idx < w.keys.length - 1) K.sel.k = w.keys[idx + 1];
    kreuzCheckWords(false); kreuzPaint(); kreuzWin();
  }

  /* ---------- Ende ---------- */
  function finish(reason) {
    if (!G || G.done) return; G.done = true;
    var m = GAMES.filter(function (x) { return x.id === G.id; })[0], sec = Math.round((Date.now() - G.start) / 1000);
    var rec = best(G.id), score = G.score, isRecord = score > rec.best;
    if (!S.state.arena) S.state.arena = {};
    S.state.arena[key(G.id)] = { best: Math.max(rec.best, score), plays: rec.plays + 1 };
    var coins = Math.min(40, Math.floor(score / 40)) + (isRecord && rec.plays > 0 ? 10 : 0);
    if (G.items === 0) coins = 0;
    if (global.WordySync) { global.WordySync.sessionEnd({ sec: sec, items: G.items, correct: G.correct, mode: "arena", sub: G.id, score: score, coins: coins }); global.WordySync.ctx = null; }
    S.rollDay();
    var left = Math.max(0, 30 - (S.state.daily.arenaCoins || 0)), capped = coins > left; coins = Math.min(coins, left);
    S.state.daily.arenaCoins = (S.state.daily.arenaCoins || 0) + coins;
    coins = S.boost(coins); S.addCoins(coins); S.addXp(Math.min(60, Math.round(score / 8)));
    var rw = S.finishSession({ items: G.items, correct: G.correct, sec: sec, maxChain: G.maxStreak, newSeen: 0, boxSolved: 0, mastered: 0, sentOk: 0, arena: true });
    var acc = G.items ? Math.round(G.correct * 100 / G.items) : 0;
    el.innerHTML = '<div class="ar-end"><div class="ar-endicon">' + (isRecord && rec.plays > 0 ? "🏆" : esc(m.icon)) + '</div>' +
      '<h1>' + (reason === "quit" ? "Runde beendet" : isRecord && rec.plays > 0 ? "Neuer Bestwert!" : G.correct === G.items && G.items ? "Alles geschafft!" : "Geschafft!") + '</h1>' +
      '<div class="ar-big tnum">' + score + ' Punkte</div>' +
      '<div class="ar-stats"><div><b class="tnum">' + G.correct + '</b><span>richtig</span></div><div><b class="tnum">' + acc + '%</b><span>Trefferquote</span></div><div><b class="tnum">' + (G.id === "kreuz" ? G.hints : G.maxStreak) + '</b><span>' + (G.id === "kreuz" ? "Tipps" : "beste Serie") + '</span></div><div><b class="tnum">' + Math.max(rec.best, score) + '</b><span>Bestwert</span></div></div>' +
      '<p class="ar-note">' + (coins ? "🪙 " + coins + " Münzen" + (capped ? " (Tageslimit erreicht)" : "") : (capped ? "Tageslimit der Spiele erreicht" : "Diesmal keine Münzen")) + (rw.goalReached ? " · Tagesziel erreicht" : "") + '</p>' +
      '<div class="ar-endbtns"><button class="ar-btn" data-g="again">Noch mal</button><button class="ar-btn ghost" data-g="exit">Zurück</button></div></div>';
    S.save(true);
    if (global.VTUI && global.VTUI.refreshHeader) global.VTUI.refreshHeader();
  }
  function close() {
    G = null; el.hidden = true; el.innerHTML = ""; document.documentElement.classList.remove("ar-open");
    if (global.VTUI && global.VTUI.afterArena) global.VTUI.afterArena();
  }
  function next() {
    G.i++;
    if (G.i >= G.words.length) return finish("done");
    if (G.id === "detective") detRound(); else eisRound();
  }

  /* ---------- Eingaben ---------- */
  el.addEventListener("click", function (e) {
    var t = e.target.closest("[data-g]"); if (!t || !G) { if (t && !G && /^(exit|again|quit)$/.test(t.getAttribute("data-g"))) close(); return; }
    var a = t.getAttribute("data-g");
    if (a === "quit") { if (G.done) return close(); return G.items || G.score ? finish("quit") : close(); }
    if (a === "exit") return close();
    if (a === "again") { var id = G.id, o = G.opts; G = null; return start(id, o); }
    if (G.done) return;
    if (a === "k") { var k = t.getAttribute("data-k"); return G.id === "detective" ? detType(k) : G.id === "eisi" ? eisType(k) : kreuzType(k); }
    if (a === "next") return next();
    if (a === "say") return say(G.words[G.i].raw);
    if (a === "hint") {
      if (G.id === "detective") { var d = G.det; if (d.hinted || d.over) return; d.hinted = true; G.hints++; d.cur = G.words[G.i].en[0]; return detPaint(); }
      if (G.id === "eisi") { var es = G.eis, w = G.words[G.i]; if (es.over) return; var un = w.en.split("").filter(function (c) { return !es.guessed[c]; }); if (!un.length) return; var pick = un[Math.floor(Math.random() * un.length)]; es.hinted = true; G.hints++; es.guessed[pick] = true; setKey(pick, "g"); es.wrong++; eisPaint(); if (w.en.split("").every(function (c) { return es.guessed[c]; })) return eisEnd(true); if (es.wrong >= 6) eisEnd(false); return; }
      return kreuzHint();
    }
    if (a === "giveup") { if (G.id === "detective" && !G.det.over) { G.det.over = true; return detEnd(false); } if (G.id === "eisi" && !G.eis.over) return eisEnd(false); return; }
    if (a === "cell") return kreuzSelect(t.getAttribute("data-k"));
    if (a === "word") { var wi = +t.getAttribute("data-wi"); G.kr.sel.wi = wi; var kw = G.kr.words[wi], first = kw.keys.filter(function (k) { return G.kr.cells[k].ent !== G.kr.cells[k].ch; })[0] || kw.keys[0]; G.kr.sel.k = first; return kreuzPaint(); }
    if (a === "check") { kreuzCheckWords(true); kreuzPaint(); return kreuzWin(); }
  });
  document.addEventListener("keydown", function (e) {
    if (!G || el.hidden || G.done) return;
    if (e.key === "Escape") return finish("quit");
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key === "Backspace" ? "BACK" : e.key === "Enter" ? "ENTER" : /^[a-zA-Z]$/.test(e.key) ? e.key.toUpperCase() : null; if (!k) return;
    e.preventDefault();
    if (G.id === "detective") detType(k); else if (G.id === "eisi") eisType(k); else if (G.id === "kreuz") kreuzType(k);
  });

  global.VTG = { GAMES: GAMES, start: start, best: best, open: function () { return !!G; }, _evalGuess: evalGuess, _layout: layout, _state: function () { return G; } };
})(window);
