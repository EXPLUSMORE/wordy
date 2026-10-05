/* Sync: sendet den Lernverlauf an den Wordy-Server (Dashboard).
   Offline-zuerst: Ereignisse landen in einer Warteschlange und gehen raus, sobald es Netz gibt.
   Ohne Verbindung zum Server passiert nichts, die App arbeitet wie bisher. */
(function (g) {
  "use strict";
  var VT = g.VT, W = g.WordySync = { ctx: null }, timer = null, busy = false, lastSnap = 0;
  var MAX_Q = 4000, BATCH = 200;

  function pid() { try { return VT.profiles().active; } catch (e) { return "p1"; } }
  function lsGet(k) { try { return JSON.parse(g.localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { g.localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function cfg() { return lsGet("wordy.sync." + pid()); }
  function queue() { return lsGet("wordy.q." + pid()) || []; }
  function saveQ(a) { lsSet("wordy.q." + pid(), a.slice(-MAX_Q)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  W.connected = function () { var c = cfg(); return !!(c && c.url && c.token); };
  W.info = function () { var c = cfg() || {}; return { connected: W.connected(), name: c.name || "", url: c.url || "", last: c.last || 0, pending: queue().length, error: c.err || "", stateAt: c.stateAt || 0, stateErr: c.stateErr || "", hidden: !!c.hidden }; };

  /* Ereignis vormerken (nur wenn verbunden) */
  W.log = function (kind, d) {
    if (!W.connected() || (cfg() || {}).hidden) return;   // "nur sichern": keine Lernereignisse senden
    var q = queue(), data = d || {};
    if (W.ctx && W.ctx.mode && !data.m) data.m = W.ctx.mode;
    q.push({ i: uid(), t: Date.now(), k: kind, d: data });
    saveQ(q);
    if (q.length >= 25) flush(); else if (!timer) timer = setTimeout(function () { timer = null; flush(); }, 20000);
  };

  function post(c, path, body, keep) {
    return g.fetch(c.url + path, { method: "POST", keepalive: !!keep, headers: { "Content-Type": "application/json", Authorization: "Bearer " + c.token }, body: JSON.stringify(body) });
  }
  function setCfg(patch) { var c = cfg(); if (!c) return; for (var k in patch) c[k] = patch[k]; lsSet("wordy.sync." + pid(), c); }

  function flush(keep) {
    var c = cfg();
    if (!c || !c.token || busy || !g.fetch) return Promise.resolve(false);
    var q = queue(); if (!q.length) return Promise.resolve(true);
    busy = true;
    var batch = q.slice(0, BATCH);
    return post(c, "/api/events", { events: batch }, keep).then(function (r) {
      if (r.status === 401) { setCfg({ err: "Die Verbindung wurde von den Eltern getrennt." }); throw new Error("401"); }
      if (!r.ok) throw new Error(String(r.status));
      var cur = queue(), sent = {}; batch.forEach(function (e) { sent[e.i] = 1; });
      saveQ(cur.filter(function (e) { return !sent[e.i]; }));
      setCfg({ last: Date.now(), err: "" });
      busy = false;
      return queue().length ? flush(keep) : true;
    }).catch(function (e) { busy = false; if (String(e.message) !== "401") setCfg({ err: "Server gerade nicht erreichbar, es wird später erneut versucht." }); return false; });
  }
  W.flush = function () { return flush(false); };

  /* Stand der Wörter, Einheiten und Münzen: damit sieht man auch, was schon vor der Verbindung gelernt war */
  W.snapshot = function () {
    var c = cfg(); if (!c || !c.token || !g.fetch) return Promise.resolve(false);
    var st = VT.state, words = {}, units = {}, id;
    if (c.hidden) return Promise.resolve(false);
    if (VT.isFresh()) return Promise.resolve(false);   // ein leerer Stand (neues Gerät) darf die Übersicht auf dem Server nicht überschreiben
    for (id in st.w) { var r = st.w[id]; if (r && r.reps != null) words[id] = [VT.levelOf(id), r.ok || 0, r.no || 0, r.last || 0]; }
    VT.units().forEach(function (u) { if (u.track === "schule") units[u.id] = { id: u.id, title: u.title, k: u.k, total: u.words.length }; });
    var rk = VT.rankOf(st.xp), d = st.daily || {};
    var meta = {
      name: st.profile.name || "", coins: st.coins, xp: st.xp, rank: rk.rank ? rk.rank.n : "", streak: st.streak.count, best: st.streak.best,
      goalMin: st.settings.goalMin, todaySec: d.sec || 0, todayItems: d.items || 0, owned: (st.profile.owned || []).length,
      wish: (VT.wish && VT.wish()) ? VT.wish().label || VT.wish().id : "", klassen: st.settings.klassen, version: g.WORDY_VERSION || "", totals: st.totals
    };
    lastSnap = Date.now();
    var body = { words: words, catalog: Object.keys(units).map(function (k) { return units[k]; }), meta: meta }, tp = textsPayload();
    if (tp.sig !== c.textsSig) body.texts = tp.texts;
    return post(c, "/api/snapshot", body).then(function (r) { if (r.ok && body.texts) setCfg({ textsSig: tp.sig }); return r.ok; }).catch(function () { return false; });
  };


  /* ---------- Ziele und Lernpläne der Eltern ---------- */
  var lastPull = 0;
  function addDays(d, n) { var a = d.split("-").map(Number); return new Date(Date.UTC(a[0], a[1] - 1, a[2] + n)).toISOString().slice(0, 10); }
  function monday(d) { var a = d.split("-").map(Number), wd = (new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay() + 6) % 7; return addDays(d, -wd); }
  function dayDiff(a, b) { return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000); }
  function dayStat(k) { var st = VT.state; return st.daily && st.daily.date === k ? st.daily : st.history[k]; }
  W.remote = function () { return lsGet("wordy.cfg." + pid()) || { goals: [], plans: [] }; };

  W.progress = function (goal) {
    var cur = 0, i, h;
    if (goal.kind === "unit") {
      var total = 0, ok = 0;
      VT.units().forEach(function (u) {
        if (goal.scope.indexOf(u.id) < 0) return;
        total += u.words.length;
        for (i = 0; i < u.words.length; i++) if (VT.levelOf(u.id + "#" + i) >= 3) ok++;
      });
      cur = total ? Math.round(ok * 100 / total) : 0;
    } else {
      for (i = 0; i < 7; i++) {
        h = dayStat(addDays(goal.week, i)); if (!h) continue;
        if (goal.kind === "minutes") cur += (h.sec || 0) / 60;
        else if (goal.kind === "days") { if ((h.sec || 0) >= 300) cur++; }
        else if (goal.kind === "newwords") cur += h.newSeen || 0;
      }
      cur = Math.round(cur);
    }
    return { cur: cur, pct: Math.min(100, Math.round(cur * 100 / Math.max(1, goal.target))) };
  };
  W.planInfo = function (pl) {
    var total = 0, ok = 0, today = VT.today();
    VT.words().forEach(function (w) { if (pl.units.indexOf(w.unit) >= 0) { total++; if (VT.levelOf(w.id) >= 3) ok++; } });
    var days = dayDiff(today, pl.exam), learnDays = Math.max(1, days);
    return { total: total, ok: ok, pct: total ? Math.round(ok * 100 / total) : 0, days: days, quota: Math.ceil((total - ok) / learnDays) };
  };
  W.currentGoals = function () { var mon = monday(VT.today()); return W.remote().goals.filter(function (g) { return g.week === mon; }); };
  W.activePlans = function () { var t = VT.today(); return W.remote().plans.filter(function (p) { return p.exam >= t; }); };

  /* Prüft Ziele und Pläne; vergibt Bonusmünzen genau einmal */
  W.check = function () {
    if (!W.connected()) return;
    var st = VT.state, got = [];
    if (!st.goalsDone) st.goalsDone = {};
    W.currentGoals().forEach(function (g) {
      var key = "g" + g.id; if (st.goalsDone[key]) return;
      if (W.progress(g).cur >= g.target) { st.goalsDone[key] = 1; VT.parentCoins(g.coins); W.log("goal", { id: g.id, done: 1 }); got.push({ title: g.title, coins: g.coins, kind: "goal" }); }
    });
    W.activePlans().forEach(function (pl) {
      var key = "p" + pl.id; if (st.goalsDone[key]) return;
      if (W.planInfo(pl).pct >= 90) { st.goalsDone[key] = 1; VT.parentCoins(pl.coins); W.log("plan", { id: pl.id, done: 1 }); got.push({ title: pl.title, coins: pl.coins, kind: "plan" }); }
    });
    if (got.length) { VT.save(true); if (g.WordyHooks && g.WordyHooks.onReward) g.WordyHooks.onReward(got); }
  };

  W.pull = function (force) {
    var c = cfg(); if (!c || !c.token || !g.fetch || c.hidden) return Promise.resolve(false);
    if (!force && Date.now() - lastPull < 3 * 60000) return Promise.resolve(false);
    lastPull = Date.now();
    return g.fetch(c.url + "/api/sync", { headers: { Authorization: "Bearer " + c.token } })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (j) { lsSet("wordy.cfg." + pid(), { goals: j.goals || [], plans: j.plans || [], t: Date.now() }); W.check(); if (g.WordyHooks && g.WordyHooks.onChange) g.WordyHooks.onChange(); return true; })
      .catch(function () { return false; });
  };

  /* Wörter der Einheiten im Klartext, damit das Dashboard sie anzeigen kann (nur wenn sich etwas geändert hat) */
  function textsPayload() {
    var st = VT.state, sel = st.settings.klassen || [], out = {}, sig = "";
    VT.units().forEach(function (u) {
      if (u.track !== "schule") return;
      var touched = false, i;
      if (sel.indexOf(u.k) < 0) { for (i = 0; i < u.words.length && !touched; i++) if (st.w[u.id + "#" + i]) touched = true; if (!touched) return; }
      out[u.id] = u.words.map(function (w) { return [w[0], w[1]]; }); sig += u.id + ":" + u.words.length + ";";
    });
    return { texts: out, sig: sig };
  }


  /* ---------- Vollständige Sicherung des Lernstands auf dem Server ---------- */
  var lastState = 0;
  function api(c, method, path, body) {
    return g.fetch(c.url + path, { method: method, headers: { "Content-Type": "application/json", Authorization: "Bearer " + c.token }, body: body ? JSON.stringify(body) : undefined });
  }
  W.pushState = function (force) {
    var c = cfg(); if (!c || !c.token || !g.fetch) return Promise.resolve(false);
    if (VT.isFresh()) return Promise.resolve(false);
    if (!force && Date.now() - lastState < 10 * 60000) return Promise.resolve(false);
    lastState = Date.now();
    return api(c, "PUT", "/api/state", { state: VT.state }).then(function (r) {
      if (r.status === 409) { setCfg({ stateErr: "Der Server hat einen Lernstand mit Fortschritt. Bitte unter Setup zuerst wiederherstellen." }); return false; }
      if (!r.ok) throw new Error(String(r.status));
      setCfg({ stateAt: Date.now(), stateErr: "" }); return true;
    }).catch(function () { lastState = 0; return false; });
  };
  W.stateList = function () {
    var c = cfg(); if (!c || !c.token) return Promise.resolve([]);
    return api(c, "GET", "/api/state/list").then(function (r) { return r.ok ? r.json() : { items: [] }; }).then(function (j) { return j.items || []; }).catch(function () { return []; });
  };
  W.restore = function (day) {
    var c = cfg(); if (!c || !c.token) return Promise.resolve({ error: "Nicht verbunden." });
    return api(c, "GET", "/api/state" + (day ? "?day=" + encodeURIComponent(day) : "")).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (!x.ok) return { error: x.j && x.j.error || "Wiederherstellen hat nicht geklappt." };
        var res = VT.restoreState(x.j.state); if (res.error) return res;
        setCfg({ stateErr: "" }); lastState = 0;
        return W.snapshot().then(function () { return W.pull(true); }).then(function () { return { ok: true, ts: x.j.ts, coins: x.j.coins }; });
      }).catch(function () { return { error: "Der Server ist nicht erreichbar." }; });
  };

  /* Verbinden mit dem Code der Eltern: "https://server#ABCD-EFGH" */
  W.pair = function (text) {
    var s = String(text || "").trim(), m = s.match(/^(https?:\/\/[^\s#]+?)\/?#?\s*([A-Za-z0-9]{4}-?[A-Za-z0-9]{4})$/);
    if (!m) return Promise.resolve({ error: "Bitte den ganzen Code einfügen, so wie ihn das Dashboard zeigt (Adresse und Code)." });
    var url = m[1].replace(/\/+$/, "");
    return g.fetch(url + "/api/pair", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: m[2], device: (g.navigator && g.navigator.userAgent || "").slice(0, 70) }) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) {
        if (!x.ok) return { error: x.j && x.j.error || "Verbinden hat nicht geklappt." };
        lsSet("wordy.sync." + pid(), { url: url, token: x.j.token, name: x.j.name, last: 0, hidden: !!x.j.hidden });
        W.log("hello", { v: g.WORDY_VERSION || "" });
        if (VT.isFresh()) return flush(false).then(function () { return W.pull(true); }).then(function () { return W.stateList(); }).then(function (l) { return { ok: true, name: x.j.name, backups: l }; });
        return W.snapshot().then(function () { return flush(false); }).then(function () { return W.pull(true); }).then(function () { W.pushState(true); return { ok: true, name: x.j.name }; });
      }).catch(function () { return { error: "Der Server ist nicht erreichbar. Gibt es Netz, und stimmt die Adresse?" }; });
  };
  W.disconnect = function () { try { g.localStorage.removeItem("wordy.sync." + pid()); g.localStorage.removeItem("wordy.q." + pid()); g.localStorage.removeItem("wordy.cfg." + pid()); } catch (e) {} };

  /* Aus der App: Ende einer Lernrunde */
  W.sessionEnd = function (d) {
    if (!W.connected()) return;
    if ((cfg() || {}).hidden) { W.pushState(true); return; }
    W.log("ss", d);
    W.check();
    flush(false).then(function () { return W.snapshot(); }).then(function () { return W.pull(true); }).then(function () { return W.pushState(true); });
  };
  W.maybeSnapshot = function () { if (W.connected() && Date.now() - lastSnap > 10 * 60000) W.snapshot(); };

  g.addEventListener("visibilitychange", function () { if (g.document.visibilityState === "hidden") { flush(true); W.pushState(false); } else { flush(false); W.pull(false); } });
  g.addEventListener("online", function () { flush(false); });
  setTimeout(function () { flush(false); W.maybeSnapshot(); W.pull(true); }, 4000);
})(window);
