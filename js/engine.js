/* Vokabeltrainer v2 – Lernmotor: Speicherung, Spaced Repetition, Fehlerkartei,
   Sessionplanung, Level, Missionen, Statistik. Keine UI in dieser Datei. */
(function (global) {
  "use strict";

  var KEY = "vokabeltrainer.v2";
  var SEC_PER_ITEM = 11;           // Schätzwert für die Zeitplanung
  var HEART_REGEN_MS = 8 * 60000;  // ein Herz alle 8 Minuten

  var LEVELS = [
    { n: "Neu",         short: "neu",  hint: "noch nie geübt" },
    { n: "Angefangen",  short: "1",    hint: "einmal gesehen" },
    { n: "Geübt",       short: "2",    hint: "kommt bald wieder" },
    { n: "Sitzt",       short: "3",    hint: "sitzt ziemlich sicher" },
    { n: "Gemeistert",  short: "★",    hint: "langfristig gespeichert" }
  ];

  /* Ränge nach dem Vorbild von Fortnite Ranked; "Unreal Gold" ist die eigene Spitze darüber */
  var RANKS = [
    { xp: 0,     n: "Bronze I",     t: "bronze" },   { xp: 150,   n: "Bronze II",    t: "bronze" },
    { xp: 400,   n: "Bronze III",   t: "bronze" },   { xp: 800,   n: "Silber I",     t: "silber" },
    { xp: 1400,  n: "Silber II",    t: "silber" },   { xp: 2200,  n: "Silber III",   t: "silber" },
    { xp: 3200,  n: "Gold I",       t: "gold" },     { xp: 4600,  n: "Gold II",      t: "gold" },
    { xp: 6400,  n: "Gold III",     t: "gold" },     { xp: 9000,  n: "Platin I",     t: "platin" },
    { xp: 12000, n: "Platin II",    t: "platin" },   { xp: 15500, n: "Platin III",   t: "platin" },
    { xp: 19500, n: "Diamant I",    t: "diamant" },  { xp: 24000, n: "Diamant II",   t: "diamant" },
    { xp: 29000, n: "Diamant III",  t: "diamant" },  { xp: 35000, n: "Elite",        t: "elite" },
    { xp: 42000, n: "Champion",     t: "champion" }, { xp: 50000, n: "Unreal",       t: "unreal" },
    { xp: 60000, n: "Unreal Gold",  t: "unreal-gold" }
  ];

  var AVATARS = ["🦊","🐼","🦉","🐙","🦕","🐝","🦁","🐧","🦄","🐢","🦈","🐨"];
  /* Shop: kind = avatar | frame | title | bg | fx | snd | theme. cost 0 = gehört immer dazu.
     rank = Mindestrang (Name aus RANKS), davor ist der Eintrag gesperrt. Gezeichnet wird in cosmetics.js. */
  var SHOP = [
    { id: "av:🦊", kind: "avatar", label: "Fuchs",    cost: 0,   val: "🦊" },
    { id: "av:🐼", kind: "avatar", label: "Panda",    cost: 40,  val: "🐼" },
    { id: "av:🐢", kind: "avatar", label: "Schildkröte", cost: 50, val: "🐢" },
    { id: "av:🦉", kind: "avatar", label: "Eule",     cost: 60,  val: "🦉" },
    { id: "av:🐙", kind: "avatar", label: "Krake",    cost: 80,  val: "🐙" },
    { id: "av:🦕", kind: "avatar", label: "Dino",     cost: 120, val: "🦕" },
    { id: "av:🦈", kind: "avatar", label: "Hai",      cost: 160, val: "🦈" },
    { id: "av:🦄", kind: "avatar", label: "Einhorn",  cost: 220, val: "🦄" },
    { id: "av:pbaer",    kind: "avatar", label: "Pummelbär",     cost: 150, val: "svg:pbaer" },
    { id: "av:phase",    kind: "avatar", label: "Pummelhase",    cost: 180, val: "svg:phase" },
    { id: "av:pkatze",   kind: "avatar", label: "Pummelkatze",   cost: 200, val: "svg:pkatze" },
    { id: "av:pummel",   kind: "avatar", label: "Pummeleinhorn", cost: 250, val: "svg:pummel" },
    { id: "av:pdrache",  kind: "avatar", label: "Pummeldrache",  cost: 300, val: "svg:pdrache" },
    { id: "av:clombo",    kind: "avatar", label: "Clombo",        cost: 300, val: "svg:clombo" },
    { id: "av:pphoenix", kind: "avatar", label: "Pummelphönix",  cost: 600,  val: "svg:pphoenix", rank: "Gold I" },
    { id: "av:pgold",    kind: "avatar", label: "Goldpummel",    cost: 800,  val: "svg:pgold", rank: "Platin I" },
    { id: "av:pregen",   kind: "avatar", label: "Regenbogenpummel", cost: 1200, val: "svg:pregen", rank: "Diamant I" },
    { id: "av:pgalaxie", kind: "avatar", label: "Galaxiepummel", cost: 2000, val: "svg:pgalaxie", rank: "Elite" },

    { id: "fr:none",    kind: "frame", label: "Kein Rahmen", cost: 0,   val: "none" },
    { id: "fr:gold",    kind: "frame", label: "Goldrahmen",  cost: 120, val: "gold" },
    { id: "fr:rainbow", kind: "frame", label: "Regenbogenrahmen", cost: 220, val: "rainbow" },
    { id: "fr:fire",    kind: "frame", label: "Flammenrahmen", cost: 300, val: "fire" },

    { id: "ti:none",    kind: "title", label: "Kein Titel",   cost: 0,   val: "" },
    { id: "ti:wort",    kind: "title", label: "Wortjäger",    cost: 80,  val: "Wortjäger" },
    { id: "ti:streber", kind: "title", label: "Streber",      cost: 100, val: "Streber" },
    { id: "ti:freund",  kind: "title", label: "Pummelfreund", cost: 120, val: "Pummelfreund" },
    { id: "ti:profi",   kind: "title", label: "Vokabelprofi", cost: 150, val: "Vokabelprofi" },
    { id: "ti:genie",   kind: "title", label: "Sprachgenie",  cost: 300, val: "Sprachgenie" },
    { id: "ti:champ",   kind: "title", label: "Champion der Wörter", cost: 500, val: "Champion der Wörter", rank: "Champion" },

    { id: "bg:none",   kind: "bg", label: "Schlicht", cost: 0,   val: "none" },
    { id: "bg:stars",  kind: "bg", label: "Sterne",   cost: 150, val: "stars" },
    { id: "bg:clouds", kind: "bg", label: "Wolken",   cost: 150, val: "clouds" },
    { id: "bg:space",  kind: "bg", label: "Weltall",  cost: 250, val: "space" },

    { id: "fx:none",     kind: "fx", label: "Keine Effekte", cost: 0,   val: "none" },
    { id: "fx:confetti", kind: "fx", label: "Konfetti",      cost: 100, val: "confetti" },
    { id: "fx:stars",    kind: "fx", label: "Sternenregen",  cost: 150, val: "stars" },
    { id: "fx:sparks",   kind: "fx", label: "Funken",        cost: 200, val: "sparks" },
    { id: "fx:firework", kind: "fx", label: "Feuerwerk",     cost: 300, val: "firework" },

    { id: "sn:none",  kind: "snd", label: "Stumm",     cost: 0,   val: "none" },
    { id: "sn:bell",  kind: "snd", label: "Glöckchen", cost: 80,  val: "bell" },
    { id: "sn:arcade", kind: "snd", label: "Arcade",   cost: 120, val: "arcade" },
    { id: "sn:harp",  kind: "snd", label: "Harfe",     cost: 160, val: "harp" },

    { id: "th:paper", kind: "theme", label: "Papier", cost: 0,  val: "paper" },
    { id: "th:mint",  kind: "theme", label: "Minze",  cost: 90,  val: "mint" },
    { id: "th:plum",  kind: "theme", label: "Pflaume",cost: 90,  val: "plum" },
    { id: "th:amber", kind: "theme", label: "Amber",  cost: 140, val: "amber" }
  ];
  var PROFILE_KEY = { avatar: "avatar", frame: "frame", title: "title", bg: "bg", fx: "fx", snd: "snd", theme: "theme" };

  var BADGES = [
    { id: "start",   n: "Erster Schritt",  d: "Die erste Übung abgeschlossen." },
    { id: "w50",     n: "50 Wörter",       d: "50 Vokabeln schon einmal geübt." },
    { id: "w150",    n: "150 Wörter",      d: "150 Vokabeln schon einmal geübt." },
    { id: "m25",     n: "25 gemeistert",   d: "25 Wörter sitzen langfristig." },
    { id: "m100",    n: "100 gemeistert",  d: "100 Wörter sitzen langfristig." },
    { id: "streak7", n: "Eine Woche",      d: "7 Tage hintereinander geübt." },
    { id: "streak30",n: "Ein Monat",       d: "30 Tage hintereinander geübt." },
    { id: "clean",   n: "Fehlerfrei",      d: "Eine Runde ohne einen Fehler." },
    { id: "chain15", n: "15er-Serie",      d: "15 richtige Antworten in Folge." },
    { id: "box0",    n: "Kartei leer",     d: "Die Fehlerkartei einmal leer geräumt." },
    { id: "unit1",   n: "Einheit fertig",  d: "Alle Wörter einer Einheit gemeistert." },
    { id: "early",   n: "Dranbleiber",     d: "An 5 verschiedenen Tagen geübt." },
    { id: "sent20",  n: "Satzbauer",       d: "20 Sätze richtig zusammengesetzt." },
    { id: "sent75",  n: "Satzprofi",       d: "75 Sätze richtig zusammengesetzt." },
    { id: "arena1",  n: "Arena betreten",  d: "Eine Runde in der Arena gespielt." },
    { id: "combo15", n: "Serientäter",     d: "15 Treffer am Stück in der Arena." }
  ];

  /* ---------- Hilfsfunktionen ---------- */
  function today(d) { d = d || new Date(); return d.toISOString().slice(0, 10); }
  function dayDiff(a, b) { return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------- Wortkatalog ---------- */
  var units = [], words = [], byId = {}, sentences = [];
  function trackOf(u) { return u.track || (u.k === 0 ? "eigen" : "schule"); }
  function buildCatalogue(state) {
    units = (global.VOCAB_UNITS || []).slice();
    if (state && state.custom) units = units.concat(state.custom);
    words = []; byId = {};
    units.forEach(function (u) {
      u.track = trackOf(u);
      u.words.forEach(function (w, i) {
        var item = {
          id: u.id + "#" + i, en: w[0], de: w[1], diff: w[2] || 1, ex: w[3] || "",
          unit: u.id, unitTitle: u.title, k: u.k, icon: u.icon || "📘", track: u.track
        };
        item.gap = gapToken(item);
        words.push(item); byId[item.id] = item;
      });
    });
    sentences = (global.SENTENCES || []).map(function (a, i) {
      return { id: "s" + i, track: a[0], k: a[1], en: a[2], de: a[3], rule: a[4] };
    });
    return words;
  }
  function gapToken(item) {
    if (!item.ex) return null;
    var base = item.en.replace(/^to\s+/i, "");
    var i = item.ex.toLowerCase().indexOf(base.toLowerCase());
    return i < 0 ? null : item.ex.substr(i, base.length);
  }

  /* ---------- Zustand ---------- */
  function freshState() {
    return {
      v: 2, created: Date.now(),
      profile: { name: "", avatar: "🦊", theme: "paper", owned: ["av:🦊", "th:paper"] },
      settings: { track: "schule", klassen: [6], bizGroups: ["Basis"], units: [], goalMin: 10, audio: true, hearts: true, newPerDay: 12 },
      xp: 0, coins: 0, hearts: 5, heartTs: Date.now(),
      streak: { count: 0, best: 0, last: null, freezes: 2, usedToday: false },
      daily: null, history: {}, w: {}, s: {}, arena: {}, custom: [], badges: [],
      totals: { items: 0, correct: 0, sec: 0, sentOk: 0 }
    };
  }
  /* ---------- Spieler (Profile): jeder Spieler hat einen eigenen Speicherplatz ---------- */
  var PKEY = "wordy.profiles";
  function keyFor(id) { return id === "p1" ? KEY : KEY + "." + id; }
  function profiles() {
    var d = null;
    try { d = JSON.parse(global.localStorage.getItem(PKEY)); } catch (e) {}
    if (!d || !d.list || !d.list.length) d = { active: "p1", list: [{ id: "p1", name: "Spieler 1" }] };
    if (!d.list.some(function (x) { return x.id === d.active; })) d.active = d.list[0].id;
    return d;
  }
  function saveProfiles(d) { try { global.localStorage.setItem(PKEY, JSON.stringify(d)); } catch (e) {} }
  function addProfile(name) {
    var d = profiles(), id = "p" + Date.now().toString(36);
    d.list.push({ id: id, name: (name || "").trim().slice(0, 20) || "Spieler " + (d.list.length + 1) });
    d.active = id; saveProfiles(d); return id;
  }
  function switchProfile(id) { var d = profiles(); if (d.list.some(function (x) { return x.id === id; })) { d.active = id; saveProfiles(d); } }
  function renameProfile(id, name) {
    var d = profiles(); d.list.forEach(function (x) { if (x.id === id) x.name = (name || "").trim().slice(0, 20) || x.name; }); saveProfiles(d);
  }
  function deleteProfile(id) {
    var d = profiles(); if (d.list.length < 2) return false;
    d.list = d.list.filter(function (x) { return x.id !== id; });
    try { ['', '.auto', '.pre'].forEach(function (x) { global.localStorage.removeItem(keyFor(id) + x); }); } catch (e) {}
    if (d.active === id) d.active = d.list[0].id;
    saveProfiles(d); return true;
  }

  var state = freshState();

  function load() {
    var raw = null;
    try { raw = global.localStorage.getItem(keyFor(profiles().active)); } catch (e) { raw = null; }
    var ok = false;
    if (raw) { try { var p = JSON.parse(raw); if (p && p.v === 2) { state = Object.assign(freshState(), p); ok = true; } } catch (e) {} }
    if (!ok && readBackup("auto")) { state = Object.assign(freshState(), readBackup("auto").s); restored = true; }
    buildCatalogue(state);
    rollDay();
    regenHearts();
    return state;
  }
  var saveTimer = null, lastBak = 0, restored = false;
  var BAK_EVERY = 5 * 60 * 1000;
  /* Sicherungskopien liegen neben dem Hauptstand: "auto" wird alle paar Minuten
     erneuert, "pre" entsteht vor Zurücksetzen, Einspielen und Wiederherstellen. */
  function bakKey(slot) { return keyFor(profiles().active) + "." + slot; }
  function writeBackup(slot, json) {
    try { global.localStorage.setItem(bakKey(slot), JSON.stringify({ t: Date.now(), s: JSON.parse(json) })); } catch (e) {}
  }
  function readBackup(slot) {
    try {
      var b = JSON.parse(global.localStorage.getItem(bakKey(slot)));
      return b && b.s && b.s.v === 2 ? b : null;
    } catch (e) { return null; }
  }
  function backupInfo() {
    var a = readBackup("auto"), p = readBackup("pre");
    return { auto: a ? a.t : null, pre: p ? p.t : null, restored: restored };
  }
  function restoreBackup(slot) {
    var b = readBackup(slot); if (!b) return { error: "Keine Sicherung vorhanden." };
    writeBackup("pre", JSON.stringify(state));
    state = Object.assign(freshState(), b.s); buildCatalogue(state); rollDay(); save(true);
    return { ok: true };
  }
  function save(now) {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (!now) { saveTimer = setTimeout(function () { save(true); }, 400); return; }
    try {
      var json = JSON.stringify(state);
      global.localStorage.setItem(keyFor(profiles().active), json);
      if (Date.now() - lastBak > BAK_EVERY) { lastBak = Date.now(); writeBackup("auto", json); }
    } catch (e) {}
  }
  /* Beim Schließen, Wechseln der App oder Sperren des Handys sofort speichern. */
  function flush() { if (state && state.v === 2) save(true); }
  try {
    global.addEventListener("pagehide", flush);
    global.document.addEventListener("visibilitychange", function () { if (global.document.hidden) flush(); });
  } catch (e) {}
  /* Dauerhaften Speicher anfordern, damit der Browser den Lernstand bei Platzmangel nicht räumt. */
  var persisted = null;
  function keepStorage(cb) {
    try {
      if (!global.navigator.storage || !global.navigator.storage.persist) { if (cb) cb(null); return; }
      global.navigator.storage.persisted().then(function (p) { return p || global.navigator.storage.persist(); })
        .then(function (p) { persisted = !!p; if (cb) cb(persisted); }, function () { if (cb) cb(null); });
    } catch (e) { if (cb) cb(null); }
  }

  /* ---------- Tageswechsel, Streak, Herzen ---------- */
  function rollDay() {
    var t = today();
    if (!state.daily || state.daily.date !== t) {
      if (state.daily && state.daily.items > 0) state.history[state.daily.date] = {
        items: state.daily.items, correct: state.daily.correct, sec: state.daily.sec, xp: state.daily.xp
      };
      state.daily = { date: t, items: 0, correct: 0, sec: 0, xp: 0, newSeen: 0, missions: makeMissions(), done: false };
      state.streak.usedToday = false;
      var last = state.streak.last;
      if (last) {
        var gap = dayDiff(last, t);
        if (gap > 1) {
          var missed = gap - 1;
          if (state.streak.freezes >= missed) { state.streak.freezes -= missed; state.streak.usedToday = true; }
          else { state.streak.best = Math.max(state.streak.best, state.streak.count); state.streak.count = 0; }
        }
      }
      save(true);
    }
  }
  function makeMissions() {
    var pool = [
      { id: "m20", n: "20 Aufgaben lösen", goal: 20, type: "items", coins: 10 },
      { id: "m30", n: "30 Aufgaben lösen", goal: 30, type: "items", coins: 14 },
      { id: "mgoal", n: "Tagesziel erreichen", goal: 1, type: "goal", coins: 15 },
      { id: "mbox", n: "5 Wörter aus der Fehlerkartei", goal: 5, type: "box", coins: 12 },
      { id: "mchain", n: "10 richtige in Folge", goal: 10, type: "chain", coins: 12 },
      { id: "mnew", n: "6 neue Wörter kennenlernen", goal: 6, type: "new", coins: 10 },
      { id: "mmaster", n: "2 Wörter meistern", goal: 2, type: "master", coins: 18 },
      { id: "msent", n: "4 Sätze richtig bauen", goal: 4, type: "sent", coins: 14 }
    ];
    var picked = shuffle(pool.slice()).slice(0, 3);
    return picked.map(function (m) { return { id: m.id, n: m.n, goal: m.goal, type: m.type, coins: m.coins, p: 0, done: false }; });
  }
  function regenHearts() {
    if (!state.settings.hearts) { state.hearts = 5; return; }
    var gained = Math.floor((Date.now() - (state.heartTs || Date.now())) / HEART_REGEN_MS);
    if (gained > 0 && state.hearts < 5) {
      state.hearts = Math.min(5, state.hearts + gained);
      state.heartTs = Date.now();
      if (state.hearts >= 5) state.heartTs = Date.now();
    }
  }
  function heartsIn() {
    if (state.hearts >= 5) return 0;
    return Math.max(0, HEART_REGEN_MS - (Date.now() - state.heartTs));
  }

  /* ---------- Wortfortschritt ---------- */
  function rec(id) {
    var r = state.w[id];
    if (!r) { r = state.w[id] = { reps: 0, ef: 2.3, iv: 0, due: 0, lapses: 0, chain: 0, ok: 0, no: 0, last: 0 }; }
    return r;
  }
  function levelOf(id) {
    var r = state.w[id]; if (!r || !r.reps) return 0;
    if (r.iv >= 21 && r.chain >= 4) return 4;
    if (r.iv >= 7 || r.reps >= 4) return 3;
    if (r.reps >= 2) return 2;
    return 1;
  }
  // grade: 2 = sicher richtig, 1 = richtig mit Hilfe/langsam, 0 = falsch
  function grade(id, g) {
    var r = rec(id), before = levelOf(id);
    r.last = Date.now();
    if (g === 0) {
      r.no++; r.lapses++; r.chain = 0; r.reps = 0; r.iv = 0;
      r.ef = clamp(r.ef - 0.2, 1.3, 2.8);
      r.due = Date.now() + 60000;
    } else {
      r.ok++; r.chain++;
      r.ef = clamp(r.ef + (g === 2 ? 0.08 : -0.06), 1.3, 2.8);
      r.iv = r.reps === 0 ? 1 : r.reps === 1 ? 3 : Math.min(400, Math.round(r.iv * r.ef));
      r.reps++;
      r.due = Date.now() + r.iv * 86400000;
    }
    return { before: before, after: levelOf(id), rec: r };
  }
  function inErrorBox(id) { var r = state.w[id]; return !!r && r.lapses > 0 && levelOf(id) < 3; }

  /* ---------- Auswahl & Sessionplanung ---------- */
  function groupsOf() {
    var s = state.settings, biz = s.track === "business", key = biz ? "bizGroups" : "klassen";
    if (!Array.isArray(s[key]) || !s[key].length) s[key] = biz ? ["Basis"] : [6];   // immer mindestens eine Auswahl
    return s[key];
  }
  function activeWords() {
    var s = state.settings, sel = groupsOf();
    return words.filter(function (w) {
      if (s.units && s.units.length) return s.units.indexOf(w.unit) >= 0;
      if (w.track === "eigen") return true;            // eigene Listen immer aktiv
      if (w.track !== s.track) return false;
      return sel.indexOf(w.k) >= 0;
    });
  }
  /* ---------- Sätze ---------- */
  function srec(id) {
    var r = state.s[id];
    if (!r) r = state.s[id] = { reps: 0, ef: 2.3, iv: 0, due: 0, ok: 0, no: 0, last: 0 };
    return r;
  }
  function activeSentences() {
    var s = state.settings, sel = groupsOf();
    return sentences.filter(function (x) { return x.track === s.track && sel.indexOf(x.k) >= 0; });
  }
  function planSentences(n) {
    if (n <= 0) return [];
    var now = Date.now(), act = activeSentences(), due = [], fresh = [];
    act.forEach(function (x) {
      var r = state.s[x.id];
      if (!r || !r.reps) fresh.push(x); else if (r.due <= now) due.push(x);
    });
    due.sort(function (a, b) { return state.s[a.id].due - state.s[b.id].due; });
    return shuffle(due.slice(0, n).concat(shuffle(fresh).slice(0, Math.max(0, n - due.length))));
  }
  function gradeSentence(id, g) {
    var r = srec(id); r.last = Date.now();
    if (g === 0) { r.no++; r.reps = 0; r.iv = 0; r.ef = clamp(r.ef - 0.2, 1.3, 2.8); r.due = Date.now() + 120000; }
    else {
      r.ok++; state.totals.sentOk++;
      r.ef = clamp(r.ef + (g === 2 ? 0.08 : -0.06), 1.3, 2.8);
      r.iv = r.reps === 0 ? 2 : r.reps === 1 ? 5 : Math.min(400, Math.round(r.iv * r.ef));
      r.reps++; r.due = Date.now() + r.iv * 86400000;
    }
    return r;
  }
  function sentenceStats() {
    var act = activeSentences(), seen = 0, mastered = 0;
    act.forEach(function (x) { var r = state.s[x.id]; if (r && r.reps) { seen++; if (r.iv >= 21) mastered++; } });
    return { total: act.length, seen: seen, mastered: mastered, ok: state.totals.sentOk };
  }
  function pools() {
    var now = Date.now(), act = activeWords();
    var due = [], box = [], fresh = [], learning = [];
    act.forEach(function (w) {
      var r = state.w[w.id];
      if (!r || !r.reps && !r.no) { fresh.push(w); return; }
      if (inErrorBox(w.id)) { box.push(w); return; }
      if (r.due <= now) due.push(w); else learning.push(w);
    });
    due.sort(function (a, b) { return state.w[a.id].due - state.w[b.id].due; });
    box.sort(function (a, b) { return (state.w[b.id].lapses - state.w[a.id].lapses) || (state.w[a.id].last - state.w[b.id].last); });
    return { due: due, box: box, fresh: fresh, learning: learning, all: act };
  }
  /* mode: "mix" | "box" | "new" | "unit" */
  function planSession(opts) {
    opts = opts || {};
    var minutes = opts.minutes || 5;
    var n = Math.max(5, Math.round(minutes * 60 / SEC_PER_ITEM));
    var p = pools(), out = [];
    if (opts.unit) {
      var list = words.filter(function (w) { return w.unit === opts.unit; });
      out = shuffle(list).slice(0, Math.max(n, 10));
      return out;
    }
    if (opts.mode === "box") { out = p.box.slice(0, n); if (out.length < 5) out = out.concat(p.due.slice(0, n - out.length)); return shuffle(out); }
    if (opts.mode === "new") {
      var left = Math.max(0, state.settings.newPerDay - state.daily.newSeen);
      out = p.fresh.slice(0, Math.min(n, left || n));
      return out;
    }
    var wantBox = Math.round(n * 0.25), wantNew = Math.round(n * 0.25);
    var newLeft = Math.max(0, state.settings.newPerDay - state.daily.newSeen);
    wantNew = Math.min(wantNew, newLeft, p.fresh.length);
    var takeBox = p.box.slice(0, Math.min(wantBox, p.box.length));
    var takeNew = p.fresh.slice(0, wantNew);
    var rest = n - takeBox.length - takeNew.length;
    var takeDue = p.due.slice(0, rest);
    if (takeDue.length < rest) takeDue = takeDue.concat(p.learning.slice(0, rest - takeDue.length));
    if (takeDue.length + takeBox.length + takeNew.length < Math.min(n, p.all.length))
      takeNew = takeNew.concat(p.fresh.slice(wantNew, wantNew + (n - takeDue.length - takeBox.length - takeNew.length)));
    out = shuffle(takeBox.concat(takeDue));
    // neue Wörter gleichmäßig einstreuen, nie zwei direkt hintereinander
    takeNew.forEach(function (w, i) {
      var pos = Math.min(out.length, Math.round((i + 0.5) * (out.length + takeNew.length) / Math.max(1, takeNew.length)));
      out.splice(pos, 0, w);
    });
    return out.slice(0, n);
  }

  /* ---------- Unregelmäßige Verben ----------
     Eigene Liste (data/verben.js), aber derselbe Lernspeicher wie die Wörter: state.w["v#<n>"]. */
  var verbs = (global.VERBS || []).map(function (v, i) {
    var first = function (x) { return String(x).split("/")[0]; };
    var sents = (v[5] || []).map(function (x) { return { en: x[0], de: x[1], form: x[2], time: x[3] }; });
    return { id: "v#" + i, inf: v[0], past: v[1], pp: v[2], de: v[3], lvl: v[4] || 1, s: sents,
      ex: sents[1] ? sents[1].en : "", en: v[0] + ", " + first(v[1]) + ", " + first(v[2]), alt: /\//.test(v[1] + v[2]) };
  });
  function verbPools() {
    var now = Date.now(), due = [], box = [], fresh = [], learning = [];
    verbs.forEach(function (v) {
      var r = state.w[v.id];
      if (!r || !r.reps && !r.no) { fresh.push(v); return; }
      if (inErrorBox(v.id)) { box.push(v); return; }
      if (r.due <= now) due.push(v); else learning.push(v);
    });
    due.sort(function (a, b) { return state.w[a.id].due - state.w[b.id].due; });
    learning.sort(function (a, b) { return state.w[a.id].due - state.w[b.id].due; });
    fresh.sort(function (a, b) { return a.lvl - b.lvl; });   // häufige Verben zuerst
    return { due: due, box: box, fresh: fresh, learning: learning, all: verbs };
  }
  /* n Verben für eine Übung: Fehlerkartei und Fälliges zuerst, dann höchstens newMax neue, dann der Rest.
     opts.mix = zum Einstreuen in normale Runden: nur so viele neue, wie das Tageslimit erlaubt. */
  function planVerbs(n, opts) {
    opts = opts || {};
    var p = verbPools(), out = [];
    var newMax = opts.mix ? Math.max(0, Math.min(1, (state.settings.newVerbsPerDay || 3) - (state.daily.newVerbs || 0))) : (opts.newMax == null ? 5 : opts.newMax);
    out = p.box.slice(0, n);
    out = out.concat(p.due.slice(0, n - out.length));
    var fresh = p.fresh.slice(0, Math.min(newMax, n - out.length));
    out = out.concat(fresh);
    if (!opts.mix && out.length < n) out = out.concat(p.learning.slice(0, n - out.length));
    if (!opts.mix && out.length < n) out = out.concat(shuffle(p.fresh.slice(fresh.length)).slice(0, n - out.length));
    if (fresh.length) state.daily.newVerbs = (state.daily.newVerbs || 0) + fresh.length;
    return out;
  }
  function verbStats() {
    var dist = [0, 0, 0, 0, 0];
    verbs.forEach(function (v) { dist[levelOf(v.id)]++; });
    return { total: verbs.length, seen: verbs.length - dist[0], mastered: dist[4], dist: dist };
  }

  /* ---------- Fortschritt, Level, Belohnungen ---------- */
  function rankOf(xp) {
    var r = RANKS[0], next = null;
    for (var i = 0; i < RANKS.length; i++) { if (xp >= RANKS[i].xp) { r = RANKS[i]; next = RANKS[i + 1] || null; } }
    return { rank: r, next: next, into: xp - r.xp, span: next ? next.xp - r.xp : 0 };
  }
  function addXp(v) { state.xp += v; state.daily.xp += v; }
  function addCoins(v) { state.coins += v; }

  function bumpMission(type, amount) {
    var hit = [];
    state.daily.missions.forEach(function (m) {
      if (m.done || m.type !== type) return;
      m.p = type === "chain" ? Math.max(m.p, amount) : m.p + amount;
      if (m.p >= m.goal) { m.done = true; addCoins(m.coins); hit.push(m); }
    });
    return hit;
  }
  function checkBadges() {
    var got = [], have = state.badges;
    function give(id) {
      var def = BADGES.filter(function (b) { return b.id === id; })[0];
      if (!def || have.indexOf(id) >= 0) return;
      have.push(id); got.push(def);
    }
    var seen = 0, mastered = 0;
    for (var id in state.w) { if (state.w[id].reps || state.w[id].no) seen++; if (levelOf(id) === 4) mastered++; }
    if (state.totals.sentOk >= 20) give("sent20");
    if (state.totals.sentOk >= 75) give("sent75");
    if (seen >= 1) give("start");
    if (seen >= 50) give("w50");
    if (seen >= 150) give("w150");
    if (mastered >= 25) give("m25");
    if (mastered >= 100) give("m100");
    if (state.streak.count >= 7) give("streak7");
    if (state.streak.count >= 30) give("streak30");
    if (Object.keys(state.history).length + 1 >= 5) give("early");
    if (seen > 20 && pools().box.length === 0) give("box0");
    var uDone = units.some(function (u) {
      return u.words.length > 0 && u.words.every(function (w, i) { return levelOf(u.id + "#" + i) === 4; });
    });
    if (uDone) give("unit1");
    return got;
  }
  function finishSession(res) {
    // res: {items, correct, sec, maxChain, newSeen, boxSolved}
    var d = state.daily;
    d.items += res.items; d.correct += res.correct; d.sec += res.sec; d.newSeen += res.newSeen || 0;
    state.totals.items += res.items; state.totals.correct += res.correct; state.totals.sec += res.sec;
    var rewards = { coins: 0, missions: [], badges: [], goalReached: false, streakUp: false };
    rewards.missions = rewards.missions
      .concat(bumpMission("items", res.items))
      .concat(bumpMission("box", res.boxSolved || 0))
      .concat(bumpMission("new", res.newSeen || 0))
      .concat(bumpMission("chain", res.maxChain || 0))
      .concat(bumpMission("master", res.mastered || 0))
      .concat(bumpMission("sent", res.sentOk || 0));
    var goalSec = state.settings.goalMin * 60;
    if (d.sec >= goalSec && !d.done) {
      d.done = true; rewards.goalReached = true; addCoins(20); rewards.coins += 20;
      rewards.missions = rewards.missions.concat(bumpMission("goal", 1));
      if (state.streak.last !== d.date) {
        state.streak.count += 1; state.streak.last = d.date;
        state.streak.best = Math.max(state.streak.best, state.streak.count);
        rewards.streakUp = true;
        if (state.streak.count % 5 === 0) state.streak.freezes = Math.min(3, state.streak.freezes + 1);
      }
    }
    if (res.items >= 8 && res.correct === res.items) {
      if (state.badges.indexOf("clean") < 0) { state.badges.push("clean"); rewards.badges.push(BADGES.filter(function (b) { return b.id === "clean"; })[0]); }
    }
    if ((res.maxChain || 0) >= 15 && state.badges.indexOf("chain15") < 0) {
      state.badges.push("chain15"); rewards.badges.push(BADGES.filter(function (b) { return b.id === "chain15"; })[0]);
    }
    rewards.badges = rewards.badges.concat(checkBadges());
    rewards.missions.forEach(function (m) { rewards.coins += m.coins; });
    save(true);
    return rewards;
  }

  /* ---------- Statistik ---------- */
  function stats() {
    var act = activeWords(), dist = [0, 0, 0, 0, 0], ok = 0, no = 0;
    act.forEach(function (w) { dist[levelOf(w.id)]++; var r = state.w[w.id]; if (r) { ok += r.ok; no += r.no; } });
    var d14 = [], t = new Date();
    for (var i = 13; i >= 0; i--) {
      var dt = new Date(t.getTime() - i * 86400000), k = today(dt);
      var h = (state.daily && state.daily.date === k) ? state.daily : state.history[k];
      d14.push({ date: k, label: ["So","Mo","Di","Mi","Do","Fr","Sa"][dt.getDay()], items: h ? h.items : 0, sec: h ? h.sec : 0, correct: h ? h.correct : 0 });
    }
    var perUnit = units.filter(function (u) { return u.track === state.settings.track || u.track === "eigen"; }).map(function (u) {
      var m = 0, s = 0;
      u.words.forEach(function (w, i) { var l = levelOf(u.id + "#" + i); if (l === 4) m++; if (l > 0) s++; });
      return { id: u.id, title: u.title, icon: u.icon || "📘", k: u.k, track: u.track, total: u.words.length, mastered: m, seen: s };
    });
    var weak = Object.keys(state.w).filter(function (id) { return byId[id] && state.w[id].no > 0 && levelOf(id) < 3; })
      .map(function (id) { return { w: byId[id], r: state.w[id] }; })
      .sort(function (a, b) { return (b.r.no - a.r.no) || (a.r.ok - b.r.ok); }).slice(0, 25);
    return {
      dist: dist, total: act.length, ok: ok, no: no,
      acc: ok + no ? Math.round(ok * 100 / (ok + no)) : 0,
      d14: d14, perUnit: perUnit, weak: weak,
      boxSize: pools().box.length, dueNow: pools().due.length, sent: sentenceStats(),
      days: Object.keys(state.history).length + (state.daily && state.daily.items ? 1 : 0)
    };
  }

  /* ---------- CSV-Import / Export ---------- */
  function parseCsv(text, title) {
    var lines = text.replace(/\r/g, "").split("\n").filter(function (l) { return l.trim().length; });
    var sep = (lines[0].split(";").length > lines[0].split(",").length) ? ";" : (lines[0].split("\t").length > 1 ? "\t" : ",");
    var out = [], skipped = 0;
    lines.forEach(function (l, i) {
      var c = l.split(sep).map(function (x) { return x.trim().replace(/^"|"$/g, ""); });
      if (i === 0 && /^(en|english|englisch)$/i.test(c[0])) return;
      if (c.length < 2 || !c[0] || !c[1]) { skipped++; return; }
      out.push([c[0], c[1], Number(c[3]) || 2, c[2] || ""]);
    });
    if (!out.length) return { error: "Keine gültigen Zeilen gefunden." };
    var unit = { k: 0, track: "eigen", id: "eigen-" + Date.now().toString(36), title: title || "Eigene Liste", icon: "📝", words: out };
    state.custom.push(unit); buildCatalogue(state); save(true);
    return { unit: unit, count: out.length, skipped: skipped };
  }
  function removeCustom(id) {
    state.custom = state.custom.filter(function (u) { return u.id !== id; });
    state.settings.units = state.settings.units.filter(function (u) { return u !== id; });
    buildCatalogue(state); save(true);
  }
  function exportProgress() { return JSON.stringify(state); }
  function importProgress(text) {
    try {
      var p = JSON.parse(text);
      if (!p || p.v !== 2) return { error: "Das ist kein gültiger Lernstand." };
      writeBackup("pre", JSON.stringify(state));
      state = Object.assign(freshState(), p); buildCatalogue(state); rollDay(); save(true);
      return { ok: true };
    } catch (e) { return { error: "Die Datei konnte nicht gelesen werden." }; }
  }
  function exportCsv() {
    var rows = ["englisch;deutsch;einheit;stufe;richtig;falsch;naechste_wiederholung"];
    activeWords().forEach(function (w) {
      var r = state.w[w.id] || { ok: 0, no: 0, due: 0 };
      rows.push([w.en, w.de, w.unitTitle, LEVELS[levelOf(w.id)].n, r.ok, r.no,
        r.due ? new Date(r.due).toISOString().slice(0, 10) : "-"].join(";"));
    });
    return rows.join("\n");
  }
  function resetProgress() { writeBackup("pre", JSON.stringify(state)); var keep = state.custom, st = state.settings; state = freshState(); state.custom = keep; state.settings = st; buildCatalogue(state); rollDay(); save(true); }
  function setTrack(t) { state.settings.track = t; state.settings.units = []; save(true); }

  /* ---------- Shop ---------- */
  function itemById(id) { return SHOP.filter(function (x) { return x.id === id; })[0]; }
  function minXp(it) {
    if (!it.rank) return 0;
    var r = RANKS.filter(function (x) { return x.n === it.rank; })[0];
    return r ? r.xp : 0;
  }
  function owns(it) { return it.cost === 0 || state.profile.owned.indexOf(it.id) >= 0; }
  function isActive(it) { var v = state.profile[PROFILE_KEY[it.kind]]; return (v == null ? defaultOf(it.kind) : v) === it.val; }
  function defaultOf(kind) { return kind === "avatar" ? "🦊" : kind === "theme" ? "paper" : kind === "title" ? "" : "none"; }
  function equip(id) {
    var it = itemById(id); if (!it || !owns(it)) return { error: "Das gehört dir noch nicht." };
    state.profile[PROFILE_KEY[it.kind]] = it.val; save(true); return { ok: true, item: it };
  }
  function buy(id) {
    var it = itemById(id);
    if (!it) return { error: "Unbekannt." };
    if (owns(it)) return { error: "Gehört dir schon." };
    if (state.xp < minXp(it)) return { error: "Das gibt es erst ab dem Rang " + it.rank + "." };
    if (state.coins < it.cost) return { error: "Dafür fehlen noch " + (it.cost - state.coins) + " Münzen." };
    state.coins -= it.cost; state.profile.owned.push(id);
    state.profile[PROFILE_KEY[it.kind]] = it.val;
    save(true); return { ok: true, item: it };
  }

  global.VT = {
    LEVELS: LEVELS, RANKS: RANKS, AVATARS: AVATARS, SHOP: SHOP, BADGES: BADGES,
    SEC_PER_ITEM: SEC_PER_ITEM,
    load: load, save: save, get state() { return state; },
    units: function () { return units; }, words: function () { return words; }, byId: function (id) { return byId[id]; },
    buildCatalogue: function () { return buildCatalogue(state); },
    levelOf: levelOf, grade: grade, inErrorBox: inErrorBox, rec: rec,
    pools: pools, planSession: planSession, activeWords: activeWords,
    sentences: function () { return sentences; }, activeSentences: activeSentences,
    planSentences: planSentences, gradeSentence: gradeSentence, sentenceStats: sentenceStats,
    srec: srec, groupsOf: groupsOf, setTrack: setTrack,
    rankOf: rankOf, addXp: addXp, addCoins: addCoins, finishSession: finishSession,
    stats: stats, today: today, shuffle: shuffle, regenHearts: regenHearts, heartsIn: heartsIn,
    rollDay: rollDay, verbs: function () { return verbs; }, verbPools: verbPools, planVerbs: planVerbs, verbStats: verbStats, parseCsv: parseCsv, removeCustom: removeCustom,
    backupInfo: backupInfo, restoreBackup: restoreBackup, keepStorage: keepStorage, isPersisted: function () { return persisted; },
    profiles: profiles, addProfile: addProfile, switchProfile: switchProfile, renameProfile: renameProfile, deleteProfile: deleteProfile,
    exportProgress: exportProgress, importProgress: importProgress, exportCsv: exportCsv,
    resetProgress: resetProgress, buy: buy, equip: equip, owns: owns, isActive: isActive, minXp: minXp, defaultOf: defaultOf
  };
})(window);
