/* Wortspiele – Wort-Detektiv, Rette Eisi, Wort-Kreuz.
   Nutzen die Arena-Fläche (#arena) und deren Optik, aber eigene Logik. Zählen aufs Tagesziel, Lernstand über S.grade. */
(function (global) {
  "use strict";
  var S = global.VT, el = document.getElementById("arena"), G = null;

  var GAMES = [
    { id: "detective", icon: "🔎", name: "Wort-Detektiv", tag: "5 Wörter · 6 Versuche", claim: "Errate das englische Wort.",
      desc: "Du bekommst die deutsche Bedeutung und die Länge. Rate das englische Wort: Grün heißt richtig, Gelb richtig aber an anderer Stelle, Grau kommt nicht vor." },
    { id: "eisi", icon: "🐻‍❄️", name: "Freezy", tag: "Rette Icy · 5 Wörter", claim: "Rate Buchstabe für Buchstabe.",
      desc: "Icy steht auf schmelzendem Eis. Tippe Buchstaben, die im englischen Wort vorkommen. Jeder falsche Buchstabe lässt ein Stück Eis schmelzen." },
    { id: "blast", icon: "🚀", name: "Blast", tag: "Wörter-Shooter", claim: "Schieß das richtige Wort ab.",
      desc: "Oben steht ein deutsches Wort. Englische Wörter fliegen auf dich zu: Tippe das richtige ab, bevor es dich erreicht. Mit den Pfeilen ◀ ▶ (oder den Pfeiltasten) steuerst du dein Raumschiff und weichst den Wörtern aus: Jede Berührung kostet ein Herz. Falsch geschossen kostet ebenfalls ein Herz. Eis-Sterne bremsen alles, Bomben räumen die falschen Wörter weg." },
    { id: "letters", icon: "🔠", name: "Letters", tag: "Buchstabensalat", claim: "Finde die versteckten Wörter.",
      desc: "Im Buchstabensalat verstecken sich englische Wörter, waagerecht, senkrecht oder diagonal, vorwärts oder rückwärts. Die Liste zeigt die deutschen Bedeutungen. Wische über die Buchstaben, um ein Wort zu markieren." },
    { id: "kreuz", icon: "🧩", name: "Xing", tag: "Kreuzworträtsel (Crossing)", claim: "Deutsche Hinweise, englische Lösungen.",
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
  function pickWords(n, min, max, unit, spaces) {
    var p = S.pools(), order = S.shuffle(p.box.slice()).concat(S.shuffle(p.due.slice()), S.shuffle(p.learning.slice()), S.shuffle(p.fresh.slice()), S.shuffle(p.all.slice()));
    if (unit) { var us = [].concat(unit); order = S.shuffle(S.words().filter(function (w) { return us.indexOf(w.unit) >= 0; })); }   // gewählte Einheit: alle ihre Wörter, auch außerhalb des aktiven Lernbereichs
    var seenEn = {}, seenDe = {}, out = [];
    order.forEach(function (w) {
      var s = clean(w.en);
      if (!(spaces ? /^[a-z][a-z ]*[a-z]$/ : /^[a-z]+$/).test(s) || s.length < min || s.length > max || seenEn[s] || seenDe[w.de]) return;
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
      '<button class="ar-x" data-g="help" aria-label="Spielregeln">?</button>' +
      '<div class="ar-score"><b class="tnum" id="wgScore">' + G.score + '</b><span>Punkte</span></div></div>';
  }
  function paintScore() { var s = $("#wgScore"); if (s) s.textContent = G.score; }
  function dots() {
    return '<div class="wg-dots">' + G.words.map(function (w, i) { return '<i class="' + (i < G.i ? (G.res[i] ? "ok" : "no") : i === G.i ? "now" : "") + '"></i>'; }).join("") + '</div>';
  }


  /* ---------- Kurzerklärung ---------- */
  var HELP = {
    detective: ["Rate das englische Wort zur deutschen Bedeutung. Du siehst, wie viele Buchstaben es hat.", "Tippe die Buchstaben, dann <b>✓ Prüfen</b>. Du hast 6 Versuche pro Wort, insgesamt 5 Wörter.", "🟩 richtiger Buchstabe an der richtigen Stelle · 🟨 kommt vor, aber an anderer Stelle · ⬛ kommt nicht vor.", "💡 verrät den ersten Buchstaben (kostet 25 Punkte)."],
    eisi: ["Icy steht auf schmelzendem Eis. Rate das englische Wort zur deutschen Bedeutung, Buchstabe für Buchstabe.", "Tippe einen Buchstaben: Kommt er im Wort vor, erscheint er. Wenn nicht, schmilzt ein Eisstück.", "Nach 6 Fehlern fällt Icy ins Wasser. 5 Wörter pro Runde.", "💡 deckt einen Buchstaben auf, kostet aber ein Eisstück."],
    kreuz: ["Ein Kreuzworträtsel: Die Hinweise sind deutsch, geschrieben wird englisch.", "Tippe ein Feld und dann die Buchstaben. Tippst du dasselbe Feld nochmal, wechselt die Richtung (waagerecht ↔ senkrecht). Du kannst auch einen Hinweis antippen.", "<b>✓ Prüfen</b> färbt falsche Buchstaben rot, 💡 deckt ein Feld auf (−8 Punkte)."],
    blast: ["Oben steht ein deutsches Wort. Englische Wörter fliegen auf dich zu.", "Tippe das passende englische Wort an, bevor es unten ankommt.", "Falsch getippt oder das richtige verpasst: −1 ♥. Alle 5 Treffer gibt es ein neues Level, alle 10 ein Extra-Herz.", "❄️ bremst alles, 💣 räumt die falschen Wörter weg."],
    letters: ["Im Buchstabensalat verstecken sich englische Wörter. Die Liste zeigt die deutschen Bedeutungen.", "Wische vom ersten bis zum letzten Buchstaben eines Wortes. Es geht waagerecht, senkrecht und diagonal, auch rückwärts. Wörter dürfen sich kreuzen.", "Du kannst auch erst den Anfang und dann das Ende antippen. Ein Tipp auf einen Hinweis markiert den Anfang (−8 Punkte)."]
  };
  function helpHtml(id, btn) {
    var m = GAMES.filter(function (x) { return x.id === id; })[0];
    return '<div class="wg-help"><div class="wg-hicon">' + esc(m.icon) + '</div><h2>' + esc(m.name) + '</h2><p class="wg-hclaim">' + esc(m.claim) + '</p><ul>' + HELP[id].map(function (t) { return '<li>' + t + '</li>'; }).join("") + '</ul>' + btn + '</div>';
  }
  function showIntro(id, opts) {
    pending = { id: id, opts: opts };
    el.hidden = false; document.documentElement.classList.add("ar-open");
    var m = GAMES.filter(function (x) { return x.id === id; })[0];
    el.innerHTML = '<div class="ar-top"><button class="ar-x" data-g="introx" aria-label="Schließen">✕</button><div class="wg-title">' + esc(m.name) + '</div><div style="width:36px"></div></div><div class="wg-body">' + helpHtml(id, '<button class="wg-btn big" data-g="introgo">Los geht’s ▶</button>') + '</div>';
  }
  function showHelp() {
    if (!G || $(".wg-help-ov")) return;
    if (G.sh) G.sh.paused = true;
    var d = document.createElement("div"); d.className = "wg-help-ov"; d.innerHTML = helpHtml(G.id, '<button class="wg-btn big" data-g="helpx">Weiter ▶</button>'); el.appendChild(d);
  }
  function hideHelp() {
    var d = $(".wg-help-ov"); if (d) d.remove();
    if (G && G.sh && G.sh.paused) { G.sh.paused = false; G.sh.last = performance.now(); }
  }

  var pending = null;
  /* ---------- Start ---------- */
  function start(id, opts) {
    var seen = S.state.settings.gameIntro || (S.state.settings.gameIntro = {});
    if (!seen[id] && !(opts && opts._intro)) { if (!(S.pools().all.length || (opts && (opts.units || opts.unit)))) return; return showIntro(id, opts); }
    var min = id === "blast" ? 2 : 3, max = 8, n = id === "kreuz" ? 14 : id === "blast" ? 40 : id === "letters" ? 7 : 5, words = pickWords(n, min, id === "blast" ? 26 : max, opts && (opts.units || opts.unit), id === "blast");
    if (words.length < (id === "kreuz" ? 6 : id === "blast" ? 6 : id === "letters" ? 5 : 3)) return toast("Dafür brauchst du mehr Wörter im gewählten Bereich (einzelne Wörter ab 3 Buchstaben).");
    S.rollDay();
    G = { id: id, words: words, i: 0, score: 0, res: [], items: 0, correct: 0, wrong: 0, hints: 0, start: Date.now(), done: false, opts: opts || null, maxStreak: 0, streak: 0, cleared: 0 };
    el.hidden = false; document.documentElement.classList.add("ar-open");
    if (id === "detective") return detRound();
    if (id === "eisi") return eisRound();
    if (id === "kreuz") return kreuzStart();
    if (id === "blast") return blastStart();
    if (id === "letters") return lettersStart();
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
      '<div class="wg-acts"><button class="wg-btn" data-g="guess" id="wgGo">✓ Prüfen</button></div><div class="wg-acts"><button class="wg-btn ghost" data-g="hint">💡 Erster Buchstabe (−25)</button><button class="wg-btn ghost" data-g="giveup">Aufgeben</button></div></div>';
    detPaint();
  }
  function detPaint() {
    var d = G.det, n = G.words[G.i].en.length, row = $("[data-row='" + d.rows.length + "']");
    if (!row) return;
    var cells = $$(".wt", row), i;
    for (i = 0; i < n; i++) { cells[i].textContent = (d.cur[i] || "").toUpperCase(); cells[i].classList.toggle("on", i === d.cur.length && !d.over); }
    var go = $("#wgGo"); if (go) go.classList.toggle("ready", d.cur.length >= n && !d.over);
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
    $$(".wg-acts").forEach(function (a, ix) { a.innerHTML = ix ? "" : '<button class="wg-btn" data-g="say">🔊 Anhören</button><button class="wg-btn" data-g="next">' + (G.i + 1 >= G.words.length ? "Fertig ▶" : "Weiter ▶") + '</button>'; });
    say(w.raw);
  }

  /* ================= Rette Eisi ================= */
  function eisRound() {
    var w = G.words[G.i];
    G.eis = { guessed: {}, wrong: 0, over: false, hinted: false };
    el.innerHTML = top("Freezy") + dots() +
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
    var m = $("#wgMsg"); if (m) m.innerHTML = win ? '<span class="good">✓ Icy ist gerettet! +' + pts + '</span> · ' + esc(w.en) + ' = ' + esc(w.de) : '<span class="bad">Icy ist ins Wasser gefallen.</span> Gesucht war: <b>' + esc(w.en) + '</b>';
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
      var first = ws[0], bnd = { r0: 0, r1: 0, c0: 0, c1: first.en.length - 1 }; for (i = 0; i < first.en.length; i++) { map["0," + i] = first.en[i]; dirAt["0," + i] = 0; }
      placed.push({ w: first, r: 0, c: 0, dir: 0 });
      ws.slice(1).forEach(function (w) {
        if (placed.length >= target) return;
        var opts = [];
        placed.forEach(function (p) {
          for (var a = 0; a < p.w.en.length; a++) for (var b = 0; b < w.en.length; b++) {
            if (p.w.en[a] !== w.en[b]) continue;
            var dir = 1 - p.dir, r = p.r + DIRS[p.dir][0] * a, c = p.c + DIRS[p.dir][1] * a;
            var sr = r - DIRS[dir][0] * b, sc = c - DIRS[dir][1] * b;
            var er = sr + DIRS[dir][0] * (w.en.length - 1), ec = sc + DIRS[dir][1] * (w.en.length - 1);
            if (Math.max(bnd.r1, er) - Math.min(bnd.r0, sr) + 1 > maxDim || Math.max(bnd.c1, ec) - Math.min(bnd.c0, sc) + 1 > maxDim) continue;   // Raster soll nicht größer werden als aufs Handy passt
            if (canPlace(map, dirAt, w.en, sr, sc, dir) >= 1) opts.push({ r: sr, c: sc, dir: dir, er: er, ec: ec });
          }
        });
        if (!opts.length) return;
        var pick = opts[Math.floor(Math.random() * opts.length)];
        for (var j = 0; j < w.en.length; j++) { var kk = (pick.r + DIRS[pick.dir][0] * j) + "," + (pick.c + DIRS[pick.dir][1] * j); map[kk] = w.en[j]; dirAt[kk] = dirAt[kk] === undefined ? pick.dir : dirAt[kk]; }
        bnd.r0 = Math.min(bnd.r0, pick.r); bnd.c0 = Math.min(bnd.c0, pick.c); bnd.r1 = Math.max(bnd.r1, pick.er); bnd.c1 = Math.max(bnd.c1, pick.ec);
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
    while ((!L || L.placed.length < 5) && tries++ < 6) { cands = pickWords(16, 3, 8, G.opts && (G.opts.units || G.opts.unit)); var L2 = layout(cands, 8, 9); if (L2 && (!L || L2.placed.length > L.placed.length)) L = L2; }
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
    var h = top("Xing") +
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


  /* ================= Blast (Wörter-Shooter) ================= */
  function blastStart() {
    var deck = pickWords(60, 2, 26, G.opts && (G.opts.units || G.opts.unit), true);
    G.words = deck; G.res = [];
    el.innerHTML = top("Blast") +
      '<div class="bl-hud"><span id="blLives"></span><span id="blLevel"></span><span id="blCombo"></span></div>' +
      '<div class="bl-prompt" id="blP"><small>Schieß das englische Wort ab</small><b id="blT"></b></div>' +
      '<div class="bl-field" id="blF"><div class="bl-ship" id="blS">🚀</div><div class="bl-flash" id="blFl"></div></div>' +
      '<div class="bl-ctl"><button type="button" id="blL" aria-label="Nach links">◀</button><button type="button" id="blR" aria-label="Nach rechts">▶</button></div>';
    var F = $("#blF");
    G.sh = { px: 0, dir: 0, keys: {}, lives: 3, level: 1, hits: 0, queue: [], target: null, foes: [], freeze: 0, lastSpawn: 0, nextOrb: 9, t: 0, last: 0, id: 0, w: 0, h: 0, over: false };
    G.sh.w = F.clientWidth; G.sh.h = F.clientHeight; G.sh.px = G.sh.w / 2; blShipPos();
    [["blL", -1], ["blR", 1]].forEach(function (b) {   // Raumschiff steuern: Knopf gedrückt halten (oder Pfeiltasten / A und D)
      var btn = $("#" + b[0]), on = function (e) { e.preventDefault(); if (G && G.sh) G.sh.dir = b[1]; }, off = function () { if (G && G.sh && G.sh.dir === b[1]) G.sh.dir = 0; };
      btn.addEventListener("pointerdown", on); btn.addEventListener("pointerup", off); btn.addEventListener("pointerleave", off); btn.addEventListener("pointercancel", off);
    });
    if (!blKeys) { blKeys = true; document.addEventListener("keydown", function (e) { blKey(e, 1); }); document.addEventListener("keyup", function (e) { blKey(e, 0); }); }
    F.addEventListener("pointerdown", function (e) { if (!G || !G.sh || G.sh.over) return; var f = e.target.closest(".foe"); if (!f) return; e.preventDefault(); blShoot(+f.getAttribute("data-fid"), e.clientX, e.clientY); });
    blNextTarget(); blHud();
    G.sh.last = performance.now(); G.sh.raf = requestAnimationFrame(blLoop);
  }
  var blKeys = false;
  function blKey(e, down) {
    if (!G || G.id !== "blast" || !G.sh || G.sh.over) return;
    var k = e.key, d = k === "ArrowLeft" || k === "a" || k === "A" ? -1 : k === "ArrowRight" || k === "d" || k === "D" ? 1 : 0; if (!d) return;
    e.preventDefault(); G.sh.keys[d] = down; G.sh.dir = G.sh.keys[1] && !G.sh.keys[-1] ? 1 : G.sh.keys[-1] && !G.sh.keys[1] ? -1 : 0;
  }
  function blShipPos() {   // das 🚀-Emoji zeigt von Haus aus schräg nach rechts oben (45°): zurückdrehen, damit es nach oben schaut; beim Steuern leicht in die Fahrtrichtung kippen
    var s = $("#blS"); if (!s || !G || !G.sh) return; s.style.left = G.sh.px + "px";
    var tilt = (G.sh.dir || 0) * 14; if (s._tilt !== tilt) { s._tilt = tilt; s.style.transform = "rotate(" + (tilt - 45) + "deg)"; }
  }
  function blHud() {
    var sh = G.sh, l = "", i; for (i = 0; i < Math.max(3, sh.lives); i++) l += '<i class="' + (i < sh.lives ? "" : "off") + '">♥</i>';
    $("#blLives").innerHTML = l; $("#blLevel").textContent = "Level " + sh.level;
    var hard = G.streak > 10;   // mehr als 10 Treffer in Folge: Hardcore (schneller, mehr Wörter, wackelnde Bahnen), endet mit dem ersten Fehler
    if (hard !== !!sh.hard) { sh.hard = hard; blFlash(hard ? "🔥 Hardcore!" : "Hardcore vorbei", hard ? "combo" : "bad"); }
    var c = $("#blCombo"); if (c) c.textContent = G.streak >= 3 ? "×" + Math.min(3, 1 + G.streak * 0.1).toFixed(1) + " Serie " + G.streak + (hard ? " 🔥" : "") : "";
  }
  function blFlash(t, cls) { var f = $("#blFl"); if (!f) return; f.textContent = t; f.className = "bl-flash show " + (cls || ""); clearTimeout(f._t); f._t = setTimeout(function () { f.className = "bl-flash"; }, 1100); }
  function blNextTarget() {
    var sh = G.sh; if (!sh.queue.length) sh.queue = S.shuffle(G.words.slice());
    sh.target = sh.queue.shift(); $("#blT").textContent = sh.target.de;
    var P = $("#blP"); P.classList.remove("pop"); void P.offsetWidth; P.classList.add("pop");
  }
  /* Wörter in Blast sehen nicht alle gleich aus: leicht zufällige Größe; Wortgruppen werden zufällig umgebrochen (schmal, mehrzeilig) oder einzeilig kleiner geschrieben.
     Sehr lange Einzeiler werden so weit verkleinert, dass sie ins Feld passen. */
  function blFit(d) {
    var base = parseFloat(getComputedStyle(d).fontSize), n = d.textContent.length, maxW = G.sh.w * 0.92, f = 0.92 + Math.random() * 0.2;
    if (!base) return;
    if (n > 12 && /\s/.test(d.textContent)) {
      if (Math.random() < 0.5) { d.style.maxWidth = Math.round(38 + Math.random() * 22) + "%"; f *= n > 22 ? 0.9 : 1; }   // umbrechen
      else { d.style.whiteSpace = "nowrap"; f *= n <= 18 ? 0.9 : n <= 22 ? 0.8 : 0.7; }   // kleiner, eine Zeile
    } else if (n > 12) f *= n <= 18 ? 0.9 : 0.8;
    d.style.fontSize = (Math.round(base * f * 10) / 10) + "px";
    if (d.style.whiteSpace === "nowrap" && d.offsetWidth > maxW) d.style.fontSize = (Math.floor(base * f * maxW / d.offsetWidth * 10) / 10) + "px";
  }
  function blSpawn(w, kind) {
    var sh = G.sh, F = $("#blF"), d = document.createElement("div"), id = ++sh.id;
    d.className = "foe" + (kind ? " orb" : ""); d.setAttribute("data-fid", id); d.textContent = kind ? (kind === "freeze" ? "❄️" : "💣") : w.raw;
    d.style.setProperty("--h", kind ? (kind === "freeze" ? 195 : 20) : Math.floor(Math.random() * 360));
    F.appendChild(d); if (!kind) blFit(d);
    var fw = d.offsetWidth, x = 8 + Math.random() * Math.max(1, sh.w - fw - 16);
    var o = { id: id, el: d, w: w, kind: kind || null, x: x, y: -44, fw: fw, fh: d.offsetHeight, ph: Math.random() * 6 };
    d.style.transform = "translate3d(" + x + "px," + o.y + "px,0)"; sh.foes.push(o); return o;
  }
  function blBoom(o, bad) {
    o.dead = true; var r = o.el.getBoundingClientRect();
    o.el.classList.add("boom"); if (bad) o.el.classList.add("bad"); setTimeout(function () { if (o.el.parentNode) o.el.parentNode.removeChild(o.el); }, 280);
    try { global.VTC.burst(bad ? "stars" : S.state.profile.fx, r.left + r.width / 2, r.top + r.height / 2, bad ? 6 : 12, .9); } catch (e) {}
  }
  function blLaser(px, py) {
    var F = $("#blF"), fr = F.getBoundingClientRect(), sx = G.sh.px, sy = fr.height - 24, tx = px - fr.left, ty = py - fr.top, dx = tx - sx, dy = ty - sy;
    var L = document.createElement("div"); L.className = "bl-laser"; L.style.cssText = "left:" + sx + "px;top:" + sy + "px;width:" + Math.sqrt(dx * dx + dy * dy) + "px;transform:rotate(" + Math.atan2(dy, dx) + "rad)";
    F.appendChild(L); setTimeout(function () { if (L.parentNode) L.parentNode.removeChild(L); }, 130);
  }
  function blLose(why, askedWord) {
    var sh = G.sh; sh.lives--; G.wrong++; G.streak = 0; snd(false);
    try { if (navigator.vibrate) navigator.vibrate(40); } catch (e) {}
    var F = $("#blF"); F.classList.remove("hurt"); void F.offsetWidth; F.classList.add("hurt");
    if (askedWord) { try { if (global.WordySync) global.WordySync.ctx = { mode: "arena" }; S.grade(askedWord.id, 0); } catch (e) {} }
    blHud(); paintScore();
    if (sh.lives <= 0) { sh.over = true; cancelAnimationFrame(sh.raf); setTimeout(function () { if (G && G.id === "blast") finish("dead"); }, 700); }
  }
  function blShoot(fid, px, py) {
    var sh = G.sh, o = sh.foes.filter(function (f) { return f.id === fid && !f.dead; })[0]; if (!o) return;
    blLaser(px, py);
    if (o.kind === "freeze") { sh.freeze = 5; blBoom(o); blFlash("❄️ Alles langsamer!", "good"); snd(true); return; }
    if (o.kind === "bomb") { sh.foes.forEach(function (f) { if (!f.dead && !f.kind && f.w.id !== sh.target.id) { blBoom(f, true); } }); blBoom(o); blFlash("💥 Falsche Wörter weg!", "good"); snd(true); return; }
    if (o.w.id === sh.target.id) {
      var t = sh.target; blBoom(o);
      G.items++; G.correct++; G.streak++; G.maxStreak = Math.max(G.maxStreak, G.streak); sh.hits++;
      var pts = Math.round((10 + sh.level * 2) * Math.min(3, 1 + G.streak * 0.1)); G.score += pts;
      try { if (global.WordySync) global.WordySync.ctx = { mode: "arena" }; S.grade(t.id, 1); } catch (e) {}
      snd(true); blFlash("+" + pts, G.streak >= 5 ? "combo" : "good");
      if (sh.hits % 5 === 0) { sh.level++; blFlash("Level " + sh.level + " · schneller!", "combo"); }
      if (sh.hits % 10 === 0 && sh.lives < 5) { sh.lives++; blFlash("♥ Extra-Herz!", "combo"); }
      blNextTarget(); blHud(); paintScore();
    } else {
      blBoom(o, true); blFlash("Falsch: " + o.w.raw + " = " + o.w.de, "bad"); G.items++; blLose("falsch", sh.target);
    }
  }
  function blLoop(now) {
    if (!G || !G.sh || G.sh.over) return;
    if (G.sh.paused) { G.sh.raf = requestAnimationFrame(blLoop); return; }
    var sh = G.sh, dt = Math.min(0.05, (now - sh.last) / 1000); sh.last = now; sh.t += dt;
    if (sh.freeze > 0) sh.freeze -= dt;
    var F = $("#blF"); F.classList.toggle("frozen", sh.freeze > 0);
    var v = Math.min(200, 44 * Math.pow(1.12, sh.level - 1)) * (sh.freeze > 0 ? 0.2 : 1) * (sh.hard ? 1.3 : 1)   /* alle 5 Treffer ein Level: ca. 12 % schneller */, bottom = sh.h - 54;
    if (sh.dir) sh.px = Math.max(22, Math.min(sh.w - 22, sh.px + sh.dir * 300 * dt));
    blShipPos();
    sh.foes.forEach(function (o) {
      if (o.dead) return;
      var ox = Math.max(0, Math.min(sh.w - o.fw, o.x + Math.sin(sh.t * (sh.hard ? 2.2 : 1.3) + o.ph) * (sh.hard ? 28 : 6)));
      o.y += v * dt; o.el.style.transform = "translate3d(" + ox + "px," + o.y + "px,0)";
      if (!o.kind && o.y + (o.fh || 34) > sh.h - 46 && o.y < sh.h - 8 && ox < sh.px + 18 && ox + o.fw > sh.px - 18) {   // Raumschiff berührt ein Wort: ein Herz weg
        var ct = sh.target && o.w.id === sh.target.id; blBoom(o, true);
        if (ct) { var t0 = sh.target; blFlash("Getroffen: " + t0.en + " = " + t0.de, "bad"); G.items++; blNextTarget(); blLose("berührt", t0); }
        else { blFlash("Autsch! Ausweichen!", "bad"); blLose("berührt"); }
        return;
      }
      if (o.y > bottom) {
        o.dead = true; if (o.el.parentNode) o.el.parentNode.removeChild(o.el);
        if (!o.kind && sh.target && o.w.id === sh.target.id) { var t = sh.target; blFlash("Verpasst: " + t.en + " = " + t.de, "bad"); G.items++; blNextTarget(); blLose("verpasst", t); }
      }
    });
    sh.foes = sh.foes.filter(function (o) { return !o.dead; });
    var want = 4 + Math.min(3, Math.floor(sh.level / 2)) + (sh.hard ? 2 : 0), plain = sh.foes.filter(function (o) { return !o.kind; });
    if (sh.t - sh.lastSpawn > Math.max(0.5, 1.3 - sh.level * 0.05) * (sh.hard ? 0.7 : 1) && plain.length < want) {
      sh.lastSpawn = sh.t;
      var hasT = plain.some(function (o) { return o.w.id === sh.target.id; }), w;
      if (!hasT) w = sh.target; else { var pool = G.words.filter(function (x) { return x.id !== sh.target.id && x.en !== sh.target.en && !plain.some(function (o) { return o.w.id === x.id; }); }); w = pool[Math.floor(Math.random() * pool.length)]; }
      if (w) blSpawn(w);
    }
    if (sh.t > sh.nextOrb) { sh.nextOrb = sh.t + 12 + Math.random() * 6; blSpawn(null, Math.random() < .5 ? "freeze" : "bomb"); }
    sh.raf = requestAnimationFrame(blLoop);
  }


  /* ================= Letters (Buchstabensalat) ================= */
  var LDIRS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];   // alle acht Richtungen, auch rückwärts
  function lettersBuild(words, N) {
    var grid = [], placed = [], r, c, i;
    for (r = 0; r < N; r++) { grid[r] = []; for (c = 0; c < N; c++) grid[r][c] = ""; }
    var dirPool = S.shuffle([0, 1, 2, 3, 4, 5, 6, 7]);   // jedem Wort eine eigene Richtung zuweisen, damit Diagonale und Rückwärts sicher vorkommen
    words.slice().sort(function (a, b) { return b.en.length - a.en.length; }).forEach(function (w, wi) {
      var tries, cands = [], len = w.en.length;
      for (tries = 0; tries < 500; tries++) {
        var d = LDIRS[tries < 250 ? dirPool[wi % 8] : Math.floor(Math.random() * 8)], sr = Math.floor(Math.random() * N), sc = Math.floor(Math.random() * N);
        var er = sr + d[0] * (len - 1), ec = sc + d[1] * (len - 1);
        if (er < 0 || er >= N || ec < 0 || ec >= N) continue;
        var ok = true, shared = 0; for (i = 0; i < len && ok; i++) { var g = grid[sr + d[0] * i][sc + d[1] * i]; if (g) { if (g !== w.en[i]) ok = false; else shared++; } }
        if (!ok || shared >= len) continue;   // Überschneiden ist erlaubt (gleiche Buchstaben), aber das Wort darf nicht komplett in einem anderen stecken
        cands.push({ d: d, r: sr, c: sc, shared: shared });
        if (cands.length >= 40) break;
      }
      if (!cands.length) return;
      var most = Math.max.apply(null, cands.map(function (x) { return x.shared; })), top = cands.filter(function (x) { return x.shared === most; }), pick = top[Math.floor(Math.random() * top.length)];
      for (i = 0; i < len; i++) grid[pick.r + pick.d[0] * i][pick.c + pick.d[1] * i] = w.en[i];
      placed.push({ w: w, r: pick.r, c: pick.c, d: pick.d, found: false, hue: 0 });
    });
    var abc = "eeeeaaaiioonnrrsstttlldcuhmpbgfywkvxzjq";   // häufige Buchstaben öfter, damit es nach Englisch aussieht
    for (r = 0; r < N; r++) for (c = 0; c < N; c++) if (!grid[r][c]) grid[r][c] = abc[Math.floor(Math.random() * abc.length)];
    return { grid: grid, placed: placed };
  }
  function lettersStart() {
    var N = 9, B = null, tries = 0;
    while (tries++ < 8) { B = lettersBuild(G.words.slice(0, 7), N); if (B.placed.length >= 5) break; G.words = pickWords(7, 3, 8, G.opts && (G.opts.units || G.opts.unit)); }
    if (!B || B.placed.length < 4) { close(); return toast("Das Rätsel ließ sich nicht bauen. Versuch es gleich noch einmal."); }
    B.placed.forEach(function (p, i) { p.hue = Math.round(i * 360 / B.placed.length + 20); });
    G.words = B.placed.map(function (p) { return p.w; }); G.res = [];
    G.ls = { N: N, grid: B.grid, placed: B.placed, found: 0, sel: [], start: null, drag: false, last: Date.now(), hintsAt: null, cellOf: {} };
    var h = top("Letters") +
      '<div class="wg-body"><div class="ls-cur" id="lsCur">&nbsp;</div>' +
      '<div class="ls-grid" id="lsGrid" style="--n:' + N + '">';
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) h += '<div class="lc" data-r="' + r + '" data-c="' + c + '">' + B.grid[r][c] + '</div>';
    h += '</div><div class="wg-msg" id="wgMsg">Wische über ein Wort. Tippe auf einen Hinweis für einen Tipp.</div><div class="ls-list" id="lsList"></div></div>';
    el.innerHTML = h; lsList(); lsEvents();
  }
  function lsList() {
    var L = G.ls; $("#lsList").innerHTML = L.placed.map(function (p, i) {
      return '<button class="ls-it' + (p.found ? " done" : "") + '" data-g="lshint" data-i="' + i + '"' + (p.found ? ' style="border-color:hsl(' + p.hue + ' 55% 50%)"' : "") + '>' + esc(p.w.de) + ' <small>(' + p.w.en.length + ')</small>' + (p.found ? ' <b>' + esc(p.w.raw) + '</b>' : "") + '</button>';
    }).join("");
  }
  function lsCell(r, c) { return $("[data-r='" + r + "'][data-c='" + c + "']"); }
  function lsPaintSel() {
    var L = G.ls; $$(".lc.sel").forEach(function (e) { e.classList.remove("sel"); });
    var txt = ""; L.sel.forEach(function (rc) { var e = lsCell(rc[0], rc[1]); if (e) e.classList.add("sel"); txt += L.grid[rc[0]][rc[1]]; });
    $("#lsCur").textContent = txt.toUpperCase() || " ";
  }
  function lsLine(a, b) {   // gerade Linie (acht Richtungen) von a zu b; rastet auf die nächste Richtung ein
    var L = G.ls, dr = b[0] - a[0], dc = b[1] - a[1];
    if (!dr && !dc) return [a];
    var k = Math.round(Math.atan2(dr, dc) / (Math.PI / 4)), ang = k * Math.PI / 4, sr = Math.round(Math.sin(ang)), sc = Math.round(Math.cos(ang));
    var len = Math.max(0, Math.round((dr * sr + dc * sc) / (sr * sr + sc * sc))), out = [];
    while (len > 0 && (a[0] + sr * len < 0 || a[0] + sr * len >= L.N || a[1] + sc * len < 0 || a[1] + sc * len >= L.N)) len--;
    for (var i = 0; i <= len; i++) out.push([a[0] + sr * i, a[1] + sc * i]);
    return out;
  }
  function lsFromPoint(e) {
    var g = $("#lsGrid"), r = g.getBoundingClientRect(), L = G.ls, c = Math.floor((e.clientX - r.left) / r.width * L.N), rr = Math.floor((e.clientY - r.top) / r.height * L.N);
    return [Math.max(0, Math.min(L.N - 1, rr)), Math.max(0, Math.min(L.N - 1, c))];
  }
  function lsEvents() {
    var g = $("#lsGrid"), L = G.ls;
    g.addEventListener("pointerdown", function (e) {
      if (!G || G.done) return; e.preventDefault(); try { g.setPointerCapture(e.pointerId); } catch (x) {}
      var p = lsFromPoint(e);
      if (L.tap && !(L.tap[0] === p[0] && L.tap[1] === p[1])) { var line = lsLine(L.tap, p); L.sel = line; L.tap = null; lsPaintSel(); return lsCheck(); }   // Tippen-Tippen: Start und Ende
      L.start = p; L.drag = true; L.moved = false; L.sel = [p]; lsPaintSel();
    });
    g.addEventListener("pointermove", function (e) {
      if (!L.drag) return; var p = lsFromPoint(e); if (p[0] !== L.start[0] || p[1] !== L.start[1]) L.moved = true;
      L.sel = lsLine(L.start, p); lsPaintSel();
    });
    function up() {
      if (!L.drag) return; L.drag = false;
      if (!L.moved) { L.tap = L.start; return; }   // einfacher Tipp: Start gemerkt, nächster Tipp ist das Ende
      L.tap = null; lsCheck();
    }
    g.addEventListener("pointerup", up); g.addEventListener("pointercancel", function () { L.drag = false; L.sel = []; lsPaintSel(); });
  }
  function lsCheck() {
    var L = G.ls, txt = L.sel.map(function (rc) { return L.grid[rc[0]][rc[1]]; }).join(""), rev = txt.split("").reverse().join(""), hit = null;
    if (txt.length >= 2) L.placed.forEach(function (p) { if (!p.found && (p.w.en === txt || p.w.en === rev)) hit = p; });
    if (!hit) {
      if (txt.length >= 2) { G.wrong++; G.score = Math.max(0, G.score - 2); paintScore(); snd(false); var m = $("#wgMsg"); if (m) m.innerHTML = '<span class="bad">Das ist keins der gesuchten Wörter.</span>'; }
      L.sel = []; L.tap = null; return lsPaintSel();
    }
    hit.found = true; L.found++;
    L.sel.forEach(function (rc) { var e = lsCell(rc[0], rc[1]); if (e) { e.style.setProperty("--fh", hit.hue); e.classList.add("f"); } });
    var quick = Math.max(0, 10 - Math.floor((Date.now() - L.last) / 3000)), pts = 20 + quick - (hit.hinted ? 8 : 0);
    L.last = Date.now(); G.score += pts; G.items++; G.correct++; G.streak++; G.maxStreak = Math.max(G.maxStreak, G.streak);
    try { if (global.WordySync) global.WordySync.ctx = { mode: "arena" }; S.grade(hit.w.id, 1, hit.hinted ? { hint: true } : undefined); } catch (e) {}
    snd(true); burst(10); paintScore(); L.sel = []; lsPaintSel(); lsList();
    var m = $("#wgMsg"); if (m) m.innerHTML = '<span class="good">✓ ' + esc(hit.w.raw) + ' = ' + esc(hit.w.de) + ' +' + pts + '</span> · noch ' + (L.placed.length - L.found); 
    say(hit.w.raw);
    if (L.found >= L.placed.length) { G.score += 30; paintScore(); setTimeout(function () { finish("done"); }, 1100); }
  }
  function lsHint(i) {
    var L = G.ls, p = L.placed[i]; if (!p || p.found) return;
    if (!p.hinted) { p.hinted = true; G.hints++; G.score = Math.max(0, G.score - 8); paintScore(); }
    var e = lsCell(p.r, p.c); if (e) { e.classList.add("hint"); setTimeout(function () { e.classList.remove("hint"); }, 1800); }
    var m = $("#wgMsg"); if (m) m.textContent = "Tipp: Das Wort fängt an der markierten Stelle an (" + p.w.en.length + " Buchstaben).";
  }

  /* ---------- Ende ---------- */
  function finish(reason) {
    if (!G || G.done) return; G.done = true; if (G.sh) { G.sh.over = true; cancelAnimationFrame(G.sh.raf); }
    if (G.id === "letters" && G.ls) G.items = G.words.length;
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
    if (G && G.sh) { G.sh.over = true; cancelAnimationFrame(G.sh.raf); }
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
    var t0 = e.target.closest("[data-g]"), a0 = t0 && t0.getAttribute("data-g");
    if (a0 === "introgo" && pending) { var pd = pending; pending = null; (S.state.settings.gameIntro || (S.state.settings.gameIntro = {}))[pd.id] = 1; try { S.save(); } catch (x) {} el.innerHTML = ""; return start(pd.id, Object.assign({}, pd.opts || {}, { _intro: true })); }
    if (a0 === "introx") { pending = null; el.hidden = true; el.innerHTML = ""; document.documentElement.classList.remove("ar-open"); return; }
    if (a0 === "help") return showHelp();
    if (a0 === "helpx") return hideHelp();
    var t = e.target.closest("[data-g]"); if (!t || !G) { if (t && !G && /^(exit|again|quit)$/.test(t.getAttribute("data-g"))) close(); return; }
    var a = t.getAttribute("data-g");
    if (a === "quit") { if (G.done) return close(); return G.items || G.score ? finish("quit") : close(); }
    if (a === "exit") return close();
    if (a === "again") { var id = G.id, o = G.opts; G = null; return start(id, o); }
    if (G.done) return;
    if (a === "k") { var k = t.getAttribute("data-k"); return G.id === "detective" ? detType(k) : G.id === "eisi" ? eisType(k) : kreuzType(k); }
    if (a === "next") return next();
    if (a === "guess") return detType("ENTER");
    if (a === "say") return say(G.words[G.i].raw);
    if (a === "hint") {
      if (G.id === "detective") { var d = G.det; if (d.hinted || d.over) return; d.hinted = true; G.hints++; d.cur = G.words[G.i].en[0]; return detPaint(); }
      if (G.id === "eisi") { var es = G.eis, w = G.words[G.i]; if (es.over) return; var un = w.en.split("").filter(function (c) { return !es.guessed[c]; }); if (!un.length) return; var pick = un[Math.floor(Math.random() * un.length)]; es.hinted = true; G.hints++; es.guessed[pick] = true; setKey(pick, "g"); es.wrong++; eisPaint(); if (w.en.split("").every(function (c) { return es.guessed[c]; })) return eisEnd(true); if (es.wrong >= 6) eisEnd(false); return; }
      return kreuzHint();
    }
    if (a === "giveup") { if (G.id === "detective" && !G.det.over) { G.det.over = true; return detEnd(false); } if (G.id === "eisi" && !G.eis.over) return eisEnd(false); return; }
    if (a === "lshint") return lsHint(+t.getAttribute("data-i"));
    if (a === "cell") return kreuzSelect(t.getAttribute("data-k"));
    if (a === "word") { var wi = +t.getAttribute("data-wi"); G.kr.sel.wi = wi; var kw = G.kr.words[wi], first = kw.keys.filter(function (k) { return G.kr.cells[k].ent !== G.kr.cells[k].ch; })[0] || kw.keys[0]; G.kr.sel.k = first; return kreuzPaint(); }
    if (a === "check") { kreuzCheckWords(true); kreuzPaint(); return kreuzWin(); }
  });
  document.addEventListener("keydown", function (e) {
    if (!G || el.hidden || G.done) return;
    if (e.key === "Escape") return finish("quit");
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (G.id === "blast") { if (/^[1-9]$/.test(e.key) && G.sh && !G.sh.over) { var fs = G.sh.foes.filter(function (f) { return !f.dead; }).sort(function (a, b) { return a.x - b.x; }), f = fs[+e.key - 1]; if (f) { var r = f.el.getBoundingClientRect(); blShoot(f.id, r.left + r.width / 2, r.top + r.height / 2); } } return; }
    var k = e.key === "Backspace" ? "BACK" : e.key === "Enter" ? "ENTER" : /^[a-zA-Z]$/.test(e.key) ? e.key.toUpperCase() : null; if (!k) return;
    e.preventDefault();
    if (G.id === "detective") detType(k); else if (G.id === "eisi") eisType(k); else if (G.id === "kreuz") kreuzType(k);
  });

  global.VTG = { GAMES: GAMES, start: start, best: best, open: function () { return !!G; }, _evalGuess: evalGuess, _layout: layout, _state: function () { return G; } };
})(window);
