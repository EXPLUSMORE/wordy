/* Wordy-Server: nimmt den Lernfortschritt der App entgegen und zeigt ihn im Eltern-Dashboard.
   Keine Abhängigkeiten, nur Node.js (>= 22.13) mit eingebautem SQLite.  Start: siehe README.md */
"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const { sendMail } = require("./mail");

const PORT = +process.env.PORT || 8787;
const HOST = process.env.HOST || "127.0.0.1";
const DB_FILE = process.env.DB_FILE || path.join(__dirname, "data", "wordy.db");
const ADMIN_USER = process.env.ADMIN_USER || "eltern";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";      // Adresse(n) der App, z. B. https://explusmore.github.io
const TZ = process.env.TZ_DISPLAY || "Europe/Berlin";
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const MAX_BODY = 512 * 1024;
const INVITE_DAYS = 7;
const MAIL = {
  host: process.env.SMTP_HOST || "", port: +process.env.SMTP_PORT || 587, secure: process.env.SMTP_SECURE || "",
  user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASSWORD || "",
  from: process.env.MAIL_FROM || "", to: process.env.MAIL_TO || "",
  day: process.env.MAIL_DAY === undefined ? 0 : +process.env.MAIL_DAY, hour: process.env.MAIL_HOUR === undefined ? 18 : +process.env.MAIL_HOUR
};
const mailOn = () => !!(MAIL.host && MAIL.from && MAIL.to);

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 10) {
  console.error("ADMIN_PASSWORD fehlt oder ist kürzer als 10 Zeichen. Siehe .env.example.");
  process.exit(1);
}

fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
const db = new DatabaseSync(DB_FILE);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS players (id INTEGER PRIMARY KEY, name TEXT NOT NULL, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS tokens (hash TEXT PRIMARY KEY, player INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    device TEXT, created INTEGER NOT NULL, last_seen INTEGER);
  CREATE TABLE IF NOT EXISTS invites (code TEXT PRIMARY KEY, player INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, player INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    eid TEXT NOT NULL, ts INTEGER NOT NULL, k TEXT NOT NULL, d TEXT NOT NULL, UNIQUE(player, eid));
  CREATE INDEX IF NOT EXISTS ev_player_ts ON events(player, ts);
  CREATE TABLE IF NOT EXISTS goals (id INTEGER PRIMARY KEY, player INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    week TEXT NOT NULL, kind TEXT NOT NULL, target INTEGER NOT NULL, scope TEXT NOT NULL DEFAULT '[]', coins INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS plans (id INTEGER PRIMARY KEY, player INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    title TEXT NOT NULL, exam TEXT NOT NULL, units TEXT NOT NULL, coins INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, val TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS snaps (player INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    key TEXT NOT NULL, ts INTEGER NOT NULL, d TEXT NOT NULL, PRIMARY KEY(player, key));
`);

const q = {
  player: db.prepare("SELECT * FROM players WHERE id = ?"),
  players: db.prepare("SELECT * FROM players ORDER BY id"),
  addPlayer: db.prepare("INSERT INTO players(name, created) VALUES (?, ?)"),
  renamePlayer: db.prepare("UPDATE players SET name = ? WHERE id = ?"),
  delPlayer: db.prepare("DELETE FROM players WHERE id = ?"),
  addInvite: db.prepare("INSERT INTO invites(code, player, created) VALUES (?, ?, ?)"),
  invite: db.prepare("SELECT * FROM invites WHERE code = ?"),
  useInvite: db.prepare("UPDATE invites SET used = 1 WHERE code = ?"),
  addToken: db.prepare("INSERT INTO tokens(hash, player, device, created, last_seen) VALUES (?, ?, ?, ?, ?)"),
  token: db.prepare("SELECT * FROM tokens WHERE hash = ?"),
  touchToken: db.prepare("UPDATE tokens SET last_seen = ? WHERE hash = ?"),
  devices: db.prepare("SELECT hash, device, created, last_seen FROM tokens WHERE player = ? ORDER BY created"),
  delTokens: db.prepare("DELETE FROM tokens WHERE player = ?"),
  addEvent: db.prepare("INSERT OR IGNORE INTO events(player, eid, ts, k, d) VALUES (?, ?, ?, ?, ?)"),
  events: db.prepare("SELECT ts, k, d FROM events WHERE player = ? AND ts >= ? ORDER BY ts"),
  evCount: db.prepare("SELECT COUNT(*) AS n, MAX(ts) AS last FROM events WHERE player = ?"),
  setSnap: db.prepare("INSERT INTO snaps(player, key, ts, d) VALUES (?, ?, ?, ?) ON CONFLICT(player, key) DO UPDATE SET ts = excluded.ts, d = excluded.d"),
  snap: db.prepare("SELECT ts, d FROM snaps WHERE player = ? AND key = ?"),
  goals: db.prepare("SELECT * FROM goals WHERE player = ? AND week >= ? ORDER BY week DESC, id"),
  goal: db.prepare("SELECT * FROM goals WHERE id = ?"),
  addGoal: db.prepare("INSERT INTO goals(player, week, kind, target, scope, coins, title, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
  delGoal: db.prepare("DELETE FROM goals WHERE id = ?"),
  plans: db.prepare("SELECT * FROM plans WHERE player = ? AND exam >= ? ORDER BY exam, id"),
  plan: db.prepare("SELECT * FROM plans WHERE id = ?"),
  addPlan: db.prepare("INSERT INTO plans(player, title, exam, units, coins, created) VALUES (?, ?, ?, ?, ?, ?)"),
  delPlan: db.prepare("DELETE FROM plans WHERE id = ?"),
  kvGet: db.prepare("SELECT val FROM kv WHERE key = ?"),
  kvSet: db.prepare("INSERT INTO kv(key, val) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET val = excluded.val")
};

/* ---------- Hilfen ---------- */
const sha = s => crypto.createHash("sha256").update(s).digest("hex");
const rand = n => crypto.randomBytes(n).toString("hex");
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function newCode() {
  let s = ""; const b = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) s += ALPHABET[b[i] % ALPHABET.length];
  return s.slice(0, 4) + "-" + s.slice(4);
}
function eq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}
const dayFmt = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const dayOf = ts => dayFmt.format(new Date(ts));

const hits = new Map();   // sehr einfache Begrenzung pro Adresse
function limited(ip, bucket, max, windowMs) {
  const k = bucket + ":" + ip, now = Date.now();
  const a = (hits.get(k) || []).filter(t => now - t < windowMs);
  a.push(now); hits.set(k, a);
  return a.length > max;
}
setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.some(t => now - t < 3600000)) hits.delete(k); }, 600000).unref();

function clientIp(req) {
  if (TRUST_PROXY && req.headers["x-forwarded-for"]) return String(req.headers["x-forwarded-for"]).split(",")[0].trim();
  return req.socket.remoteAddress || "?";
}
function send(res, code, body, headers) {
  const isStr = typeof body === "string";
  res.writeHead(code, Object.assign({
    "Content-Type": isStr ? "text/html; charset=utf-8" : "application/json; charset=utf-8",
    "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer"
  }, headers || {}));
  res.end(isStr ? body : JSON.stringify(body));
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const parts = [];
    req.on("data", c => { n += c.length; if (n > MAX_BODY) { reject(Object.assign(new Error("zu groß"), { status: 413 })); req.destroy(); } else parts.push(c); });
    req.on("end", () => { try { resolve(parts.length ? JSON.parse(Buffer.concat(parts).toString("utf8")) : {}); } catch (e) { reject(Object.assign(new Error("Ungültiges JSON"), { status: 400 })); } });
    req.on("error", reject);
  });
}
function cors(req, res) {
  const o = req.headers.origin;
  if (!o) return;
  const ok = ALLOW_ORIGIN === "*" || ALLOW_ORIGIN.split(",").map(s => s.trim()).includes(o);
  if (ok) {
    res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN === "*" ? "*" : o);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Max-Age", "86400");
  }
}
function adminOk(req) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Basic ")) return false;
  const [u, ...rest] = Buffer.from(h.slice(6), "base64").toString("utf8").split(":");
  const p = rest.join(":");
  return eq(u, ADMIN_USER) && eq(p, ADMIN_PASSWORD);
}
function playerOf(req) {
  const h = req.headers.authorization || "";
  if (!h.startsWith("Bearer ")) return null;
  const hash = sha(h.slice(7).trim()), t = q.token.get(hash);
  if (!t) return null;
  q.touchToken.run(Date.now(), hash);
  return t.player;
}
const clean = (s, n) => String(s == null ? "" : s).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);

/* ---------- App-Schnittstelle ---------- */
function apiPair(body, ip) {
  if (limited(ip, "pair", 10, 600000)) return [429, { error: "Zu viele Versuche. Bitte später noch einmal." }];
  const code = clean(body.code, 20).toUpperCase().replace(/[^A-Z0-9]/g, "");
  const norm = code.slice(0, 4) + "-" + code.slice(4);
  const inv = q.invite.get(norm);
  if (!inv || inv.used || Date.now() - inv.created > INVITE_DAYS * 86400000) return [400, { error: "Der Code stimmt nicht oder ist abgelaufen." }];
  const pl = q.player.get(inv.player);
  if (!pl) return [400, { error: "Spieler nicht gefunden." }];
  const token = rand(32);
  q.addToken.run(sha(token), pl.id, clean(body.device, 80), Date.now(), Date.now());
  q.useInvite.run(norm);
  return [200, { token, name: pl.name }];
}
function apiEvents(pid, body) {
  const list = Array.isArray(body.events) ? body.events.slice(0, 500) : [];
  let n = 0;
  db.exec("BEGIN");
  try {
    for (const e of list) {
      if (!e || typeof e.i !== "string" || typeof e.k !== "string" || !Number.isFinite(e.t)) continue;
      const ts = Math.min(Math.max(+e.t, 1.6e12), Date.now() + 86400000);
      const d = JSON.stringify(e.d || {});
      if (d.length > 2000) continue;
      n += +q.addEvent.run(pid, clean(e.i, 40), ts, clean(e.k, 12), d).changes;
    }
    db.exec("COMMIT");
  } catch (err) { db.exec("ROLLBACK"); throw err; }
  return [200, { ok: true, stored: n }];
}
function apiSnapshot(pid, body) {
  for (const key of ["words", "catalog", "meta", "texts"]) {
    if (body[key] == null) continue;
    const d = JSON.stringify(body[key]);
    if (d.length > 400000) continue;
    q.setSnap.run(pid, key, Date.now(), d);
  }
  return [200, { ok: true }];
}

/* ---------- Eltern-Auswertung ---------- */
function snap(pid, key) { const r = q.snap.get(pid, key); return r ? { ts: r.ts, d: JSON.parse(r.d) } : null; }

function report(pid, days) {
  const now = Date.now(), from = now - days * 86400000;
  const evs = q.events.all(pid, from).map(r => ({ ts: r.ts, k: r.k, d: JSON.parse(r.d) }));
  const perDay = {};
  const day = ts => (perDay[dayOf(ts)] = perDay[dayOf(ts)] || { date: dayOf(ts), sec: 0, items: 0, correct: 0, neu: 0, coins: 0, sessions: 0 });
  const bad = {}, sessions = [], buys = [];
  for (const e of evs) {
    const d = e.d;
    if (e.k === "a" || e.k === "s") {
      const x = day(e.ts); x.items++; if (d.g > 0) x.correct++;
      if (e.k === "a" && (d.b || 0) === 0 && d.g > 0) x.neu++;
      if (d.g === 0 && d.id) {
        const b = bad[d.id] = bad[d.id] || { id: d.id, en: d.en || d.id, de: d.de || "", n: 0, last: 0 };
        b.n++; b.last = e.ts;
      }
    } else if (e.k === "ss") {
      const x = day(e.ts); x.sec += d.sec || 0; x.coins += d.coins || 0; x.sessions++;
      sessions.push({ ts: e.ts, sec: d.sec || 0, items: d.items || 0, correct: d.correct || 0, mode: d.mode || "", unit: d.unit || "", coins: d.coins || 0 });
    } else if (e.k === "buy") buys.push({ ts: e.ts, name: d.name || d.id, cost: d.cost || 0 });
  }
  const dayList = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dayOf(now - i * 86400000);
    dayList.push(perDay[k] || { date: k, sec: 0, items: 0, correct: 0, neu: 0, coins: 0, sessions: 0 });
  }
  const words = snap(pid, "words"), cat = snap(pid, "catalog"), meta = snap(pid, "meta");
  const lvOf = id => (words && words.d[id]) ? words.d[id][0] : 0;
  const badList = Object.values(bad).sort((a, b) => b.n - a.n || b.last - a.last).slice(0, 15)
    .map(b => Object.assign(b, { lv: lvOf(b.id) }));
  let units = [];
  if (cat) {
    const stat = {};
    if (words) for (const id of Object.keys(words.d)) {
      const u = id.split("#")[0], lv = words.d[id][0];
      const s = stat[u] = stat[u] || [0, 0, 0, 0, 0];
      s[lv] = (s[lv] || 0) + 1;
    }
    units = cat.d.filter(u => stat[u.id]).map(u => {
      const s = stat[u.id];
      return { id: u.id, title: u.title, k: u.k, total: u.total, lv: s, seen: s[1] + s[2] + s[3] + s[4], mastered: s[4] };
    });
  }
  const sum = (f) => dayList.reduce((a, x) => a + f(x), 0);
  const last7 = dayList.slice(-7);
  const c = q.evCount.get(pid);
  return {
    days: dayList, units, problems: badList, sessions: sessions.slice(-25).reverse(), buys: buys.slice(-20).reverse(), meta: meta ? meta.d : null,
    metaTs: meta ? meta.ts : null,
    totals: { sec: sum(x => x.sec), items: sum(x => x.items), correct: sum(x => x.correct), neu: sum(x => x.neu), activeDays: dayList.filter(x => x.items > 0).length },
    week: { sec: last7.reduce((a, x) => a + x.sec, 0), items: last7.reduce((a, x) => a + x.items, 0), correct: last7.reduce((a, x) => a + x.correct, 0), activeDays: last7.filter(x => x.items > 0).length },
    goals: weekGoals(pid), plans: plansOf(pid),
    events: c.n, lastEvent: c.last
  };
}


/* ---------- Wochen, Ziele, Lernpläne ---------- */
const ymdAdd = (d, n) => { const [y, m, x] = d.split("-").map(Number); return new Date(Date.UTC(y, m - 1, x + n)).toISOString().slice(0, 10); };
function mondayOf(d) { const [y, m, x] = d.split("-").map(Number); return ymdAdd(d, -((new Date(Date.UTC(y, m - 1, x)).getUTCDay() + 6) % 7)); }
const daysBetween = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
const SAFE_ID = /^[A-Za-z0-9_.\-]{1,30}$/;
const KINDS = { minutes: "Minuten üben", days: "Tage üben", newwords: "neue Wörter", unit: "Einheit sicher" };

function unitTitles(pid, ids) {
  const cat = snap(pid, "catalog"), by = {};
  if (cat) cat.d.forEach(u => { by[u.id] = u.title.replace(/^Headlight 2 · /, ""); });
  return ids.map(i => by[i] || i);
}
function goalTitle(pid, kind, target, scope) {
  if (kind === "minutes") return target + " Minuten üben";
  if (kind === "days") return "An " + target + " Tagen üben (mindestens 5 Minuten)";
  if (kind === "newwords") return target + " neue Wörter lernen";
  return target + " % sicher: " + unitTitles(pid, scope).join(", ");
}
/* Fortschritt eines Wochenziels aus den Ereignissen und dem Wörterstand */
function goalProgress(pid, g, evs) {
  const from = g.week, to = ymdAdd(g.week, 6), scope = JSON.parse(g.scope);
  const inWeek = e => { const d = dayOf(e.ts); return d >= from && d <= to; };
  let cur = 0;
  if (g.kind === "minutes" || g.kind === "days" || g.kind === "newwords") {
    const secDay = {};
    for (const e of evs) {
      if (!inWeek(e)) continue;
      if (e.k === "ss") secDay[dayOf(e.ts)] = (secDay[dayOf(e.ts)] || 0) + (e.d.sec || 0);
      else if (e.k === "a" && g.kind === "newwords" && (e.d.b || 0) === 0 && e.d.g > 0) cur++;
    }
    if (g.kind === "minutes") cur = Math.round(Object.values(secDay).reduce((a, b) => a + b, 0) / 60);
    if (g.kind === "days") cur = Object.values(secDay).filter(x => x >= 300).length;
  } else {
    const w = snap(pid, "words"), cat = snap(pid, "catalog");
    if (w && cat) {
      let total = 0, ok = 0;
      for (const u of cat.d) if (scope.includes(u.id)) total += u.total;
      for (const id of Object.keys(w.d)) if (scope.includes(id.split("#")[0]) && w.d[id][0] >= 3) ok++;
      cur = total ? Math.round(ok * 100 / total) : 0;
    }
  }
  const done = evs.some(e => e.k === "goal" && e.d.id === g.id);
  return { cur, done: done || cur >= g.target };
}
function planProgress(pid, p) {
  const scope = JSON.parse(p.units), w = snap(pid, "words"), cat = snap(pid, "catalog");
  let total = 0, ok = 0;
  if (cat) for (const u of cat.d) if (scope.includes(u.id)) total += u.total;
  if (w) for (const id of Object.keys(w.d)) if (scope.includes(id.split("#")[0]) && w.d[id][0] >= 3) ok++;
  return { total, ok, pct: total ? Math.round(ok * 100 / total) : 0, daysLeft: daysBetween(dayOf(Date.now()), p.exam) };
}
function weekGoals(pid) {
  const mon = mondayOf(dayOf(Date.now())), list = q.goals.all(pid, ymdAdd(mon, -28));
  if (!list.length) return [];
  const evs = q.events.all(pid, Date.parse(ymdAdd(mon, -29) + "T00:00:00Z")).map(r => ({ ts: r.ts, k: r.k, d: JSON.parse(r.d) }));
  return list.map(g => Object.assign({ id: g.id, week: g.week, kind: g.kind, target: g.target, scope: JSON.parse(g.scope), coins: g.coins, title: g.title,
    current: g.week <= mon && mon <= ymdAdd(g.week, 6) }, goalProgress(pid, g, evs)));
}
function plansOf(pid) {
  return q.plans.all(pid, ymdAdd(dayOf(Date.now()), -7)).map(p => Object.assign({ id: p.id, title: p.title, exam: p.exam, units: JSON.parse(p.units), coins: p.coins, unitTitles: unitTitles(pid, JSON.parse(p.units)) }, planProgress(pid, p)));
}
function createGoal(pid, b) {
  const kind = String(b.kind || ""), target = Math.round(+b.target), coins = Math.round(+b.coins || 0);
  if (!KINDS[kind]) return [400, { error: "Unbekannte Art von Ziel." }];
  if (!(target >= 1 && target <= (kind === "days" ? 7 : kind === "unit" ? 100 : 10000))) return [400, { error: "Zielwert ungültig." }];
  if (coins < 0 || coins > 500) return [400, { error: "Münzen müssen zwischen 0 und 500 liegen." }];
  const scope = Array.isArray(b.scope) ? b.scope.filter(x => SAFE_ID.test(String(x))).slice(0, 40).map(String) : [];
  if (kind === "unit" && !scope.length) return [400, { error: "Bitte mindestens eine Einheit wählen." }];
  const mon = mondayOf(dayOf(Date.now()));
  const week = b.week === "next" ? ymdAdd(mon, 7) : mon;
  const title = clean(b.title, 90) || goalTitle(pid, kind, target, scope);
  const id = +q.addGoal.run(pid, week, kind, target, JSON.stringify(kind === "unit" ? scope : []), coins, title, Date.now()).lastInsertRowid;
  return [200, { id }];
}
function createPlan(pid, b) {
  const exam = String(b.exam || ""), coins = Math.round(+b.coins || 0);
  if (!/^\d{4}-\d\d-\d\d$/.test(exam) || exam < dayOf(Date.now())) return [400, { error: "Datum der Arbeit fehlt oder liegt in der Vergangenheit." }];
  const units = Array.isArray(b.units) ? b.units.filter(x => SAFE_ID.test(String(x))).slice(0, 40).map(String) : [];
  if (!units.length) return [400, { error: "Bitte mindestens eine Einheit wählen." }];
  if (coins < 0 || coins > 500) return [400, { error: "Münzen müssen zwischen 0 und 500 liegen." }];
  const title = clean(b.title, 60) || "Klassenarbeit";
  const id = +q.addPlan.run(pid, title, exam, JSON.stringify(units), coins, Date.now()).lastInsertRowid;
  return [200, { id }];
}
/* Was die App abholt: Ziele der laufenden und kommenden Woche, offene Lernpläne */
function apiSync(pid) {
  const mon = mondayOf(dayOf(Date.now()));
  return [200, {
    now: Date.now(), today: dayOf(Date.now()),
    goals: q.goals.all(pid, mon).map(g => ({ id: g.id, week: g.week, kind: g.kind, target: g.target, scope: JSON.parse(g.scope), coins: g.coins, title: g.title })),
    plans: q.plans.all(pid, dayOf(Date.now())).map(p => ({ id: p.id, title: p.title, exam: p.exam, units: JSON.parse(p.units), coins: p.coins }))
  }];
}
/* Einzelne Einheit mit allen Wörtern und ihrem Stand */
function unitDetail(pid, uid) {
  const w = snap(pid, "words"), t = snap(pid, "texts"), cat = snap(pid, "catalog");
  const unit = cat ? cat.d.find(u => u.id === uid) : null;
  if (!unit) return [404, { error: "Einheit unbekannt." }];
  const texts = t && t.d[uid] ? t.d[uid] : [];
  const list = [];
  for (let i = 0; i < unit.total; i++) {
    const r = w && w.d[uid + "#" + i];
    list.push({ i, en: texts[i] ? texts[i][0] : "", de: texts[i] ? texts[i][1] : "", lv: r ? r[0] : 0, ok: r ? r[1] : 0, no: r ? r[2] : 0, last: r ? r[3] : 0 });
  }
  return [200, { id: uid, title: unit.title, total: unit.total, words: list, hasTexts: texts.length > 0 }];
}


/* ---------- Wochenzusammenfassung per Mail ---------- */
const esc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmtMin = s => { const m = Math.round(s / 60); return m >= 60 ? Math.floor(m / 60) + " Std. " + (m % 60) + " Min." : m + " Min."; };
const pctOf = (a, b) => b ? Math.round(a * 100 / b) + " %" : "–";
function weeklyData(pid) {
  const r = report(pid, 21), mon = mondayOf(dayOf(Date.now())), prevMon = ymdAdd(mon, -7);
  const wk = r.days.filter(d => d.date >= mon), pw = r.days.filter(d => d.date >= prevMon && d.date < mon);
  const sum = (l, f) => l.reduce((a, x) => a + f(x), 0);
  return {
    mon, sec: sum(wk, d => d.sec), items: sum(wk, d => d.items), correct: sum(wk, d => d.correct), neu: sum(wk, d => d.neu),
    active: wk.filter(d => d.sec >= 300).length, prevSec: sum(pw, d => d.sec), prevItems: sum(pw, d => d.items),
    goals: r.goals.filter(g => g.current), plans: r.plans, problems: r.problems.slice(0, 5), meta: r.meta
  };
}
function mailContent() {
  const players = q.players.all(), parts = [], texts = [];
  for (const p of players) {
    const d = weeklyData(p.id), idle = !d.items && !d.sec;
    const trend = d.prevSec ? (d.sec >= d.prevSec ? "↑ " : "↓ ") + "Vorwoche " + fmtMin(d.prevSec) : "";
    const goals = d.goals.map(g => (g.done ? "✅ " : "⬜ ") + g.title + " (" + g.cur + " von " + g.target + (g.kind === "unit" ? " %" : "") + (g.coins ? ", " + g.coins + " Münzen" : "") + ")");
    const plans = d.plans.map(x => "📅 " + x.title + ": " + (x.daysLeft > 0 ? "noch " + x.daysLeft + " Tage" : x.daysLeft === 0 ? "heute" : "vorbei") + ", " + x.pct + " % sicher");
    const probs = d.problems.map(x => x.en + " (" + x.n + "×)");
    texts.push([p.name, "  Übungszeit: " + fmtMin(d.sec) + (trend ? " (" + trend + ")" : ""), "  Aktive Tage (mind. 5 Min.): " + d.active + " von 7",
      "  Aufgaben: " + d.items + ", richtig: " + pctOf(d.correct, d.items), "  Neue Wörter: " + d.neu,
      ...(goals.length ? ["  Wochenziele:", ...goals.map(x => "    " + x)] : []), ...(plans.length ? ["  Lernplan:", ...plans.map(x => "    " + x)] : []),
      ...(probs.length ? ["  Schwierige Wörter: " + probs.join(", ")] : []), ...(idle ? ["  Diese Woche wurde noch nicht gelernt."] : [])].join("\n"));
    parts.push('<h2 style="margin:22px 0 6px;font-size:18px">' + esc(p.name) + "</h2>" +
      (idle ? '<p style="color:#8a5a00">Diese Woche wurde noch nicht gelernt.</p>' : "") +
      '<table style="border-collapse:collapse;font-size:15px"><tr><td style="padding:3px 14px 3px 0;color:#555">Übungszeit</td><td><b>' + esc(fmtMin(d.sec)) + "</b> " + esc(trend) + "</td></tr>" +
      '<tr><td style="padding:3px 14px 3px 0;color:#555">Aktive Tage</td><td><b>' + d.active + " von 7</b> (mind. 5 Min.)</td></tr>" +
      '<tr><td style="padding:3px 14px 3px 0;color:#555">Aufgaben</td><td><b>' + d.items + "</b>, richtig " + pctOf(d.correct, d.items) + "</td></tr>" +
      '<tr><td style="padding:3px 14px 3px 0;color:#555">Neue Wörter</td><td><b>' + d.neu + "</b></td></tr></table>" +
      (goals.length ? '<p style="margin:12px 0 4px"><b>Wochenziele</b></p><ul style="margin:0;padding-left:20px">' + goals.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "") +
      (plans.length ? '<p style="margin:12px 0 4px"><b>Lernplan</b></p><ul style="margin:0;padding-left:20px">' + plans.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "") +
      (probs.length ? '<p style="margin:12px 0 4px"><b>Schwierige Wörter</b></p><p style="margin:0">' + esc(probs.join(", ")) + "</p>" : ""));
  }
  const mon = mondayOf(dayOf(Date.now()));
  return {
    subject: "Wordy: Lernwoche ab " + mon.split("-").reverse().join("."),
    text: "Wordy Wochenzusammenfassung (Woche ab " + mon + ")\n\n" + (texts.join("\n\n") || "Noch keine Spieler angelegt.") + "\n",
    html: '<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#16222B;max-width:560px"><h1 style="font-size:20px;margin:0 0 4px">📚 Wordy · Lernwoche</h1><div style="color:#666">Woche ab ' + esc(mon.split("-").reverse().join(".")) + "</div>" + (parts.join("") || "<p>Noch keine Spieler angelegt.</p>") + "</div>"
  };
}
async function sendWeekly() {
  if (!mailOn()) throw new Error("Mailversand ist nicht eingerichtet (siehe README).");
  const c = mailContent();
  await sendMail({ host: MAIL.host, port: MAIL.port, secure: MAIL.secure, user: MAIL.user, pass: MAIL.pass, from: MAIL.from, to: MAIL.to, subject: c.subject, text: c.text, html: c.html });
}
const localNow = () => {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", hour: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  return { wd: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(f.find(x => x.type === "weekday").value), h: +f.find(x => x.type === "hour").value };
};
let mailTries = { key: "", n: 0 };
function mailTick() {
  if (!mailOn()) return;
  const { wd, h } = localNow(), key = mondayOf(dayOf(Date.now()));
  const sent = q.kvGet.get("mail_sent");
  if (wd !== MAIL.day || h < MAIL.hour || (sent && sent.val === key)) return;
  if (mailTries.key !== key) mailTries = { key, n: 0 };
  if (mailTries.n >= 3) return;
  mailTries.n++;
  sendWeekly().then(() => { q.kvSet.run("mail_sent", key); console.log("Wochenmail gesendet für Woche ab " + key); },
    e => console.error("Wochenmail fehlgeschlagen:", e.message));
}
setInterval(mailTick, 60000).unref();

function adminPlayers() {
  return q.players.all().map(p => {
    const c = q.evCount.get(p.id), m = snap(p.id, "meta"), devs = q.devices.all(p.id);
    const today = dayOf(Date.now());
    let todaySec = 0, todayItems = 0;
    for (const r of q.events.all(p.id, Date.now() - 36 * 3600000)) {
      if (dayOf(r.ts) !== today) continue;
      const d = JSON.parse(r.d);
      if (r.k === "ss") todaySec += d.sec || 0; else if (r.k === "a" || r.k === "s") todayItems++;
    }
    return { id: p.id, name: p.name, created: p.created, events: c.n, lastEvent: c.last, meta: m ? m.d : null,
      devices: devs.map(d => ({ id: d.hash.slice(0, 8), device: d.device, created: d.created, lastSeen: d.last_seen })),
      today: { sec: todaySec, items: todayItems } };
  });
}
function newInvite(pid) {
  const code = newCode();
  q.addInvite.run(code, pid, Date.now());
  return { code, validDays: INVITE_DAYS };
}

/* ---------- Routing ---------- */
const PUBLIC = path.join(__dirname, "public");
const server = http.createServer(async (req, res) => {
  const ip = clientIp(req), url = new URL(req.url, "http://x"), p = url.pathname;
  try {
    cors(req, res);
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

    if (p === "/healthz") return send(res, 200, { ok: true });

    if (p === "/api/pair" && req.method === "POST") { const [c, b] = apiPair(await readJson(req), ip); return send(res, c, b); }
    if (p === "/api/events" && req.method === "POST") {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      const [c, b] = apiEvents(pid, await readJson(req)); return send(res, c, b);
    }
    if (p === "/api/snapshot" && req.method === "POST") {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      const [c, b] = apiSnapshot(pid, await readJson(req)); return send(res, c, b);
    }
    if (p === "/api/sync" && req.method === "GET") {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      const [c, b] = apiSync(pid); return send(res, c, b);
    }
    if (p === "/api/ping" && req.method === "POST") {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      return send(res, 200, { ok: true, name: q.player.get(pid).name });
    }

    /* Ab hier nur für Eltern */
    if (p === "/" || p.startsWith("/api/admin/")) {
      if (limited(ip, "admin", 120, 60000)) return send(res, 429, { error: "Zu viele Anfragen." });
      if (!adminOk(req)) {
        if (limited(ip, "authfail", 10, 600000)) return send(res, 429, { error: "Zu viele Versuche." });
        return send(res, 401, "Anmeldung nötig", { "WWW-Authenticate": 'Basic realm="Wordy Lernfortschritt", charset="UTF-8"' });
      }
      if (p === "/") {
        return send(res, 200, fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8"),
          { "Content-Security-Policy": "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:" });
      }
      if (p === "/api/admin/mail" && req.method === "GET") { const sent = q.kvGet.get("mail_sent"); return send(res, 200, { configured: mailOn(), to: mailOn() ? MAIL.to : "", day: MAIL.day, hour: MAIL.hour, lastWeek: sent ? sent.val : null }); }
      if (p === "/api/admin/mail/test" && req.method === "POST") {
        try { await sendWeekly(); return send(res, 200, { ok: true }); } catch (e) { return send(res, 200, { ok: false, error: String(e.message).replace(MAIL.pass || "\u0000", "***").slice(0, 300) }); }
      }
      if (p === "/api/admin/players" && req.method === "GET") return send(res, 200, adminPlayers());
      if (p === "/api/admin/players" && req.method === "POST") {
        const name = clean((await readJson(req)).name, 20);
        if (!name) return send(res, 400, { error: "Name fehlt." });
        const id = +q.addPlayer.run(name, Date.now()).lastInsertRowid;
        return send(res, 200, { id, name, invite: newInvite(id) });
      }
      const mu = p.match(/^\/api\/admin\/players\/(\d+)\/unit\/([A-Za-z0-9_.\-]{1,30})$/);
      if (mu && req.method === "GET") { if (!q.player.get(+mu[1])) return send(res, 404, { error: "Unbekannt." }); const [c, b] = unitDetail(+mu[1], mu[2]); return send(res, c, b); }
      const mg = p.match(/^\/api\/admin\/(goals|plans)\/(\d+)$/);
      if (mg && req.method === "DELETE") { (mg[1] === "goals" ? q.delGoal : q.delPlan).run(+mg[2]); return send(res, 200, { ok: true }); }
      const m = p.match(/^\/api\/admin\/players\/(\d+)(?:\/(\w+))?$/);
      if (m) {
        const pid = +m[1], pl = q.player.get(pid);
        if (!pl) return send(res, 404, { error: "Unbekannt." });
        if (!m[2] && req.method === "GET") return send(res, 200, { id: pid, name: pl.name });
        if (m[2] === "report" && req.method === "GET") return send(res, 200, report(pid, Math.min(90, Math.max(7, +url.searchParams.get("days") || 30))));
        if (m[2] === "goals" && req.method === "GET") return send(res, 200, weekGoals(pid));
        if (m[2] === "goals" && req.method === "POST") { const [c, b] = createGoal(pid, await readJson(req)); return send(res, c, b); }
        if (m[2] === "plans" && req.method === "GET") return send(res, 200, plansOf(pid));
        if (m[2] === "plans" && req.method === "POST") { const [c, b] = createPlan(pid, await readJson(req)); return send(res, c, b); }
        if (m[2] === "catalog" && req.method === "GET") { const c = snap(pid, "catalog"); return send(res, 200, c ? c.d : []); }
        if (m[2] === "invite" && req.method === "POST") return send(res, 200, newInvite(pid));
        if (m[2] === "rename" && req.method === "POST") {
          const name = clean((await readJson(req)).name, 20); if (!name) return send(res, 400, { error: "Name fehlt." });
          q.renamePlayer.run(name, pid); return send(res, 200, { ok: true });
        }
        if (m[2] === "revoke" && req.method === "POST") { q.delTokens.run(pid); return send(res, 200, { ok: true }); }
        if (!m[2] && req.method === "DELETE") { q.delPlayer.run(pid); return send(res, 200, { ok: true }); }
      }
    }
    return send(res, 404, { error: "Nicht gefunden." });
  } catch (e) {
    if (e && e.status) return send(res, e.status, { error: e.message });
    console.error(e);
    return send(res, 500, { error: "Serverfehler." });
  }
});
server.requestTimeout = 15000;
server.listen(PORT, HOST, () => console.log("Wordy-Server läuft auf http://" + HOST + ":" + PORT));
module.exports = { server, db };
