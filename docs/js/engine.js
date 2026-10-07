/* Vokabeltrainer v2 – Lernmotor: Speicherung, Spaced Repetition, Fehlerkartei,
   Sessionplanung, Level, Missionen, Statistik. Keine UI in dieser Datei. */
(function (global) {
  "use strict";

  var KEY = "vokabeltrainer.v2";
  var SEC_PER_ITEM = 11;           // Schätzwert für die Zeitplanung, solange noch keine eigenen Runden vorliegen
  /* Sekunden pro geplantem Wort aus den eigenen, fertig gespielten Runden (ab 50 Wörtern), sonst der Schätzwert */
  function secPerItem() {
    var pc = state && state.pace;
    if (!pc || pc.n < 50 || !pc.sec) return SEC_PER_ITEM;
    return clamp(Math.round(pc.sec / pc.n), 6, 40);
  }
  function itemsFor(minutes) { return Math.max(5, Math.round(minutes * 60 / secPerItem())); }
  function recordPace(sec, planned) {
    if (!(sec >= 20 && planned >= 5)) return;
    if (!state.pace) state.pace = { sec: 0, n: 0 };
    state.pace.sec += sec; state.pace.n += planned;
    if (state.pace.n > 400) { state.pace.sec = Math.round(state.pace.sec * 0.5); state.pace.n = Math.round(state.pace.n * 0.5); }   // neuere Runden zählen mehr
  }
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
    { id: "av:clombo",    kind: "avatar", label: "Clombo",        cost: 300, val: "svg:clombo", rank: "Gold I" },
    { id: "av:pphoenix", kind: "avatar", label: "Pummelphönix",  cost: 600,  val: "svg:pphoenix", rank: "Gold I" },
    { id: "av:pgold",    kind: "avatar", label: "Goldpummel",    cost: 800,  val: "svg:pgold", rank: "Platin I" },
    { id: "av:pregen",   kind: "avatar", label: "Regenbogenpummel", cost: 1200, val: "svg:pregen", rank: "Diamant I" },
    { id: "av:pgalaxie", kind: "avatar", label: "Galaxiepummel", cost: 2000, val: "svg:pgalaxie", rank: "Elite" },

    /* Fortnite-Sammlung (eigene Zeichnungen): Tiere ab Gold II, Rang-Kristalle ab ihrem Rang, Unreal-Stücke erst ab Unreal */
    { id: "av:fnhuhn",     kind: "avatar", set: "fn", label: "Huhn",           cost: 150,  val: "svg:fnhuhn",     rank: "Gold II" },
    { id: "av:fnschwein",  kind: "avatar", set: "fn", label: "Wildschwein",    cost: 200,  val: "svg:fnschwein",  rank: "Gold II" },
    { id: "av:fnfrosch",   kind: "avatar", set: "fn", label: "Frosch",         cost: 200,  val: "svg:fnfrosch",   rank: "Gold II" },
    { id: "av:fnwolf",     kind: "avatar", set: "fn", label: "Wolf",           cost: 250,  val: "svg:fnwolf",     rank: "Gold II" },
    { id: "av:fnraptor",   kind: "avatar", set: "fn", label: "Raptor",         cost: 300,  val: "svg:fnraptor",   rank: "Gold II" },
    { id: "av:fnllama",    kind: "avatar", set: "fn", label: "Beute-Lama",     cost: 350,  val: "svg:fnllama",    rank: "Gold II" },
    { id: "av:fnelite",    kind: "avatar", set: "fn", label: "Elite-Kristall", cost: 800,  val: "svg:fnelite",    rank: "Elite" },
    { id: "av:fnchamp",    kind: "avatar", set: "fn", label: "Champion-Kristall", cost: 1200, val: "svg:fnchamp", rank: "Champion" },
    { id: "av:fnkristall", kind: "avatar", set: "fn", label: "Kristall-Lama",  cost: 1500, val: "svg:fnkristall", rank: "Unreal" },
    { id: "av:fnunreal",   kind: "avatar", set: "fn", label: "Unreal-Kristall", cost: 2500, val: "svg:fnunreal",  rank: "Unreal" },

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
  /* Sticker: jede Figur gibt es zusätzlich als Aufkleber (halber Preis), die man auf Startseite und Profil klebt */
  SHOP = SHOP.concat(SHOP.filter(function (a) { return a.kind === "avatar"; }).map(function (a) {
    return { id: "st:" + a.id.slice(3), kind: "sticker", set: a.set, label: a.label + "-Sticker", cost: a.cost ? Math.max(20, Math.round(a.cost / 20) * 10) : 0, val: a.val, rank: a.rank };
  }));
  SHOP.forEach(function (x) { if (x.id === "st:clombo") x.cost = 300; });   // Clombo als Sticker: gleicher Preis und gleicher Mindestrang wie die Figur
  var MAX_STICKERS = 5;
  /* Sticker-Plätze auf dem Profil: der erste ist gratis, die weiteren werden nacheinander freigeschaltet */
  var STICKER_SLOT_COST = [0, 100, 150, 150, 150];
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
  /* Kalendertag in der Ortszeit des Geräts: Missionen, Tagesziel und Serie wechseln um Mitternacht, nicht um 1 oder 2 Uhr nachts */
  function today(d) {
    d = d || new Date();
    var m = d.getMonth() + 1, t = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (t < 10 ? "0" : "") + t;
  }
  function dayDiff(a, b) { return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------- Wortkatalog ---------- */
  var units = [], words = [], byId = {}, sentences = [];
  function trackOf(u) { return u.track || (u.k === 0 ? "eigen" : "schule"); }
  function buildCatalogue(state) {
    units = (global.VOCAB_UNITS || []).slice();
    var cfg = state && state.settings;   // einmalig: Schulstoff (Headlight 2) ist die Voreinstellung, die Klassen kommen optional dazu
    if (cfg && (cfg.hl2 || 0) < 2) { cfg.hl2 = 2; cfg.klassen = ["Headlight 2"]; }
    /* Einmalig mit dem neuen Sticker-System (Version 2.17): alle aufgeklebten Sticker abnehmen, ein Platz frei. Gekaufte Sticker bleiben im Besitz. */
    if (state && state.profile && !state.profile.stickerReset) { state.profile.stickers = []; state.profile.stickerSlots = 1; state.profile.stickerReset = 1; }
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
      settings: { track: "schule", klassen: ["Headlight 2"], hl2: 2, bizGroups: ["Basis"], units: [], goalMin: 10, audio: true, hearts: true, newPerDay: 12 },
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
  /* Lernstand aus einer Sicherung (vom Server) einspielen; der bisherige Stand bleibt als "pre"-Kopie erhalten */
  function restoreState(obj) {
    if (!obj || obj.v !== 2 || !obj.w || !obj.settings) return { error: "Das ist kein gültiger Lernstand." };
    writeBackup("pre", JSON.stringify(state));
    state = Object.assign(freshState(), obj); buildCatalogue(state); rollDay(); save(true);
    return { ok: true };
  }
  function isFresh() { return !Object.keys(state.w).length && !(state.totals && state.totals.items); }
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

  /* ---------- Wochenzeitplan (Eltern legen pro Wochentag Minuten fest; gilt jede Woche gleich) ---------- */
  function weekPlan() {
    var r = global.WordySync && global.WordySync.remote ? (global.WordySync.remote() || {}).weekPlan : null;
    return r && Array.isArray(r.min) && r.min.length === 7 ? r : null;
  }
  function wdIndex(dateStr) { var a = dateStr.split("-").map(Number); return (new Date(Date.UTC(a[0], a[1] - 1, a[2])).getUTCDay() + 6) % 7; }   // Montag = 0
  function planMin(dateStr) { var wp = weekPlan(); return wp ? (+wp.min[wdIndex(dateStr || today())] || 0) : null; }   // null = kein Plan
  function freeDay(dateStr) { return planMin(dateStr) === 0; }
  function goalMin(dateStr) { var m = planMin(dateStr); return m > 0 ? m : state.settings.goalMin; }   // freier Tag: wer übt, hat das normale Ziel

  /* ---------- Tageswechsel, Streak, Herzen ---------- */
  function rollDay() {
    var t = today();
    if (!state.daily || state.daily.date !== t) {
      if (state.daily && state.daily.items > 0) state.history[state.daily.date] = {
        items: state.daily.items, correct: state.daily.correct, sec: state.daily.sec, xp: state.daily.xp, newSeen: state.daily.newSeen || 0
      };
      state.daily = { date: t, items: 0, correct: 0, sec: 0, xp: 0, newSeen: 0, missions: makeMissions(), done: false };
      state.streak.usedToday = false;
      var last = state.streak.last;
      if (last) {
        var gap = dayDiff(last, t);
        if (gap > 1) {
          var missed = gap - 1;
          for (var fd = 1; fd <= gap - 1; fd++) { if (freeDay(today(new Date(Date.parse(t + "T12:00:00") - fd * 86400000)))) missed--; }   // freie Tage im Wochenplan unterbrechen die Serie nicht
          if (missed <= 0) { /* nur freie Tage dazwischen */ }
          else if (state.streak.freezes >= missed) { state.streak.freezes -= missed; state.streak.usedToday = true; }
          else { state.streak.best = Math.max(state.streak.best, state.streak.count); state.streak.count = 0; }
        }
      }
      save(true);
    }
    fixMissions();
  }
  var MISSION_POOL = [
    { id: "m20", n: "15 verschiedene Wörter üben", goal: 15, type: "items", coins: 10 },
    { id: "m30", n: "25 verschiedene Wörter üben", goal: 25, type: "items", coins: 14 },
    { id: "mgoal", n: "Tagesziel erreichen", goal: 1, type: "goal", coins: 15 },
    { id: "mbox", n: "5 Fehlerkartei-Wörter richtig beantworten", goal: 5, type: "box", coins: 12 },
    { id: "mchain", n: "10 richtige in Folge", goal: 10, type: "chain", coins: 12 },
    { id: "mnew", n: "6 neue Wörter kennenlernen", goal: 6, type: "new", coins: 10 },
    { id: "mmaster", n: "2 Wörter meistern", goal: 2, type: "master", coins: 18 },
    { id: "msent", n: "4 Sätze richtig bauen", goal: 4, type: "sent", coins: 14 },
    { id: "marena", n: "Eine Arena-Runde spielen", goal: 1, type: "arena", coins: 10 }
  ];
  var ARENA_NAMES = { match: "Match-Rausch", blitz: "Blitzrunde", survival: "Letztes Herz", hunt: "Fehlerjagd" };
  /* Aus einer Vorlage wird die Tagesmission; die Arena-Mission bekommt einen Spielmodus */
  function instMission(def) {
    var m = { id: def.id, n: def.n, goal: def.goal, type: def.type, coins: def.coins, p: 0, done: false };
    if (def.type === "arena") {
      var ids = ["match", "blitz", "survival"]; if (pools().box.length >= 5) ids.push("hunt");
      m.mode = ids[Math.floor(Math.random() * ids.length)]; m.n = "Eine Runde " + ARENA_NAMES[m.mode] + " spielen";
    }
    return m;
  }
  /* Wörter, die dem Meistern am nächsten sind: erst Stufe „Sitzt“ (fällige zuerst), dann Stufe „Geübt“ */
  function masterList(n) {
    var now = Date.now();
    var cand = pools().all.filter(function (w) { var l = levelOf(w.id); return l === 3 || l === 2; });
    cand.sort(function (a, b) {
      var la = levelOf(a.id), lb = levelOf(b.id); if (la !== lb) return lb - la;
      var ra = state.w[a.id], rb = state.w[b.id], da = ra.due <= now ? 0 : 1, db = rb.due <= now ? 0 : 1;
      return (da - db) || ((rb.iv || 0) - (ra.iv || 0));
    });
    return cand.slice(0, n);
  }
  /* Nur Missionen, die heute überhaupt machbar sind: leere Fehlerkartei, keine neuen Wörter mehr, keine Sätze usw. fallen heraus */
  function missionFeasible(m) {
    var p = pools();
    switch (m.type) {
      case "box": return p.box.length >= m.goal;
      case "new":
        var seen = state.daily && state.daily.date === today() ? (state.daily.newSeen || 0) : 0;
        return p.fresh.length >= m.goal && Math.max(0, state.settings.newPerDay - seen) >= m.goal;
      case "master": return p.all.filter(function (w) { return levelOf(w.id) >= 3; }).length >= m.goal;
      case "sent": return activeSentences().length >= m.goal;
      case "arena": return state.settings.arenaMissions !== false && p.all.length >= 8;
      default: return true;
    }
  }
  function makeMissions() {
    var pool = MISSION_POOL.filter(missionFeasible).filter(function (m) { return m.type !== "arena" || Math.random() < 0.3; });   // „ab und zu“ eine Arena-Runde
    if (pool.length < 3) pool = MISSION_POOL.filter(function (m) { return /^(items|goal|chain)$/.test(m.type); });
    var picked = shuffle(pool.slice()).slice(0, 3);
    return picked.map(instMission);
  }
  /* Eine schon gezogene, unerfüllbare und noch nicht begonnene Mission wird durch eine machbare ersetzt */
  function fixMissions() {
    var d = state.daily; if (!d || !d.missions) return;
    var changed = false;
    d.missions = d.missions.map(function (m) {
      var def = MISSION_POOL.filter(function (x) { return x.id === m.id; })[0];
      if (m.done || m.p > 0 || !def || missionFeasible(def)) return m;
      var have = d.missions.map(function (x) { return x.id; });
      var alt = shuffle(MISSION_POOL.filter(function (x) { return have.indexOf(x.id) < 0 && missionFeasible(x); }))[0];
      if (!alt) return m;
      changed = true;
      return instMission(alt);
    });
    if (changed) save();
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
  function ev(kind, d) { var f = global.WordySync; if (f) { try { f.log(kind, d); } catch (e) {} } }
  /* o.hint: mit Hinweis gelöst. Das Wort gilt als „gesehen“, aber nicht als sicher: kurzer Abstand und keine Serie (Münzen für echten Fortschritt gibt es weiter, XP nicht). */
  function grade(id, g, o) {
    o = o || {};
    var r = rec(id), before = levelOf(id);
    var wasDue = !r.reps || r.due <= Date.now(), wasBox = inErrorBox(id);   // Münzen nur für fällige Wörter: Wiederholen ohne Abstand bringt nichts
    r.last = Date.now();
    touchToday(id);
    if (g === 0) {
      r.no++; r.lapses++; r.chain = 0; r.reps = 0; r.iv = 0;
      r.ef = clamp(r.ef - 0.2, 1.3, 2.8);
      r.due = Date.now() + 60000;
    } else {
      r.ok++; r.chain = o.hint ? 0 : r.chain + 1;
      if (o.hint) {
        r.ef = clamp(r.ef - 0.06, 1.3, 2.8);
        r.iv = Math.max(1, Math.min(r.iv || 1, 3)); r.reps = Math.max(1, r.reps);
      } else {
        r.ef = clamp(r.ef + (g === 2 ? 0.08 : -0.06), 1.3, 2.8);
        r.iv = r.reps === 0 ? 1 : r.reps === 1 ? 3 : Math.min(400, Math.round(r.iv * r.ef));
        r.reps++;
      }
      r.due = Date.now() + r.iv * 86400000;
    }
    var after = levelOf(id);
    if (after === 4 && before < 4) r.m = Date.now();   // wann das Wort gemeistert wurde (für „diese Woche gemeistert“)
    if (g > 0) awardProgress(id, before, after, wasDue, wasBox && !inErrorBox(id));
    var it = byId[id]; ev("a", { id: id, g: g, h: o.hint ? 1 : 0, b: before, a: after, en: it ? it.en : "", de: it ? it.de : "", u: it ? it.unit : "" });
    return { before: before, after: after, rec: r };
  }

  /* ---------- Fortschrittsmünzen ----------
     Münzen gibt es für echten Fortschritt, nicht für Antworten: ein neues Wort, eine höhere Stufe, ein gelöstes Wort
     aus der Fehlerkartei, eine entdeckte oder abgeschlossene Einheit. Jedes Wort zahlt höchstens einmal pro Tag,
     und nur, wenn es fällig war. Dasselbe Wort immer wieder zu üben bringt also nichts. */
  var progressLog = { neu: 0, stufe: 0, gemeistert: 0, kartei: 0, einheit: 0, serie: 0, parts: [], n: {} };
  var PART_TEXT = { neu: "neue Wörter", stufe: "Stufen aufgestiegen", gemeistert: "Wörter gemeistert", kartei: "aus der Fehlerkartei" };
  function addCl(cat, c) { var d = state.daily; if (!d || c <= 0) return; if (!d.cl) d.cl = {}; d.cl[cat] = (d.cl[cat] || 0) + c; }
  function logCoins(kind, c, label) {
    if (c <= 0) return; addCoins(c); addCl(kind === "serie" ? "serie" : "fortschritt", c); progressLog[kind] = (progressLog[kind] || 0) + c;
    progressLog.n = progressLog.n || {}; progressLog.n[kind] = (progressLog.n[kind] || 0) + 1;
    if (label) progressLog.parts.push({ c: c, t: label });
  }
  function foldParts() {   // Einzelfortschritte zu je einer Zeile zusammenfassen
    var out = [];
    ["neu", "stufe", "gemeistert", "kartei"].forEach(function (k) {
      if (progressLog[k]) out.push({ c: progressLog[k], t: (progressLog.n[k] || 0) + " " + PART_TEXT[k] });
    });
    return out.concat(progressLog.parts);
  }
  function touchToday(id) {   // verschiedene Wörter heute, für die Missionen "x verschiedene Wörter üben"
    var d = state.daily; if (!d) return;
    if (!d.touched) d.touched = {};
    if (!d.touched[id]) { d.touched[id] = 1; d.distinct = (d.distinct || 0) + 1; }
  }
  function awardProgress(id, before, after, wasDue, boxSolved) {
    var d = state.daily; if (!d || !wasDue) return;
    if (!d.paid) d.paid = {};
    if (d.paid[id]) return;
    var c = 0, kind = null;
    if (after > before) {
      for (var lv = before + 1; lv <= after; lv++) c += lv === 4 ? 4 : 1;
      kind = before === 0 ? "neu" : after === 4 ? "gemeistert" : "stufe";
      logCoins(kind, c);
    }
    if (boxSolved) logCoins("kartei", 2);
    if (c > 0 || boxSolved) d.paid[id] = 1;
    if (after >= 1) unitBonus(id);
  }
  function unitIds(uid) {
    if (uid === "verbs") return verbs.map(function (v) { return v.id; });
    var u = units.filter(function (x) { return x.id === uid; })[0];
    return u ? u.words.map(function (w, i) { return u.id + "#" + i; }) : [];
  }
  /* Entdecker-Bonus (ab 5 Wörtern einer Einheit angefangen) und Abschluss-Bonus (alle mindestens "Geübt"); je einmal pro Einheit */
  function unitBonus(id) {
    var uid = id.indexOf("v#") === 0 ? "verbs" : (byId[id] && byId[id].unit); if (!uid) return;
    var u = uid === "verbs" ? { title: "Unregelmäßige Verben", track: "schule" } : units.filter(function (x) { return x.id === uid; })[0];
    if (!u || u.track === "eigen") return;
    var ids = unitIds(uid); if (ids.length < 8) return;
    var ub = state.unitBonus || (state.unitBonus = {}), r = ub[uid] || (ub[uid] = {});
    if (!r.s && ids.filter(function (x) { return levelOf(x) >= 1; }).length >= 5) { r.s = 1; logCoins("einheit", 8, "Neue Einheit entdeckt: " + u.title); }
    if (!r.d && ids.every(function (x) { return levelOf(x) >= 2; })) { r.d = 1; logCoins("einheit", uid === "verbs" ? 60 : 30, "Einheit geschafft: " + u.title); }
  }
  var STREAK_BONUS = { 3: 15, 7: 40, 14: 80, 30: 200, 60: 300, 100: 500 };
  function inErrorBox(id) { var r = state.w[id]; return !!r && r.lapses > 0 && levelOf(id) < 3; }

  /* ---------- Auswahl & Sessionplanung ---------- */
  function groupsOf() {
    var s = state.settings, biz = s.track === "business", key = biz ? "bizGroups" : "klassen";
    if (!Array.isArray(s[key]) || !s[key].length) s[key] = biz ? ["Basis"] : ["Headlight 2"];   // immer mindestens eine Auswahl
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
  /* Schulbücher mit eigenen Sätzen (Headlight 2) nutzen diese; ohne eigene Sätze greift die Klasse (Rückfall) */
  var BOOK_CLASS = { "Headlight 2": 6 };
  function activeSentences() {
    var s = state.settings, sel = groupsOf().map(function (k) {
      return BOOK_CLASS[k] && !sentences.some(function (x) { return x.k === k; }) ? BOOK_CLASS[k] : k; });
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
    ev("s", { id: id, g: g });
    return r;
  }
  function sentenceStats() {
    var act = activeSentences(), seen = 0, mastered = 0;
    act.forEach(function (x) { var r = state.s[x.id]; if (r && r.reps) { seen++; if (r.iv >= 21) mastered++; } });
    return { total: act.length, seen: seen, mastered: mastered, ok: state.totals.sentOk };
  }
  function pools(scope) {
    var now = Date.now(), act = scope ? words.filter(function (w) { return scope.indexOf(w.unit) >= 0; }) : activeWords();
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
    var n = itemsFor(minutes);
    var p = pools(opts.scope), out = [];
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
    var newLeft = Math.max(0, (opts.newMax != null ? opts.newMax : state.settings.newPerDay) - state.daily.newSeen);
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
  function addXp(v) { if (boostActive()) v *= 2; state.xp += v; state.daily.xp += v; }
  function boostActive() { var b = state.path && state.path.boost; return !!(b && b.on && b.left > 0); }
  function addCoins(v) { state.coins += v; }

  function bumpMission(type, amount) {
    var hit = [];
    state.daily.missions.forEach(function (m) {
      if (m.done || m.type !== type) return;
      m.p = type === "chain" ? Math.max(m.p, amount) : m.p + amount;
      if (m.p >= m.goal) { m.done = true; addCoins(m.coins); addCl("missionen", m.coins); hit.push(m); }
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
    var bst = state.path && state.path.boost;
    if (bst && bst.on) { bst.left = Math.max(0, bst.left - (res.sec || 0)); if (bst.left <= 0) bst.on = false; }   // Booster zählt echte Übungszeit
    // res: {items, correct, sec, maxChain, newSeen, boxSolved}
    var d = state.daily;
    d.items += res.items; d.correct += res.correct; d.sec += res.sec; d.newSeen += res.newSeen || 0;
    state.totals.items += res.items; state.totals.correct += res.correct; state.totals.sec += res.sec;
    var rewards = { coins: 0, missions: [], badges: [], goalReached: false, streakUp: false };
    rewards.missions = rewards.missions
      .concat(bumpMission("items", (function () { var dd = (d.distinct || 0) - (d.distinctBooked || 0); d.distinctBooked = d.distinct || 0; return dd; })()))
      .concat(bumpMission("box", res.boxSolved || 0))
      .concat(bumpMission("new", res.newSeen || 0))
      .concat(bumpMission("chain", res.maxChain || 0))
      .concat(bumpMission("master", res.mastered || 0))
      .concat(bumpMission("sent", res.sentOk || 0))
      .concat(bumpMission("arena", res.arena ? 1 : 0));
    var goalSec = goalMin() * 60;
    if (d.sec >= goalSec && !d.done) {
      d.done = true; rewards.goalReached = true; addCoins(20); addCl("ziel", 20); rewards.coins += 20;
      rewards.missions = rewards.missions.concat(bumpMission("goal", 1));
      if (state.streak.last !== d.date) {
        state.streak.count += 1; state.streak.last = d.date;
        state.streak.best = Math.max(state.streak.best, state.streak.count);
        rewards.streakUp = true;
        if (state.streak.count % 5 === 0) state.streak.freezes = Math.min(3, state.streak.freezes + 1);
        var sb = STREAK_BONUS[state.streak.count];
        if (sb) logCoins("serie", sb, state.streak.count + " Tage am Stück!");
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
    rewards.parts = foldParts();
    progressLog = { neu: 0, stufe: 0, gemeistert: 0, kartei: 0, einheit: 0, serie: 0, parts: [], n: {} };
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
      var m = 0, s = 0, f = 0;
      u.words.forEach(function (w, i) { var l = levelOf(u.id + "#" + i); if (l === 4) m++; if (l >= 3) f++; if (l > 0) s++; });
      return { id: u.id, title: u.title, icon: u.icon || "📘", k: u.k, track: u.track, total: u.words.length, mastered: m, sure: f, seen: s };
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
  function stickerSlots() {   // bestehende Profile behalten, was sie schon aufgeklebt haben
    var p = state.profile;
    if (typeof p.stickerSlots !== "number") p.stickerSlots = Math.max(1, Array.isArray(p.stickers) ? p.stickers.length : 0);
    return Math.min(MAX_STICKERS, p.stickerSlots);
  }
  function buySlot() {
    var n = stickerSlots();
    if (n >= MAX_STICKERS) return { error: "Alle fünf Plätze sind schon freigeschaltet." };
    var cost = STICKER_SLOT_COST[n];
    if (state.coins < cost) return { error: "Dafür fehlen noch " + (cost - state.coins) + " Münzen." };
    state.coins -= cost; state.profile.stickerSlots = n + 1;
    ev("buy", { id: "slot:" + (n + 1), name: "Sticker-Platz " + (n + 1), cost: cost });
    save(true); return { ok: true, slots: n + 1, cost: cost };
  }
  function stickers() { var l = state.profile.stickers; if (!Array.isArray(l)) l = state.profile.stickers = []; return l; }
  function isActive(it) {
    if (it.kind === "sticker") return stickers().indexOf(it.id) >= 0; var v = state.profile[PROFILE_KEY[it.kind]]; return (v == null ? defaultOf(it.kind) : v) === it.val; }
  function defaultOf(kind) { return kind === "avatar" ? "🦊" : kind === "theme" ? "paper" : kind === "title" ? "" : "none"; }
  function equip(id) {
    var it = itemById(id); if (!it || !owns(it)) return { error: "Das gehört dir noch nicht." };
    if (it.kind === "sticker") {            // antippen klebt auf oder löst wieder ab; höchstens so viele wie freigeschaltete Plätze
      var l = stickers(), i = l.indexOf(it.id);
      if (i >= 0) l.splice(i, 1); else { l.push(it.id); while (l.length > stickerSlots()) l.shift(); }
      save(true); return { ok: true, item: it, on: i < 0 };
    }
    state.profile[PROFILE_KEY[it.kind]] = it.val; save(true); return { ok: true, item: it };
  }
  /* ---------- Lernpfad (Headlight 2): Abschnitte aus Stationen, Truhe am Ende jedes Abschnitts ---------- */
  var STATION_WORDS = 7, pathCache = null, pathCacheKey = "";
  function pathState() {
    var p = state.path;
    if (!p) p = state.path = { pos: 0, stars: {}, chests: {}, pending: [], boost: { stock: 0, on: false, left: 0 } };
    if (!p.boost) p.boost = { stock: 0, on: false, left: 0 };
    if (!Array.isArray(p.pending)) p.pending = [];
    if (!Array.isArray(p.bossLog)) p.bossLog = [];
    if (!p.bossFail) p.bossFail = {};
    return p;
  }
  var BIZ_ORDER = ["Basis", "Aufbau", "Profi", "Smalltalk", "Redewendungen"];
  /* Welche Einheiten stehen im Pfad? Die Eltern können das im Dashboard festlegen; sonst Schule = Headlight 2, Business = die gewählten Stufen */
  function pathUnitList() {
    var tr = state.settings.track === "business" ? "business" : "schule", r = global.WordySync && global.WordySync.remote ? (global.WordySync.remote() || {}).pathUnits : null;
    var all = units.filter(function (u) { return u.track === tr; });
    if (tr === "business") all = all.map(function (u, i) { return { u: u, i: i }; }).sort(function (a, b) { return (BIZ_ORDER.indexOf(a.u.k) - BIZ_ORDER.indexOf(b.u.k)) || (a.i - b.i); }).map(function (x) { return x.u; });
    if (Array.isArray(r) && r.length) { var chosen = all.filter(function (u) { return r.indexOf(u.id) >= 0; }); if (chosen.length) return chosen; }
    if (tr === "schule") return all.filter(function (u) { return u.k === "Headlight 2"; });
    var g = state.settings.bizGroups || ["Basis"];
    return all.filter(function (u) { return g.indexOf(u.k) >= 0; });
  }
  var BOSS_MODES = ["match", "blitz", "survival"], BOSS_NEED = { match: 10, blitz: 12, survival: 7 };
  /* Boss-Schwierigkeit (Dashboard): leicht 0,7 / normal 1 / schwer 1,3 */
  function bossFactor() {
    var r = global.WordySync && global.WordySync.remote ? (global.WordySync.remote() || {}).bossDiff : "";
    return r === "leicht" ? 0.7 : r === "schwer" ? 1.3 : 1;
  }
  function pathStations() {
    var ul = pathUnitList(), bf = bossFactor(), key = state.settings.track + ":" + bf + ":" + ul.map(function (u) { return u.id; }).join(",");
    if (pathCache && pathCacheKey === key) return pathCache;
    var out = [], secCount = 0, verbSec = 0, verbOrder = verbs.map(function (v, i) { return { id: v.id, l: v.lvl, i: i }; }).sort(function (a, b) { return (a.l - b.l) || (a.i - b.i); }).map(function (x) { return x.id; });
    ul.forEach(function (u) {
      var ids = u.words.map(function (w, i) { return u.id + "#" + i; }), n = ids.length;
      if (n < 4) return;
      var ns = Math.max(1, Math.round(n / STATION_WORDS)), parts = Math.ceil(ns / 5), per = Math.ceil(ns / parts), chunk = Math.ceil(n / ns), k = 0;
      var name = u.title.replace(/^Headlight 2 · /, "");
      for (var part = 0; part < parts; part++) {
        var cnt = Math.min(per, ns - k), sec = [], secWords = [], secId = u.id + (parts > 1 ? "." + (part + 1) : "");
        for (var j = 0; j < cnt; j++, k++) {
          var w = ids.slice(k * chunk, (k + 1) * chunk); if (!w.length) continue;
          secWords = secWords.concat(w);
          sec.push({ id: "S" + u.id + "." + k, unit: u.id, section: secId, sectionTitle: name + (parts > 1 ? " (Teil " + (part + 1) + ")" : ""), words: w, last: false });
        }
        if (!sec.length) continue;
        var bs = sec[sec.length - 1]; bs.last = true; bs.reviewWords = secWords;   // die letzte Station jedes Abschnitts ist die Boss-Runde in der Arena
        bs.bossMode = BOSS_MODES[secCount++ % BOSS_MODES.length]; bs.bossNeed = Math.max(3, Math.min(Math.round(BOSS_NEED[bs.bossMode] * bf), Math.max(Math.round(5 * bf), Math.floor(secWords.length * 0.8 * bf))));
        sec.forEach(function (s, ix) { s.n = ix + 1; s.of = sec.length; });
        if (state.settings.track !== "business" && sec.length >= 2 && verbOrder.length) {   // in jedem Abschnitt einmal unregelmäßige Verben (Station vor dem Boss), fest nach Abschnitt verteilt
          sec[sec.length - 2].verbIds = [0, 1, 2, 3].map(function (q) { return verbOrder[(verbSec * 4 + q) % verbOrder.length]; }); verbSec++;
        }
        out = out.concat(sec);
      }
    });
    out.forEach(function (s, i) { s.index = i; });
    pathCache = out; pathCacheKey = key;
    return out;
  }
  /* Abschnitte mit Stand für das Dashboard: [{id, u (Einheit), t (Titel), n (Stationen), d (geschafft), b (Boss geschafft), c (Truhe geholt)}] */
  function byUnit(id) { return units.filter(function (u) { return u.id === id; })[0]; }
  function pathSections() {
    var p = pathState(), secs = [], by = {};
    pathStations().forEach(function (s) {
      var x = by[s.section];
      if (!x) { var un = byUnit(s.unit); x = by[s.section] = { id: s.section, u: s.unit, k: un ? un.k : "", t: s.sectionTitle, n: 0, d: 0, b: 0, c: p.chests[s.section] ? 1 : 0 }; secs.push(x); }
      x.n++; if (p.stars[s.id]) { x.d++; if (s.last) x.b = 1; }
    });
    return secs;
  }
  /* Sanfte Hilfe: nach zwei verfehlten Versuchen sinkt das Ziel um 1, nach vier um 2 (mindestens 3) */
  function bossNeedFor(st) {
    var f = pathState().bossFail[st.id] || 0, help = f >= 4 ? 2 : f >= 2 ? 1 : 0;
    help = Math.min(help, Math.max(0, st.bossNeed - 3));
    return { need: st.bossNeed - help, base: st.bossNeed, help: help, tries: f };
  }
  function bossRecord(boss, correct, pass) {
    var p = pathState(), f = p.bossFail[boss.id] || 0;
    p.bossLog.push({ id: boss.id, t: Date.now(), s: boss.title, m: boss.mode, need: boss.need, base: boss.base || boss.need, c: correct, ok: pass ? 1 : 0, a: f + 1 });
    if (p.bossLog.length > 40) p.bossLog = p.bossLog.slice(-40);
    if (pass) delete p.bossFail[boss.id]; else p.bossFail[boss.id] = f + 1;
    save();
  }
  function bossLog() { return pathState().bossLog.slice(-30); }
  function pathProgress() { var p = pathState(), st = pathStations(), d = st.filter(function (s) { return p.stars[s.id]; }).length; return { done: d, total: st.length }; }
  /* Stationen, deren Wörter schon alle „sitzen“, werden übersprungen (Magnus hat Stoff ja schon gelernt) */
  function pathSync() {
    var p = pathState(), st = pathStations(), pos = 0, moved = false;
    while (pos < st.length && p.stars[st[pos].id]) pos++;   // Reihenfolge streng: die erste Station ohne Sterne ist dran
    while (pos < st.length) {
      var s = st[pos], all = (s.last ? s.reviewWords : s.words).concat(s.verbIds || []).every(function (id) { return levelOf(id) >= 3; });
      if (!all) break;
      p.stars[s.id] = Math.max(p.stars[s.id] || 0, 3); p.auto = (p.auto || 0) + 1;
      if (s.last) p.chests[s.section] = 1;   // übersprungener Abschnitt: keine Truhe
      pos++; moved = true;
    }
    p.pos = pos;
    if (moved) save();
    return p;
  }
  function pathComplete(id, stars) {
    var p = pathState(), st = pathStations().filter(function (x) { return x.id === id; })[0];
    if (!st) return { error: true };
    pathSync();
    var adv = st.index === p.pos, chest = null;
    p.stars[id] = Math.max(p.stars[id] || 0, stars);
    if (adv) {
      if (st.last && !p.chests[st.section]) {
        p.chests[st.section] = 1;
        chest = { section: st.section, title: st.sectionTitle, coins: 15 + Math.floor(Math.random() * 16), boost: Math.random() < 0.4 };
        p.pending.push(chest);
      }
    }
    pathSync(); save(true);
    return { advanced: adv, chest: chest, finished: p.pos >= pathStations().length };
  }
  function claimChest() {
    var p = pathState(), c = p.pending.shift();
    if (!c) return null;
    addCoins(c.coins); addCl("fortschritt", c.coins);
    if (c.boost) p.boost.stock++;
    save(true); return c;
  }
  function boostStart() {
    var b = pathState().boost;
    if (b.on) return { error: "Ein Booster läuft schon." };
    if (b.stock < 1) return { error: "Kein Booster im Vorrat." };
    b.stock--; b.on = true; b.left = 900; save(true); return { ok: true, left: b.left };
  }

  /* Wunsch: ein Shop-Eintrag, auf den gespart wird; die Startseite zeigt den Fortschritt dorthin */
  /* Münzen heute nach Quelle, für die Übersicht im Fortschritt */
  function coinsToday() {
    var d = state.daily || {}, cl = d.cl || {}, next = 0, nextDays = 0;
    Object.keys(STREAK_BONUS).map(Number).sort(function (a, b) { return a - b; }).some(function (k) { if (k > state.streak.count) { next = k; nextDays = k - state.streak.count; return true; } });
    return { fortschritt: cl.fortschritt || 0, missionen: cl.missionen || 0, ziel: cl.ziel || 0, serie: cl.serie || 0, eltern: cl.eltern || 0, arena: d.arenaCoins || 0,
      missionenDone: (d.missions || []).filter(function (m) { return m.done; }).length, missionenAll: (d.missions || []).length,
      zielDone: !!d.done, streakNext: next, streakDays: nextDays, streakBonus: STREAK_BONUS[next] || 0 };
  }
  function parentCoins(c) { if (c > 0) { addCoins(c); addCl("eltern", c); save(true); } }
  function wish() {
    var id = state.profile.wish, it = id ? itemById(id) : null;
    if (it && owns(it)) { state.profile.wish = null; it = null; }
    return it;
  }
  function setWish(id) {
    var it = itemById(id); if (!it) return { error: "Unbekannt." };
    if (owns(it)) return { error: "Gehört dir schon." };
    var on = state.profile.wish !== id; state.profile.wish = on ? id : null; save(true);
    return { ok: true, on: on, item: it };
  }
  function buy(id) {
    var it = itemById(id);
    if (!it) return { error: "Unbekannt." };
    if (owns(it)) return { error: "Gehört dir schon." };
    if (state.xp < minXp(it)) return { error: "Das gibt es erst ab dem Rang " + it.rank + "." };
    if (state.coins < it.cost) return { error: "Dafür fehlen noch " + (it.cost - state.coins) + " Münzen." };
    state.coins -= it.cost; state.profile.owned.push(id);
    ev("buy", { id: id, name: it.label || it.id, cost: it.cost });
    if (it.kind === "sticker") { var l = stickers(); l.push(it.id); while (l.length > stickerSlots()) l.shift(); }
    else state.profile[PROFILE_KEY[it.kind]] = it.val;
    save(true); return { ok: true, item: it };
  }

  global.VT = {
    LEVELS: LEVELS, RANKS: RANKS, AVATARS: AVATARS, SHOP: SHOP, BADGES: BADGES,
    SEC_PER_ITEM: SEC_PER_ITEM, secPerItem: secPerItem, itemsFor: itemsFor, recordPace: recordPace,
    load: load, save: save, get state() { return state; },
    units: function () { return units; }, words: function () { return words; }, byId: function (id) { return byId[id]; },
    buildCatalogue: function () { return buildCatalogue(state); },
    levelOf: levelOf, grade: grade, inErrorBox: inErrorBox, rec: rec,
    pools: pools, planSession: planSession, activeWords: activeWords, masterList: masterList,
    sentences: function () { return sentences; }, activeSentences: activeSentences,
    planSentences: planSentences, gradeSentence: gradeSentence, sentenceStats: sentenceStats,
    srec: srec, groupsOf: groupsOf, setTrack: setTrack,
    rankOf: rankOf, addXp: addXp, addCoins: addCoins, finishSession: finishSession,
    stats: stats, today: today, shuffle: shuffle, regenHearts: regenHearts, heartsIn: heartsIn,
    rollDay: rollDay, verbs: function () { return verbs; }, verbPools: verbPools, planVerbs: planVerbs, verbStats: verbStats, parseCsv: parseCsv, removeCustom: removeCustom,
    restoreState: restoreState, isFresh: isFresh, backupInfo: backupInfo, restoreBackup: restoreBackup, keepStorage: keepStorage, isPersisted: function () { return persisted; },
    profiles: profiles, addProfile: addProfile, switchProfile: switchProfile, renameProfile: renameProfile, deleteProfile: deleteProfile,
    exportProgress: exportProgress, importProgress: importProgress, exportCsv: exportCsv,
    resetProgress: resetProgress, buy: buy, equip: equip, wish: wish, setWish: setWish, coinsToday: coinsToday, parentCoins: parentCoins, stickers: stickers, pathState: pathState, pathStations: pathStations, goalMin: goalMin, freeDay: freeDay, planMin: planMin, weekPlan: weekPlan, pathProgress: pathProgress, bossNeedFor: bossNeedFor, bossRecord: bossRecord, bossLog: bossLog, pathSections: pathSections, pathSync: pathSync, pathComplete: pathComplete, claimChest: claimChest, boostStart: boostStart, boostActive: boostActive, stickerSlots: stickerSlots, buySlot: buySlot, SLOT_COST: STICKER_SLOT_COST, owns: owns, isActive: isActive, minXp: minXp, defaultOf: defaultOf
  };
})(window);
