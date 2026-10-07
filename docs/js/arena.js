/* Arena – vier Zeitmodi zum schnellen Üben.
   Eigene Spielfläche, eigene Optik, angebunden an die Wiederholungslogik. */
(function (global) {
  "use strict";
  var S = global.VT, el = document.getElementById("arena");

  var MODES = [
    { id: "match", icon: "⚡", name: "Match-Rausch",
      tag: "60 Sekunden", claim: "Fünf gegen fünf, so schnell du kannst.",
      desc: "Links fünf Wörter, rechts fünf Übersetzungen in zufälliger Reihenfolge. Jedes Paar, das sitzt, macht Platz für ein neues. Ein Fehlgriff kostet zwei Sekunden." },
    { id: "blitz", icon: "🔥", name: "Blitzrunde",
      tag: "Zeit sammeln", claim: "Jede richtige Antwort kauft dir Zeit.",
      desc: "Du startest mit 40 Sekunden. Richtig bringt anderthalb Sekunden zurück, falsch kostet drei. Die Runde endet, wenn die Uhr leer ist." },
    { id: "survival", icon: "💠", name: "Letztes Herz",
      tag: "Ein Fehler genügt", claim: "Wie weit kommst du ohne Patzer?",
      desc: "Pro Wort läuft ein kurzer Balken ab, und er wird alle fünf Treffer schneller. Ein Fehler oder eine abgelaufene Zeit beendet die Runde sofort." },
    { id: "hunt", icon: "🎯", name: "Fehlerjagd",
      tag: "90 Sekunden", claim: "Nur die Wörter, die dich ärgern.",
      desc: "Gespielt wird ausschließlich mit der Fehlerkartei. Jedes Wort muss zweimal sitzen, dann ist es erledigt. Schaffst du die Kartei leer?" }
  ];

  var run = null, timer = null;

  /* ---------- Hilfen ---------- */
  function esc(x) { return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }
  function $(s, r) { return (r || el).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || el).querySelectorAll(s)); }
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
  function key(id) { return id + ":" + S.state.settings.track; }
  function best(id) { var a = S.state.arena || {}; return a[key(id)] || { best: 0, plays: 0 }; }

  /* Wortpool: Fehlerkartei und fällige Wörter zuerst, dann der Rest */
  function pool(mode) {
    var p = S.pools(), list;
    if (mode === "hunt") {
      list = p.box.slice();
      if (list.length < 6) {
        var weak = p.all.filter(function (w) { var r = S.state.w[w.id]; return r && r.no > 0; });
        list = list.concat(weak.filter(function (w) { return list.indexOf(w) < 0; }));
      }
      if (list.length < 6) list = list.concat(S.shuffle(p.all.slice()).slice(0, 12 - list.length));
    } else {
      list = S.shuffle(p.box.slice()).concat(S.shuffle(p.due.slice()), S.shuffle(p.learning.slice()), S.shuffle(p.fresh.slice()));
    }
    var seenDe = {}, seenEn = {};
    return list.filter(function (w) {
      if (seenDe[w.de] || seenEn[w.en]) return false;
      seenDe[w.de] = seenEn[w.en] = 1; return true;
    });
  }
  function nextWord() {
    if (!run.queue.length) run.queue = run.opts && run.opts.words ? S.shuffle(run.opts.words.slice()) : pool(run.mode);
    return run.queue.shift();
  }
  function distractors(w, n) {
    var all = run.all.filter(function (x) { return x.id !== w.id && x.de !== w.de && x.en !== w.en; });
    var same = all.filter(function (x) { return x.unit === w.unit; });
    return S.shuffle(same).slice(0, n).concat(S.shuffle(all).slice(0, n)).slice(0, n);
  }

  /* ---------- Punkte ---------- */
  function hit(w, weight) {
    run.combo++; run.maxCombo = Math.max(run.maxCombo, run.combo);
    var mult = Math.min(3, 1 + run.combo * 0.1);
    var pts = Math.round(10 * mult * (weight || 1));
    run.score += pts; run.correct++; run.items++;
    var bn = $("#arNote"); if (bn && run.boss) bn.textContent = noteText();
    if (w) { if (global.WordySync) global.WordySync.ctx = { mode: "arena" }; S.grade(w.id, 1); }            // Tempo zählt als sichere, nicht als tiefe Wiederholung
    S.addXp(2);
    flash("+" + pts, run.combo >= 5 ? "combo" : "ok");
    var pr = S.state.profile;
    if (S.state.settings.audio) global.VTC.sound(pr.snd, true);
    global.VTC.burst(pr.fx, global.innerWidth / 2, global.innerHeight * .5, 10, .9);
    return pts;
  }
  function miss(w) {
    run.combo = 0; run.items++; run.wrong++;
    if (w) { if (global.WordySync) global.WordySync.ctx = { mode: "arena" }; S.grade(w.id, 0); }
    buzz(35);
    shake();
    if (S.state.settings.audio) global.VTC.sound(S.state.profile.snd, false);
  }
  function flash(text, kind) {
    var f = $("#arFlash"); if (!f) return;
    f.textContent = text; f.className = "ar-flash " + (kind || "ok") + " show";
    setTimeout(function () { if (f) f.className = "ar-flash " + (kind || "ok"); }, 420);
  }
  function shake() {
    var b = $("#arBoard"); if (!b) return;
    b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake");
  }

  /* ---------- Rahmen ---------- */
  function noteText() { return (run.boss ? "⚔️ Boss " + run.correct + " / " + run.boss.need + (run.boss.help ? " (erleichtert)" : "") + " · " : "") + (run.note || ""); }
  function chrome(inner) {
    var t = run.mode === "survival" ? "" :
      '<div class="ar-time"><i id="arBar" style="width:100%"></i></div>';
    return '<div class="ar-top">' +
      '<button class="ar-x" data-a="quit" aria-label="Arena verlassen">✕</button>' +
      '<div class="ar-clock tnum" id="arClock">' + fmt(run.left) + '</div>' +
      '<div class="ar-score"><b class="tnum" id="arScore">0</b><span>Punkte</span></div>' +
      '</div>' + t +
      '<div class="ar-sub"><span id="arCombo" class="ar-combo"></span><span id="arNote">' + esc(noteText()) + '</span></div>' +
      '<div class="ar-board" id="arBoard">' + inner + '</div>' +
      '<div class="ar-flash" id="arFlash"></div>';
  }
  function fmt(ms) {
    var s = Math.max(0, ms / 1000);
    return s >= 10 ? s.toFixed(0) : s.toFixed(1);
  }
  function paintHud() {
    var nt = $("#arNote"); if (nt && run.boss) nt.textContent = noteText();
    var c = $("#arClock"); if (c) c.textContent = fmt(run.left);
    var sc = $("#arScore"); if (sc) sc.textContent = run.score;
    var cb = $("#arCombo");
    if (cb) {
      cb.textContent = run.combo >= 3 ? "×" + (Math.min(3, 1 + run.combo * 0.1)).toFixed(1) + " Serie " + run.combo : "";
      cb.className = "ar-combo" + (run.combo >= 8 ? " hot" : "");
    }
    var bar = $("#arBar");
    if (bar) {
      var pct = Math.max(0, Math.min(100, run.left / run.total * 100));
      bar.style.width = pct + "%";
      bar.className = pct < 20 ? "low" : pct < 45 ? "mid" : "";
    }
    if (run.mode === "hunt") { var n = $("#arNote"); if (n) n.textContent = "Noch " + run.targets.length + " in der Kartei"; }
  }

  /* ---------- Takt ---------- */
  function startClock() {
    var last = Date.now();
    timer = setInterval(function () {
      if (!run) return stopClock();
      var now = Date.now(), d = now - last; last = now;
      run.left -= d;
      if (run.mode === "survival") {
        run.qLeft -= d;
        var qb = $("#arQbar");
        if (qb) {
          var p = Math.max(0, run.qLeft / run.qTotal * 100);
          qb.style.width = p + "%";
          qb.className = p < 30 ? "low" : p < 60 ? "mid" : "";
        }
        if (run.qLeft <= 0) { miss(run.cur); return finish("timeout"); }
        var c = $("#arClock"); if (c) c.textContent = run.correct;
        return;
      }
      if (run.left <= 0) { run.left = 0; paintHud(); return finish("time"); }
      paintHud();
    }, 90);
  }
  function stopClock() { if (timer) clearInterval(timer); timer = null; }

  /* ================= Modus 1: Match-Rausch ================= */
  function renderMatch() {
    run.left = run.total = 60000;
    run.dir = Math.random() < 0.5 ? "de2en" : "en2de";
    run.note = run.dir === "de2en" ? "Deutsch → Englisch" : "Englisch → Deutsch";
    run.left5 = []; run.right5 = []; run.sel = null;
    for (var i = 0; i < 5; i++) { var w = nextWord(); run.left5.push(w); run.right5.push(w); }
    run.right5 = S.shuffle(run.right5);
    el.innerHTML = chrome('<div class="ar-match" id="arMatch"></div>');
    paintMatch(); startClock();
  }
  function side(w, which) {
    return run.dir === "de2en" ? (which === "l" ? w.de : w.en) : (which === "l" ? w.en : w.de);
  }
  function paintMatch() {
    var m = $("#arMatch"); if (!m) return;
    m.innerHTML =
      '<div class="ar-col">' + run.left5.map(function (w, i) {
        return w ? '<button class="ar-tile' + (run.sel === i ? " sel" : "") + '" data-l="' + i + '">' + esc(side(w, "l")) + '</button>'
                 : '<span class="ar-tile gone"></span>';
      }).join("") + '</div>' +
      '<div class="ar-col">' + run.right5.map(function (w, i) {
        return w ? '<button class="ar-tile" data-r="' + i + '">' + esc(side(w, "r")) + '</button>'
                 : '<span class="ar-tile gone"></span>';
      }).join("") + '</div>';
  }
  function tapMatch(l, r) {
    if (l != null) {
      run.sel = run.sel === l ? null : l;
      $$("[data-l]").forEach(function (t) { t.classList.toggle("sel", +t.getAttribute("data-l") === run.sel); });
      return;
    }
    if (run.sel == null) return;
    var lw = run.left5[run.sel], rw = run.right5[r];
    if (!lw || !rw) return;
    if (lw.id === rw.id) {
      hit(lw, 1);
      var li = run.sel, ri = r;
      run.sel = null;
      var tiles = $$("[data-l='" + li + "'],[data-r='" + ri + "']");
      tiles.forEach(function (t) { t.classList.add("pop"); });
      setTimeout(function () {
        if (!run || run.mode !== "match") return;
        var nw = nextWord();
        run.left5[li] = nw; run.right5[ri] = nw;
        var swap = Math.floor(Math.random() * 5);        // neue Übersetzung nicht auf Höhe des Partners lassen
        var tmp = run.right5[ri]; run.right5[ri] = run.right5[swap]; run.right5[swap] = tmp;
        paintMatch();
      }, 150);
      paintHud();
    } else {
      miss(lw);
      run.left -= 2000;
      run.sel = null;
      var wrongTile = $("[data-r='" + r + "']");
      if (wrongTile) { wrongTile.classList.add("bad"); setTimeout(function () { wrongTile.classList.remove("bad"); }, 320); }
      $$("[data-l]").forEach(function (t) { t.classList.remove("sel"); });
      paintHud();
    }
  }

  /* ================= Modus 2 & 4: Karten mit Auswahl ================= */
  function renderCard() {
    var w = nextWord();
    if (run.mode === "hunt") {
      if (!run.targets.length) return finish("cleared");
      w = run.targets[Math.floor(Math.random() * run.targets.length)];
    }
    run.cur = w;
    var ask = Math.random() < 0.5 ? "en" : "de";
    run.ask = ask;
    var opts = S.shuffle(distractors(w, 3).map(function (x) { return { t: ask === "en" ? x.de : x.en, ok: false }; })
      .concat([{ t: ask === "en" ? w.de : w.en, ok: true }]));
    run.opts = opts;
    var qbar = run.mode === "survival"
      ? '<div class="ar-qbar"><i id="arQbar" style="width:100%"></i></div>' : "";
    var inner = '<div class="ar-card">' +
      '<div class="ar-ask">' + (ask === "en" ? "auf Deutsch" : "auf Englisch") + '</div>' +
      '<div class="ar-word">' + esc(ask === "en" ? w.en : w.de) + '</div>' + qbar +
      '<div class="ar-opts">' + opts.map(function (o, i) {
        return '<button class="ar-opt" data-o="' + i + '">' + esc(o.t) + '</button>';
      }).join("") + '</div></div>';
    if ($("#arBoard")) { $("#arBoard").innerHTML = inner; }
    else el.innerHTML = chrome(inner);
    if (run.mode === "survival") { run.qLeft = run.qTotal; var c = $("#arClock"); if (c) c.textContent = run.correct; }
    paintHud();
  }
  function tapOpt(i) {
    if (!run || run.locked) return;
    var o = run.opts[i], w = run.cur;
    var btns = $$(".ar-opt");
    if (o.ok) {
      btns[i].classList.add("right");
      hit(w, run.mode === "hunt" ? 1.4 : 1);
      if (run.mode === "blitz") run.left = Math.min(run.cap, run.left + 1500);
      if (run.mode === "survival") {
        if (run.correct % 5 === 0) run.qTotal = Math.max(2800, run.qTotal - 300);
      }
      if (run.mode === "hunt") {
        run.hits[w.id] = (run.hits[w.id] || 0) + 1;
        if (run.hits[w.id] >= 2) {
          run.targets = run.targets.filter(function (x) { return x.id !== w.id; });
          run.cleared++;
          flash("erledigt!", "combo");
          if (!run.targets.length) { paintHud(); return setTimeout(function () { finish("cleared"); }, 250); }
        }
      }
    } else {
      btns[i].classList.add("wrong");
      btns.forEach(function (b, j) { if (run.opts[j].ok) b.classList.add("right"); });
      miss(w);
      if (run.mode === "blitz") run.left -= 3000;
      if (run.mode === "hunt") { run.hits[w.id] = 0; run.left -= 2000; }
      if (run.mode === "survival") { paintHud(); run.locked = true; return setTimeout(function () { finish("dead"); }, 600); }
    }
    paintHud();
    run.locked = true;
    setTimeout(function () {
      if (!run) return;
      run.locked = false;
      if (run.left > 0 || run.mode === "survival") renderCard();
    }, o.ok ? 150 : 550);
  }

  /* ---------- Start & Ende ---------- */
  function start(mode, opts) {
    var p = S.pools();
    if (!(opts && opts.words) && p.all.length < 8) return global.VTUI.toast("Für die Arena brauchst du mindestens acht Wörter im gewählten Bereich.");
    if (mode === "hunt" && !p.box.length) global.VTUI.toast("Fehlerkartei ist leer – gespielt wird mit deinen wackeligsten Wörtern.");
    S.rollDay();
    run = {
      mode: mode, score: 0, combo: 0, maxCombo: 0, items: 0, correct: 0, wrong: 0,
      start: Date.now(), left: 0, total: 0, queue: [], all: opts && opts.words ? opts.words.concat(p.all.filter(function (x) { return opts.words.indexOf(x) < 0; })) : p.all, locked: false, opts: opts || null, boss: opts && opts.boss || null,
      qTotal: 7000, qLeft: 7000, targets: [], hits: {}, cleared: 0, note: ""
    };
    run.queue = opts && opts.words ? S.shuffle(opts.words.slice()) : pool(mode);
    el.hidden = false;
    document.documentElement.classList.add("ar-open");
    if (mode === "match") return renderMatch();
    if (mode === "blitz") { run.left = 40000; run.total = 60000; run.cap = 60000; run.note = "Richtig bringt Zeit, bis 60 Sekunden"; }
    if (mode === "survival") { run.left = run.total = 0; run.note = "Ein Fehler beendet die Runde"; }
    if (mode === "hunt") {
      run.left = run.total = 90000;
      run.targets = run.queue.slice(0, 10);
      run.note = "Noch " + run.targets.length + " in der Kartei";
    }
    el.innerHTML = chrome("");
    if (mode === "survival") { var c = $("#arClock"); if (c) c.textContent = "0"; }
    renderCard(); startClock();
  }

  function finish(reason) {
    if (!run || run.done) return;
    run.done = true; stopClock();
    var sec = Math.round((Date.now() - run.start) / 1000);
    var m = MODES.filter(function (x) { return x.id === run.mode; })[0];
    var score = run.mode === "survival" ? run.correct : run.score;
    var rec = best(run.mode), isRecord = score > rec.best;
    if (!S.state.arena) S.state.arena = {};
    S.state.arena[key(run.mode)] = { best: Math.max(rec.best, score), plays: rec.plays + 1 };
    var coins = Math.min(40, Math.floor(score / 40)) + (isRecord ? 10 : 0);
    if (global.WordySync) { global.WordySync.sessionEnd({ sec: sec, items: run.items, correct: run.correct, mode: "arena", sub: run.mode, score: score, coins: coins }); global.WordySync.ctx = null; }
    S.rollDay();
    var left = Math.max(0, 30 - (S.state.daily.arenaCoins || 0));   // Tageslimit, damit dieselben Wörter nicht endlos Münzen bringen
    var capped = coins > left; coins = Math.min(coins, left);
    S.state.daily.arenaCoins = (S.state.daily.arenaCoins || 0) + coins;
    S.addCoins(coins);
    S.addXp(Math.min(60, Math.round(score / 8)));
    var boss = run.boss && global.VTUI && global.VTUI.bossFinish ? global.VTUI.bossFinish(run.boss, run.correct) : null;
    var rw = S.finishSession({ items: run.items, correct: run.correct, sec: sec, maxChain: run.maxCombo, newSeen: 0, boxSolved: run.cleared, mastered: 0, sentOk: 0, arena: true });
    var fresh = [];
    function give(id) {
      if (S.state.badges.indexOf(id) < 0) {
        S.state.badges.push(id);
        var b = S.BADGES.filter(function (x) { return x.id === id; })[0];
        if (b) fresh.push(b);
      }
    }
    give("arena1");
    if (run.maxCombo >= 15) give("combo15");
    var acc = run.items ? Math.round(run.correct * 100 / run.items) : 0;
    var head = boss ? (boss.pass ? "Boss besiegt!" : "Knapp daneben – noch ein Versuch")
      : reason === "cleared" ? "Kartei leer geräumt!"
      : isRecord ? "Neuer Bestwert!"
      : reason === "dead" ? "Erwischt."
      : reason === "timeout" ? "Zeit abgelaufen."
      : "Runde vorbei";
    var line = run.mode === "survival"
      ? run.correct + " " + (run.correct === 1 ? "Wort" : "Wörter") + " am Stück"
      : score + " Punkte";
    el.innerHTML = '<div class="ar-end">' +
      '<div class="ar-endicon">' + (isRecord ? "🏆" : reason === "cleared" ? "🎯" : esc(m.icon)) + '</div>' +
      '<h1>' + esc(head) + '</h1>' +
      '<div class="ar-big tnum">' + esc(line) + '</div>' +
      '<div class="ar-stats">' +
      '<div><b class="tnum">' + run.correct + '</b><span>richtig</span></div>' +
      '<div><b class="tnum">' + acc + '%</b><span>Trefferquote</span></div>' +
      '<div><b class="tnum">' + run.maxCombo + '</b><span>beste Serie</span></div>' +
      '<div><b class="tnum">' + Math.max(rec.best, score) + '</b><span>Bestwert</span></div>' +
      '</div>' +
      '<p class="ar-note">' + (coins ? "🪙 " + coins + " Münzen" + (capped ? " (Tageslimit der Arena erreicht)" : "") : (capped ? "Arena-Münzen für heute sind voll – lerne neue Wörter für mehr" : "Keine Münzen diesmal")) +
      (boss ? " · Boss: " + run.correct + " von " + run.boss.need + " richtig nötig" + (boss.pass ? " " + "★".repeat(boss.stars) : "") : "") +
      (rw.goalReached ? " · Tagesziel erreicht" : "") +
      rw.missions.filter(function (x) { return x.type === "arena"; }).map(function (x) { return " · Mission geschafft: +" + x.coins + " 🪙"; }).join("") +
      (run.cleared ? " · " + run.cleared + " aus der Fehlerkartei befreit" : "") + '</p>' +
      (fresh.length ? '<p class="ar-note" style="color:var(--ar-gold)">🏅 Neu: ' + fresh.map(function (b) { return esc(b.n); }).join(", ") + '</p>' : "") +
      '<div class="ar-endbtns">' + (boss && boss.pass ? (boss.chest ? '<button class="ar-btn" data-a="chest">🎁 Truhe öffnen</button>' : '<button class="ar-btn" data-a="quit">Weiter auf dem Pfad</button>')
        : '<button class="ar-btn" data-a="again">' + (boss ? "Nochmal versuchen" : "Noch mal") + '</button><button class="ar-btn ghost" data-a="quit">Zurück</button>') + '</div></div>';
    S.save(true);
    if (global.VTUI && global.VTUI.refreshHeader) global.VTUI.refreshHeader();
  }

  function close() {
    stopClock();
    var again = run && run.mode;
    run = null;
    el.hidden = true; el.innerHTML = "";
    document.documentElement.classList.remove("ar-open");
    if (global.VTUI && global.VTUI.afterArena) global.VTUI.afterArena();
    return again;
  }

  el.addEventListener("click", function (e) {
    if (!run) { var q0 = e.target.closest("[data-a]"); if (q0) close(); return; }
    var t = e.target.closest("[data-a]");
    if (t) {
      var a = t.getAttribute("data-a");
      if (a === "quit") { if (!run.done) finish("quit"); else close(); return; }
      if (a === "again") { var m = run.mode, o = run.opts; close(); return start(m, o); }
      if (a === "chest") { close(); return global.VTUI.openChest(); }
    }
    if (run.done) return;
    var l = e.target.closest("[data-l]"), r = e.target.closest("[data-r]");
    if (l) return tapMatch(+l.getAttribute("data-l"), null);
    if (r) return tapMatch(null, +r.getAttribute("data-r"));
    var o = e.target.closest("[data-o]");
    if (o) return tapOpt(+o.getAttribute("data-o"));
  });
  document.addEventListener("keydown", function (e) {
    if (!run || el.hidden || run.done) return;
    if (/^[1-4]$/.test(e.key)) { var o = $$(".ar-opt")[+e.key - 1]; if (o) o.click(); }
    if (e.key === "Escape") finish("quit");
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && run && !run.done && run.mode !== "survival") finish("quit");
  });

  global.ARENA = { MODES: MODES, start: start, best: best, close: close, open: function () { return !el.hidden; } };
})(window);
