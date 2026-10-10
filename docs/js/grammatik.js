/* Grammatik – Lektionen (Erklärkarte + 8 Übungen). Themen in data/grammatik.js, Optik der Arena (#arena, ar-* und wg-*). */
(function (global) {
  "use strict";
  var S = global.VT, el = document.getElementById("arena"), L = null, TOPICS = global.GRAMMAR || [];
  var PER_LESSON = 8;

  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function $(s, r) { return (r || el).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || el).querySelectorAll(s)); }
  function snd(ok) { try { if (S.state.settings.audio) global.VTC.sound(S.state.profile.snd, ok); } catch (e) {} }
  function say(t) { try { if (global.VTUI && global.VTUI.speak) global.VTUI.speak(t); } catch (e) {} }
  function toast(m) { try { global.VTUI.toast(m); } catch (e) {} }
  function topic(id) { return TOPICS.filter(function (t) { return t.id === id; })[0]; }
  function gs() { return S.state.gram || (S.state.gram = {}); }
  function rec(id) { var g = gs(); return g[id] || (g[id] = { lessons: 0, ok: {}, best: 0 }); }
  function plain(s) { return String(s).replace(/\[\[|\]\]/g, ""); }
  function hl(s) { return esc(s).replace(/\[\[(.+?)\]\]/g, "<u>$1</u>"); }
  function norm(s) { return String(s).toLowerCase().replace(/[.,!?;:"“”]/g, "").replace(/’/g, "'").replace(/\s+/g, " ").trim(); }

  /* ---------- Themenliste für die Ansicht ---------- */
  function list() {
    var prevDone = true;
    return TOPICS.map(function (t) {
      if (t.soon) return { id: t.id, icon: t.icon, title: t.title, book: t.book, short: t.short, soon: true, pct: 0, lessons: 0 };
      var r = rec(t.id), n = t.items.length, ok = Object.keys(r.ok).filter(function (k) { return r.ok[k]; }).length, pct = Math.round(ok * 100 / n);
      var o = { id: t.id, icon: t.icon, title: t.title, book: t.book, short: t.short, soon: false, pct: pct, lessons: r.lessons };
      return o;
    });
  }
  function next() {   // „Heute dran“: erstes Thema, das noch nicht sitzt
    var l = list().filter(function (x) { return !x.soon; }); return l.filter(function (x) { return x.pct < 100; })[0] || l[0] || null;
  }

  /* ---------- Lektion ---------- */
  function pickItems(t) {
    var r = rec(t.id), idx = t.items.map(function (x, i) { return i; }), open = S.shuffle(idx.filter(function (i) { return !r.ok[i]; })), done = S.shuffle(idx.filter(function (i) { return r.ok[i]; }));
    var pick = open.concat(done).slice(0, PER_LESSON);
    return S.shuffle(pick).map(function (i) { return { i: i, it: t.items[i], tries: 0 }; });
  }
  function start(id) {
    var t = topic(id); if (!t || t.soon) return toast("Dieses Thema kommt bald.");
    S.rollDay();
    L = { t: t, queue: pickItems(t), n: 0, score: 0, right: 0, wrong: 0, first: 0, start: Date.now(), done: false, retry: [], cur: null, answered: false, streak: 0, maxStreak: 0 };
    L.total = L.queue.length; L.orig = L.total; L.res = [];
    el.hidden = false; document.documentElement.classList.add("ar-open");
    showExplain(true);
  }
  function top(title) {
    return '<div class="ar-top"><button class="ar-x" data-gr="quit" aria-label="Lektion verlassen">✕</button><div class="wg-title">' + esc(title) + '</div>' +
      '<button class="ar-x" data-gr="help" aria-label="Erklärung">?</button><div class="ar-score"><b class="tnum" id="grScore">' + (L ? L.score : 0) + '</b><span>Punkte</span></div></div>';
  }
  function explainHtml(t, btn) {
    var e = t.explain;
    return '<div class="wg-help gr-help-s"><div class="wg-hicon">' + esc(t.icon) + '</div><h2>' + esc(t.title) + '</h2><p class="wg-hclaim">' + esc(t.book) + '</p>' +
      '<div class="gr-lead">' + e.lead + '</div><ul>' + e.points.map(function (p) { return '<li>' + p + '</li>'; }).join("") + '</ul>' +
      '<div class="gr-ex">' + e.examples.map(function (x, i) { return '<div class="gr-exi"><button class="gr-say" data-gr="say" data-i="' + i + '" aria-label="Anhören">🔊</button><div><div class="gr-en">' + hl(x.en) + '</div><div class="gr-de">' + esc(x.de) + '</div></div></div>'; }).join("") + '</div>' +
      '<div class="gr-merk">💡 ' + esc(e.merk) + '</div><div class="gr-go">' + btn + '</div></div>';
  }
  function showExplain(first) {
    var t = L.t;
    if (first) {
      el.innerHTML = top(t.title) + '<div class="wg-body">' + explainHtml(t, '<button class="wg-btn big" data-gr="go">Üben ▶ (' + L.total + ' Aufgaben)</button>') + '</div>';
    } else {
      if ($(".wg-help-ov")) return;
      var d = document.createElement("div"); d.className = "wg-help-ov"; d.innerHTML = explainHtml(t, '<button class="wg-btn big" data-gr="helpx">Weiter ▶</button>'); el.appendChild(d);
    }
  }
  function dots() {
    var h = ""; for (var i = 0; i < L.total; i++) h += '<i class="' + (i < L.n ? (L.res[i] ? "ok" : "no") : i === L.n ? "now" : "") + '"></i>'; return '<div class="wg-dots">' + h + '</div>';
  }
  function paintScore() { var s = $("#grScore"); if (s) s.textContent = L.score; }

  function nextTask() {
    if (!L.queue.length) return finish();
    L.cur = L.queue.shift(); L.answered = false; if (!L.res) L.res = [];
    var c = L.cur, it = c.it;
    var head = top(L.t.title) + dots() + '<div class="wg-body">';
    if (it.t === "choice") {
      c.opts = S.shuffle(it.opts.map(function (o, k) { return { t: o, ok: k === 0 }; }));
      el.innerHTML = head + '<div class="gr-q">' + esc(it.q).replace("____", '<span class="gr-blank">____</span>') + '</div><div class="gr-opts">' + c.opts.map(function (o, k) { return '<button class="gr-opt" data-gr="opt" data-k="' + k + '">' + esc(o.t) + '</button>'; }).join("") + '</div>' + fbBox() + '</div>';
    } else if (it.t === "type") {
      el.innerHTML = head + '<div class="gr-q">' + esc(it.q).replace("____", '<span class="gr-blank">____</span>') + '</div>' +
        '<input class="gr-in" id="grIn" type="text" autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Antwort tippen" aria-label="Antwort"><button class="wg-btn big" data-gr="check">✓ Prüfen</button>' + fbBox() + '</div>';
      setTimeout(function () { var i = $("#grIn"); if (i) i.focus(); }, 80);
    } else if (it.t === "order") {
      c.pool = S.shuffle(it.w.map(function (w, k) { return { w: w, id: k }; })); c.ans = [];
      el.innerHTML = head + '<div class="gr-qs">Bring die Wörter in die richtige Reihenfolge.</div><div class="gr-ans" id="grAns"></div><div class="gr-pool" id="grPool"></div><button class="wg-btn big" data-gr="check">✓ Prüfen</button>' + fbBox() + '</div>';
      orderPaint();
    } else if (it.t === "error") {
      c.toks = it.s.split(" "); c.stage = 1;
      el.innerHTML = head + '<div class="gr-qs">In diesem Satz steckt ein Fehler. Tippe das falsche Wort an.</div><div class="gr-toks" id="grToks">' + c.toks.map(function (w, k) { return '<button class="gr-tok" data-gr="tok" data-k="' + k + '">' + esc(w) + '</button>'; }).join("") + '</div><div id="grFix"></div>' + fbBox() + '</div>';
    }
  }
  function fbBox() { return '<div class="gr-fb" id="grFb" hidden></div>'; }
  function orderPaint() {
    var c = L.cur;
    $("#grAns").innerHTML = c.ans.map(function (o, k) { return '<button class="gr-tile on" data-gr="untile" data-k="' + k + '">' + esc(o.w) + '</button>'; }).join("") || '<span class="gr-hint">Tippe die Wörter unten an</span>';
    $("#grPool").innerHTML = c.pool.map(function (o, k) { return '<button class="gr-tile" data-gr="tile" data-k="' + k + '">' + esc(o.w) + '</button>'; }).join("");
  }
  function lock() { $$(".gr-opt,.gr-tile,.gr-tok,[data-gr=check],.gr-in").forEach(function (b) { b.disabled = true; }); }

  /* Ergebnis einer Aufgabe: ok = richtig, fullText = ganzer richtiger Satz */
  function answer(ok, full) {
    var c = L.cur; if (L.answered) return; L.answered = true; c.tries++;
    var r = rec(L.t.id);
    if (ok) {
      var pts = c.retry ? 5 : 10; L.score += pts; L.right++; if (!c.retry) L.first++; L.streak++; L.maxStreak = Math.max(L.maxStreak, L.streak);
      if (!c.retry) r.ok[c.i] = 1; L.res[L.n] = true; snd(true);
      try { global.VTC.burst(S.state.profile.fx, global.innerWidth / 2, global.innerHeight * .45, 8, .8); } catch (e) {}
    } else {
      L.wrong++; L.streak = 0; r.ok[c.i] = 0; L.res[L.n] = false; snd(false);
      if (!c.retry) { L.queue.push({ i: c.i, it: c.it, tries: 0, retry: true }); L.total++; }   // Fehler kommt am Ende noch einmal
    }
    L.n++;
    paintScore();
    var fb = $("#grFb"); fb.hidden = false; fb.className = "gr-fb " + (ok ? "good" : "bad");
    fb.innerHTML = '<b>' + (ok ? "Richtig!" : "Nicht ganz.") + '</b> ' + (full ? '<div class="gr-full">' + esc(full) + '</div>' : "") + '<div class="gr-why">' + esc(c.it.why) + '</div>' +
      '<div class="wg-acts" style="margin-top:8px"><button class="wg-btn" data-gr="say2">🔊 Anhören</button><button class="wg-btn" data-gr="next">' + (L.queue.length ? "Weiter ▶" : "Fertig ▶") + '</button></div>';
    lock(); if (full) { say(plain(full)); }
    try { fb.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) {}
  }

  function onOpt(k) {
    var c = L.cur, o = c.opts[+k], full = c.it.q.replace("____", c.it.opts[0]);
    $$(".gr-opt").forEach(function (b, j) { if (c.opts[j].ok) b.classList.add("right"); else if (+k === j) b.classList.add("wrong"); });
    answer(o.ok, full);
  }
  function onCheckType() {
    var c = L.cur, v = norm(($("#grIn") || {}).value || ""); if (!v) return toast("Schreib erst eine Antwort.");
    var ok = c.it.a.some(function (a) { return norm(a) === v; }); var i = $("#grIn"); if (i) i.classList.add(ok ? "right" : "wrong");
    answer(ok, c.it.full);
  }
  function onCheckOrder() {
    var c = L.cur; if (c.ans.length < c.it.w.length) return toast("Setze erst alle Wörter ein.");
    var ok = norm(c.ans.map(function (o) { return o.w; }).join(" ")) === norm(c.it.w.join(" "));
    var a = $("#grAns"); if (a) a.classList.add(ok ? "right" : "wrong");
    answer(ok, c.it.w.join(" "));
  }
  function onTok(k) {
    var c = L.cur; if (c.stage !== 1) return; k = +k;
    if (k !== c.it.bad) { $$(".gr-tok")[k].classList.add("wrong"); $$(".gr-tok")[c.it.bad].classList.add("right"); return answer(false, fixed(c, c.it.fix[0])); }
    $$(".gr-tok")[k].classList.add("sel"); c.stage = 2;
    c.fixOpts = S.shuffle(c.it.fix.map(function (o, j) { return { t: o, ok: j === 0 }; }));
    $("#grFix").innerHTML = '<div class="gr-qs" style="margin-top:10px">Wie heißt es richtig?</div><div class="gr-opts">' + c.fixOpts.map(function (o, j) { return '<button class="gr-opt" data-gr="fix" data-k="' + j + '">' + esc(o.t) + '</button>'; }).join("") + '</div>';
  }
  function fixed(c, w) { var t = c.toks.slice(); var tail = t[c.it.bad].match(/[.,!?]+$/); t[c.it.bad] = w + (tail ? tail[0] : ""); return t.join(" "); }
  function onFix(j) {
    var c = L.cur, o = c.fixOpts[+j];
    $$("#grFix .gr-opt").forEach(function (b, x) { if (c.fixOpts[x].ok) b.classList.add("right"); else if (+j === x) b.classList.add("wrong"); });
    if (!o.ok) $$(".gr-tok")[c.it.bad].classList.add("right");
    answer(o.ok, fixed(c, c.it.fix[0]));
  }

  /* ---------- Ende ---------- */
  function finish() {
    if (!L || L.done) return; L.done = true;
    var t = L.t, r = rec(t.id), sec = Math.round((Date.now() - L.start) / 1000), items = L.right + L.wrong, correct = L.right;
    r.lessons++; r.best = Math.max(r.best || 0, L.score); r.last = Date.now();
    var coins = Math.min(12, Math.floor(L.score / 8));
    if (global.WordySync) { global.WordySync.sessionEnd({ sec: sec, items: items, correct: correct, mode: "arena", sub: "grammar:" + t.id, score: L.score, coins: coins }); global.WordySync.ctx = null; }
    S.rollDay();
    var left = Math.max(0, 30 - (S.state.daily.arenaCoins || 0)), capped = coins > left; coins = Math.min(coins, left);
    S.state.daily.arenaCoins = (S.state.daily.arenaCoins || 0) + coins;
    coins = S.boost(coins); S.addCoins(coins); S.addXp(Math.min(40, Math.round(L.score / 2)));
    var rw = S.finishSession({ items: items, correct: correct, sec: sec, maxChain: L.maxStreak, newSeen: 0, boxSolved: 0, mastered: 0, sentOk: 0, arena: true });
    var info = list().filter(function (x) { return x.id === t.id; })[0], acc = items ? Math.round(correct * 100 / items) : 0;
    el.innerHTML = '<div class="ar-end"><div class="ar-endicon">' + (L.wrong === 0 ? "🏆" : esc(t.icon)) + '</div><h1>' + (L.wrong === 0 ? "Alles richtig!" : "Lektion geschafft!") + '</h1>' +
      '<div class="ar-big tnum">' + L.score + ' Punkte</div>' +
      '<div class="ar-stats"><div><b class="tnum">' + L.first + '/' + L.orig + '</b><span>gleich richtig</span></div><div><b class="tnum">' + acc + '%</b><span>Trefferquote</span></div><div><b class="tnum">' + info.pct + '%</b><span>Thema sitzt</span></div><div><b class="tnum">' + r.lessons + '</b><span>Lektionen</span></div></div>' +
      '<p class="ar-note">' + (coins ? "🪙 " + coins + " Münzen" + (capped ? " (Tageslimit erreicht)" : "") : "Diesmal keine Münzen") + (rw.goalReached ? " · Tagesziel erreicht" : "") + '</p>' +
      '<div class="ar-endbtns"><button class="ar-btn" data-gr="again">Noch eine Lektion</button><button class="ar-btn ghost" data-gr="exit">Zurück</button></div></div>';
    S.save(true);
    if (global.VTUI && global.VTUI.refreshHeader) global.VTUI.refreshHeader();
  }
  function close() {
    L = null; el.hidden = true; el.innerHTML = ""; document.documentElement.classList.remove("ar-open");
    if (global.VTUI && global.VTUI.afterArena) global.VTUI.afterArena();
  }

  /* ---------- Eingaben ---------- */
  el.addEventListener("click", function (e) {
    var t = e.target.closest("[data-gr]"); if (!t || !L) { if (t && !L && /^(exit|quit|again)$/.test(t.getAttribute("data-gr"))) close(); return; }
    var a = t.getAttribute("data-gr");
    if (a === "quit") { if (L.done) return close(); if (L.right + L.wrong > 0) { L.queue = []; return finish(); } return close(); }
    if (a === "exit") return close();
    if (a === "again") { var id = L.t.id; L = null; return start(id); }
    if (a === "help") return showExplain(false);
    if (a === "helpx") { var d = $(".wg-help-ov"); if (d) d.remove(); return; }
    if (a === "say") { var ex = L.t.explain.examples[+t.getAttribute("data-i")]; return say(plain(ex.en)); }
    if (L.done) return;
    if (a === "go") { L.res = []; return nextTask(); }
    if (a === "next") return nextTask();
    if (a === "say2") { var c0 = L.cur, it = c0.it; return say(plain(it.t === "choice" ? it.q.replace("____", it.opts[0]) : it.t === "type" ? it.full : it.t === "order" ? it.w.join(" ") : fixed(c0, it.fix[0]))); }
    if (a === "opt") return onOpt(t.getAttribute("data-k"));
    if (a === "fix") return onFix(t.getAttribute("data-k"));
    if (a === "tok") return onTok(t.getAttribute("data-k"));
    if (a === "check") { var c1 = L.cur; return c1.it.t === "type" ? onCheckType() : onCheckOrder(); }
    if (a === "tile") { var c2 = L.cur, k = +t.getAttribute("data-k"); c2.ans.push(c2.pool.splice(k, 1)[0]); return orderPaint(); }
    if (a === "untile") { var c3 = L.cur, k3 = +t.getAttribute("data-k"); c3.pool.push(c3.ans.splice(k3, 1)[0]); return orderPaint(); }
  });
  el.addEventListener("keydown", function (e) { if (L && !L.done && e.key === "Enter" && e.target && e.target.id === "grIn" && !L.answered) { e.preventDefault(); onCheckType(); } });

  global.VTGR = { list: list, next: next, start: start, topic: topic, _state: function () { return L; } };
})(window);
