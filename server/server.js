/* Wordy-Server: nimmt den Lernfortschritt der App entgegen und zeigt ihn im Eltern-Dashboard.
   Keine Abhängigkeiten, nur Node.js (>= 22.13) mit eingebautem SQLite.  Start: siehe README.md */
"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const { sendMail, sendGraph } = require("./mail");
const webpush = require("./push");

/* Welche Version und welcher Git-Stand läuft hier? (für die Zeile am Ende des Dashboards) */
const SERVER_INFO = (() => {
  let version = "", commit = "";
  try { version = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")).version; } catch (e) {}
  try { commit = require("node:child_process").execFileSync("git", ["-C", __dirname, "rev-parse", "--short", "HEAD"], { timeout: 3000, stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch (e) {}
  return { version, commit, started: Date.now() };
})();

const PORT = +process.env.PORT || 8787;
const HOST = process.env.HOST || "127.0.0.1";
const DB_FILE = process.env.DB_FILE || path.join(__dirname, "data", "wordy.db");
const ADMIN_USER = process.env.ADMIN_USER || "eltern";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";      // Adresse(n) der App, z. B. https://explusmore.github.io
const TZ = process.env.TZ_DISPLAY || "Europe/Berlin";
const TRUST_PROXY = process.env.TRUST_PROXY === "1";
const MAX_BODY = 512 * 1024, MAX_STATE = 3 * 1024 * 1024, KEEP_STATES = 30;
const INVITE_DAYS = 7;
const MAIL = {
  host: process.env.SMTP_HOST || "", port: +process.env.SMTP_PORT || 587, secure: process.env.SMTP_SECURE || "",
  user: process.env.SMTP_USER || "", pass: process.env.SMTP_PASSWORD || "",
  from: process.env.MAIL_FROM || "", to: process.env.MAIL_TO || "",
  day: process.env.MAIL_DAY === undefined ? 0 : +process.env.MAIL_DAY, hour: process.env.MAIL_HOUR === undefined ? 18 : +process.env.MAIL_HOUR
};
const GRAPH = { tenant: process.env.GRAPH_TENANT || "", clientId: process.env.GRAPH_CLIENT_ID || "", clientSecret: process.env.GRAPH_CLIENT_SECRET || "" };
const mailTo = () => { try { const r = q.kvGet.get("mail_to"); if (r && r.val) return r.val; } catch (e) {} return MAIL.to; };   // Dashboard-Eintrag vor .env
const graphOn = () => !!(GRAPH.tenant && GRAPH.clientId && GRAPH.clientSecret && MAIL.from && mailTo());
const APP_URL = (process.env.APP_URL || "https://wordy.explusmore.com").replace(/\/+$/, "");
const DASH_URL = (process.env.DASHBOARD_URL || "https://track.wordy.explusmore.com").replace(/\/+$/, "");
const mailOn = () => graphOn() || !!(MAIL.host && MAIL.from && mailTo());

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
  CREATE TABLE IF NOT EXISTS states (player INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE, day TEXT NOT NULL,
    ts INTEGER NOT NULL, bytes INTEGER NOT NULL, coins INTEGER NOT NULL DEFAULT 0, words INTEGER NOT NULL DEFAULT 0, d TEXT NOT NULL, PRIMARY KEY(player, day));
  CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, val TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS snaps (player INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    key TEXT NOT NULL, ts INTEGER NOT NULL, d TEXT NOT NULL, PRIMARY KEY(player, key));
`);

if (!db.prepare("PRAGMA table_info(players)").all().some(c => c.name === "hidden")) db.exec("ALTER TABLE players ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0");
/* Elternkonten: Familien melden sich per E-Mail-Link an und verwalten nur ihre eigenen Kinder. Spieler ohne Familie gehören dem Betreiber (Basic-Anmeldung). */
db.exec(`
  CREATE TABLE IF NOT EXISTS families (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, created INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'active',
    consent_ts INTEGER, consent_ver TEXT, weekly INTEGER NOT NULL DEFAULT 1, last_login INTEGER);
  CREATE TABLE IF NOT EXISTS family_links (hash TEXT PRIMARY KEY, family INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE, created INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS family_sessions (hash TEXT PRIMARY KEY, family INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE, created INTEGER NOT NULL, last_seen INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS family_invites (code TEXT PRIMARY KEY, created INTEGER NOT NULL, expires INTEGER NOT NULL, max_uses INTEGER NOT NULL DEFAULT 1, uses INTEGER NOT NULL DEFAULT 0, note TEXT);
`);
if (!db.prepare("PRAGMA table_info(players)").all().some(c => c.name === "family")) db.exec("ALTER TABLE players ADD COLUMN family INTEGER REFERENCES families(id) ON DELETE CASCADE");
for (const [tab, col, ddl] of [["families", "role", "TEXT NOT NULL DEFAULT 'parent'"], ["families", "pw", "TEXT NOT NULL DEFAULT ''"], ["family_invites", "role", "TEXT NOT NULL DEFAULT 'parent'"], ["families", "owner", "INTEGER REFERENCES families(id) ON DELETE CASCADE"], ["family_invites", "owner", "INTEGER"], ["goals", "item", "TEXT NOT NULL DEFAULT ''"], ["plans", "item", "TEXT NOT NULL DEFAULT ''"]]) if (!db.prepare("PRAGMA table_info(" + tab + ")").all().some(c => c.name === col)) db.exec("ALTER TABLE " + tab + " ADD COLUMN " + col + " " + ddl);
const MAX_COPARENTS = 2;
const fq = {
  byId: db.prepare("SELECT * FROM families WHERE id = ?"),
  byEmail: db.prepare("SELECT * FROM families WHERE email = ?"),
  setPw: db.prepare("UPDATE families SET pw = ? WHERE id = ?"),
  all: db.prepare("SELECT f.*, (SELECT COUNT(*) FROM players p WHERE p.family = COALESCE(f.owner, f.id)) AS children FROM families f ORDER BY f.id"),
  add: db.prepare("INSERT INTO families(email, created, consent_ts, consent_ver, role, owner) VALUES (?, ?, ?, ?, ?, ?)"),
  coparents: db.prepare("SELECT * FROM families WHERE owner = ? ORDER BY id"),
  setStatus: db.prepare("UPDATE families SET status = ? WHERE id = ?"),
  setWeekly: db.prepare("UPDATE families SET weekly = ? WHERE id = ?"),
  touchLogin: db.prepare("UPDATE families SET last_login = ? WHERE id = ?"),
  del: db.prepare("DELETE FROM families WHERE id = ?"),
  addLink: db.prepare("INSERT INTO family_links(hash, family, created) VALUES (?, ?, ?)"),
  link: db.prepare("SELECT * FROM family_links WHERE hash = ?"),
  useLink: db.prepare("UPDATE family_links SET used = 1 WHERE hash = ?"),
  addSess: db.prepare("INSERT INTO family_sessions(hash, family, created, last_seen) VALUES (?, ?, ?, ?)"),
  sess: db.prepare("SELECT * FROM family_sessions WHERE hash = ?"),
  touchSess: db.prepare("UPDATE family_sessions SET last_seen = ? WHERE hash = ?"),
  delSess: db.prepare("DELETE FROM family_sessions WHERE hash = ?"),
  delSessOf: db.prepare("DELETE FROM family_sessions WHERE family = ?"),
  addInv: db.prepare("INSERT INTO family_invites(code, created, expires, max_uses, note, role) VALUES (?, ?, ?, ?, ?, ?)"),
  addCoInv: db.prepare("INSERT INTO family_invites(code, created, expires, max_uses, note, role, owner) VALUES (?, ?, ?, 1, ?, 'parent', ?)"),
  coInvs: db.prepare("SELECT * FROM family_invites WHERE owner = ? AND uses < max_uses AND expires > ?"),
  inv: db.prepare("SELECT * FROM family_invites WHERE code = ?"),
  invs: db.prepare("SELECT * FROM family_invites ORDER BY created DESC LIMIT 50"),
  useInv: db.prepare("UPDATE family_invites SET uses = uses + 1 WHERE code = ?"),
  delInv: db.prepare("DELETE FROM family_invites WHERE code = ?"),
  kids: db.prepare("SELECT * FROM players WHERE family = ? ORDER BY id"),
  addKid: db.prepare("INSERT INTO players(name, created, hidden, family) VALUES (?, ?, 0, ?)"),
  prune: db.prepare("DELETE FROM family_links WHERE created < ?")
};
/* Freunde und Duelle: nur mit Freigabe der Eltern beider Kinder. Öffentlich sichtbar ist nur der von den Eltern vergebene Name, die Figur und Punkte. */
for (const [col, ddl] of [["social", "INTEGER NOT NULL DEFAULT 0"], ["fcode", "TEXT"], ["avatar", "TEXT"]]) if (!db.prepare("PRAGMA table_info(players)").all().some(c => c.name === col)) db.exec("ALTER TABLE players ADD COLUMN " + col + " " + ddl);
db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS players_fcode ON players(fcode);
  CREATE TABLE IF NOT EXISTS friends (lo INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE, hi INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    lo_ok INTEGER NOT NULL DEFAULT 0, hi_ok INTEGER NOT NULL DEFAULT 0, req INTEGER NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(lo, hi));
  CREATE TABLE IF NOT EXISTS challenges (id INTEGER PRIMARY KEY, a INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE, b INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    mode TEXT NOT NULL, words TEXT NOT NULL, seed INTEGER NOT NULL, a_score INTEGER NOT NULL, a_ts INTEGER NOT NULL, b_score INTEGER, b_ts INTEGER, created INTEGER NOT NULL, a_react TEXT, b_react TEXT);
  CREATE INDEX IF NOT EXISTS ch_b ON challenges(b, b_score);
  CREATE TABLE IF NOT EXISTS scores (player INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE, mode TEXT NOT NULL, week TEXT NOT NULL, best INTEGER NOT NULL, PRIMARY KEY(player, mode, week));
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS crews (id INTEGER PRIMARY KEY, name TEXT NOT NULL, emoji TEXT NOT NULL, owner INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS crew_members (crew INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE, player INTEGER NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE, joined INTEGER NOT NULL, PRIMARY KEY(crew, player));
  CREATE TABLE IF NOT EXISTS crew_invites (crew INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE, player INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE, inviter INTEGER NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(crew, player));
  CREATE TABLE IF NOT EXISTS crew_claims (player INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE, week TEXT NOT NULL, quest TEXT NOT NULL, tier INTEGER NOT NULL, coins INTEGER NOT NULL, PRIMARY KEY(player, week, quest, tier));
  CREATE TABLE IF NOT EXISTS crew_cheers (id INTEGER PRIMARY KEY, crew INTEGER NOT NULL REFERENCES crews(id) ON DELETE CASCADE, frm INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE, tto INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE, emoji TEXT NOT NULL, ts INTEGER NOT NULL);
`);
const cq = {
  crewOf: db.prepare("SELECT c.* FROM crews c JOIN crew_members m ON m.crew = c.id WHERE m.player = ?"),
  crew: db.prepare("SELECT * FROM crews WHERE id = ?"),
  members: db.prepare("SELECT player, joined FROM crew_members WHERE crew = ? ORDER BY joined, player"),
  addCrew: db.prepare("INSERT INTO crews(name, emoji, owner, created) VALUES (?, ?, ?, ?)"),
  addMember: db.prepare("INSERT INTO crew_members(crew, player, joined) VALUES (?, ?, ?)"),
  delMember: db.prepare("DELETE FROM crew_members WHERE player = ?"),
  delCrew: db.prepare("DELETE FROM crews WHERE id = ?"),
  setOwner: db.prepare("UPDATE crews SET owner = ? WHERE id = ?"),
  invite: db.prepare("SELECT * FROM crew_invites WHERE crew = ? AND player = ?"),
  addInvite: db.prepare("INSERT OR REPLACE INTO crew_invites(crew, player, inviter, created) VALUES (?, ?, ?, ?)"),
  delInvite: db.prepare("DELETE FROM crew_invites WHERE crew = ? AND player = ?"),
  delInvitesOf: db.prepare("DELETE FROM crew_invites WHERE player = ?"),
  invitesFor: db.prepare("SELECT i.*, c.name, c.emoji FROM crew_invites i JOIN crews c ON c.id = i.crew WHERE i.player = ? AND i.created > ? ORDER BY i.created DESC"),
  invitesOfCrew: db.prepare("SELECT * FROM crew_invites WHERE crew = ? AND created > ?"),
  claim: db.prepare("SELECT 1 FROM crew_claims WHERE player = ? AND week = ? AND quest = ? AND tier = ?"),
  addClaim: db.prepare("INSERT INTO crew_claims(player, week, quest, tier, coins) VALUES (?, ?, ?, ?, ?)"),
  claimsOf: db.prepare("SELECT quest, tier FROM crew_claims WHERE player = ? AND week = ?"),
  cheer: db.prepare("SELECT 1 FROM crew_cheers WHERE frm = ? AND tto = ? AND ts > ?"),
  addCheer: db.prepare("INSERT INTO crew_cheers(crew, frm, tto, emoji, ts) VALUES (?, ?, ?, ?, ?)"),
  cheersFor: db.prepare("SELECT frm, emoji, ts FROM crew_cheers WHERE tto = ? AND ts > ? ORDER BY ts DESC LIMIT 10"),
  pruneCheers: db.prepare("DELETE FROM crew_cheers WHERE ts < ?")
};
const sq = {
  me: db.prepare("SELECT * FROM players WHERE id = ?"),
  byCode: db.prepare("SELECT * FROM players WHERE fcode = ?"),
  setCode: db.prepare("UPDATE players SET fcode = ? WHERE id = ?"),
  setSocial: db.prepare("UPDATE players SET social = ? WHERE id = ?"),
  setAvatar: db.prepare("UPDATE players SET avatar = ? WHERE id = ?"),
  fr: db.prepare("SELECT * FROM friends WHERE lo = ? AND hi = ?"),
  frOf: db.prepare("SELECT * FROM friends WHERE lo = ? OR hi = ?"),
  addFr: db.prepare("INSERT INTO friends(lo, hi, lo_ok, hi_ok, req, created) VALUES (?, ?, 0, 0, ?, ?)"),
  okLo: db.prepare("UPDATE friends SET lo_ok = 1 WHERE lo = ? AND hi = ?"), okHi: db.prepare("UPDATE friends SET hi_ok = 1 WHERE lo = ? AND hi = ?"),
  delFr: db.prepare("DELETE FROM friends WHERE lo = ? AND hi = ?"),
  addCh: db.prepare("INSERT INTO challenges(a, b, mode, words, seed, a_score, a_ts, created) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"),
  ch: db.prepare("SELECT * FROM challenges WHERE id = ?"),
  inbox: db.prepare("SELECT * FROM challenges WHERE b = ? AND b_score IS NULL AND created > ? ORDER BY created DESC LIMIT 20"),
  recent: db.prepare("SELECT * FROM challenges WHERE (a = ? OR b = ?) AND b_score IS NOT NULL ORDER BY b_ts DESC LIMIT 20"),
  waiting: db.prepare("SELECT * FROM challenges WHERE a = ? AND b_score IS NULL AND created > ? ORDER BY created DESC LIMIT 20"),
  chDone: db.prepare("UPDATE challenges SET b_score = ?, b_ts = ? WHERE id = ? AND b_score IS NULL"),
  reactA: db.prepare("UPDATE challenges SET a_react = ? WHERE id = ? AND a = ?"), reactB: db.prepare("UPDATE challenges SET b_react = ? WHERE id = ? AND b = ?"),
  chCount: db.prepare("SELECT COUNT(*) AS n FROM challenges WHERE a = ? AND created > ?"),
  setScore: db.prepare("INSERT INTO scores(player, mode, week, best) VALUES (?, ?, ?, ?) ON CONFLICT(player, mode, week) DO UPDATE SET best = MAX(best, excluded.best)"),
  score: db.prepare("SELECT best FROM scores WHERE player = ? AND mode = ? AND week = ?"),
  pruneScores: db.prepare("DELETE FROM scores WHERE week < ?")
};
/* Klassen-Modus (freiwillig): Lehrkräfte legen eine Klasse an, die Wochenaufgabe (Einheiten, Zeitraum) erscheint bei den Kindern, die mit Zustimmung ihrer Eltern beigetreten sind. */
db.exec(`
  CREATE TABLE IF NOT EXISTS classes (id INTEGER PRIMARY KEY, teacher INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE, name TEXT NOT NULL, tname TEXT NOT NULL, code TEXT NOT NULL UNIQUE, created INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS class_members (class INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE, player INTEGER NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE, status TEXT NOT NULL DEFAULT 'pending', created INTEGER NOT NULL, PRIMARY KEY(class, player));
  CREATE TABLE IF NOT EXISTS class_tasks (id INTEGER PRIMARY KEY, class INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE, title TEXT NOT NULL, units TEXT NOT NULL, d_from TEXT NOT NULL, d_to TEXT NOT NULL, goal INTEGER NOT NULL DEFAULT 15, created INTEGER NOT NULL);
`);
const kq = {
  cls: db.prepare("SELECT * FROM classes WHERE id = ?"), byCode: db.prepare("SELECT * FROM classes WHERE code = ?"), ofTeacher: db.prepare("SELECT * FROM classes WHERE teacher = ? ORDER BY id"),
  addCls: db.prepare("INSERT INTO classes(teacher, name, tname, code, created) VALUES (?, ?, ?, ?, ?)"), delCls: db.prepare("DELETE FROM classes WHERE id = ?"),
  members: db.prepare("SELECT player, status FROM class_members WHERE class = ? ORDER BY created, player"), memberOf: db.prepare("SELECT cm.*, c.name, c.tname FROM class_members cm JOIN classes c ON c.id = cm.class WHERE cm.player = ?"),
  addMember: db.prepare("INSERT INTO class_members(class, player, status, created) VALUES (?, ?, 'pending', ?)"), setStatus: db.prepare("UPDATE class_members SET status = ? WHERE player = ?"), delMember: db.prepare("DELETE FROM class_members WHERE player = ?"),
  tasks: db.prepare("SELECT * FROM class_tasks WHERE class = ? ORDER BY d_from DESC, id DESC"), active: db.prepare("SELECT * FROM class_tasks WHERE class = ? AND d_from <= ? AND d_to >= ? ORDER BY d_to, id"), task: db.prepare("SELECT * FROM class_tasks WHERE id = ?"),
  addTask: db.prepare("INSERT INTO class_tasks(class, title, units, d_from, d_to, goal, created) VALUES (?, ?, ?, ?, ?, ?, ?)"), delTask: db.prepare("DELETE FROM class_tasks WHERE id = ?")
};
const MAX_KIDS = 6, LINK_MIN = 20, SESSION_DAYS = 30, CONSENT_VER = "2026-10e";   // Version der Datenschutzerklärung, der zugestimmt wird
const q = {
  player: db.prepare("SELECT * FROM players WHERE id = ?"),
  players: db.prepare("SELECT * FROM players ORDER BY id"),
  addPlayer: db.prepare("INSERT INTO players(name, created, hidden) VALUES (?, ?, ?)"),
  setHidden: db.prepare("UPDATE players SET hidden = ? WHERE id = ?"),
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
  addGoal: db.prepare("INSERT INTO goals(player, week, kind, target, scope, coins, title, created, item) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"),
  delGoal: db.prepare("DELETE FROM goals WHERE id = ?"),
  plans: db.prepare("SELECT * FROM plans WHERE player = ? AND exam >= ? ORDER BY exam, id"),
  plan: db.prepare("SELECT * FROM plans WHERE id = ?"),
  addPlan: db.prepare("INSERT INTO plans(player, title, exam, units, coins, created, item) VALUES (?, ?, ?, ?, ?, ?, ?)"),
  delPlan: db.prepare("DELETE FROM plans WHERE id = ?"),
  putState: db.prepare("INSERT INTO states(player, day, ts, bytes, coins, words, d) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(player, day) DO UPDATE SET ts = excluded.ts, bytes = excluded.bytes, coins = excluded.coins, words = excluded.words, d = excluded.d"),
  latestState: db.prepare("SELECT day, ts, bytes, coins, words, d FROM states WHERE player = ? ORDER BY ts DESC LIMIT 1"),
  stateDay: db.prepare("SELECT day, ts, bytes, coins, words, d FROM states WHERE player = ? AND day = ?"),
  stateList: db.prepare("SELECT day, ts, bytes, coins, words FROM states WHERE player = ? ORDER BY day DESC"),
  pruneStates: db.prepare("DELETE FROM states WHERE player = ? AND day NOT IN (SELECT day FROM states WHERE player = ? ORDER BY day DESC LIMIT ?)"),
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

const hits = new Map();
const ADMIN_RATE = +process.env.ADMIN_RATE || 120;   // Anfragen je Minute für das Dashboard (der Test erhöht das)   // sehr einfache Begrenzung pro Adresse
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
function readJson(req, max) {
  return new Promise((resolve, reject) => {
    let n = 0; const parts = [];
    req.on("data", c => { n += c.length; if (n > (max || MAX_BODY)) { reject(Object.assign(new Error("zu groß"), { status: 413 })); req.destroy(); } else parts.push(c); });
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
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
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
  return [200, { token, name: pl.name, hidden: !!pl.hidden }];
}
function apiEvents(pid, body) {
  if (q.player.get(pid).hidden) return [200, { ok: true, stored: 0 }];
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
  if (q.player.get(pid).hidden) return [200, { ok: true }];
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
  const evs = q.events.all(pid, now - Math.max(days, 15) * 86400000).map(r => ({ ts: r.ts, k: r.k, d: JSON.parse(r.d) }));
  const perDay = {};
  const day = ts => (perDay[dayOf(ts)] = perDay[dayOf(ts)] || { date: dayOf(ts), sec: 0, items: 0, correct: 0, neu: 0, coins: 0, xp: 0, sessions: 0 });
  const bad = {}, sessions = [], buys = [], unitEarn = {}, wordEarn = { xp: 0, coins: 0, runs: 0 }, malRuns = [];
  for (const e of evs) {
    const d = e.d;
    if (e.ts < from) continue;       // die Zeitraum-Auswahl gilt für Tagesbalken, Problemwörter und Runden
    if (e.k === "a" || e.k === "s") {
      const x = day(e.ts); x.items++; if (d.g > 0) x.correct++;
      if (e.k === "a" && (d.b || 0) === 0 && d.g > 0) x.neu++;
      if (d.g === 0 && d.id) {
        const b = bad[d.id] = bad[d.id] || Object.assign({ id: d.id, n: 0, last: 0 }, nameOf(d));
        b.n++; b.last = e.ts;
      }
    } else if (e.k === "ss") {
      const x = day(e.ts); x.sec += d.sec || 0; x.coins += d.coins || 0; x.xp += d.xp || 0; x.sessions++;
      if (d.mode !== "arena") { wordEarn.xp += d.xp || 0; wordEarn.coins += d.coins || 0; wordEarn.runs++; }   // Lernrunden mit Wörtern, ohne Arena, Spiele und Grammatik
      if (d.unit) { const ue = unitEarn[String(d.unit)] = unitEarn[String(d.unit)] || { xp: 0, coins: 0, runs: 0 }; ue.xp += d.xp || 0; ue.coins += d.coins || 0; ue.runs++; }
      sessions.push({ ts: e.ts, sec: d.sec || 0, items: d.items || 0, correct: d.correct || 0, mode: d.mode || "", sub: String(d.sub || "").slice(0, 40), score: d.score || 0, unit: d.unit || "", coins: d.coins || 0, xp: d.xp == null ? null : d.xp });
    } else if (e.k === "mal") {   // Einmaleins-Runde: echte XP/Münzen zählen mit, Zeit und Aufgaben nicht (kein Wortschatz, kein Tagesziel)
      const x = day(e.ts); x.coins += d.coins || 0; x.xp += d.xp || 0;
      x.malRuns = (x.malRuns || 0) + 1; x.malSec = (x.malSec || 0) + (d.sec || 0); x.malXp = (x.malXp || 0) + (d.xp || 0); x.malCoins = (x.malCoins || 0) + (d.coins || 0);
      malRuns.push({ ts: e.ts, k: String(d.k || "").slice(0, 10), lv: String(d.lv || "").slice(0, 10), score: d.score || 0, err: d.err || 0, sec: d.sec || 0, ms: d.ms || 0, xp: d.xp || 0, coins: d.coins || 0, rec: d.rec ? 1 : 0, tm: d.tm === 0 ? 0 : 1, n: d.n || 0 });
    } else if (e.k === "buy") buys.push({ ts: e.ts, name: d.name || d.id, cost: d.cost || 0 });
  }
  const runsBy = {}, badBy = {};
  for (const s of sessions) (runsBy[dayOf(s.ts)] = runsBy[dayOf(s.ts)] || []).push(s);
  for (const e of evs) if (e.ts >= from && (e.k === "a" || e.k === "s") && e.d.g === 0 && e.d.id) {
    const m = badBy[dayOf(e.ts)] = badBy[dayOf(e.ts)] || {}, x = m[e.d.id] = m[e.d.id] || Object.assign({ n: 0 }, nameOf(e.d));
    x.n++;
  }
  const dayList = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dayOf(now - i * 86400000), base = perDay[k] || { date: k, sec: 0, items: 0, correct: 0, neu: 0, coins: 0, xp: 0, sessions: 0 };
    dayList.push(Object.assign({}, base, { runs: runsBy[k] || [], problems: Object.values(badBy[k] || {}).sort((a, b) => b.n - a.n).slice(0, 5) }));
  }
  /* Heute und laufende Kalenderwoche (Mo–So), unabhängig von der gewählten Zeitspanne */
  const todayK = dayOf(now), mon = mondayOf(todayK), sun = ymdAdd(mon, 6), pmon = ymdAdd(mon, -7), psun = ymdAdd(mon, -1);
  const empty = k => ({ date: k, sec: 0, items: 0, correct: 0, neu: 0, coins: 0, xp: 0, sessions: 0 });
  const dayAt = k => perDay[k] || empty(k);
  const sumDays = list => list.reduce((a, x) => ({ sec: a.sec + x.sec, items: a.items + x.items, correct: a.correct + x.correct, neu: a.neu + x.neu, coins: a.coins + x.coins, xp: a.xp + x.xp, sessions: a.sessions + x.sessions, activeDays: a.activeDays + (x.items > 0 ? 1 : 0) }), { sec: 0, items: 0, correct: 0, neu: 0, coins: 0, xp: 0, sessions: 0, activeDays: 0 });
  const wdays = []; for (let i = 0; i < 7; i++) wdays.push(dayAt(ymdAdd(mon, i)));
  const pdays = []; for (let i = 0; i < 7; i++) pdays.push(dayAt(ymdAdd(pmon, i)));
  const topBad = (a, b) => { const m = {}; for (const e of evs) { const k = dayOf(e.ts); if ((e.k === "a" || e.k === "s") && e.d.g === 0 && e.d.id && k >= a && k <= b) { const x = m[e.d.id] = m[e.d.id] || Object.assign({ id: e.d.id, n: 0, last: 0 }, nameOf(e.d)); x.n++; x.last = e.ts; } }
    return Object.values(m).sort((x, y) => y.n - x.n || y.last - x.last).slice(0, 5); };
  const todayInfo = Object.assign(dayAt(todayK), { problems: topBad(todayK, todayK), runs: sessions.filter(s => dayOf(s.ts) === todayK).reverse() });
  const weekInfo = Object.assign(sumDays(wdays), { from: mon, to: sun, days: wdays, problems: topBad(mon, sun), prev: Object.assign(sumDays(pdays), { from: pmon, to: psun }) });
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
    mal: (() => { const t = dayOf(now), w7 = dayOf(now - 6 * 86400000), sm = f => malRuns.reduce((a, r) => a + f(r), 0), td = malRuns.filter(r => dayOf(r.ts) >= t), wk = malRuns.filter(r => dayOf(r.ts) >= w7);
      return { total: { runs: malRuns.length, sec: sm(r => r.sec), xp: sm(r => r.xp), coins: sm(r => r.coins) }, today: { runs: td.length, sec: td.reduce((a, r) => a + r.sec, 0), xp: td.reduce((a, r) => a + r.xp, 0), coins: td.reduce((a, r) => a + r.coins, 0) },
        week: { runs: wk.length, sec: wk.reduce((a, r) => a + r.sec, 0), xp: wk.reduce((a, r) => a + r.xp, 0), coins: wk.reduce((a, r) => a + r.coins, 0), days: new Set(wk.map(r => dayOf(r.ts))).size }, last: malRuns.slice(-10).reverse() }; })(),
    days: dayList, today: todayInfo, calWeek: weekInfo, units, unitEarn, wordEarn, problems: badList, sessions: sessions.slice(-25).reverse(), buys: buys.slice(-20).reverse(), meta: meta ? meta.d : null,
    metaTs: meta ? meta.ts : null,
    totals: { sec: sum(x => x.sec), items: sum(x => x.items), correct: sum(x => x.correct), neu: sum(x => x.neu), xp: sum(x => x.xp), coins: sum(x => x.coins), activeDays: dayList.filter(x => x.items > 0).length },
    week: { sec: last7.reduce((a, x) => a + x.sec, 0), items: last7.reduce((a, x) => a + x.items, 0), correct: last7.reduce((a, x) => a + x.correct, 0), activeDays: last7.filter(x => x.items > 0).length },
    goals: weekGoals(pid), plans: plansOf(pid), backups: q.stateList.all(pid).map(stateMeta),
    events: c.n, lastEvent: c.last
  };
}



/* ---------- Analyse: Spielergebnisse und Lernverhalten der letzten Wochen, mit Vorschlägen ----------
   Reine Auswertung der Lernereignisse (nichts wird gespeichert). Die Vorschläge sind Regeln mit Mindestmengen, damit wenige Daten nicht täuschen. */
const hourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false });
const GAME_NAME = { match: "Match-Rausch", blitz: "Blitzrunde", survival: "Letztes Herz", hunt: "Fehlerjagd", detective: "Wort-Detektiv", eisi: "Freezy", kreuz: "Xing", letters: "Letters", blast: "Blast", blast3d: "Blast 3D", grammar: "Grammatik" };
const MODE_NAME_DE = { mix: "Gemischt", new: "Neue Wörter", box: "Fehlerkartei", sent: "Sätze", verbs: "Verben", unit: "Einheit", plan: "Lernplan", focus: "Gezielt üben", master: "Meistern", path: "Lernpfad" };
function analysis(pid, days) {
  days = Math.min(120, Math.max(14, days || 90));
  const now = Date.now(), from = now - days * 86400000;
  const evs = q.events.all(pid, from).map(r => ({ ts: r.ts, k: r.k, d: JSON.parse(r.d) }));
  const words = snap(pid, "words"), lvOf = id => (words && words.d[id]) ? words.d[id][0] : 0;
  const ratio = (a, b) => b ? a / b : null;
  /* 1. Runden je Spiel bzw. Lernart */
  const games = {}, modes = {}, perDayRuns = {};
  for (const e of evs) if (e.k === "ss") {
    const d = e.d, arena = d.mode === "arena", raw = String(d.sub || ""), key = arena ? (raw.startsWith("grammar:") ? "grammar" : raw || "arena") : (d.mode || "mix");
    const bag = arena ? games : modes, g = bag[key] = bag[key] || { id: key, name: arena ? (GAME_NAME[key] || key) : (MODE_NAME_DE[key] || key), runs: 0, sec: 0, items: 0, correct: 0, scores: [], last: 0 };
    g.runs++; g.sec += d.sec || 0; g.items += d.items || 0; g.correct += d.correct || 0; g.last = Math.max(g.last, e.ts);
    if (arena && d.score > 0) g.scores.push(d.score);
    (perDayRuns[dayOf(e.ts)] = perDayRuns[dayOf(e.ts)] || 0);
    perDayRuns[dayOf(e.ts)]++;
  }
  const fin = bag => Object.values(bag).map(g => {
    const sc = g.scores, n = sc.length, half = Math.floor(n / 2);
    const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
    const trend = n >= 6 ? Math.round((avg(sc.slice(n - half)) - avg(sc.slice(0, half))) / Math.max(1, avg(sc.slice(0, half))) * 100) : null;
    return { id: g.id, name: g.name, runs: g.runs, sec: g.sec, items: g.items, acc: ratio(g.correct, g.items), best: n ? Math.max.apply(null, sc) : null, avg: n ? Math.round(avg(sc)) : null, trend, last: g.last };
  }).sort((a, b) => b.sec - a.sec);
  /* 2. Einzelantworten: Art (Wörter/Sätze/Verben), Einheit, Wörter, Tageszeit, Hilfen */
  const types = { Wörter: { n: 0, ok: 0 }, Sätze: { n: 0, ok: 0 }, Verben: { n: 0, ok: 0 } }, units = {}, bad = {}, hours = Array.from({ length: 24 }, () => ({ n: 0, ok: 0 })), wdays = Array.from({ length: 7 }, () => ({ n: 0, ok: 0 }));
  let hints = 0, ans = 0;
  const half = now - Math.round(days / 2) * 86400000, per = [{ n: 0, ok: 0 }, { n: 0, ok: 0 }];
  for (const e of evs) if (e.k === "a" || e.k === "s") {
    const d = e.d, id = String(d.id || ""), good = d.g > 0 ? 1 : 0, t = /^s\d+$/.test(id) ? "Sätze" : /^v#/.test(id) ? "Verben" : "Wörter";
    types[t].n++; types[t].ok += good; ans++; if (d.h) hints++;
    const h = hours[+hourFmt.format(new Date(e.ts)) % 24]; h.n++; h.ok += good;
    const w = wdays[(new Date(dayOf(e.ts) + "T12:00:00Z").getUTCDay() + 6) % 7]; w.n++; w.ok += good;
    const pp = per[e.ts >= half ? 1 : 0]; pp.n++; pp.ok += good;
    if (t === "Wörter") { const u = String(d.u || id.split("#")[0]); const x = units[u] = units[u] || { id: u, n: 0, ok: 0 }; x.n++; x.ok += good; }
    if (!good && id) { const b = bad[id] = bad[id] || Object.assign({ id, n: 0 }, nameOf(d)); b.n++; }
  }
  const unitList = Object.values(units).filter(u => u.n >= 15).map(u => ({ id: u.id, title: ((UNIT_BY[u.id] && UNIT_BY[u.id].title) || u.id).replace(/^Headlight 2 · /, ""), n: u.n, acc: u.ok / u.n })).sort((a, b) => a.acc - b.acc).slice(0, 6);
  const stuck = Object.values(bad).filter(b => b.n >= 3).map(b => Object.assign(b, { lv: lvOf(b.id) })).sort((a, b) => b.n - a.n).slice(0, 10);
  const hourList = hours.map((h, i) => ({ h: i, n: h.n, acc: ratio(h.ok, h.n) })).filter(h => h.n > 0);
  /* 3. Rhythmus */
  const activeDays = new Set(evs.filter(e => e.k === "ss" || e.k === "a" || e.k === "s").map(e => dayOf(e.ts)));
  const last14 = Array.from({ length: 14 }, (_, i) => dayOf(now - i * 86400000)).filter(k => activeDays.has(k)).length;
  const allSec = Object.values(Object.assign({}, games, modes)).reduce((a, g) => a + g.sec, 0), runs = Object.values(Object.assign({}, games, modes)).reduce((a, g) => a + g.runs, 0);
  const arenaSec = Object.values(games).reduce((a, g) => a + g.sec, 0);
  const gl = fin(games), ml = fin(modes);
  /* 4. Vorschläge */
  const tips = [], tip = (prio, icon, title, text) => tips.push({ prio, icon, title, text });
  const pc = x => Math.round(x * 100) + " %";
  if (ans < 40 && runs < 5) tip(3, "ℹ️", "Noch wenig Daten", "Es gibt erst " + ans + " Antworten und " + runs + " Runden in diesem Zeitraum. Die Vorschläge werden besser, sobald mehr geübt wurde.");
  const weakType = Object.entries(types).filter(([, v]) => v.n >= 30).map(([k, v]) => ({ k, acc: v.ok / v.n, n: v.n })).sort((a, b) => a.acc - b.acc)[0];
  if (weakType && weakType.acc < 0.72) tip(1, "🎯", weakType.k + " fallen am schwersten (" + pc(weakType.acc) + " richtig)", "Lege dafür im Dashboard unter „Lernstoff steuern“ einen Lernplan an oder stelle eine Einheit als Wochenziel ein. In der App hilft „Gezielt üben“ gezielt für diese Aufgabenform.");
  if (unitList.length && unitList[0].acc < 0.7) tip(1, "📚", "Schwächste Einheiten: " + unitList.slice(0, 3).filter(u => u.acc < 0.75).map(u => u.title).join(", "), "Dort liegt die Trefferquote unter 75 %. Diese Einheiten als Lernplan oder Wochenziel (Einheit sicher) setzen, bevor der Pfad weiterläuft.");
  if (stuck.length >= 3) tip(1, "♻️", stuck.length + " Wörter bleiben hängen", "Sie wurden mindestens dreimal falsch beantwortet: " + stuck.slice(0, 5).map(b => b.en).join(", ") + ". Täglich 5 Minuten Fehlerkartei oder „Mitlesen“ dafür einplanen; alternativ eine eigene Lernliste mit diesen Wörtern.");
  const badGame = gl.filter(g => g.runs >= 3 && g.acc != null && g.acc < 0.55).sort((a, b) => a.acc - b.acc)[0];
  if (badGame) tip(2, "🎮", badGame.name + " klappt noch nicht gut (" + pc(badGame.acc) + " richtig)", "Das Spiel ist offenbar zu schwer oder zu schnell. Erst die Wörter in „Lernen“ festigen, dann noch einmal spielen. Vorschlag: im Wechsel mit Fehlerjagd (Fehlerkartei) üben.");
  const unplayed = Object.keys(GAME_NAME).filter(k => k !== "grammar" && !games[k]);
  if (runs >= 5 && unplayed.length >= 3) tip(3, "🧩", unplayed.length + " Spiele noch nie gespielt", unplayed.slice(0, 5).map(k => GAME_NAME[k]).join(", ") + ". Spiele bringen Abwechslung; ein Wochenziel „Tage üben“ mit einem Spiel pro Tag macht neugierig.");
  const gram = games.grammar; if (runs >= 10 && !gram) tip(3, "✏️", "Grammatik noch nicht ausprobiert", "Unter Lernen › Grammatik gibt es 8 Themen passend zum Schulbuch. Ein Thema pro Woche als Lernplan-Ergänzung.");
  if (allSec > 600 && arenaSec / allSec > 0.7) tip(2, "⚖️", "Fast nur Spiele (" + pc(arenaSec / allSec) + " der Zeit)", "Spiele sind flache Wiederholung. Damit Wörter wirklich sitzen, sollte mindestens die Hälfte der Zeit in Lernen (Daily Challenge, Lernpfad, Fehlerkartei) laufen. Dafür eine Mindestzeit als Wochenziel (Minuten üben) setzen.");
  if (allSec > 600 && arenaSec / allSec < 0.08 && runs >= 8) tip(3, "🎲", "Kaum Spiele", "Fast nur Standardrunden. Zwei kurze Spielrunden pro Woche halten die Motivation hoch.");
  if (last14 < 6 && days >= 14) tip(1, "📅", "Nur an " + last14 + " von 14 Tagen geübt", "Regelmäßigkeit zählt mehr als Länge. Ein Wochenziel „An 5 Tagen üben“ und die tägliche Erinnerung zur besten Uhrzeit (siehe unten) einstellen.");
  const avgRun = runs ? allSec / runs / 60 : 0;
  if (runs >= 8 && avgRun < 3) tip(2, "⏱️", "Sehr kurze Runden (Ø " + avgRun.toFixed(1).replace(".", ",") + " Min.)", "Ab etwa 5 Minuten wird die Wiederholung wirksam. Tagesziel auf 10 Minuten stellen und Daily Challenge fest einplanen.");
  if (runs >= 8 && avgRun > 25) tip(3, "☕", "Sehr lange Runden (Ø " + Math.round(avgRun) + " Min.)", "Nach etwa 15 Minuten lässt die Konzentration nach. Zwei kürzere Runden am Tag bringen mehr.");
  if (ans >= 60 && hints / ans > 0.25) tip(2, "💡", "Viele Hilfen (" + pc(hints / ans) + " der Antworten)", "Hilfen schützen vor Frust, ersetzen aber das Erinnern. Schwierigkeit senken (nur bekannte Einheiten) und die Hilfen nur nach dem zweiten Fehler anbieten.");
  if (per[0].n >= 40 && per[1].n >= 40) { const a0 = per[0].ok / per[0].n, a1 = per[1].ok / per[1].n; if (a1 - a0 >= 0.05) tip(3, "📈", "Trefferquote steigt", pc(a0) + " → " + pc(a1) + " in der zweiten Hälfte des Zeitraums. Weiter so; neue Einheiten hinzunehmen."); else if (a0 - a1 >= 0.05) tip(2, "📉", "Trefferquote sinkt", pc(a0) + " → " + pc(a1) + ". Wahrscheinlich kam neuer Stoff dazu. Neue Wörter pro Tag begrenzen und die Fehlerkartei zuerst leeren."); }
  const goodHours = hourList.filter(h => h.n >= 25).sort((a, b) => b.acc - a.acc), badHours = hourList.filter(h => h.n >= 25).sort((a, b) => a.acc - b.acc);
  if (goodHours.length >= 3 && goodHours[0].acc - badHours[0].acc >= 0.1) tip(3, "🕒", "Beste Uhrzeit: " + goodHours[0].h + " Uhr", "Dort liegt die Trefferquote bei " + pc(goodHours[0].acc) + " (am schwächsten um " + badHours[0].h + " Uhr: " + pc(badHours[0].acc) + "). Erinnerung dafür im Dashboard unter Einstellungen › Tägliche Erinnerung setzen.");
  const sentN = types["Sätze"].n, wordN = types["Wörter"].n;
  if (ans >= 100 && sentN / ans < 0.05) tip(3, "🧱", "Fast keine Sätze", "Satzbau-Übungen trainieren Grammatik im Zusammenhang. Eine Satzrunde (Modus Sätze) pro Tag zusätzlich anstoßen.");
  tips.sort((a, b) => a.prio - b.prio);
  return {
    days, answers: ans, runs, sec: allSec, activeDays: activeDays.size, last14, acc: ans ? Object.values(types).reduce((a, v) => a + v.ok, 0) / ans : null,
    games: gl, modes: ml, types: Object.entries(types).map(([k, v]) => ({ name: k, n: v.n, acc: ratio(v.ok, v.n) })), units: unitList, stuck, hours: hourList,
    wdays: wdays.map((w, i) => ({ d: i, n: w.n, acc: ratio(w.ok, w.n) })), tips, stuckRaw: stuck.length
  };
}


/* ---------- Persönlicher Tagesplan: aus der Analyse die Übungen für die Tageszeit des Kindes (Standard 10 Minuten) ----------
   Vier Bausteine (Wiederholen, schwächste Einheit, schwache Aufgabenart, Spiel), Minuten nach Gewicht verteilt. Die App zeigt ihn auf der Startseite (kommt über /api/sync). */
const dayplanOn = pid => { const r = q.kvGet.get("dayplan:" + pid); try { return r ? JSON.parse(r.val).on !== false : true; } catch (e) { return true; } };
const ARENA_IDS = ["match", "blitz", "survival", "hunt"];
function buildDayplan(A, total, biz) {
  const pc = x => Math.round(x * 100) + " %", T = Object.fromEntries(A.types.map(t => [t.name, t])), blocks = [];
  const doy = Math.floor(Date.now() / 86400000);
  // 1. Wiederholen
  if (A.stuck.length >= 3) blocks.push({ id: "box", w: 3, icon: "♻️", title: "Fehlerkartei", sub: "Hängende Wörter: " + A.stuck.slice(0, 3).map(b => b.en).join(", "), act: "start", mode: "box" });
  else blocks.push({ id: "mix", w: 3, icon: "🏆", title: "Daily Challenge", sub: "Bunte Wiederholung: Wörter, die heute dran sind", act: "start", mode: "mix" });
  // 2. Schwächste Einheit, sonst Neues
  const wu = A.units[0];
  if (wu && wu.acc < 0.85) blocks.push({ id: "unit", w: 3, icon: "📚", title: wu.title, sub: "Schwächste Einheit: " + pc(wu.acc) + " richtig", act: "start", mode: "unit", unit: wu.id });
  else blocks.push({ id: "new", w: 3, icon: "✨", title: "Neue Wörter", sub: "Nichts Schwaches offen: Zeit für Neues", act: "start", mode: "new" });
  // 3. Sätze gehören immer dazu (Satzbau übt Grammatik im Zusammenhang); schwach = mehr Zeit
  const sw0 = T["Sätze"] && T["Sätze"].n >= 20 && T["Sätze"].acc < 0.8;
  blocks.push({ id: "sent", w: sw0 ? 3 : 2, icon: "💬", title: "Sätze", sub: sw0 ? "Sätze klappen erst zu " + pc(T["Sätze"].acc) : "Satzbau: Grammatik im Zusammenhang üben", act: "start", mode: "sent" });
  // 4. Weitere Aufgabenart: Verben, wenn sie schwach sind, sonst abwechselnd Verben und Tippen
  const vw = !biz && T["Verben"] && T["Verben"].n >= 20 && T["Verben"].acc < 0.8;
  if (vw) blocks.push({ id: "type", w: 2, icon: "🔀", title: "Verben", sub: "Verben klappen erst zu " + pc(T["Verben"].acc), act: "start", mode: "verbs" });
  else { const rot = (biz ? [] : [{ t: "Verben", i: "🔀", m: "verbs" }]).concat([{ t: "Tippen", i: "⌨️", m: "focus", f: "type" }]), r = rot[doy % rot.length];
    blocks.push({ id: "type", w: 2, icon: r.i, title: r.t, sub: "Abwechslung: heute " + r.t, act: "start", mode: r.m, focus: r.f || null }); }
  // 4. Spiel (nur wenn nicht schon fast nur gespielt wird)
  const gshare = A.sec ? A.games.reduce((a, g) => a + g.sec, 0) / A.sec : 0;
  if (gshare <= 0.7) {
    let g = null;
    if (A.stuck.length >= 3) g = { id: "hunt", name: "Fehlerjagd", why: "Jagt die hängenden Wörter" };
    else { const f = A.games.filter(x => x.id !== "grammar" && (x.acc == null || x.acc >= 0.55)).sort((a, b) => b.runs - a.runs)[0]; g = f ? { id: f.id, name: f.name, why: "Dein Lieblingsspiel (" + f.runs + " Runden)" } : { id: "blast", name: "Blast", why: "Zum Ausprobieren" }; }
    blocks.push({ id: "game", w: 2, icon: "🎮", title: g.name, sub: g.why, act: ARENA_IDS.includes(g.id) ? "arena" : "wgame", gid: g.id });
  } else blocks[1].w += 2;   // kein Spiel: die Minuten gehen an die schwächste Einheit
  // Minuten verteilen (mindestens 1, Summe = total)
  const sw = blocks.reduce((a, b) => a + b.w, 0); let used = 0;
  blocks.forEach(b => { b.min = Math.max(1, Math.round(b.w * total / sw)); used += b.min; });
  for (let i = 0; used !== total && i < 40; i++) { const b = blocks[i % blocks.length]; if (used < total) { b.min++; used++; } else if (b.min > 1) { b.min--; used--; } }
  blocks.forEach(b => delete b.w);
  return { total, blocks, why: A.tips.filter(t => t.prio === 1).slice(0, 2).map(t => t.title), made: Date.now() };
}
const dayplanCache = new Map();
function dayplanOf(pid) {
  const c = dayplanCache.get(pid); if (c && Date.now() - c.ts < 20 * 60000) return c.v;
  const meta = snap(pid, "meta"), total = Math.min(20, Math.max(5, Math.round(meta && meta.d && meta.d.goalMin) || 10)), biz = !!(meta && meta.d && meta.d.track === "business");
  const A = analysis(pid, 60), v = A.answers + A.runs < 15 ? null : buildDayplan(A, total, biz);
  dayplanCache.set(pid, { ts: Date.now(), v }); return v;
}


/* ---------- Plan-Generator: Eltern stellen den Tagesplan selbst zusammen (ersetzt den automatischen Plan, bis er gelöscht wird) ----------
   Bausteine: Mitlesen/Einheit je Einheit, Lernarten, Spiele (optional je Einheit), Grammatik-Thema, Duell nach Wahl. Die Texte baut der Server, die App führt nur aus. */
const GRAM_TOPICS = { pres1: ["🕒", "Simple Present und Present Progressive"], past1: ["⏪", "Simple Past: Das ist passiert"], past2: ["❓", "Simple Past: Fragen und Verneinung"], modal1: ["💪", "have to, should, can / could"], will1: ["🔮", "will, going to, I'll"], comp1: ["📈", "Steigerung"], quant1: ["🍎", "some, any, there is / there are"], if1: ["🔀", "If-Sätze (Typ 1)"] };
const PLAN_GAMES = { match: ["⚡", "Match-Rausch", "arena"], blitz: ["🔥", "Blitzrunde", "arena"], survival: ["💠", "Letztes Herz", "arena"], hunt: ["🎯", "Fehlerjagd", "arena"], detective: ["🕵️", "Wort-Detektiv", "wgame"], eisi: ["🧊", "Freezy", "wgame"], kreuz: ["✖️", "Xing", "wgame"], letters: ["🔤", "Letters", "wgame"], blast: ["🚀", "Blast", "wgame"], blast3d: ["🛸", "Blast 3D", "wgame"] };
const PLAN_TYPES = {
  mitlesen: { label: "Mitlesen", group: "Lernen", unit: "opt" }, unit: { label: "Einheit üben", group: "Lernen", unit: "req" },
  box: { label: "Fehlerkartei", group: "Lernen" }, mix: { label: "Daily Challenge (gemischt)", group: "Lernen" }, new: { label: "Neue Wörter", group: "Lernen" },
  sent: { label: "Sätze", group: "Lernen" }, verbs: { label: "Unregelmäßige Verben", group: "Lernen" },
  listen: { label: "Hören", group: "Gezielt üben" }, type: { label: "Tippen", group: "Gezielt üben" }, gap: { label: "Lücken", group: "Gezielt üben" }, match: { label: "Zuordnen", group: "Gezielt üben" },
  grammar: { label: "Grammatik", group: "Lernen", topic: true }, game: { label: "Spiel", group: "Spiele", game: true, unit: "opt" }, duel: { label: "Duell nach Wahl", group: "Spiele" }
};
const unitShort = id => { const u = UNIT_BY[id]; return u ? u.title.replace(/^Headlight 2 · /, "") : String(id); };
function planBlocks(raw) {
  const out = [], err = (m) => ({ error: m });
  if (!Array.isArray(raw) || !raw.length) return err("Bitte mindestens einen Baustein angeben.");
  if (raw.length > 12) return err("Höchstens 12 Bausteine.");
  for (let i = 0; i < raw.length; i++) {
    const r = raw[i] || {}, t = String(r.t || ""), def = PLAN_TYPES[t], min = Math.round(+r.min);
    if (!def) return err("Unbekannter Baustein " + (i + 1) + ".");
    if (!(min >= 1 && min <= 30)) return err("Minuten bei Baustein " + (i + 1) + ": 1 bis 30.");
    const unit = r.unit ? String(r.unit) : "";
    if (unit && !SAFE_ID.test(unit)) return err("Einheit bei Baustein " + (i + 1) + " ungültig.");
    if (def.unit === "req" && !unit) return err("Baustein " + (i + 1) + ": bitte eine Einheit wählen.");
    if (unit && UNIT_BY[unit] === undefined && !/^(eigen|own)/i.test(unit)) return err("Einheit bei Baustein " + (i + 1) + " ist dem Server unbekannt.");
    const b = { id: "c" + i, min, icon: "📚", title: def.label, sub: "", act: "start", mode: t, unit: "", focus: null, gid: "", topic: "" };
    if (t === "mitlesen") { b.act = "mitlesen"; b.icon = "🗣️"; b.unit = unit; b.title = unit ? "Mitlesen: " + unitShort(unit) : "Mitlesen: alle gelernten Wörter"; b.sub = "Wörter hören und laut mitsprechen"; }
    else if (t === "unit") { b.mode = "unit"; b.unit = unit; b.title = unitShort(unit); b.sub = "Einheit üben"; }
    else if (t === "box") { b.icon = "♻️"; b.sub = "Fehlerkartei: Wörter, die noch wackeln"; }
    else if (t === "mix") { b.icon = "🏆"; b.sub = "Bunte Wiederholung, was heute dran ist"; }
    else if (t === "new") { b.icon = "✨"; b.sub = "Neue Wörter kennenlernen"; }
    else if (t === "sent") { b.icon = "💬"; b.sub = "Sätze bauen"; }
    else if (t === "verbs") { b.icon = "🔀"; b.sub = "Unregelmäßige Verben"; }
    else if (["listen", "type", "gap", "match"].includes(t)) { b.mode = "focus"; b.focus = t; b.icon = { listen: "👂", type: "⌨️", gap: "🧩", match: "🔗" }[t]; b.sub = "Gezielt üben: " + def.label; }
    else if (t === "grammar") { const g = GRAM_TOPICS[String(r.topic || "")]; if (!g) return err("Grammatik-Thema bei Baustein " + (i + 1) + " unbekannt."); b.act = "gram"; b.topic = String(r.topic); b.icon = g[0]; b.title = g[1]; b.sub = "Grammatik: erklären und üben"; }
    else if (t === "game") {
      const g = PLAN_GAMES[String(r.game || "")]; if (!g) return err("Spiel bei Baustein " + (i + 1) + " unbekannt.");
      b.gid = String(r.game); b.icon = g[0]; b.title = g[1]; b.sub = "Spiel";
      if (g[2] === "arena" && unit && b.gid !== "hunt") { b.act = "unitgame"; b.unit = unit; b.sub = "Spiel mit Wörtern aus " + unitShort(unit); } else b.act = g[2];
    }
    else if (t === "duel") { b.act = "duel"; b.icon = "⚔️"; b.title = "Ein Duell deiner Wahl"; b.sub = "Fordere einen Freund heraus"; }
    out.push(b);
  }
  return { blocks: out };
}
/* Gespeichert: { raw: Standard-Plan | null, days: { "0".."6": Plan } (Mo = 0), ts }. Ältere Daten ({ raw, ts }) gelten als Standard. */
function customplanStore(pid) { const r = q.kvGet.get("customplan:" + pid); let v = null; try { v = r ? JSON.parse(r.val) : null; } catch (e) {} if (!v || typeof v !== "object") v = {}; return { raw: Array.isArray(v.raw) ? v.raw : null, days: v.days && typeof v.days === "object" ? v.days : {}, ts: v.ts || 0 }; }
const planOfRaw = (raw, ts) => { if (!Array.isArray(raw)) return null; const b = planBlocks(raw); return b.error ? null : { custom: true, total: b.blocks.reduce((a, x) => a + x.min, 0), blocks: b.blocks, why: [], made: ts || 0 }; };
const planDow = () => (new Date(dayOf(Date.now()) + "T12:00:00Z").getUTCDay() + 6) % 7;
/* Plan der Eltern für einen Wochentag (0 = Montag): eigener Tagesplan, sonst der Standard */
function customplanOf(pid, dow) { const st = customplanStore(pid), d = dow == null ? planDow() : dow; return planOfRaw(Array.isArray(st.days[d]) ? st.days[d] : st.raw, st.ts); }
function customplanWeek(pid) { return Array.from({ length: 7 }, (_, d) => customplanOf(pid, d)); }

/* ---------- Wochen, Ziele, Lernpläne ---------- */
const ymdAdd = (d, n) => { const [y, m, x] = d.split("-").map(Number); return new Date(Date.UTC(y, m - 1, x + n)).toISOString().slice(0, 10); };
function mondayOf(d) { const [y, m, x] = d.split("-").map(Number); return ymdAdd(d, -((new Date(Date.UTC(y, m - 1, x)).getUTCDay() + 6) % 7)); }
const daysBetween = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
const SAFE_ID = /^[A-Za-z0-9_.\-]{1,30}$/;
const KINDS = { minutes: "Minuten üben", days: "Tage üben", newwords: "Wörter wiedererkennen", unit: "Einheit sicher" };

function unitTitles(pid, ids) {
  const cat = snap(pid, "catalog"), by = {};
  if (cat) cat.d.forEach(u => { by[u.id] = u.title.replace(/^Headlight 2 · /, ""); });
  return ids.map(i => by[i] || i);
}
function goalTitle(pid, kind, target, scope) {
  if (kind === "minutes") return target + " Minuten üben";
  if (kind === "days") return "An " + target + " Tagen üben (mindestens 5 Minuten)";
  if (kind === "newwords") return target + " Wörter wiedererkennen (am Folgetag richtig)";
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
      else if (e.k === "a" && g.kind === "newwords" && (e.d.b || 0) === 1 && (e.d.a || 0) >= 2 && e.d.g > 0) cur++;
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
  return list.map(g => Object.assign({ id: g.id, week: g.week, kind: g.kind, target: g.target, scope: JSON.parse(g.scope), coins: g.coins, item: g.item || "", title: g.title,
    current: g.week <= mon && mon <= ymdAdd(g.week, 6) }, goalProgress(pid, g, evs)));
}
function plansOf(pid) {
  return q.plans.all(pid, ymdAdd(dayOf(Date.now()), -7)).map(p => Object.assign({ id: p.id, title: p.title, exam: p.exam, units: JSON.parse(p.units), coins: p.coins, item: p.item || "", unitTitles: unitTitles(pid, JSON.parse(p.units)) }, planProgress(pid, p)));
}
const itemId = v => /^[a-z]{2,3}:[^\s<>"'&\\]{1,40}$/.test(String(v || "")) ? String(v) : "";   // Shop-Artikel als Belohnung (nur Betreiber)
function createGoal(pid, b) {
  if (q.player.get(pid).hidden) return [400, { error: "Für nur gesicherte Spieler gibt es keine Ziele." }];
  const kind = String(b.kind || ""), target = Math.round(+b.target), coins = Math.round(+b.coins || 0);
  if (!KINDS[kind]) return [400, { error: "Unbekannte Art von Ziel." }];
  if (!(target >= 1 && target <= (kind === "days" ? 7 : kind === "unit" ? 100 : 10000))) return [400, { error: "Zielwert ungültig." }];
  if (coins < 0 || coins > 500) return [400, { error: "Münzen müssen zwischen 0 und 500 liegen." }];
  const scope = Array.isArray(b.scope) ? b.scope.filter(x => SAFE_ID.test(String(x))).slice(0, 40).map(String) : [];
  if (kind === "unit" && !scope.length) return [400, { error: "Bitte mindestens eine Einheit wählen." }];
  const mon = mondayOf(dayOf(Date.now()));
  const week = b.week === "next" ? ymdAdd(mon, 7) : mon;
  const title = clean(b.title, 90) || goalTitle(pid, kind, target, scope);
  const id = +q.addGoal.run(pid, week, kind, target, JSON.stringify(kind === "unit" ? scope : []), coins, title, Date.now(), itemId(b.item)).lastInsertRowid;
  return [200, { id }];
}
function createPlan(pid, b) {
  if (q.player.get(pid).hidden) return [400, { error: "Für nur gesicherte Spieler gibt es keinen Lernplan." }];
  const exam = String(b.exam || ""), coins = Math.round(+b.coins || 0);
  if (!/^\d{4}-\d\d-\d\d$/.test(exam) || exam < dayOf(Date.now())) return [400, { error: "Datum der Arbeit fehlt oder liegt in der Vergangenheit." }];
  const units = Array.isArray(b.units) ? b.units.filter(x => SAFE_ID.test(String(x))).slice(0, 40).map(String) : [];
  if (!units.length) return [400, { error: "Bitte mindestens eine Einheit wählen." }];
  if (coins < 0 || coins > 500) return [400, { error: "Münzen müssen zwischen 0 und 500 liegen." }];
  const title = clean(b.title, 60) || "Klassenarbeit";
  const id = +q.addPlan.run(pid, title, exam, JSON.stringify(units), coins, Date.now(), itemId(b.item)).lastInsertRowid;
  return [200, { id }];
}
/* Was die App abholt: Ziele der laufenden und kommenden Woche, offene Lernpläne */
function apiSync(pid) {
  const mon = mondayOf(dayOf(Date.now()));
  return [200, {
    now: Date.now(), today: dayOf(Date.now()),
    goals: q.goals.all(pid, mon).map(g => ({ id: g.id, week: g.week, kind: g.kind, target: g.target, scope: JSON.parse(g.scope), coins: g.coins, item: g.item || "", title: g.title })),
    plans: q.plans.all(pid, dayOf(Date.now())).map(p => ({ id: p.id, title: p.title, exam: p.exam, units: JSON.parse(p.units), coins: p.coins, item: p.item || "" })).concat(classPlansFor(pid)),
    pathUnits: pathUnitsOf(pid),
    weekPlan: weekPlanOf(pid),
    bossDiff: bossDiffOf(pid),
    selfChoose: selfChooseOf(pid),
    shop: shopPlan(),
    seasonPlan: seasonPlan(),
    lookForce: lookForceOf(pid),
    coinFactor: coinFactorOf(pid),
    gifts: giftsOf(pid).slice(-20),
    season: seasonOf(pid),
    dayplan: customplanOf(pid) || (dayplanOn(pid) ? dayplanOf(pid) : null),
    dayplanWeek: customplanWeek(pid),
    dayplanAuto: dayplanOn(pid) ? dayplanOf(pid) : null
  }];
}
/* Wochenzeitplan: Minuten pro Wochentag (Mo bis So), gilt jede Woche gleich, dazu Wochenbonus in Münzen */
function weekPlanOf(pid) { const r = q.kvGet.get("weekplan:" + pid); try { const v = r ? JSON.parse(r.val) : null; return v && Array.isArray(v.min) ? v : null; } catch (e) { return null; } }
function setWeekPlan(pid, body) {
  if (body.clear) { q.kvSet.run("weekplan:" + pid, "null"); return [200, { ok: true, plan: null }]; }
  const min = Array.isArray(body.min) ? body.min.slice(0, 7).map(x => Math.max(0, Math.min(180, Math.round(+x) || 0))) : null;
  if (!min || min.length !== 7) return [400, { error: "Bitte sieben Werte (Montag bis Sonntag) angeben." }];
  const bonus = Math.max(0, Math.min(200, Math.round(+body.bonus) || 0)), plan = { min, bonus };
  q.kvSet.run("weekplan:" + pid, JSON.stringify(plan));
  return [200, { ok: true, plan }];
}
/* Schwierigkeit der Boss-Runden: leicht, normal oder schwer (Zielwerte x 0,7 / 1 / 1,3) */
/* Wer wählt den Stoff? Standard: gesteuert (Eltern/Lehrkraft über die Pfad-Einheiten). „Kind wählt selbst“ gibt die Lernbereiche frei. */
function selfChooseOf(pid) { const r = q.kvGet.get("selfchoose:" + pid); return !!(r && r.val === "1"); }
function setSelfChoose(pid, body) { q.kvSet.run("selfchoose:" + pid, body && body.on ? "1" : "0"); return [200, { ok: true, on: !!(body && body.on) }]; }
/* Shop-Kalender: Go-live-Datum (Montag) und Abweichungen „ab Woche N“ je Artikel, nur der Betreiber ändert sie */
function shopPlan() {
  const st = q.kvGet.get("shop_start"), ov = q.kvGet.get("shop_over");
  let over = {}; try { over = ov ? JSON.parse(ov.val) : {}; } catch (e) {}
  return { start: st && /^\d{4}-\d{2}-\d{2}$/.test(st.val) ? st.val : "", over };
}
function setShopPlan(body) {
  const start = /^\d{4}-\d{2}-\d{2}$/.test(body.start || "") ? body.start : "", over = {};
  if (body.over && typeof body.over === "object") Object.keys(body.over).slice(0, 300).forEach(id => { if (/^[a-z]{2}:[^\s"<>]{1,40}$/.test(id)) over[id] = Math.max(0, Math.min(104, Math.round(+body.over[id]) || 0)); });
  q.kvSet.run("shop_start", start); q.kvSet.run("shop_over", JSON.stringify(over));
  return [200, { ok: true }];
}
/* Saison-Looks: Betreiber setzt je Look Modus (auto = Standardfenster, on = für alle an, off = aus) und optional ein eigenes Fenster (MM-DD) */
const SEASON_IDS = ["halloween", "winter", "xmas", "spring", "aqua"];
function seasonPlan() {
  const r = q.kvGet.get("season_plan"); let v = {}; try { v = r ? JSON.parse(r.val) : {}; } catch (e) {}
  return v && typeof v === "object" ? v : {};
}
function setSeasonPlan(body) {
  const out = {}, ok = d => /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(d || "");
  SEASON_IDS.forEach(id => {
    const x = body && body[id]; if (!x || typeof x !== "object") return;
    const mode = x.mode === "on" || x.mode === "off" ? x.mode : "auto", e = { mode };
    if (ok(x.from) && ok(x.to)) { e.from = x.from; e.to = x.to; }
    if (mode !== "auto" || e.from) out[id] = e;
  });
  q.kvSet.run("season_plan", JSON.stringify(out));
  return [200, { ok: true, plan: out }];
}
/* Look-Vorgabe je Spieler (nur Betreiber, zum Testen): "" = Standard, Look-ID = erzwingen (ohne Datumsfenster und Sperre), "off" = aus */
function lookForceOf(pid) { const r = q.kvGet.get("look:" + pid); return r && (SEASON_IDS.includes(r.val) || r.val === "off") ? r.val : ""; }
function setLookForce(pid, body) {
  const v = body && (SEASON_IDS.includes(body.look) || body.look === "off") ? body.look : "";
  q.kvSet.run("look:" + pid, v); return [200, { ok: true, look: v }];
}
function bossDiffOf(pid) { const r = q.kvGet.get("bossdiff:" + pid); return r && (r.val === "leicht" || r.val === "schwer") ? r.val : "normal"; }
function setBossDiff(pid, body) {
  const v = body && (body.diff === "leicht" || body.diff === "schwer") ? body.diff : "normal";
  q.kvSet.run("bossdiff:" + pid, v);
  return [200, { ok: true, diff: v }];
}
/* Extramünzen von den Eltern: werden von der App beim nächsten Abgleich genau einmal gutgeschrieben */
function giftsOf(pid) { const r = q.kvGet.get("gifts:" + pid); try { return r ? JSON.parse(r.val) : []; } catch (e) { return []; } }
function addGift(pid, body) {
  const coins = Math.round(+body.coins);
  if (!(coins >= 1 && coins <= 500)) return [400, { error: "Münzen müssen zwischen 1 und 500 liegen." }];
  const note = String(body.note || "").replace(/\r/g, "").trim().slice(0, 240), list = giftsOf(pid);
  const gift = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), coins, note, ts: Date.now() };
  list.push(gift); q.kvSet.run("gifts:" + pid, JSON.stringify(list.slice(-50)));
  return [200, { ok: true, gift, list: list.slice(-50) }];
}
/* Pass: Monat aus Wochen-Sets (Aufgabe + Belohnungen), von den Eltern im Dashboard zusammengestellt */
function seasonOf(pid) { const r = q.kvGet.get("season:" + pid); try { const v = r ? JSON.parse(r.val) : null; return v && Array.isArray(v.weeks) ? v : null; } catch (e) { return null; } }
function setSeason(pid, body) {
  if (body.clear) { q.kvSet.run("season:" + pid, "null"); return [200, { ok: true, season: null }]; }
  const idOk = s => /^[a-z]{2}:[^\s"<>]{1,40}$/.test(s), cl = (v, a, b) => Math.max(a, Math.min(b, Math.round(+v) || a));
  const clean = w => ({ title: String(w.title || "").replace(/[<>]/g, "").trim().slice(0, 40), need: cl(w.need, 1, 7), items: (Array.isArray(w.items) ? w.items : []).map(String).filter(idOk).slice(0, 8), slot: w.slot ? 1 : 0, boost: cl(w.boost, 0, 3), coins: cl(w.coins, 0, 500) });
  if (!Array.isArray(body.weeks) || !body.weeks.length) return [400, { error: "Mindestens eine Woche angeben." }];
  const old = seasonOf(pid), id = body.newId ? "s" + Date.now().toString(36) : old ? old.id : /^[a-z0-9]{3,20}$/.test(body.id || "") ? body.id : "s" + Date.now().toString(36);
  const season = { id, title: String(body.title || "Pass").replace(/[<>]/g, "").trim().slice(0, 30) || "Pass", theme: "ice", start: /^\d{4}-\d{2}-\d{2}$/.test(body.start || "") ? body.start : "", weeks: body.weeks.slice(0, 6).map(clean), finale: body.finale ? clean(body.finale) : null };
  q.kvSet.run("season:" + pid, JSON.stringify(season));
  return [200, { ok: true, season }];
}
/* Münzfaktor: Eltern können Verdienst und damit das Tempo im Shop anpassen (0,5 bis 2) */
/* Belohnungsbereich für Eltern (vorübergehend): Extramünzen, Münzfaktor, Bonusmünzen/Geschenke bei Zielen und Plänen, Wochenpass.
   Der Betreiber schaltet ihn im Dashboard unter „Familien“ ein und aus (kv feature:famrewards, Standard: an). */
function famRewardsOn() { const r = q.kvGet.get("feature:famrewards"); return !r || r.val !== "0"; }
function coinFactorOf(pid) { const r = q.kvGet.get("coinfactor:" + pid); const v = r ? parseFloat(r.val) : 1; return [0.5, 1, 1.5, 2].includes(v) ? v : 1; }
function setCoinFactor(pid, body) {
  const v = [0.5, 1, 1.5, 2].includes(+body.factor) ? +body.factor : 1;
  q.kvSet.run("coinfactor:" + pid, String(v));
  return [200, { ok: true, factor: v }];
}
/* Welche Einheiten stehen im Lernpfad? Leer = Standard der App (Schule: Headlight 2, Business: gewählte Stufen) */
function pathUnitsOf(pid) { const r = q.kvGet.get("pathunits:" + pid); try { return r ? JSON.parse(r.val) : []; } catch (e) { return []; } }
function setPathUnits(pid, body) {
  const cat = snap(pid, "catalog"), known = new Set(cat ? cat.d.map(u => u.id) : []);
  const list = (Array.isArray(body.units) ? body.units : []).map(String).filter(id => /^[A-Za-z0-9_.\-]{1,30}$/.test(id) && (!known.size || known.has(id))).slice(0, 200);
  q.kvSet.run("pathunits:" + pid, JSON.stringify(list));
  return [200, { ok: true, units: list }];
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


/* Alle Wörter eines Spielers mit Stand (für die Wörterliste im Dashboard) */
function allWords(pid) {
  const w = snap(pid, "words"), t = snap(pid, "texts"), cat = snap(pid, "catalog");
  const title = {}; if (cat) for (const u of cat.d) title[u.id] = u.title;
  const out = [];
  if (w) for (const id of Object.keys(w.d)) {
    const [uid, i] = id.split("#"), r = w.d[id], tx = t && t.d[uid] && t.d[uid][+i];
    if (!(uid in title)) continue;                       // nur Schulbuch-/Klassenwörter, die der Server kennt
    out.push({ u: uid, ut: title[uid], i: +i, en: tx ? tx[0] : "", de: tx ? tx[1] : "", lv: r[0], ok: r[1], no: r[2], last: r[3], m: r[4] || 0 });
  }
  return { words: out, hasTexts: !!t };
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
    mal: { runs: sum(wk, d => d.malRuns || 0), sec: sum(wk, d => d.malSec || 0), xp: sum(wk, d => d.malXp || 0), coins: sum(wk, d => d.malCoins || 0), days: wk.filter(d => d.malRuns).length },
    active: wk.filter(d => d.sec >= 300).length, prevSec: sum(pw, d => d.sec), prevItems: sum(pw, d => d.items),
    goals: r.goals.filter(g => g.current), plans: r.plans, problems: r.problems.slice(0, 5), meta: r.meta
  };
}
function mailContent(list, link) {
  const players = list || q.players.all().filter(x => !x.hidden && x.family == null), parts = [], texts = [];
  for (const p of players) {
    const d = weeklyData(p.id), idle = !d.items && !d.sec;
    const trend = d.prevSec ? (d.sec >= d.prevSec ? "↑ " : "↓ ") + "Vorwoche " + fmtMin(d.prevSec) : "";
    const goals = d.goals.map(g => (g.done ? "✅ " : "⬜ ") + g.title + " (" + g.cur + " von " + g.target + (g.kind === "unit" ? " %" : "") + (g.coins ? ", " + g.coins + " Münzen" : "") + ")");
    const plans = d.plans.map(x => "📅 " + x.title + ": " + (x.daysLeft > 0 ? "noch " + x.daysLeft + " Tage" : x.daysLeft === 0 ? "heute" : "vorbei") + ", " + x.pct + " % sicher");
    const probs = d.problems.map(x => x.en + " (" + x.n + "×)");
    texts.push([p.name, "  Übungszeit: " + fmtMin(d.sec) + (trend ? " (" + trend + ")" : ""), "  Aktive Tage (mind. 5 Min.): " + d.active + " von 7",
      "  Aufgaben: " + d.items + ", richtig: " + pctOf(d.correct, d.items), "  Neue Wörter: " + d.neu,
      ...(d.mal.runs ? ["  Einmaleins: " + d.mal.runs + " Runde" + (d.mal.runs === 1 ? "" : "n") + " an " + d.mal.days + " Tag" + (d.mal.days === 1 ? "" : "en") + ", " + fmtMin(d.mal.sec) + " (zählt nicht zur Übungszeit)"] : []), ...(goals.length ? ["  Wochenziele:", ...goals.map(x => "    " + x)] : []), ...(plans.length ? ["  Lernplan:", ...plans.map(x => "    " + x)] : []),
      ...(probs.length ? ["  Schwierige Wörter: " + probs.join(", ")] : []), ...(idle ? ["  Diese Woche wurde noch nicht gelernt."] : [])].join("\n"));
    parts.push('<h2 style="margin:22px 0 6px;font-size:18px">' + esc(p.name) + "</h2>" +
      (idle ? '<p style="color:#8a5a00">Diese Woche wurde noch nicht gelernt.</p>' : "") +
      '<table style="border-collapse:collapse;font-size:15px"><tr><td style="padding:3px 14px 3px 0;color:#555">Übungszeit</td><td><b>' + esc(fmtMin(d.sec)) + "</b> " + esc(trend) + "</td></tr>" +
      '<tr><td style="padding:3px 14px 3px 0;color:#555">Aktive Tage</td><td><b>' + d.active + " von 7</b> (mind. 5 Min.)</td></tr>" +
      '<tr><td style="padding:3px 14px 3px 0;color:#555">Aufgaben</td><td><b>' + d.items + "</b>, richtig " + pctOf(d.correct, d.items) + "</td></tr>" +
      '<tr><td style="padding:3px 14px 3px 0;color:#555">Neue Wörter</td><td><b>' + d.neu + "</b></td></tr>" +
      (d.mal.runs ? '<tr><td style="padding:3px 14px 3px 0;color:#555">Einmaleins</td><td><b>' + d.mal.runs + " Runde" + (d.mal.runs === 1 ? "" : "n") + "</b> an " + d.mal.days + " Tag" + (d.mal.days === 1 ? "" : "en") + ", " + esc(fmtMin(d.mal.sec)) + "</td></tr>" : "") + "</table>" +
      (goals.length ? '<p style="margin:12px 0 4px"><b>Wochenziele</b></p><ul style="margin:0;padding-left:20px">' + goals.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "") +
      (plans.length ? '<p style="margin:12px 0 4px"><b>Lernplan</b></p><ul style="margin:0;padding-left:20px">' + plans.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul>" : "") +
      (probs.length ? '<p style="margin:12px 0 4px"><b>Schwierige Wörter</b></p><p style="margin:0">' + esc(probs.join(", ")) + "</p>" : ""));
  }
  const mon = mondayOf(dayOf(Date.now()));
  return {
    subject: "Wordy: Lernwoche ab " + mon.split("-").reverse().join("."),
    text: "Wordy Wochenzusammenfassung (Woche ab " + mon + ")\n\n" + (texts.join("\n\n") || "Noch keine Spieler angelegt.") + "\n\nAlle Details im Dashboard: " + (link || DASH_URL) + "\n",
    html: '<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#16222B;max-width:560px"><h1 style="font-size:20px;margin:0 0 4px">📚 Wordy · Lernwoche</h1><div style="color:#666">Woche ab ' + esc(mon.split("-").reverse().join(".")) + "</div>" + (parts.join("") || "<p>Noch keine Spieler angelegt.</p>") + '<p style="margin:26px 0 0"><a href="' + esc(link || DASH_URL) + '" style="display:inline-block;background:#1E6273;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Zum Dashboard</a></p><p style="margin:8px 0 0;color:#666;font-size:13px"><a href="' + esc(link || DASH_URL) + '" style="color:#1E6273">' + esc(link || DASH_URL) + "</a></p></div>"
  };
}
async function sendWeekly() {
  if (!mailOn()) throw new Error("Mailversand ist nicht eingerichtet (siehe README).");
  const c = mailContent();
  if (graphOn()) return sendGraph({ tenant: GRAPH.tenant, clientId: GRAPH.clientId, clientSecret: GRAPH.clientSecret, from: MAIL.from, to: mailTo(), subject: c.subject, html: c.html });
  await sendMail({ host: MAIL.host, port: MAIL.port, secure: MAIL.secure, user: MAIL.user, pass: MAIL.pass, from: MAIL.from, to: mailTo(), subject: c.subject, text: c.text, html: c.html });
}
const localNow = () => {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  return { wd: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(f.find(x => x.type === "weekday").value), h: +f.find(x => x.type === "hour").value, m: +f.find(x => x.type === "minute").value };
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
function famTick() {
  if (!transportOn()) return;
  const { wd, h } = localNow();
  if (wd !== MAIL.day || h < MAIL.hour) return;
  famWeekly().catch(e => console.error("Familien-Wochenmail:", e.message));
}
setInterval(mailTick, 60000).unref();
setInterval(famTick, 60000).unref();


/* ---------- Vollständige Sicherung des Lernstands ---------- */
function apiStatePut(pid, body) {
  const st = body && body.state;
  if (!st || st.v !== 2 || typeof st.w !== "object" || !st.w || typeof st.settings !== "object") return [400, { error: "Kein gültiger Lernstand." }];
  const words = Object.keys(st.w).length, last = q.latestState.get(pid);
  // Ein leerer Stand (neues Gerät, gelöschte Daten) darf eine vorhandene Sicherung nie ersetzen
  if (words === 0 && last && last.words > 0) return [409, { error: "Auf dem Server liegt ein Lernstand mit Fortschritt. Bitte zuerst wiederherstellen." }];
  const d = JSON.stringify(st), now = Date.now();
  q.putState.run(pid, dayOf(now), now, Buffer.byteLength(d), Math.round(+st.coins || 0), words, d);
  q.pruneStates.run(pid, pid, KEEP_STATES);
  return [200, { ok: true, ts: now }];
}
const stateMeta = r => ({ day: r.day, ts: r.ts, bytes: r.bytes, coins: r.coins, words: r.words });
function apiStateGet(pid, day) {
  const r = day ? q.stateDay.get(pid, day) : q.latestState.get(pid);
  if (!r) return [404, { error: "Keine Sicherung vorhanden." }];
  return [200, Object.assign(stateMeta(r), { state: JSON.parse(r.d) })];
}

function adminPlayers(hidden, scope) {
  return q.players.all().filter(p => !!p.hidden === !!hidden && famPlayer(p, scope)).map(p => {
    const c = q.evCount.get(p.id), m = snap(p.id, "meta"), devs = q.devices.all(p.id);
    const today = dayOf(Date.now());
    let todaySec = 0, todayItems = 0;
    for (const r of q.events.all(p.id, Date.now() - 36 * 3600000)) {
      if (dayOf(r.ts) !== today) continue;
      const d = JSON.parse(r.d);
      if (r.k === "ss") todaySec += d.sec || 0; else if (r.k === "a" || r.k === "s") todayItems++;
    }
    const lastSt = q.latestState.get(p.id);
    return { id: p.id, name: p.name, created: p.created, hidden: !!p.hidden, backup: lastSt ? { day: lastSt.day, ts: lastSt.ts, words: lastSt.words, coins: lastSt.coins } : null, events: c.n, lastEvent: c.last, meta: m ? m.d : null,
      devices: devs.map(d => ({ id: d.hash.slice(0, 8), device: d.device, created: d.created, lastSeen: d.last_seen })),
      today: { sec: todaySec, items: todayItems } };
  });
}
function nameTaken(name, scope, exceptId) {
  const rows = scope ? fq.kids.all(scope.fid) : db.prepare("SELECT id, name FROM players WHERE family IS NULL").all();
  return rows.some(r => r.id !== exceptId && String(r.name).trim().toLowerCase() === String(name).trim().toLowerCase());
}
function newInvite(pid) {
  const code = newCode();
  q.addInvite.run(code, pid, Date.now());
  return { code, validDays: INVITE_DAYS, link: APP_URL + "/#verbinden=" + encodeURIComponent(DASH_URL + "#" + code) };
}



/* ---------- Tägliche Erinnerung (Web Push) ----------
   Das Gerät meldet sich mit seinem Push-Abo an (Bearer), die Eltern stellen Uhrzeit und An/Aus im Dashboard ein.
   Jeden Tag zur Uhrzeit (Europe/Berlin) kommt ein persönlicher Spruch, außer das Tagesziel ist schon geschafft. */
db.exec(`CREATE TABLE IF NOT EXISTS push_subs (id INTEGER PRIMARY KEY, player INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE, endpoint TEXT NOT NULL UNIQUE, p256dh TEXT NOT NULL, auth TEXT NOT NULL, created INTEGER NOT NULL, ua TEXT NOT NULL DEFAULT '')`);
const pq = {
  add: db.prepare("INSERT OR REPLACE INTO push_subs(player, endpoint, p256dh, auth, created, ua) VALUES (?, ?, ?, ?, ?, ?)"),
  of: db.prepare("SELECT * FROM push_subs WHERE player = ?"),
  del: db.prepare("DELETE FROM push_subs WHERE endpoint = ?"),
  delId: db.prepare("DELETE FROM push_subs WHERE id = ?"),
  players: db.prepare("SELECT DISTINCT player FROM push_subs")
};
const VAPID = (() => {
  const r = q.kvGet.get("vapid"); try { const v = r ? JSON.parse(r.val) : null; if (v && v.publicKey && v.privateKey) return v; } catch (e) {}
  const v = webpush.generateVapid(); q.kvSet.run("vapid", JSON.stringify(v)); return v;
})();
const PUSH_SUBJECT = process.env.PUSH_SUBJECT || DASH_URL || "mailto:admin@example.org";
const PUSH_HTTP = process.env.PUSH_ALLOW_HTTP === "1";   // nur für Tests
/* Erinnerung: im Fenster von `time` bis `until` (Europe/Berlin) alle `every` Stunden (0 = nur einmal am Tag zur Startzeit), solange das Tagesziel offen ist */
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const pushState = pid => {
  const r = q.kvGet.get("push:" + pid); let v = {}; try { v = r ? JSON.parse(r.val) : {}; } catch (e) {}
  const time = TIME_RE.test(v.time || "") ? v.time : "15:00", ev = Number.isInteger(v.every) && v.every >= 0 && v.every <= 12 ? v.every : 2;
  const until = TIME_RE.test(v.until || "") && v.until > time ? v.until : (time < "20:00" ? "20:00" : "23:30");
  return { on: v.on !== false, time, until, every: ev, last: v.last || "", lastTs: +v.lastTs || 0 };
};
const pushSave = (pid, st) => q.kvSet.run("push:" + pid, JSON.stringify(st));
const PUSH_LINES = [
  "Digga {name}, 5 Minuten Wordy und dein Tag ist safe. Kein Cap. 😎",
  "{name}, deine Aura sagt: heute wird gelernt. Lass sie nicht lügen. ✨",
  "Lowkey wartet Wordy auf dich, {name}. Highkey sollte man das heute noch machen. 😏",
  "Nicht cringe, sondern smart: eine Runde Vokabeln, {name}. Kommst du? 🧠",
  "{name}, du bist doch kein NPC. Hol dir dein Tagesziel und level up! 🎮",
  "Slay den Tag, {name}! Erst Wordy, dann Chillen. 💅",
  "Alter, {name}, die Münzen zocken sich nicht von allein. Rein in die Runde! 🪙",
  "Das ist doch wild, {name}: Dein Tagesziel ist noch offen. Dabei schaffst du das locker! 🔥",
  "Sus, {name}: Wer hat das Tagesziel noch nicht geholt? Genau, du. Aber nur noch kurz. 🕵️",
  "Bro {name}, Englisch geht heute zack-zack. Eine Runde, dann Feierabend. 🚀",
  "{name}, Wordy droppt dein Tagesziel. Du musst nur noch claimen. 🎁",
  "Kein Bock? Versteh ich, {name}. Aber 5 Minuten gehen immer. Los, du Legende! 🏅",
  "{name}, du hast Rizz, jetzt brauchst du nur noch Vokabeln. 😎",
  "Absolut nicht mid, {name}: eine Runde Wordy am Nachmittag. Das ist ein Move! 💯",
  "Jo {name}, Tagesziel offen. Das ist ein Skill-Issue, das wir heute fixen. 🛠️",
  "Bruh, {name}, die Wörter lernen sich nicht selbst. Aber du bist ja schnell! ⚡",
  "Flex des Tages, {name}: Tagesziel geknackt, bevor es dunkel wird. 💪",
  "Gönn dir, {name}! Eine Runde Wordy, dann bist du der Boss im Englischunterricht. 😤",
  "{name}, die Münzen sind am Start. Du bist am Zug. Let's go! 🪙",
  "Alter Schwede, {name}, schon so spät? Schnell noch das Tagesziel einsacken! ⏰",
  "Heute kein Drama, {name}. Nur Wörter, Münzen und gute Vibes. ✌️",
  "{name}, Glow-up für den Wortschatz: Eine Runde Wordy, und du strahlst. ✨",
  "Hammer-Idee, {name}: Erst Wordy, dann Zocken ohne schlechtes Gewissen. 🎮",
  "Main Character Move, {name}: Tagesziel holen, bevor die anderen aufwachen. 🌟",
  "Ehrenmann-Alarm, {name}: Wer jetzt übt, hat später Ruhe. Bist du dabei? 🤝"
];
const PUSH_STREAK = [
  "{streak} Tage Serie, {name}. Das wäre ja gelacht, wenn heute Schluss wäre. 🔥",
  "Dein Streak steht bei {streak}, {name}. Heute wird er {next}! 💪",
  "{streak} Tage Streak, {name}. Das ist schon richtig Sigma. Heute wird's {next}! 😎",
  "Deine Serie lebt, {name}: {streak} Tage! Lass sie heute nicht ghosten. 🔥"
];
function pushMessage(pid, name, streak, seed) {
  const nm = clean(name, 24) || "du", i = Math.abs(seed == null ? Date.now() / 86400000 | 0 : seed) + pid;
  const useStreak = streak >= 2 && i % 3 === 0, pool = useStreak ? PUSH_STREAK : PUSH_LINES;
  const body = pool[i % pool.length].replace(/\{name\}/g, nm).replace(/\{streak\}/g, streak).replace(/\{next\}/g, streak + 1);
  return { title: "Wordy", body, url: "./", tag: "wordy-daily" };
}
async function pushSendTo(pid, message) {
  let sent = 0;
  for (const sub of pq.of.all(pid)) {
    try {
      const r = await webpush.send(VAPID, PUSH_SUBJECT, { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, message);
      if (r.gone) pq.delId.run(sub.id); else if (r.ok) sent++; else console.error("Push:", r.status);
    } catch (e) { console.error("Push-Fehler:", e.message); }
  }
  return sent;
}
/* Duell-Hinweis sofort an das Gerät des Freundes (nur wenn Erinnerungen an sind); kind lässt die geöffnete App den Posteingang neu laden */
function duelPush(pid, body, kind) {
  try { if (!pushState(pid).on || !pq.of.all(pid).length) return; pushSendTo(pid, { title: "Wordy", body, url: "./", tag: "wordy-" + kind, kind }).catch(() => {}); } catch (e) {}
}
function pushTodayInfo(pid) {
  const m = snap(pid, "meta"), today = dayOf(Date.now()); let sec = 0;
  for (const r of q.events.all(pid, Date.now() - 36 * 3600000)) { if (r.k !== "ss" || dayOf(r.ts) !== today) continue; try { sec += JSON.parse(r.d).sec || 0; } catch (e) {} }
  return { sec, goal: ((m && m.d && m.d.goalMin) || 10) * 60, streak: (m && m.d && m.d.streak) || 0 };
}
let pushBusy = false;
async function pushTick() {
  if (pushBusy) return; pushBusy = true;
  try {
    const ln = localNow(), hhmm = String(ln.h).padStart(2, "0") + ":" + String(ln.m).padStart(2, "0"), day = dayOf(Date.now()), now = Date.now();
    for (const { player: pid } of pq.players.all()) {
      const st = pushState(pid); if (!st.on || hhmm < st.time) continue;
      const pl = q.player.get(pid); if (!pl) continue;
      if (st.every > 0) {   // alle N Stunden im Zeitfenster
        if (hhmm > st.until || now - st.lastTs < st.every * 3600000 - 30000) continue;
        st.lastTs = now; st.last = day; pushSave(pid, st);
        const t = pushTodayInfo(pid); if (t.sec >= t.goal) continue;   // Tagesziel schon geschafft
        await pushSendTo(pid, pushMessage(pid, pl.name, t.streak, Math.floor(now / 3600000)));
        continue;
      }
      if (st.last === day) continue;   // einmal am Tag
      const late = (ln.h * 60 + ln.m) - (+st.time.slice(0, 2) * 60 + +st.time.slice(3));
      st.last = day; st.lastTs = now; pushSave(pid, st);
      if (late > 120) continue;   // Server war lange weg: nicht mehr nachträglich nerven
      const t = pushTodayInfo(pid); if (t.sec >= t.goal) continue;
      await pushSendTo(pid, pushMessage(pid, pl.name, t.streak));
    }
  } catch (e) { console.error("Push-Tick:", e.message); } finally { pushBusy = false; }
}
setInterval(() => pushTick(), 60000).unref();
function pushView(pid) { const st = pushState(pid); return { on: st.on, time: st.time, until: st.until, every: st.every, devices: pq.of.all(pid).length, lastSent: st.last || null, lastAt: st.lastTs || null, key: VAPID.publicKey }; }
const SUB_OK = sub => {
  try {
    const u = new URL(sub.endpoint); if (!(u.protocol === "https:" || (PUSH_HTTP && u.protocol === "http:")) || String(sub.endpoint).length > 600) return false;
    return webpush.unb64u(sub.keys.p256dh).length === 65 && webpush.unb64u(sub.keys.auth).length >= 16;
  } catch (e) { return false; }
};

/* ---------- Elternkonten ---------- */
const transportOn = () => !!((GRAPH.tenant && GRAPH.clientId && GRAPH.clientSecret && MAIL.from) || (MAIL.host && MAIL.from));
/* Kinder melden ihr Gerät selbst an: Das Gerät fordert einen kurzen Code an, Eltern/Betreiber geben ihn im Dashboard für ein Kind frei, danach holt sich das Gerät sein Token ab. */
db.exec(`CREATE TABLE IF NOT EXISTS pair_requests (id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, secret TEXT NOT NULL, created INTEGER NOT NULL, device TEXT NOT NULL DEFAULT '', hint TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending', player INTEGER, token TEXT NOT NULL DEFAULT '')`);
const PAIR_MIN = 15;
const prq = {
  add: db.prepare("INSERT INTO pair_requests(id, code, secret, created, device, hint) VALUES (?,?,?,?,?,?)"),
  byId: db.prepare("SELECT * FROM pair_requests WHERE id = ?"),
  byCode: db.prepare("SELECT * FROM pair_requests WHERE code = ?"),
  approve: db.prepare("UPDATE pair_requests SET status = 'approved', player = ?, token = ? WHERE id = ?"),
  setStatus: db.prepare("UPDATE pair_requests SET status = ?, token = '' WHERE id = ?"),
  purge: db.prepare("DELETE FROM pair_requests WHERE created < ?"),
  pending: db.prepare("SELECT COUNT(*) AS n FROM pair_requests WHERE status = 'pending'")
};
function pairCode() { let s = ""; const b = crypto.randomBytes(6); for (let i = 0; i < 6; i++) s += ALPHABET[b[i] % ALPHABET.length]; return s.slice(0, 3) + "-" + s.slice(3); }
function pairNormCode(c) { const x = String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); return x.length === 6 ? x.slice(0, 3) + "-" + x.slice(3) : ""; }
const pairLive = r => r && Date.now() - r.created < PAIR_MIN * 60000;
function pairRequest(body, ip) {
  if (limited(ip, "prq", 10, 600000)) return [429, { error: "Zu viele Versuche. Bitte später noch einmal." }];
  prq.purge.run(Date.now() - 3600000);
  if (prq.pending.get().n > 500) return [503, { error: "Gerade zu viele offene Anfragen. Bitte später noch einmal." }];
  let code = pairCode(); for (let i = 0; i < 5 && prq.byCode.get(code); i++) code = pairCode();
  const id = rand(16), secret = rand(24);
  prq.add.run(id, code, sha(secret), Date.now(), clean(body.device, 80), clean(body.name, 20));
  return [200, { id, secret, code, expires: Date.now() + PAIR_MIN * 60000 }];
}
function pairPoll(id, secret, ip) {
  if (limited(ip, "ppoll", 400, 600000)) return [429, { error: "Zu viele Anfragen." }];
  const r = /^[0-9a-f]{32}$/.test(id) ? prq.byId.get(id) : null;
  if (!r || !eq(r.secret, sha(String(secret || "")))) return [404, { error: "Unbekannt." }];
  if (r.status === "approved" && r.token) { const t = r.token, pl = q.player.get(r.player); prq.setStatus.run("done", r.id); return [200, { status: "approved", token: t, name: pl ? pl.name : "", hidden: !!(pl && pl.hidden) }]; }
  if (r.status === "pending" && !pairLive(r)) return [200, { status: "expired" }];
  return [200, { status: r.status === "done" ? "expired" : r.status }];
}
function pairLookup(code, scope, ip) {
  if (limited(ip + (scope ? ":" + scope.fid : ":op"), "plook", 30, 600000)) return [429, { error: "Zu viele Versuche. Bitte später noch einmal." }];
  const r = prq.byCode.get(pairNormCode(code));
  if (!r || r.status !== "pending" || !pairLive(r)) return [404, { error: "Dieser Code stimmt nicht oder ist abgelaufen. Das Kind kann in der App einen neuen anfordern." }];
  return [200, { code: r.code, device: r.device, hint: r.hint, created: r.created }];
}
function pairApprove(code, body, scope, ip) {
  const [c, info] = pairLookup(code, scope, ip); if (c !== 200) return [c, info];
  const r = prq.byCode.get(info.code); let pid;
  if (body.player) {
    const pl = q.player.get(+body.player); if (!famPlayer(pl, scope)) return [404, { error: "Unbekannt." }]; pid = pl.id;
  } else {
    const name = clean(body.newName, 20); if (!name) return [400, { error: "Bitte wähle ein Kind oder gib einen Vornamen ein." }];
    if (scope && scope.role === "teacher") return [403, { error: "Lehrkraft-Konten haben keine Kinder." }];
    if (nameTaken(name, scope, 0)) return [400, { error: "Es gibt schon einen Spieler mit diesem Namen." }];
    if (scope && fq.kids.all(scope.fid).length >= MAX_KIDS) return [400, { error: "Es sind höchstens " + MAX_KIDS + " Kinder pro Konto möglich." }];
    pid = scope ? +fq.addKid.run(name, Date.now(), scope.fid).lastInsertRowid : +q.addPlayer.run(name, Date.now(), 0).lastInsertRowid;
    if (!scope) { sq.setSocial.run(1, pid); fcodeOf(pid); }
  }
  const token = rand(32); q.addToken.run(sha(token), pid, clean(r.device, 80), Date.now(), Date.now());
  prq.approve.run(pid, token, r.id);
  return [200, { ok: true, player: pid, name: q.player.get(pid).name }];
}

/* ---------- Feedback: Rückmeldungen von Eltern und Lehrkräften (App und Dashboard), eine Datenbank, Tagesmail an den Betreiber ---------- */
db.exec(`CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY, created INTEGER NOT NULL, player INTEGER, family INTEGER, role TEXT NOT NULL DEFAULT 'operator',
  kind TEXT NOT NULL, text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'neu', note TEXT NOT NULL DEFAULT '', reply TEXT NOT NULL DEFAULT '', reply_ts INTEGER,
  source TEXT NOT NULL DEFAULT 'dashboard', ver TEXT NOT NULL DEFAULT '', device TEXT NOT NULL DEFAULT '', mailed INTEGER NOT NULL DEFAULT 0)`);
const FB_KINDS = { idea: "Idee", bug: "Fehler", praise: "Lob", question: "Frage" }, FB_STATUS = ["neu", "in_arbeit", "erledigt"];
const fbq = {
  add: db.prepare("INSERT INTO feedback(created, player, family, role, kind, text, source, ver, device) VALUES (?,?,?,?,?,?,?,?,?)"),
  byId: db.prepare("SELECT * FROM feedback WHERE id = ?"),
  ofFamily: db.prepare("SELECT * FROM feedback WHERE family = ? ORDER BY created DESC LIMIT 100"),
  ofPlayer: db.prepare("SELECT * FROM feedback WHERE player = ? ORDER BY created DESC LIMIT 100"),   // das Gerät sieht nur, was von diesem Gerät kam (nicht, was die Eltern im Dashboard geschrieben haben)
  all: db.prepare("SELECT f.*, fam.email AS fam_email, p.name AS pname FROM feedback f LEFT JOIN families fam ON fam.id = f.family LEFT JOIN players p ON p.id = f.player ORDER BY f.created DESC LIMIT 500"),
  upd: db.prepare("UPDATE feedback SET status = ?, note = ?, reply = ?, reply_ts = ? WHERE id = ?"),
  del: db.prepare("DELETE FROM feedback WHERE id = ?"),
  unmailed: db.prepare("SELECT f.*, fam.email AS fam_email, p.name AS pname FROM feedback f LEFT JOIN families fam ON fam.id = f.family LEFT JOIN players p ON p.id = f.player WHERE f.mailed = 0 ORDER BY f.created"),
  markMailed: db.prepare("UPDATE feedback SET mailed = 1 WHERE mailed = 0 AND id <= ?"),
  open: db.prepare("SELECT COUNT(*) AS n FROM feedback WHERE status = 'neu'")
};
function fbAdd(o) {
  const kind = FB_KINDS[o.kind] ? o.kind : "idea", text = clean(o.text, 2000);
  if (!text || text.length < 3) return [400, { error: "Bitte ein paar Worte schreiben." }];
  const id = +fbq.add.run(Date.now(), o.player || null, o.family || null, o.role || "operator", kind, text, o.source || "dashboard", clean(o.ver, 20), clean(o.device, 80)).lastInsertRowid;
  return [200, { ok: true, id }];
}
const fbOwn = r => ({ id: r.id, created: r.created, kind: r.kind, text: r.text, status: r.status, reply: r.reply, replyTs: r.reply_ts });
const fbAdminRow = r => Object.assign(fbOwn(r), { role: r.role, source: r.source, ver: r.ver, device: r.device, note: r.note, who: r.fam_email || r.pname || "Betreiber", player: r.pname || "", mailed: !!r.mailed });
const fbHour = () => { const r = q.kvGet.get("fb_hour"); const h = r ? +r.val : 18; return Number.isInteger(h) && h >= 0 && h <= 23 ? h : 18; };
let fbTries = { key: "", n: 0 };
async function fbTick(force) {
  if (!transportOn() || !mailTo()) { if (force) throw new Error("Mailversand oder Empfänger-Adresse ist nicht eingerichtet."); return; }
  const { h } = localNow(), key = dayOf(Date.now()), sent = q.kvGet.get("fb_sent");
  if (!force && (h < fbHour() || (sent && sent.val === key))) return;
  const rows = fbq.unmailed.all(); if (!rows.length) return;
  if (!force) { if (fbTries.key !== key) fbTries = { key, n: 0 }; if (fbTries.n >= 3) return; fbTries.n++; }
  const rowHtml = r => '<div style="margin:0 0 14px;padding:10px 12px;border-left:4px solid #1E6273;background:#F7F9FC"><div style="font-size:13px;color:#555"><b>' + esc(FB_KINDS[r.kind]) + "</b> · " + esc(r.fam_email || r.pname || "Betreiber") + (r.pname && r.fam_email ? " (" + esc(r.pname) + ")" : "") + " · " + esc(r.source) + (r.ver ? " " + esc(r.ver) : "") + " · " + new Date(r.created).toLocaleString("de-DE", { timeZone: TZ }) + '</div><div style="margin-top:6px;white-space:pre-wrap">' + esc(r.text) + "</div></div>";
  const html = '<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#16222B;max-width:600px"><h1 style="font-size:20px;margin:0 0 12px">💬 Wordy · ' + rows.length + (rows.length === 1 ? " neue Rückmeldung" : " neue Rückmeldungen") + "</h1>" + rows.map(rowHtml).join("") + '<p><a href="' + DASH_URL + '" style="display:inline-block;background:#1E6273;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Im Dashboard bearbeiten</a></p></div>';
  const text = rows.map(r => "[" + FB_KINDS[r.kind] + "] " + (r.fam_email || r.pname || "Betreiber") + " (" + r.source + "): " + r.text).join("\n\n") + "\n\nBearbeiten: " + DASH_URL + "\n";
  try { await deliver({ to: mailTo(), subject: "Wordy: " + rows.length + (rows.length === 1 ? " neue Rückmeldung" : " neue Rückmeldungen"), html, text }); fbq.markMailed.run(rows[rows.length - 1].id); q.kvSet.run("fb_sent", key); console.log("Feedback-Mail gesendet (" + rows.length + ")"); }
  catch (e) { console.error("Feedback-Mail fehlgeschlagen:", e.message); if (force) throw e; }
}
setInterval(() => fbTick().catch(() => {}), 60000).unref();

async function deliver(o) {   // eine Mail an eine Adresse, über Graph oder SMTP
  if (!transportOn()) throw new Error("Mailversand ist nicht eingerichtet (siehe README).");
  if (GRAPH.tenant && GRAPH.clientId && GRAPH.clientSecret && MAIL.from) return sendGraph({ tenant: GRAPH.tenant, clientId: GRAPH.clientId, clientSecret: GRAPH.clientSecret, from: MAIL.from, to: o.to, subject: o.subject, html: o.html });
  return sendMail({ host: MAIL.host, port: MAIL.port, secure: MAIL.secure, user: MAIL.user, pass: MAIL.pass, from: MAIL.from, to: o.to, subject: o.subject, text: o.text, html: o.html });
}
const EMAIL_RE = /^[^\s@<>",;]{1,64}@[^\s@<>",;]{1,200}\.[A-Za-z]{2,}$/;
const normEmail = s => clean(s, 120).toLowerCase();
function mailShell(title, body) {
  return '<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#16222B;max-width:520px"><h1 style="font-size:20px;margin:0 0 10px">' + esc(title) + "</h1>" + body + '<p style="color:#888;font-size:12px;margin-top:24px">Wordy · Lernfortschritt für Eltern</p></div>';
}
async function sendLoginLink(fam) {
  const t = rand(32);
  fq.addLink.run(sha(t), fam.id, Date.now());
  fq.prune.run(Date.now() - 86400000);
  const url = DASH_URL + "/f/login?t=" + t;
  await deliver({
    to: fam.email, subject: "Dein Wordy-Anmeldelink",
    text: "Hallo!\n\nMit diesem Link meldest du dich im Wordy-Elternbereich an (gültig " + LINK_MIN + " Minuten, nur einmal nutzbar):\n\n" + url + "\n\nHast du das nicht angefordert, kannst du diese Mail ignorieren.\n",
    html: mailShell("Dein Anmeldelink", '<p>Mit diesem Link meldest du dich im Wordy-Elternbereich an. Er gilt ' + LINK_MIN + ' Minuten und funktioniert nur einmal.</p><p><a href="' + esc(url) + '" style="display:inline-block;background:#1E6273;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Jetzt anmelden</a></p><p style="color:#666;font-size:13px">Oder diesen Link kopieren:<br>' + esc(url) + "</p><p style=\"color:#666;font-size:13px\">Hast du das nicht angefordert, kannst du diese Mail ignorieren.</p>")
  });
}
function cookieOf(req, name) {
  for (const part of String(req.headers.cookie || "").split(";")) { const i = part.indexOf("="); if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim(); }
  return "";
}
/* Passwort für Eltern und Lehrkräfte (optional neben dem Anmeldelink): scrypt, Mindestlänge 10, Sperre nach Fehlversuchen */
const PW_BAD = ["passwort123", "password123", "1234567890", "0123456789", "qwertzuiop", "passwort12", "wordy12345", "1q2w3e4r5t"];
function pwHash(pw) { const salt = crypto.randomBytes(16); return "s1$" + salt.toString("hex") + "$" + crypto.scryptSync(pw, salt, 64, { N: 16384, r: 8, p: 1 }).toString("hex"); }
function pwCheck(pw, stored) {
  try { const [v, s, h] = String(stored).split("$"); if (v !== "s1") return false; return crypto.timingSafeEqual(crypto.scryptSync(pw, Buffer.from(s, "hex"), 64, { N: 16384, r: 8, p: 1 }), Buffer.from(h, "hex")); } catch (e) { return false; }
}
const PW_DUMMY = pwHash("dummy-gegen-zeitmessung");
function pwProblem(pw, email) {
  if (typeof pw !== "string" || pw.length < 10) return "Das Passwort braucht mindestens 10 Zeichen.";
  if (pw.length > 200) return "Das Passwort ist zu lang.";
  if (PW_BAD.includes(pw.toLowerCase()) || pw.toLowerCase() === String(email).toLowerCase() || /^(.)\1+$/.test(pw)) return "Dieses Passwort ist zu einfach. Bitte wähle ein anderes (z. B. drei Wörter hintereinander).";
  return "";
}
const pwFails = new Map();   // E-Mail → { n, until }
const pwLocked = email => { const x = pwFails.get(email); return !!(x && x.until > Date.now()); };
function pwFail(email) { const x = pwFails.get(email) || { n: 0, until: 0 }; if (x.until && x.until <= Date.now()) { x.n = 0; x.until = 0; } x.n++; if (x.n >= 6) { x.until = Date.now() + 15 * 60000; x.n = 0; } pwFails.set(email, x); }
function famAuth(req) {   // Familie aus dem Sitzungs-Cookie, nur aktive Konten
  const t = cookieOf(req, "wf"); if (!/^[0-9a-f]{64}$/.test(t)) return null;
  const h = sha(t), s = fq.sess.get(h); if (!s) return null;
  if (Date.now() - s.created > SESSION_DAYS * 86400000) { fq.delSess.run(h); return null; }
  const f = fq.byId.get(s.family); if (!f || f.status !== "active") return null;
  if (Date.now() - s.last_seen > 3600000) fq.touchSess.run(Date.now(), h);
  return Object.assign({}, f, { sessCreated: s.created, fid: f.owner || f.id });   // fid = Familie, deren Kinder zu sehen sind (zweiter Elternzugang = Kinder des Hauptkontos)
}
const cookieHdr = (v, maxAge) => "wf=" + v + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + maxAge + (DASH_URL.startsWith("https") ? "; Secure" : "");
/* Datenschutzerklärung: Angaben des Betreibers kommen aus .env (PRIVACY_*), fehlende werden gelb markiert */
const PRIVACY = { name: process.env.PRIVACY_NAME || "", addr: process.env.PRIVACY_ADDRESS || "", email: process.env.PRIVACY_EMAIL || "", host: process.env.PRIVACY_HOSTER || "", hostort: process.env.PRIVACY_HOSTORT || "", mail: process.env.PRIVACY_MAIL_PROVIDER || "", auth: process.env.PRIVACY_AUTHORITY || "", log: process.env.PRIVACY_LOG_DAYS || "" };
const PRIVACY_STAND = "12. Oktober 2026";
function privacyPage() {
  const miss = [], v = (x, label) => x ? esc(x) : (miss.push(label), "<mark>[" + esc(label) + " eintragen]</mark>");
  const map = { VERANTWORTLICHER: v(PRIVACY.name, "Name des Verantwortlichen"), ADRESSE: v(PRIVACY.addr, "Anschrift"), EMAIL: v(PRIVACY.email, "E-Mail-Adresse"), HOSTER: v(PRIVACY.host, "Hosting-Anbieter"), HOSTORT: v(PRIVACY.hostort, "Standort des Servers"),
    MAILANBIETER: v(PRIVACY.mail, "Mail-Anbieter"), BEHOERDE: v(PRIVACY.auth, "zuständige Aufsichtsbehörde"), LOGDAUER: v(PRIVACY.log ? PRIVACY.log + " Tage" : "", "Dauer der Server-Logs"), STAND: esc(PRIVACY_STAND) };
  map.HINWEIS = miss.length ? '<p class="box"><b>Entwurf, bitte vervollständigen.</b> Auf dem Server fehlen noch Angaben des Betreibers (gelb markiert): ' + miss.map(esc).join(", ") + '. Sie werden in der Datei <code>.env</code> über die Variablen <code>PRIVACY_*</code> gesetzt (siehe README). Der Text wurde nach Art. 13 DSGVO verfasst, ersetzt aber keine Rechtsberatung. Bitte vor dem Einladen fremder Familien rechtlich prüfen lassen.</p>' : "";
  return fs.readFileSync(path.join(PUBLIC, "datenschutz.html"), "utf8").replace(/\{\{([A-Z]+)\}\}/g, (m, k) => map[k] != null ? map[k] : m);
}
const famPlayer = (pl, scope) => !!pl && (scope ? pl.family === scope.fid : pl.family == null);   // Besitzprüfung: Familie nur eigene Kinder, Betreiber nur eigene Spieler
function famExport(f) {
  return { exportedAt: new Date().toISOString(), email: f.email, created: f.created, consent: { ts: f.consent_ts, version: f.consent_ver }, children: fq.kids.all(f.owner || f.id).map(p => ({
    id: p.id, name: p.name, created: p.created, goals: q.goals.all(p.id, "0000-00-00"), plans: q.plans.all(p.id, "0000-00-00"), latestState: (q.latestState.get(p.id) || {}).d ? JSON.parse(q.latestState.get(p.id).d) : null, events: q.events.all(p.id, 0).map(e => ({ ts: e.ts, k: e.k, d: JSON.parse(e.d) })) })) };
}
async function famWeekly() {
  if (!transportOn()) return;
  const key = mondayOf(dayOf(Date.now()));
  for (const f of fq.all.all()) {
    if (f.status !== "active" || !f.weekly || !f.children) continue;
    const sk = "fmail_sent:" + f.id, sent = q.kvGet.get(sk);
    if (sent && sent.val === key) continue;
    const tries = "fmail_try:" + f.id + ":" + key, n = q.kvGet.get(tries);
    if (n && +n.val >= 3) continue;
    q.kvSet.run(tries, String((n ? +n.val : 0) + 1));
    try { const c = mailContent(fq.kids.all(f.owner || f.id).filter(x => !x.hidden), DASH_URL + "/f/"); await deliver({ to: f.email, subject: c.subject, html: c.html, text: c.text }); q.kvSet.run(sk, key); }
    catch (e) { console.error("Familien-Wochenmail fehlgeschlagen:", e.message); }
  }
}


/* ---------- Freunde, Duelle, Ranglisten ---------- */
const SOCIAL_MAX = { match: 3000, blitz: 5000, survival: 200, detective: 1500, eisi: 1500, kreuz: 1500, letters: 1200, blast: 30000, blast3d: 30000 };   // Duelle: Arena-Modi und Wortspiele
const REACTS = ["👏", "😮", "🔥", "😅", "💪", "🤝"];
const AVATAR_RE = /^[A-Za-z0-9:_\-←-⯿\u{1F000}-\u{1FFFF}️‍]{1,40}$/u;
const pairOf = (a, b) => a < b ? [a, b] : [b, a];
function fcodeOf(pid) {
  let r = sq.me.get(pid); if (r.fcode) return r.fcode;
  for (let i = 0; i < 20; i++) { const c = "F" + newCode().replace("-", "").slice(0, 5); if (!sq.byCode.get(c)) { sq.setCode.run(c, pid); return c; } }
  throw new Error("Kein Freundescode");
}
const frState = (f, me) => (f.lo_ok && f.hi_ok) ? "ok" : ((me === f.lo ? f.lo_ok : f.hi_ok) ? "theirs" : "mine");   // ok | mine = meine Eltern müssen noch zustimmen | theirs = die Eltern des Freundes
/* Rang-Fortschritt der Freunde: nur bei bestätigten Freunden, aus dem letzten Lernstand-Abgleich (meta); die App rechnet daraus Rang und Balken */
function frXp(id, state) { if (state !== "ok") return null; const m = snap(id, "meta"), x = m && m.d && Number(m.d.xp); return Number.isFinite(x) && x >= 0 ? Math.round(x) : null; }
/* Gewählte Figur und Rahmen aus dem letzten Lernstand-Abgleich (nur bestätigte Freunde, geprüfte Werte) */
function frLook(id, state) {
  if (state !== "ok") return { avatar: "", frame: "none", acc: {}, stk: [], stkAcc: {} };
  const m = snap(id, "meta"), d = (m && m.d) || {}, av = typeof d.avatar === "string" && AVATAR_RE.test(d.avatar) ? d.avatar : "", fr = typeof d.frame === "string" && /^[a-z0-9_-]{1,20}$/.test(d.frame) ? d.frame : "none";
  const acc = {};   // Zubehör der gewählten Figur: nur bekannte Plätze, geprüfte Werte
  if (d.acc && typeof d.acc === "object") for (const k of ["head", "face", "ears", "neck"]) if (typeof d.acc[k] === "string" && /^[a-z0-9]{1,12}$/.test(d.acc[k])) acc[k] = d.acc[k];
  const stk = Array.isArray(d.stk) ? d.stk.filter(x => typeof x === "string" && /^st:[a-z0-9_-]{1,30}$/i.test(x)).slice(0, 10) : [];   // aufgeklebte Sticker (IDs)
  const stkAcc = {};   // Zubehör je Sticker-Figur (Sticker-ID → Plätze)
  if (d.stkAcc && typeof d.stkAcc === "object") for (const [fv, a] of Object.entries(d.stkAcc).slice(0, 10)) {
    if (!AVATAR_RE.test(fv) || !a || typeof a !== "object") continue;
    const o = {}; for (const k of ["head", "face", "ears", "neck"]) if (typeof a[k] === "string" && /^[a-z0-9]{1,12}$/.test(a[k])) o[k] = a[k];
    if (Object.keys(o).length) stkAcc[fv] = o;
  }
  return { avatar: av, frame: fr, acc, stk, stkAcc };
}
function frTitle(id, state) { if (state !== "ok") return ""; const m = snap(id, "meta"), t = m && m.d && typeof m.d.title === "string" ? m.d.title : ""; return t.replace(/[<>]/g, "").trim().slice(0, 30); }
function friendsOf(pid) {
  return sq.frOf.all(pid, pid).map(f => { const o = sq.me.get(f.lo === pid ? f.hi : f.lo); return o ? { id: o.id, name: o.name, avatar: frLook(o.id, frState(f, pid)).avatar || o.avatar || "", frame: frLook(o.id, frState(f, pid)).frame, acc: frLook(o.id, frState(f, pid)).acc, stk: frLook(o.id, frState(f, pid)).stk, stkAcc: frLook(o.id, frState(f, pid)).stkAcc, state: frState(f, pid), social: !!o.social, since: f.created, xp: frXp(o.id, frState(f, pid)), title: frTitle(o.id, frState(f, pid)) } : null; }).filter(Boolean);
}
const areFriends = (a, b) => { const [lo, hi] = pairOf(a, b), f = sq.fr.get(lo, hi); return !!(f && f.lo_ok && f.hi_ok); };
const weekKey = () => mondayOf(dayOf(Date.now()));
function socialGuard(pid) { const me = sq.me.get(pid); return me && me.social ? null : [403, { error: "Die Freunde-Funktion ist noch nicht freigeschaltet. Bitte deine Eltern." }]; }
/* Figur samt Zubehör für Duell, Liga und Crew (Beteiligte sind Freunde bzw. Crew-Mitglieder) */
const lookOf = o => { const l = frLook(o.id, "ok"); return { avatar: l.avatar || o.avatar || "", acc: l.acc }; };
const chView = (c, me) => { const a = sq.me.get(c.a), b = sq.me.get(c.b); return { id: c.id, mode: c.mode, seed: c.seed, words: JSON.parse(c.words), from: Object.assign({ id: a.id, name: a.name }, lookOf(a)), to: Object.assign({ id: b.id, name: b.name }, lookOf(b)), aScore: c.a_score, bScore: c.b_score, created: c.created, done: c.b_ts, mine: me === c.a ? "a" : "b", myReact: me === c.a ? c.a_react : c.b_react, theirReact: me === c.a ? c.b_react : c.a_react }; };
async function apiSocial(pid, method, p, url, req, ip) {
  const g = socialGuard(pid);
  if (p === "/api/social/profile" && method === "POST") { const av = clean((await readJson(req)).avatar, 40); if (av && AVATAR_RE.test(av)) sq.setAvatar.run(av, pid); return [200, { ok: true }]; }
  if (p === "/api/social/me" && method === "GET") { const me = sq.me.get(pid); return [200, me.social ? { enabled: true, code: fcodeOf(pid), name: me.name, friends: friendsOf(pid) } : { enabled: false, name: me.name }]; }
  if (p === "/api/social/class" || p.startsWith("/api/social/class/")) return apiClassKid(pid, method, p, req);
  if (g) return g;
  if (p === "/api/social/friends" && method === "POST") {
    if (limited("p" + pid, "friend", 20, 3600000)) return [429, { error: "Zu viele Anfragen. Bitte später noch einmal." }];
    const code = clean((await readJson(req)).code, 12).toUpperCase().replace(/[^A-Z0-9]/g, ""), o = code ? sq.byCode.get(code) : null;
    if (!o || !o.social) return [400, { error: "Diesen Freundescode gibt es nicht." }];
    if (o.id === pid) return [400, { error: "Das ist dein eigener Code." }];
    if (friendsOf(pid).length >= 30) return [400, { error: "Du hast schon sehr viele Freunde." }];
    const [lo, hi] = pairOf(pid, o.id); if (sq.fr.get(lo, hi)) return [400, { error: "Ihr seid schon verbunden oder die Anfrage läuft." }];
    sq.addFr.run(lo, hi, pid, Date.now());
    return [200, { ok: true, name: o.name }];
  }
  const mfd = p.match(/^\/api\/social\/friends\/(\d+)$/);
  if (mfd && method === "DELETE") { const [lo, hi] = pairOf(pid, +mfd[1]); sq.delFr.run(lo, hi); return [200, { ok: true }]; }
  if (p === "/api/social/challenges" && method === "POST") {
    const b = await readJson(req), to = +b.to, mode = String(b.mode), score = Math.round(+b.score);
    if (!SOCIAL_MAX[mode] || !(score >= 0 && score <= SOCIAL_MAX[mode])) return [400, { error: "Ungültiges Spiel." }];
    if (!areFriends(pid, to)) return [403, { error: "Ihr seid noch keine bestätigten Freunde." }];
    const o = sq.me.get(to); if (!o || !o.social) return [403, { error: "Dein Freund hat die Funktion nicht freigeschaltet." }];
    const words = Array.isArray(b.words) ? b.words.map(w => String(w)).filter(w => /^[A-Za-z0-9_.\-#]{1,40}$/.test(w)).slice(0, 80) : [];
    if (words.length < 8) return [400, { error: "Zu wenige Wörter." }];
    if (sq.chCount.get(pid, Date.now() - 86400000).n >= 30) return [429, { error: "Für heute sind genug Herausforderungen verschickt." }];
    const id = +sq.addCh.run(pid, to, mode, JSON.stringify(words), Math.abs(Math.round(+b.seed)) % 2147483647, score, Date.now(), Date.now()).lastInsertRowid;
    const me0 = sq.me.get(pid); duelPush(to, "⚔️ " + (me0 ? me0.name : "Dein Freund") + " fordert dich zum Duell heraus! Kannst du " + score + " schlagen?", "duel");
    return [200, { id }];
  }
  if (p === "/api/social/inbox" && method === "GET") {
    const since = Date.now() - 7 * 86400000;
    return [200, { open: sq.inbox.all(pid, since).map(c => chView(c, pid)), waiting: sq.waiting.all(pid, since).map(c => chView(c, pid)), recent: sq.recent.all(pid, pid).map(c => chView(c, pid)) }];
  }
  const mr = p.match(/^\/api\/social\/challenges\/(\d+)\/(result|react)$/);
  if (mr && method === "POST") {
    const c = sq.ch.get(+mr[1]); if (!c || (c.a !== pid && c.b !== pid)) return [404, { error: "Unbekannt." }];
    const b = await readJson(req);
    if (mr[2] === "result") {
      const score = Math.round(+b.score);
      if (c.b !== pid) return [403, { error: "Das ist deine eigene Herausforderung." }];
      if (!(score >= 0 && score <= SOCIAL_MAX[c.mode])) return [400, { error: "Ungültiges Ergebnis." }];
      if (c.b_score != null) return [400, { error: "Schon gespielt." }];
      if (Date.now() - c.created > 7 * 86400000) return [400, { error: "Abgelaufen." }];
      sq.chDone.run(score, Date.now(), c.id);
      { const me1 = sq.me.get(pid), nm = me1 ? me1.name : "Dein Freund", res = score > c.a_score ? "hat gewonnen" : score < c.a_score ? "hat verloren" : "hat Unentschieden gespielt";
        duelPush(c.a, "🏁 " + nm + " hat dein Duell gespielt und " + res + " (" + c.a_score + " : " + score + ")!", "duelres"); }
      return [200, { ok: true, view: chView(sq.ch.get(c.id), pid) }];
    }
    const e = String(b.emoji); if (!REACTS.includes(e)) return [400, { error: "Unbekannte Reaktion." }];
    if (c.b_score == null) return [400, { error: "Erst nach dem Spiel." }];
    (c.a === pid ? sq.reactA : sq.reactB).run(e, c.id, pid); return [200, { ok: true }];
  }
  if (p === "/api/social/crew" || p.startsWith("/api/social/crew/")) return apiCrew(pid, method, p, req);
  if (p === "/api/social/score" && method === "POST") {
    const b = await readJson(req), mode = String(b.mode), score = Math.round(+b.score);
    if (!SOCIAL_MAX[mode] || !(score >= 0 && score <= SOCIAL_MAX[mode])) return [400, { error: "Ungültig." }];
    sq.setScore.run(pid, mode, weekKey(), score); sq.pruneScores.run(ymdAdd(weekKey(), -35)); return [200, { ok: true }];
  }
  if (p === "/api/social/board" && method === "GET") {
    const mode = url.searchParams.get("mode") || "blitz"; if (!SOCIAL_MAX[mode]) return [400, { error: "Unbekanntes Spiel." }];
    const ids = [pid, ...friendsOf(pid).filter(f => f.state === "ok" && f.social).map(f => f.id)], wk = weekKey();
    const rows = ids.map(id => { const o = sq.me.get(id), s = sq.score.get(id, mode, wk); return Object.assign({ id, name: o.name }, lookOf(o), { score: s ? s.best : 0, me: id === pid }); }).sort((x, y) => y.score - x.score);
    return [200, { mode, week: wk, rows }];
  }
  return [404, { error: "Nicht gefunden." }];
}


/* ---------- Crews: gemeinsame Wochenziele unter bestätigten Freunden ---------- */
const CREW_ADJ = ["Turbo", "Blitz", "Mega", "Eis", "Pixel", "Cosmic", "Power", "Nitro"], CREW_NOUN = ["Pinguine", "Wölfe", "Drachen", "Füchse", "Bären", "Haie", "Eulen", "Pandas"], CREW_EMOJI = ["🐧", "🐺", "🐲", "🦊", "🐻", "🦈", "🦉", "🐼"];
const CREW_MAX = 6;
/* Aufgaben je Woche; Ziel = Basis × Mitglieder × Stufe */
const QUESTS = [{ id: "min", icon: "⏱️", name: "Übungszeit", unit: "Min.", base: 60 }, { id: "words", icon: "🧠", name: "Wörter wiedererkannt", unit: "Wörter", base: 20 }, { id: "days", icon: "📅", name: "Aktive Tage", unit: "Tage", base: 4 }];
const TIERS = [{ n: "Bronze", f: 0.5, coins: 3 }, { n: "Silber", f: 1, coins: 6 }, { n: "Gold", f: 1.5, coins: 12 }];
const CHEERS = ["💪", "🔥", "📣", "⏰", "👏", "🚀"];
function memberWeek(pid, mon) {   // Beitrag eines Kindes in der Woche ab mon (Montag bis Sonntag, Europe/Berlin), aus den Lernereignissen
  const end = ymdAdd(mon, 6), secDay = {}; let words = 0, today = 0; const t = dayOf(Date.now());
  for (const e of q.events.all(pid, Date.parse(mon + "T00:00:00Z") - 86400000)) {
    const d = dayOf(e.ts); if (d < mon || d > end) continue;
    const j = JSON.parse(e.d);
    if (e.k === "ss") { secDay[d] = (secDay[d] || 0) + (j.sec || 0); }
    else if (e.k === "a" && (j.b || 0) === 1 && (j.a || 0) >= 2 && j.g > 0) words++;
  }
  today = (secDay[t] || 0) >= 300 ? 1 : 0;
  return { min: Math.round(Object.values(secDay).reduce((a, b) => a + b, 0) / 60), words, days: Object.values(secDay).filter(x => x >= 300).length, today };
}
function crewWeek(crewId, mon) {
  const ms = cq.members.all(crewId).map(m => m.player), n = Math.max(1, ms.length), per = {};
  for (const id of ms) per[id] = memberWeek(id, mon);
  const quests = QUESTS.map(qs => {
    const total = ms.reduce((a, id) => a + per[id][qs.id === "min" ? "min" : qs.id], 0), targets = TIERS.map(t => Math.round(qs.base * n * t.f));
    return { id: qs.id, icon: qs.icon, name: qs.name, unit: qs.unit, total, targets, tier: targets.filter(x => total >= x).length };
  });
  return { n, ms, per, quests };
}
function crewStreak(crewId, monNow) {   // Wochen in Folge mit mindestens zwei erreichten Aufgaben (laufende Woche zählt, sobald erreicht)
  let streak = 0;
  for (let k = 0; k < 8; k++) { const w = crewWeek(crewId, ymdAdd(monNow, -7 * k)), ok = w.quests.filter(x => x.tier >= 1).length >= 2; if (ok) streak++; else if (k > 0) break; else if (k === 0) continue; }
  return streak;
}
function crewView(pid) {
  const c = cq.crewOf.get(pid); if (!c) return null;
  const mon = weekKey(), w = crewWeek(c.id, mon), myClaims = new Set(cq.claimsOf.all(pid, mon).map(x => x.quest + ":" + x.tier));
  const members = w.ms.map(id => { const o = sq.me.get(id), s = w.per[id]; return Object.assign({ id, name: o.name }, lookOf(o), { min: s.min, words: s.words, days: s.days, today: !!s.today, score: s.min + s.words * 2 + s.days * 10, you: id === pid, owner: id === c.owner }); });
  const best = Math.max(0, ...members.map(m => m.score)); members.forEach(m => { m.mvp = best > 0 && m.score === best; });
  const mine = w.per[pid];
  const quests = w.quests.map(x => ({ ...x, tiers: TIERS.map((t, i) => { const per = x.targets[i] / w.n, my = mine[x.id === "min" ? "min" : x.id]; return { n: t.n, target: x.targets[i], coins: t.coins, reached: x.total >= x.targets[i], claimed: myClaims.has(x.id + ":" + (i + 1)), eligible: x.total >= x.targets[i] && my >= per / 3 }; }), mine: mine[x.id === "min" ? "min" : x.id] }));
  const last = crewWeek(c.id, ymdAdd(mon, -7));
  return { id: c.id, name: c.name, emoji: c.emoji, week: mon, end: ymdAdd(mon, 6), members, quests, streak: crewStreak(c.id, mon), canInvite: w.ms.length + cq.invitesOfCrew.all(c.id, Date.now() - 7 * 86400000).length < CREW_MAX,
    pending: cq.invitesOfCrew.all(c.id, Date.now() - 7 * 86400000).map(i => { const o = sq.me.get(i.player); return o ? { id: o.id, name: o.name } : null; }).filter(Boolean),
    cheers: cq.cheersFor.all(pid, Date.now() - 86400000).map(x => { const o = sq.me.get(x.frm); return { from: o ? o.name : "?", emoji: x.emoji, ts: x.ts }; }),
    last: { quests: last.quests.map(x => ({ id: x.id, tier: x.tier })) } };
}
async function apiCrew(pid, method, p, req) {
  if (p === "/api/social/crew" && method === "GET") {
    const v = crewView(pid), inv = cq.invitesFor.all(pid, Date.now() - 7 * 86400000).map(i => { const o = sq.me.get(i.inviter); return { crew: i.crew, name: i.name, emoji: i.emoji, from: o ? o.name : "?" }; });
    return [200, { crew: v, invites: inv, names: { adj: CREW_ADJ, noun: CREW_NOUN, emoji: CREW_EMOJI }, cheers: CHEERS, tiers: TIERS.map(t => ({ n: t.n, coins: t.coins })) }];
  }
  const b = method === "POST" ? await readJson(req) : {};
  if (p === "/api/social/crew" && method === "POST") {
    if (cq.crewOf.get(pid)) return [400, { error: "Du bist schon in einer Crew." }];
    const a = CREW_ADJ[+b.adj], nn = CREW_NOUN[+b.noun], em = CREW_EMOJI[+b.emoji]; if (!a || !nn || !em) return [400, { error: "Bitte Namen und Zeichen aus der Liste wählen." }];
    const id = +cq.addCrew.run(a + " " + nn, em, pid, Date.now()).lastInsertRowid; cq.addMember.run(id, pid, Date.now()); cq.delInvitesOf.run(pid);
    return [200, { id }];
  }
  if (p === "/api/social/crew/invite" && method === "POST") {
    const c = cq.crewOf.get(pid); if (!c) return [400, { error: "Du bist in keiner Crew." }];
    const to = +b.to, o = sq.me.get(to); if (!o || !o.social || !areFriends(pid, to)) return [403, { error: "Nur bestätigte Freunde können eingeladen werden." }];
    if (cq.crewOf.get(to)) return [400, { error: "Dein Freund ist schon in einer Crew." }];
    if (cq.members.all(c.id).length + cq.invitesOfCrew.all(c.id, Date.now() - 7 * 86400000).length >= CREW_MAX) return [400, { error: "Die Crew ist voll." }];
    cq.addInvite.run(c.id, to, pid, Date.now()); return [200, { ok: true }];
  }
  if (p === "/api/social/crew/answer" && method === "POST") {
    const cid = +b.crew, inv = cq.invite.get(cid, pid); if (!inv || Date.now() - inv.created > 7 * 86400000) return [404, { error: "Einladung nicht gefunden." }];
    if (!b.accept) { cq.delInvite.run(cid, pid); return [200, { ok: true }]; }
    if (cq.crewOf.get(pid)) return [400, { error: "Du bist schon in einer Crew." }];
    if (cq.members.all(cid).length >= CREW_MAX) return [400, { error: "Die Crew ist voll." }];
    cq.addMember.run(cid, pid, Date.now()); cq.delInvitesOf.run(pid); return [200, { ok: true }];
  }
  if (p === "/api/social/crew/leave" && method === "POST") { crewLeave(pid); return [200, { ok: true }]; }
  if (p === "/api/social/crew/cheer" && method === "POST") {
    const c = cq.crewOf.get(pid), to = +b.to, em = String(b.emoji); if (!c) return [400, { error: "Du bist in keiner Crew." }];
    if (!CHEERS.includes(em)) return [400, { error: "Unbekannte Reaktion." }];
    const m = cq.members.all(c.id).map(x => x.player); if (to === pid || !m.includes(to)) return [403, { error: "Nur für Crew-Mitglieder." }];
    if (cq.cheer.get(pid, to, Date.now() - 6 * 3600000)) return [429, { error: "Du hast gerade schon angefeuert. Später wieder!" }];
    cq.addCheer.run(c.id, pid, to, em, Date.now()); cq.pruneCheers.run(Date.now() - 7 * 86400000); return [200, { ok: true }];
  }
  if (p === "/api/social/crew/claim" && method === "POST") {
    const c = cq.crewOf.get(pid); if (!c) return [400, { error: "Du bist in keiner Crew." }];
    const v = crewView(pid), qs = v.quests.filter(x => x.id === String(b.quest))[0], ti = +b.tier - 1, t = qs && qs.tiers[ti];
    if (!t) return [400, { error: "Unbekannte Belohnung." }];
    if (t.claimed) return [400, { error: "Schon abgeholt." }];
    if (!t.reached) return [400, { error: "Das Ziel ist noch nicht erreicht." }];
    if (!t.eligible) return [400, { error: "Übe selbst ein bisschen mit, dann kannst du die Belohnung holen." }];
    cq.addClaim.run(pid, v.week, qs.id, ti + 1, t.coins); return [200, { ok: true, coins: t.coins, tier: t.n, quest: qs.name }];
  }
  return [404, { error: "Nicht gefunden." }];
}
function crewLeave(pid) {
  const c = cq.crewOf.get(pid); if (!c) return;
  cq.delMember.run(pid);
  const rest = cq.members.all(c.id);
  if (!rest.length) cq.delCrew.run(c.id); else if (c.owner === pid) cq.setOwner.run(rest[0].player, c.id);
}


/* ---------- Klassen-Modus ---------- */
const CATALOG = (() => {   // alle Datendateien der App (gleiche Reihenfolge wie build.js): Wörter, Sätze, Verben
  const out = { units: [], sentences: [], verbs: [] };
  try {
    const vm = require("node:vm"), ctx = { window: {} }; vm.createContext(ctx);
    const openDir = path.join(__dirname, "..", "data", "open");   // offene Einheiten und Sätze: wie in build.js zuletzt, alphabetisch
    const openFiles = fs.existsSync(openDir) ? fs.readdirSync(openDir).filter(f => f.endsWith(".js")).sort().map(f => path.join("open", f.slice(0, -3))) : [];
    for (const f of ["klasse6", "klasse7", "klasse8", "business", "business-basis2", "business-aufbau2", "business-profi2", "smalltalk", "idioms", "saetze", "saetze2", "lernbuch", "verben"].concat(openFiles)) {
      try { vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "data", f + ".js"), "utf8"), ctx); } catch (e) { console.error("Datei " + f + " nicht geladen:", e.message); }
    }
    out.units = (ctx.window.VOCAB_UNITS || []).map(u => ({ id: String(u.id), k: u.k, title: String(u.title), icon: u.icon || "", words: u.words.map(w => [w[0], w[1]]) }));
    out.sentences = (ctx.window.SENTENCES || []).map(a => [a[2], a[3]]);
    out.verbs = (ctx.window.VERBS || []).map(v => { const f = x => String(x).split("/")[0]; return [v[0] + ", " + f(v[1]) + ", " + f(v[2]), v[3]]; });
  } catch (e) { console.error("Katalog nicht geladen:", e.message); }
  return out;
})();
const UNITS = CATALOG.units;
/* Lesbarer Name zu einem Lernereignis: neue Apps schicken Englisch und Deutsch mit, ältere nur die ID (Sätze "s12", Verben "v#3", Wörter "Einheit#Nr"). */
function nameOf(d) {
  if (d.en) return { en: String(d.en), de: String(d.de || "") };
  const id = String(d.id || ""); let m, r;
  if ((m = id.match(/^s(\d+)$/)) && (r = CATALOG.sentences[+m[1]])) return { en: r[0], de: r[1] };
  if ((m = id.match(/^v#(\d+)$/)) && (r = CATALOG.verbs[+m[1]])) return { en: r[0], de: r[1] };
  if ((m = id.match(/^(.+)#(\d+)$/))) { const u = UNIT_BY[m[1]], w = u && u.words[+m[2]]; if (w) return { en: w[0], de: w[1] }; }
  return { en: id, de: "" };
}
const UNIT_BY = Object.fromEntries(UNITS.map(u => [u.id, u]));
const GOAL_DEFAULT = 15;   // wiedererkannte Wörter je Kind im Zeitraum der Aufgabe
function classCode() { for (let i = 0; i < 20; i++) { const c = "K" + newCode().replace("-", "").slice(0, 5); if (!kq.byCode.get(c)) return c; } throw new Error("Kein Klassencode"); }
const taskView = t => ({ id: t.id, title: t.title, units: JSON.parse(t.units), from: t.d_from, to: t.d_to, goal: t.goal });
const classMembers = cid => kq.members.all(cid).filter(m => m.status === "ok").map(m => m.player);
function taskStats(pid, t) {   // Beitrag eines Kindes zur Aufgabe (nur Zahlen): wiedererkannte Wörter der Einheiten im Zeitraum
  const units = new Set(JSON.parse(t.units)); let words = 0;
  for (const e of q.events.all(pid, Date.parse(t.d_from + "T00:00:00Z") - 86400000)) {
    if (e.k !== "a") continue; const d = dayOf(e.ts); if (d < t.d_from || d > t.d_to) continue;
    const j = JSON.parse(e.d); if (units.has(j.u) && (j.b || 0) === 1 && (j.a || 0) >= 2 && j.g > 0) words++;
  }
  return words;
}
function classOverview(cid) {
  const c = kq.cls.get(cid), mon = weekKey(), today = dayOf(Date.now()), ids = classMembers(cid), pending = kq.members.all(cid).filter(m => m.status === "pending").length;
  const tasks = kq.active.all(cid, today, today), t = tasks[0] || null;
  const rows = ids.map(id => { const o = sq.me.get(id), w = memberWeek(id, mon); return { id, name: o.name, min: w.min, words: w.words, days: w.days, taskWords: t ? taskStats(id, t) : 0, active: w.min > 0 }; });
  const total = rows.reduce((a, r) => a + r.taskWords, 0), target = t ? t.goal * Math.max(1, rows.length) : 0;
  const units = t ? JSON.parse(t.units).map(uid => {
    const u = UNIT_BY[uid]; if (!u) return { id: uid, title: uid, pct: 0 };
    const ids2 = u.words.map((_, i) => u.id + "#" + i); let sum = 0, n = 0;
    for (const id of ids) { const sn = snap(id, "words"); if (!sn) continue; n++; sum += ids2.filter(x => sn.d[x] && sn.d[x][0] >= 3).length / ids2.length; }
    return { id: uid, title: u.title, pct: n ? Math.round(sum * 100 / n) : 0 };
  }) : [];
  const hard = {};
  if (t) { const us = new Set(JSON.parse(t.units)); for (const id of ids) for (const e of q.events.all(id, Date.parse(t.d_from + "T00:00:00Z") - 86400000)) { if (e.k !== "a") continue; const d = dayOf(e.ts); if (d < t.d_from || d > t.d_to) continue; const j = JSON.parse(e.d); if (us.has(j.u) && j.g === 0 && (j.en || j.id)) { const nm = nameOf(j), k = nm.en + "|" + nm.de; hard[k] = (hard[k] || 0) + 1; } } }
  const problems = Object.entries(hard).filter(x => x[1] >= 2).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, n]) => ({ en: k.split("|")[0], de: k.split("|")[1], n }));
  return { id: c.id, name: c.name, teacher: c.tname, code: c.code, members: rows, pending, active: rows.filter(r => r.active).length, tasks: kq.tasks.all(cid).map(taskView), current: t ? taskView(t) : null, goal: { total, target }, units, problems };
}
function crewLeague(cid, mon) {   // Crews der Klasse, Wertung je Mitglied (fair bei unterschiedlicher Größe)
  const ids = new Set(classMembers(cid)), seen = {};
  for (const id of ids) { const cr = cq.crewOf.get(id); if (cr && !seen[cr.id]) seen[cr.id] = { crew: cr, ids: [] }; if (cr) seen[cr.id].ids.push(id); }
  return Object.values(seen).map(x => { const sc = x.ids.map(id => { const w = memberWeek(id, mon); return w.min + w.words * 2 + w.days * 10; }); return { id: x.crew.id, name: x.crew.name, emoji: x.crew.emoji, kids: x.ids.length, score: Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) }; }).sort((a, b) => b.score - a.score);
}
function classKidView(pid) {
  const m = kq.memberOf.get(pid); if (!m) return { state: "none" };
  if (m.status !== "ok") return { state: "pending", name: m.name, teacher: m.tname };
  const o = classOverview(m.class), mine = o.members.find(r => r.id === pid) || {}, mon = weekKey(), lg = crewLeague(m.class, mon), cr = cq.crewOf.get(pid), rank = cr ? lg.findIndex(x => x.id === cr.id) + 1 : 0;
  return { state: "member", name: m.name, teacher: m.tname, kids: o.members.length, active: o.active, task: o.current && { ...o.current, unitTitles: o.current.units.map(u => (UNIT_BY[u] || { title: u }).title) }, goal: o.goal, mine: { taskWords: mine.taskWords || 0, goal: o.current ? o.current.goal : 0 },
    league: lg.slice(0, 3).map((x, i) => ({ ...x, rank: i + 1, mine: !!(cr && cr.id === x.id) })), myCrew: cr && rank > 3 ? { name: cr.name, emoji: cr.emoji, rank } : null, leagueSize: lg.length };
}
async function apiClassKid(pid, method, p, req) {
  if (p === "/api/social/class" && method === "GET") return [200, classKidView(pid)];
  if (p === "/api/social/class/join" && method === "POST") {
    if (limited("p" + pid, "classjoin", 8, 3600000)) return [429, { error: "Zu viele Versuche. Bitte später noch einmal." }];
    const code = clean((await readJson(req)).code, 12).toUpperCase().replace(/[^A-Z0-9]/g, ""), c = code ? kq.byCode.get(code) : null;
    if (!c) return [400, { error: "Diesen Klassencode gibt es nicht." }];
    if (kq.memberOf.get(pid)) return [400, { error: "Du bist schon in einer Klasse oder die Anfrage läuft." }];
    kq.addMember.run(c.id, pid, Date.now()); return [200, { ok: true, name: c.name, teacher: c.tname }];
  }
  if (p === "/api/social/class/leave" && method === "POST") { kq.delMember.run(pid); return [200, { ok: true }]; }
  return [404, { error: "Nicht gefunden." }];
}
/* Wochenaufgaben der Klasse als Lernpläne der Kinder: die App zeigt sie wie einen Lernplan (Start, Karte, Fortschritt) */
function classPlansFor(pid) {
  const m = kq.memberOf.get(pid); if (!m || m.status !== "ok") return [];
  const today = dayOf(Date.now());
  return kq.active.all(m.class, today, today).map(t => ({ id: "c" + t.id, title: "🏫 " + m.name + ": " + t.title, exam: t.d_to, units: JSON.parse(t.units), coins: 0, cls: true, teacher: m.tname }));
}
function taskCreate(cid, b) {
  const title = clean(b.title, 60) || "Wochenaufgabe", from = String(b.from || dayOf(Date.now())), to = String(b.to || ""), goal = Math.min(100, Math.max(3, Math.round(+b.goal || GOAL_DEFAULT)));
  if (!/^\d{4}-\d\d-\d\d$/.test(from) || !/^\d{4}-\d\d-\d\d$/.test(to) || to < from) return [400, { error: "Bitte einen gültigen Zeitraum wählen." }];
  if (to < dayOf(Date.now())) return [400, { error: "Das Ende liegt in der Vergangenheit." }];
  const units = (Array.isArray(b.units) ? b.units : []).map(String).filter(u => UNIT_BY[u]).slice(0, 12);
  if (!units.length) return [400, { error: "Bitte mindestens eine Einheit wählen." }];
  if (kq.tasks.all(cid).length >= 30) return [400, { error: "Zu viele Aufgaben. Bitte alte löschen." }];
  return [200, { id: +kq.addTask.run(cid, title, JSON.stringify(units), from, to, goal, Date.now()).lastInsertRowid }];
}

/* Testphase: Spieler des Betreibers (eigene Familie) bekommen die Freunde-Funktion einmalig eingeschaltet; Eltern-Konten bleiben bei „aus“ */
if (!q.kvGet.get("social_default_v1")) {
  for (const p of db.prepare("SELECT id FROM players WHERE family IS NULL AND hidden = 0 AND social = 0").all()) { sq.setSocial.run(1, p.id); fcodeOf(p.id); }
  q.kvSet.run("social_default_v1", "1");
}

/* ---------- Routing ---------- */
const PUBLIC = path.join(__dirname, "public");
const LOOK = require("./look.js");
const server = http.createServer(async (req, res) => {
  const ip = clientIp(req), url = new URL(req.url, "http://x"); let p = url.pathname, scope = null;   // scope = Familie, wenn über das Elternkonto zugegriffen wird
  try {
    cors(req, res);
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

    if (p === "/healthz") return send(res, 200, { ok: true });

    /* App-Symbole und Manifest des Dashboards: öffentlich, damit der Browser sie ohne Anmeldung laden kann (enthalten nichts Geheimes) */
    if (req.method === "GET" && p.startsWith("/app/")) {
      const f = p.slice(5);
      if (f === "manifest.webmanifest" || f === "family.webmanifest") {
        const fam = f === "family.webmanifest", ic = (n, sz, pu) => ({ src: "/app/" + n, sizes: sz, type: "image/png", purpose: pu });
        const man = { name: fam ? "Track Wordy Eltern" : "Track Wordy", short_name: "Track Wordy", lang: "de", start_url: fam ? "/f/" : "/", scope: fam ? "/f/" : "/", id: fam ? "/f/" : "/", display: "standalone",
          background_color: "#0E1320", theme_color: "#0E1320", categories: ["education"], icons: [ic("icon-192.png", "192x192", "any"), ic("icon-512.png", "512x512", "any"), ic("icon-maskable-512.png", "512x512", "maskable")] };
        return send(res, 200, JSON.stringify(man), { "Content-Type": "application/manifest+json; charset=utf-8", "Cache-Control": "public, max-age=3600" });
      }
      if (/^(icon-192|icon-512|icon-maskable-512|apple-touch-icon|favicon-32)\.png$/.test(f)) {
        try { const buf = fs.readFileSync(path.join(PUBLIC, "app", f)); res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" }); return res.end(buf); } catch (e) { return send(res, 404, { error: "Nicht gefunden." }); }
      }
      return send(res, 404, { error: "Nicht gefunden." });
    }

    if (p === "/api/pair" && req.method === "POST") { const [c, b] = apiPair(await readJson(req), ip); return send(res, c, b); }
    if (p === "/api/events" && req.method === "POST") {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      const [c, b] = apiEvents(pid, await readJson(req)); return send(res, c, b);
    }
    if (p === "/api/snapshot" && req.method === "POST") {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      const [c, b] = apiSnapshot(pid, await readJson(req)); return send(res, c, b);
    }
    if (p === "/api/state" && req.method === "PUT") {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      const [c, b] = apiStatePut(pid, await readJson(req, MAX_STATE)); return send(res, c, b);
    }
    if (p === "/api/state" && req.method === "GET") {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      const day = url.searchParams.get("day"); if (day && !/^\d{4}-\d\d-\d\d$/.test(day)) return send(res, 400, { error: "Datum ungültig." });
      const [c, b] = apiStateGet(pid, day); return send(res, c, b);
    }
    if (p === "/api/state/list" && req.method === "GET") {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      return send(res, 200, { items: q.stateList.all(pid).map(stateMeta) });
    }
    if (p === "/api/sync" && req.method === "GET") {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      const [c, b] = apiSync(pid); return send(res, c, b);
    }
    if (p.startsWith("/api/social/")) {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      if (q.player.get(pid).hidden) return send(res, 403, { error: "Dieser Spieler wird nur gesichert." });
      const [c, b] = await apiSocial(pid, req.method, p, url, req, ip); return send(res, c, b);
    }
    if (p === "/api/pair/request" && req.method === "POST") { const [c, b] = pairRequest(await readJson(req), ip); return send(res, c, b); }
    { const mp = p.match(/^\/api\/pair\/request\/([0-9a-f]{32})$/); if (mp && req.method === "GET") { const [c, b] = pairPoll(mp[1], url.searchParams.get("secret"), ip); return send(res, c, b); } }
    if (p === "/api/push/key" && req.method === "GET") return send(res, 200, { key: VAPID.publicKey });
    if (p === "/api/push" && (req.method === "GET" || req.method === "POST")) {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      if (req.method === "GET") return send(res, 200, pushView(pid));
      if (limited(ip, "push", 30, 3600000)) return send(res, 429, { error: "Zu viele Versuche. Bitte später noch einmal." });
      const b = await readJson(req), st = pushState(pid);
      if (b.action === "subscribe") {
        if (!SUB_OK(b.sub || {})) return send(res, 400, { error: "Das Gerät hat kein gültiges Push-Abo geliefert." });
        if (pq.of.all(pid).length >= 5 && !pq.of.all(pid).some(x => x.endpoint === b.sub.endpoint)) return send(res, 400, { error: "Es sind höchstens 5 Geräte möglich." });
        pq.add.run(pid, b.sub.endpoint, b.sub.keys.p256dh, b.sub.keys.auth, Date.now(), clean(b.ua, 80));
        st.on = true; if (/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time || "")) st.time = b.time; pushSave(pid, st);
        return send(res, 200, pushView(pid));
      }
      if (b.action === "settings") {   // Gerät stellt Uhrzeit oder An/Aus ein
        if (typeof b.on === "boolean") st.on = b.on;
        if (/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time || "")) st.time = b.time;
        pushSave(pid, st); return send(res, 200, pushView(pid));
      }
      if (b.action === "unsubscribe") { if (b.endpoint) pq.del.run(String(b.endpoint)); return send(res, 200, pushView(pid)); }
      if (b.action === "test") {
        const pl = q.player.get(pid), t = pushTodayInfo(pid), n = await pushSendTo(pid, pushMessage(pid, pl.name, t.streak, Math.floor(Math.random() * 1000)));
        return send(res, 200, Object.assign(pushView(pid), { sent: n }));
      }
      return send(res, 400, { error: "Unbekannte Aktion." });
    }
    if (p === "/api/feedback" && (req.method === "GET" || req.method === "POST")) {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      if (req.method === "GET") return send(res, 200, { items: fbq.ofPlayer.all(pid).map(fbOwn), kinds: FB_KINDS });
      if (limited(ip, "fb", 10, 3600000)) return send(res, 429, { error: "Zu viele Rückmeldungen. Bitte später noch einmal." });
      const b = await readJson(req), pl = q.player.get(pid);
      const [c, r] = fbAdd({ player: pid, family: pl.family, role: pl.family ? "family" : "operator", kind: b.kind, text: b.text, source: "app", ver: b.ver, device: b.device });
      return send(res, c, r);
    }
    if (p === "/api/ping" && req.method === "POST") {
      const pid = playerOf(req); if (!pid) return send(res, 401, { error: "Nicht verbunden." });
      { const pl = q.player.get(pid); return send(res, 200, { ok: true, name: pl.name, hidden: !!pl.hidden }); }
    }


    /* ---------- Elternkonto: Seiten, Anmeldung per E-Mail-Link ---------- */
    const FCSP = "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'";
    if (p === "/f/datenschutz" && req.method === "GET") return send(res, 200, privacyPage(), { "Content-Security-Policy": FCSP });
    if ((p === "/f/join" || p === "/f/login") && req.method === "GET") return send(res, 200, fs.readFileSync(path.join(PUBLIC, "family.html"), "utf8"), { "Content-Security-Policy": FCSP });
    if ((p === "/f" || p === "/f/") && req.method === "GET") {
      if (!famAuth(req)) return send(res, 200, fs.readFileSync(path.join(PUBLIC, "family.html"), "utf8"), { "Content-Security-Policy": FCSP });
      const html = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8").replace(/\/api\/admin/g, "/api/fam").replace("/app/manifest.webmanifest", "/app/family.webmanifest").replace("content=\"Track Wordy\"", "content=\"Track Wordy Eltern\"").replace("<head>", "<head><script>window.WF=1" + (famAuth(req).role === "teacher" ? ";window.WT=1" : "") + "</script>");
      return send(res, 200, html, { "Content-Security-Policy": FCSP });
    }
    if (p === "/api/family/login" && req.method === "POST") {
      if (limited(ip, "flogin", 10, 600000)) return send(res, 429, { error: "Zu viele Versuche. Bitte später noch einmal." });
      const email = normEmail((await readJson(req)).email);
      if (!EMAIL_RE.test(email)) return send(res, 400, { error: "Bitte eine gültige E-Mail-Adresse eingeben." });
      if (!transportOn()) return send(res, 503, { error: "Der Mailversand ist auf dem Server nicht eingerichtet." });
      if (!limited(email, "fmail", 3, 3600000)) {
        const f = fq.byEmail.get(email);
        if (f && f.status === "active") { try { await sendLoginLink(f); } catch (e) { console.error("Anmeldelink:", e.message); return send(res, 502, { error: "Die Mail konnte nicht gesendet werden." }); } }
      }
      return send(res, 200, { ok: true });   // immer dieselbe Antwort: nicht verraten, welche Adressen es gibt
    }
    if (p === "/api/family/join" && req.method === "POST") {
      if (limited(ip, "fjoin", 10, 600000)) return send(res, 429, { error: "Zu viele Versuche. Bitte später noch einmal." });
      const b = await readJson(req), email = normEmail(b.email), code = clean(b.invite, 40).toUpperCase().replace(/[^A-Z0-9-]/g, "");
      if (!EMAIL_RE.test(email)) return send(res, 400, { error: "Bitte eine gültige E-Mail-Adresse eingeben." });
      if (b.consent !== true) return send(res, 400, { error: "Bitte stimme der Datenschutzerklärung zu." });
      if (!transportOn()) return send(res, 503, { error: "Der Mailversand ist auf dem Server nicht eingerichtet." });
      const inv = fq.inv.get(code);
      if (!inv || inv.expires < Date.now() || inv.uses >= inv.max_uses) return send(res, 400, { error: "Dieser Einladungslink ist ungültig oder abgelaufen." });
      let f = fq.byEmail.get(email);
      if (!f) {
        let owner = null;
        if (inv.owner) { const o = fq.byId.get(inv.owner); if (!o || o.owner || o.status !== "active" || fq.coparents.all(o.id).length >= MAX_COPARENTS) return send(res, 400, { error: "Dieser Einladungslink ist ungültig oder abgelaufen." }); owner = o.id; }
        const id = +fq.add.run(email, Date.now(), Date.now(), CONSENT_VER, inv.role || "parent", owner).lastInsertRowid; fq.useInv.run(code); f = fq.byId.get(id);
      }
      if (f.status === "active" && !limited(email, "fmail", 3, 3600000)) { try { await sendLoginLink(f); } catch (e) { console.error("Anmeldelink:", e.message); return send(res, 502, { error: "Die Mail konnte nicht gesendet werden." }); } }
      return send(res, 200, { ok: true });
    }
    if (p === "/api/family/signin" && req.method === "POST") {
      if (limited(ip, "fsignin", 20, 600000)) return send(res, 429, { error: "Zu viele Versuche. Bitte später noch einmal." });
      const b = await readJson(req), email = normEmail(b.email), pw = typeof b.password === "string" ? b.password.slice(0, 200) : "";
      const bad = () => send(res, 401, { error: "E-Mail oder Passwort stimmt nicht. Du kannst dir auch einen Anmeldelink per Mail schicken lassen." });
      if (!EMAIL_RE.test(email) || !pw) return bad();
      if (pwLocked(email)) return send(res, 429, { error: "Zu viele Fehlversuche. Bitte in 15 Minuten noch einmal oder einen Anmeldelink per Mail anfordern." });
      const f = fq.byEmail.get(email), ok = f && f.status === "active" && f.pw ? pwCheck(pw, f.pw) : (pwCheck(pw, PW_DUMMY), false);
      if (!ok) { pwFail(email); return bad(); }
      pwFails.delete(email);
      const tok = rand(32); fq.addSess.run(sha(tok), f.id, Date.now(), Date.now()); fq.touchLogin.run(Date.now(), f.id);
      return send(res, 200, { ok: true }, { "Set-Cookie": cookieHdr(tok, SESSION_DAYS * 86400) });
    }
    if (p === "/api/family/session" && req.method === "POST") {
      if (limited(ip, "fsess", 20, 600000)) return send(res, 429, { error: "Zu viele Versuche." });
      const t = clean((await readJson(req)).t, 80), row = /^[0-9a-f]{64}$/.test(t) ? fq.link.get(sha(t)) : null;
      const f = row && !row.used && Date.now() - row.created < LINK_MIN * 60000 ? fq.byId.get(row.family) : null;
      if (!f || f.status !== "active") return send(res, 400, { error: "Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an." });
      fq.useLink.run(sha(t));
      const tok = rand(32); fq.addSess.run(sha(tok), f.id, Date.now(), Date.now()); fq.touchLogin.run(Date.now(), f.id);
      return send(res, 200, { ok: true }, { "Set-Cookie": cookieHdr(tok, SESSION_DAYS * 86400) });
    }
    if (p === "/api/family/logout" && req.method === "POST") {
      const t = cookieOf(req, "wf"); if (/^[0-9a-f]{64}$/.test(t)) fq.delSess.run(sha(t));
      return send(res, 200, { ok: true }, { "Set-Cookie": cookieHdr("", 0) });
    }
    if (p.startsWith("/api/fam/")) {   // Eltern-Schnittstelle der Familie: gleiche Routen wie /api/admin, aber nur für die eigenen Kinder
      if (limited(ip, "fam", 240, 60000)) return send(res, 429, { error: "Zu viele Anfragen." });
      scope = famAuth(req);
      if (!scope) return send(res, 401, { error: "Bitte neu anmelden." });
      if (req.method !== "GET" && req.headers["x-wordy"] !== "1") return send(res, 403, { error: "Nicht erlaubt." });   // einfacher Schutz vor fremden Formularen
      p = "/api/admin/" + p.slice("/api/fam/".length);
    }

    /* Ab hier nur für Eltern */
    if (p === "/" || p.startsWith("/api/admin/")) {
      if (!scope && limited(ip, "admin", ADMIN_RATE, 60000)) return send(res, 429, { error: "Zu viele Anfragen." });
      if (!scope && !adminOk(req)) {
        if (limited(ip, "authfail", 10, 600000)) return send(res, 429, { error: "Zu viele Versuche." });
        return send(res, 401, "Anmeldung nötig", { "WWW-Authenticate": 'Basic realm="Wordy Lernfortschritt", charset="UTF-8"' });
      }
      if (p === "/") {
        return send(res, 200, fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8"),
          { "Content-Security-Policy": "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:" });
      }
      if (p === "/api/admin/info" && req.method === "GET") return send(res, 200, SERVER_INFO);
      const isT = !!(scope && scope.role === "teacher");
      if (scope && !isT && (p === "/api/admin/classes" || p.startsWith("/api/admin/classes/") || p === "/api/admin/units")) return send(res, 403, { error: "Nur für Lehrkräfte." });
      if (isT && p === "/api/admin/units" && req.method === "GET") return send(res, 200, UNITS.map(u => ({ id: u.id, k: u.k, title: u.title, icon: u.icon, count: u.words.length })));
      if (isT && p === "/api/admin/classes" && req.method === "GET") return send(res, 200, kq.ofTeacher.all(scope.id).map(c => ({ id: c.id, name: c.name, code: c.code, members: classMembers(c.id).length, pending: kq.members.all(c.id).filter(m => m.status === "pending").length })));
      if (isT && p === "/api/admin/classes" && req.method === "POST") {
        const b = await readJson(req), name = clean(b.name, 40), tname = clean(b.teacher, 40);
        if (!name || !tname) return send(res, 400, { error: "Bitte Klasse (z. B. 6b Englisch) und deinen Namen (z. B. Frau Meier) eintragen." });
        if (kq.ofTeacher.all(scope.id).length >= 8) return send(res, 400, { error: "Es sind höchstens 8 Klassen pro Konto möglich." });
        const id = +kq.addCls.run(scope.id, name, tname, classCode(), Date.now()).lastInsertRowid; return send(res, 200, { id, code: kq.cls.get(id).code });
      }
      const mcl = p.match(/^\/api\/admin\/classes\/(\d+)(?:\/(\w+))?(?:\/(\d+))?$/);
      if (isT && mcl) {
        const c = kq.cls.get(+mcl[1]); if (!c || c.teacher !== scope.id) return send(res, 404, { error: "Unbekannt." });
        if (!mcl[2] && req.method === "GET") return send(res, 200, classOverview(c.id));
        if (!mcl[2] && req.method === "DELETE") { kq.delCls.run(c.id); return send(res, 200, { ok: true }); }
        if (mcl[2] === "task" && req.method === "POST") { const [cd, bd] = taskCreate(c.id, await readJson(req)); return send(res, cd, bd); }
        if (mcl[2] === "task" && mcl[3] && req.method === "DELETE") { const t = kq.task.get(+mcl[3]); if (!t || t.class !== c.id) return send(res, 404, { error: "Unbekannt." }); kq.delTask.run(t.id); return send(res, 200, { ok: true }); }
        if (mcl[2] === "kick" && mcl[3] && req.method === "POST") { const cm = kq.memberOf.get(+mcl[3]); if (cm && cm.class === c.id) kq.delMember.run(+mcl[3]); return send(res, 200, { ok: true }); }
      }
      if (!scope && p === "/api/admin/features" && req.method === "GET") return send(res, 200, { famrewards: famRewardsOn() });
      if (!scope && p === "/api/admin/features" && req.method === "POST") { const b = await readJson(req); if (typeof b.famrewards === "boolean") q.kvSet.run("feature:famrewards", b.famrewards ? "1" : "0"); return send(res, 200, { famrewards: famRewardsOn() }); }
      if (!scope && p === "/api/admin/seasonplan" && req.method === "GET") return send(res, 200, seasonPlan());
      if (!scope && p === "/api/admin/seasonplan" && req.method === "POST") { const [c, b] = setSeasonPlan(await readJson(req)); return send(res, c, b); }
      if (!scope && p === "/api/admin/shopplan" && req.method === "GET") return send(res, 200, shopPlan());
      if (!scope && p === "/api/admin/shopplan" && req.method === "POST") { const [c, b] = setShopPlan(await readJson(req)); return send(res, c, b); }
      if (scope && p === "/api/admin/me" && req.method === "GET") return send(res, 200, { email: scope.email, created: scope.created, weekly: !!scope.weekly, hasPassword: !!scope.pw, children: fq.kids.all(scope.fid).length, coparent: !!scope.owner, max: MAX_KIDS, mail: transportOn(), day: MAIL.day, hour: MAIL.hour });
      if (scope && p === "/api/admin/me/password" && req.method === "POST") {
        const b = await readJson(req), problem = pwProblem(b.password, scope.email);
        if (problem) return send(res, 400, { error: problem });
        const fresh = Date.now() - scope.sessCreated < 30 * 60000;   // frisch angemeldet (z. B. per Link): „Passwort vergessen“ ohne das alte
        if (scope.pw && !fresh && !(typeof b.current === "string" && pwCheck(b.current, scope.pw))) return send(res, 403, { error: "Das aktuelle Passwort stimmt nicht." });
        fq.setPw.run(pwHash(b.password), scope.id); return send(res, 200, { ok: true });
      }
      if (scope && p === "/api/admin/me" && req.method === "POST") { const b = await readJson(req); fq.setWeekly.run(b.weekly ? 1 : 0, scope.id); return send(res, 200, { ok: true }); }
      if (scope && p === "/api/admin/coparents") {   // zweiter Elternzugang: gleiche Kinder, eigene Anmeldung (nur vom Hauptkonto aus)
        if (scope.owner || scope.role === "teacher") return send(res, 403, { error: "Nur das Hauptkonto kann weitere Eltern einladen." });
        const list = () => ({ items: fq.coparents.all(scope.id).map(c => ({ id: c.id, email: c.email, created: c.created, lastLogin: c.last_login, status: c.status })),
          invites: fq.coInvs.all(scope.id, Date.now()).map(i => ({ code: i.code, url: DASH_URL + "/f/join?i=" + i.code, expires: i.expires })), max: MAX_COPARENTS });
        if (req.method === "GET") return send(res, 200, list());
        if (req.method === "POST") {
          const l = list(); if (l.items.length + l.invites.length >= MAX_COPARENTS) return send(res, 400, { error: "Es sind höchstens " + MAX_COPARENTS + " weitere Elternzugänge möglich." });
          fq.addCoInv.run(rand(5).toUpperCase(), Date.now(), Date.now() + 7 * 86400000, "Zweiter Elternzugang", scope.id);
          return send(res, 200, list());
        }
      }
      const mcp = scope && p.match(/^\/api\/admin\/coparents\/(\d+|[A-Z0-9]{4,20})$/);
      if (mcp && req.method === "DELETE") {
        if (scope.owner || scope.role === "teacher") return send(res, 403, { error: "Nicht erlaubt." });
        if (/^\d+$/.test(mcp[1])) { const c = fq.byId.get(+mcp[1]); if (!c || c.owner !== scope.id) return send(res, 404, { error: "Unbekannt." }); fq.del.run(c.id); }
        else { const i = fq.inv.get(mcp[1]); if (!i || i.owner !== scope.id) return send(res, 404, { error: "Unbekannt." }); fq.delInv.run(i.code); }
        return send(res, 200, { ok: true });
      }
      if (scope && p === "/api/admin/me/export" && req.method === "GET") {
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": 'attachment; filename="wordy-daten-export.json"' });
        return res.end(JSON.stringify(famExport(scope), null, 1));
      }
      if (scope && p === "/api/admin/me" && req.method === "DELETE") {
        const b = await readJson(req); if (normEmail(b.confirm) !== scope.email) return send(res, 400, { error: "Zur Bestätigung bitte die E-Mail-Adresse eintippen." });
        fq.del.run(scope.id); return send(res, 200, { ok: true }, { "Set-Cookie": cookieHdr("", 0) });   // löscht Konto, Kinder, Lernstände (ON DELETE CASCADE)
      }
      if (scope && p.startsWith("/api/admin/families")) return send(res, 403, { error: "Nicht erlaubt." });
      if (!scope && p === "/api/admin/families" && req.method === "GET") return send(res, 200, fq.all.all().map(f => ({ id: f.id, email: f.email, created: f.created, status: f.status, children: f.children, owner: f.owner, role: f.role, lastLogin: f.last_login, weekly: !!f.weekly, consent: f.consent_ts })));
      if (!scope && p === "/api/admin/families/invites" && req.method === "GET") return send(res, 200, fq.invs.all().map(i => ({ code: i.code, created: i.created, expires: i.expires, max: i.max_uses, uses: i.uses, note: i.note, url: DASH_URL + "/f/join?i=" + i.code + (i.role === "teacher" ? "&l=1" : ""), role: i.role })));
      if (!scope && p === "/api/admin/families/invites" && req.method === "POST") {
        const b = await readJson(req), code = (rand(5)).toUpperCase(), days = Math.min(60, Math.max(1, +b.days || 14)), uses = Math.min(50, Math.max(1, +b.uses || 1));
        fq.addInv.run(code, Date.now(), Date.now() + days * 86400000, uses, clean(b.note, 60), b.role === "teacher" ? "teacher" : "parent");
        return send(res, 200, { code, url: DASH_URL + "/f/join?i=" + code + (b.role === "teacher" ? "&l=1" : ""), expires: Date.now() + days * 86400000, max: uses, role: b.role === "teacher" ? "teacher" : "parent" });
      }
      const mfi = p.match(/^\/api\/admin\/families\/invites\/([A-Z0-9]{4,20})$/);
      if (!scope && mfi && req.method === "DELETE") { fq.delInv.run(mfi[1]); return send(res, 200, { ok: true }); }
      const mf = p.match(/^\/api\/admin\/families\/(\d+)(?:\/(\w+))?$/);
      if (!scope && mf) {
        const f = fq.byId.get(+mf[1]); if (!f) return send(res, 404, { error: "Unbekannt." });
        if (mf[2] === "block" && req.method === "POST") { const blocked = !!(await readJson(req)).blocked; fq.setStatus.run(blocked ? "blocked" : "active", f.id); if (blocked) fq.delSessOf.run(f.id); return send(res, 200, { ok: true }); }
        if (!mf[2] && req.method === "DELETE") { fq.del.run(f.id); return send(res, 200, { ok: true }); }
      }
      { const mq = p.match(/^\/api\/admin\/pairing\/([A-Za-z0-9-]{4,10})(\/approve|\/deny)?$/);
        if (mq) {
          if (!mq[2] && req.method === "GET") { const [c, b] = pairLookup(mq[1], scope, ip); return send(res, c, b); }
          if (mq[2] === "/approve" && req.method === "POST") { const [c, b] = pairApprove(mq[1], await readJson(req), scope, ip); return send(res, c, b); }
          if (mq[2] === "/deny" && req.method === "POST") { const [c, b] = pairLookup(mq[1], scope, ip); if (c === 200) prq.setStatus.run("denied", prq.byCode.get(b.code).id); return send(res, c, c === 200 ? { ok: true } : b); }
        } }
      if (p === "/api/admin/feedback" && req.method === "GET") {
        if (scope) return send(res, 200, { items: fbq.ofFamily.all(scope.fid).map(fbOwn), kinds: FB_KINDS });
        return send(res, 200, { items: fbq.all.all().map(fbAdminRow), kinds: FB_KINDS, open: fbq.open.get().n, hour: fbHour(), mail: transportOn() && !!mailTo(), to: mailTo() });
      }
      if (p === "/api/admin/feedback" && req.method === "POST") {
        if (limited(ip, "fb", 20, 3600000)) return send(res, 429, { error: "Zu viele Rückmeldungen. Bitte später noch einmal." });
        const b = await readJson(req), [c, r] = fbAdd({ family: scope ? scope.fid : null, role: scope ? (scope.role === "teacher" ? "teacher" : "family") : "operator", kind: b.kind, text: b.text, source: "dashboard", ver: b.ver });
        return send(res, c, r);
      }
      if (!scope && p === "/api/admin/feedback/mailnow" && req.method === "POST") {
        try { await fbTick(true); return send(res, 200, { ok: true, pending: fbq.unmailed.all().length }); } catch (e) { return send(res, 200, { ok: false, error: String(e.message).slice(0, 200) }); }
      }
      if (!scope && p === "/api/admin/feedback/settings" && req.method === "POST") {
        const h = +(await readJson(req)).hour; if (!Number.isInteger(h) || h < 0 || h > 23) return send(res, 400, { error: "Uhrzeit 0 bis 23." });
        q.kvSet.run("fb_hour", String(h)); return send(res, 200, { ok: true, hour: h });
      }
      const mfb = p.match(/^\/api\/admin\/feedback\/(\d+)$/);
      if (!scope && mfb) {
        const row = fbq.byId.get(+mfb[1]); if (!row) return send(res, 404, { error: "Unbekannt." });
        if (req.method === "DELETE") { fbq.del.run(row.id); return send(res, 200, { ok: true }); }
        if (req.method === "POST") {
          const b = await readJson(req), st = FB_STATUS.includes(b.status) ? b.status : row.status, reply = b.reply === undefined ? row.reply : clean(b.reply, 2000), note = b.note === undefined ? row.note : clean(b.note, 2000);
          fbq.upd.run(st, note, reply, reply !== row.reply && reply ? Date.now() : row.reply_ts, row.id); return send(res, 200, { ok: true });
        }
      }
      if (p === "/api/admin/mail" && req.method === "GET" && scope) { const sent = q.kvGet.get("fmail_sent:" + scope.id); return send(res, 200, { configured: transportOn() && !!scope.weekly, to: scope.email, day: MAIL.day, hour: MAIL.hour, lastWeek: sent ? sent.val : null, family: true }); }
      if (p === "/api/admin/mail/test" && req.method === "POST" && scope) {
        try { const c = mailContent(fq.kids.all(scope.fid).filter(x => !x.hidden), DASH_URL + "/f/"); await deliver({ to: scope.email, subject: c.subject, html: c.html, text: c.text }); return send(res, 200, { ok: true }); } catch (e) { return send(res, 200, { ok: false, error: String(e.message).slice(0, 200) }); }
      }
      if (p === "/api/admin/mail" && req.method === "POST") {
        const b = await readJson(req), list = String(b.to || "").split(/[,;\s]+/).filter(Boolean);
        if (list.length > 5 || list.some(a => !/^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/.test(a) || a.length > 120)) return send(res, 400, { error: "Bitte gültige Mail-Adressen eintragen (höchstens 5, mit Komma getrennt)." });
        if (list.length) q.kvSet.run("mail_to", list.join(",")); else db.prepare("DELETE FROM kv WHERE key = 'mail_to'").run();
        return send(res, 200, { ok: true });
      }
      if (p === "/api/admin/mail" && req.method === "GET") { const sent = q.kvGet.get("mail_sent"); return send(res, 200, { configured: mailOn(), transport: transportOn(), to: mailTo(), day: MAIL.day, hour: MAIL.hour, lastWeek: sent ? sent.val : null }); }
      if (p === "/api/admin/mail/test" && req.method === "POST") {
        try { await sendWeekly(); return send(res, 200, { ok: true }); } catch (e) { return send(res, 200, { ok: false, error: String(e.message).replace(MAIL.pass || "\u0000", "***").replace(GRAPH.clientSecret || "\u0000", "***").slice(0, 300) }); }
      }
      if (p === "/api/admin/players" && req.method === "GET") return send(res, 200, adminPlayers(url.searchParams.get("hidden") === "1", scope));
      if (p === "/api/admin/players" && req.method === "POST") {
        const b = await readJson(req), name = clean(b.name, 20);
        if (!name) return send(res, 400, { error: "Name fehlt." });
        if (isT) return send(res, 403, { error: "Lehrkraft-Konten haben keine Kinder." });
        if (nameTaken(name, scope, 0)) return send(res, 400, { error: "Es gibt schon einen Spieler mit diesem Namen. Bitte unterscheide sie, z. B. „Mia L.“ und „Mia K.“." });
        if (scope && fq.kids.all(scope.fid).length >= MAX_KIDS) return send(res, 400, { error: "Es sind höchstens " + MAX_KIDS + " Kinder pro Konto möglich." });
        const id = scope ? +fq.addKid.run(name, Date.now(), scope.fid).lastInsertRowid : +q.addPlayer.run(name, Date.now(), b.hidden ? 1 : 0).lastInsertRowid;
        if (!scope && !b.hidden) { sq.setSocial.run(1, id); fcodeOf(id); }   // Testphase: vom Betreiber angelegte Spieler starten mit eingeschalteten Freunden
        return send(res, 200, { id, name, hidden: !!b.hidden, invite: newInvite(id) });
      }
      const mu = p.match(/^\/api\/admin\/players\/(\d+)\/unit\/([A-Za-z0-9_.\-]{1,30})$/);
      if (mu && req.method === "GET") { if (!famPlayer(q.player.get(+mu[1]), scope)) return send(res, 404, { error: "Unbekannt." }); const [c, b] = unitDetail(+mu[1], mu[2]); return send(res, c, b); }
      const mw = p.match(/^\/api\/admin\/players\/(\d+)\/words$/);
      if (mw && req.method === "GET") { if (!famPlayer(q.player.get(+mw[1]), scope)) return send(res, 404, { error: "Unbekannt." }); return send(res, 200, allWords(+mw[1])); }
      const mg = p.match(/^\/api\/admin\/(goals|plans)\/(\d+)$/);
      if (mg && req.method === "DELETE") { const row = (mg[1] === "goals" ? q.goal : q.plan).get(+mg[2]); if (!row || !famPlayer(q.player.get(row.player), scope)) return send(res, 404, { error: "Unbekannt." }); (mg[1] === "goals" ? q.delGoal : q.delPlan).run(+mg[2]); return send(res, 200, { ok: true }); }
      const mfr = p.match(/^\/api\/admin\/players\/(\d+)\/friends\/(\d+)$/);
      if (mfr && req.method === "POST") {
        const pid = +mfr[1], oid = +mfr[2]; if (!famPlayer(q.player.get(pid), scope)) return send(res, 404, { error: "Unbekannt." });
        const [lo, hi] = pairOf(pid, oid), f = sq.fr.get(lo, hi); if (!f) return send(res, 404, { error: "Unbekannt." });
        const act = clean((await readJson(req)).action, 10);
        if (act === "approve") { (pid === lo ? sq.okLo : sq.okHi).run(lo, hi); return send(res, 200, { ok: true }); }
        if (act === "remove") { sq.delFr.run(lo, hi); return send(res, 200, { ok: true }); }
        return send(res, 400, { error: "Unbekannte Aktion." });
      }
      if (p === "/api/admin/look.svg" && req.method === "GET") {   // Figur oder Sticker als Bild (Dashboard); nur Zeichnen, keine Spielerdaten
        const av = url.searchParams.get("av") || "", svg = AVATAR_RE.test(av) ? LOOK.render(av, url.searchParams.get("acc"), url.searchParams.get("k") === "stk" ? "stk" : "fig") : null;
        if (!svg) return send(res, 404, { error: "Kein Bild." });
        res.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" }); return res.end(svg);
      }
      const m = p.match(/^\/api\/admin\/players\/(\d+)(?:\/(\w+))?$/);
      if (m) {
        const pid = +m[1], pl = q.player.get(pid);
        if (!famPlayer(pl, scope)) return send(res, 404, { error: "Unbekannt." });
        if (!m[2] && req.method === "GET") return send(res, 200, { id: pid, name: pl.name });
        if (m[2] === "report" && req.method === "GET") return send(res, 200, Object.assign(report(pid, Math.min(90, Math.max(7, +url.searchParams.get("days") || 30))), { famRewards: famRewardsOn() }));
        if (m[2] === "analysis" && req.method === "GET") return send(res, 200, analysis(pid, +url.searchParams.get("days") || 90));
        if (m[2] === "customplan" && req.method === "GET") {
          const st = customplanStore(pid);
          return send(res, 200, { raw: st.raw, days: st.days, types: PLAN_TYPES, games: Object.entries(PLAN_GAMES).map(([id, g]) => ({ id, icon: g[0], name: g[1], kind: g[2] })), grammar: Object.entries(GRAM_TOPICS).map(([id, g]) => ({ id, icon: g[0], title: g[1] })), units: UNITS.map(u => ({ id: u.id, k: u.k, title: u.title })), active: !!(st.raw || Object.keys(st.days).length) });
        }
        if (m[2] === "customplan" && req.method === "POST") {
          const b = await readJson(req), st = customplanStore(pid), day = String(b.day == null ? "all" : b.day);
          if (day !== "all" && !/^[0-6]$/.test(day)) return send(res, 400, { error: "Wochentag ungültig." });
          if (b.clear) { if (day === "all") st.raw = null; else delete st.days[day]; }
          else {
            const v = planBlocks(b.blocks); if (v.error) return send(res, 400, { error: v.error });
            const raw = b.blocks.map(x => ({ t: String(x.t), min: Math.round(+x.min), unit: x.unit ? String(x.unit) : "", game: x.game ? String(x.game) : "", topic: x.topic ? String(x.topic) : "" }));
            if (day === "all") st.raw = raw; else st.days[day] = raw;
          }
          st.ts = Date.now(); q.kvSet.run("customplan:" + pid, JSON.stringify(st));
          return send(res, 200, { ok: true, active: !!(st.raw || Object.keys(st.days).length), days: st.days, raw: st.raw });
        }
        if (m[2] === "dayplan" && req.method === "GET") { dayplanCache.delete(pid); return send(res, 200, { on: dayplanOn(pid), plan: dayplanOf(pid) }); }
        if (m[2] === "dayplan" && req.method === "POST") { const b = await readJson(req); q.kvSet.run("dayplan:" + pid, JSON.stringify({ on: b.on !== false })); return send(res, 200, { ok: true, on: b.on !== false }); }
        if (m[2] === "states" && req.method === "GET") return send(res, 200, q.stateList.all(pid).map(stateMeta));
        if (m[2] === "state" && req.method === "GET") {
          const day = url.searchParams.get("day"); if (day && !/^\d{4}-\d\d-\d\d$/.test(day)) return send(res, 400, { error: "Datum ungültig." });
          const r = day ? q.stateDay.get(pid, day) : q.latestState.get(pid);
          if (!r) return send(res, 404, { error: "Keine Sicherung vorhanden." });
          res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Disposition": 'attachment; filename="wordy-lernstand-' + String(pl.name).replace(/[^A-Za-z0-9_-]/g, "_") + "-" + r.day + '.json"' });
          return res.end(r.d);
        }
        if (m[2] === "social" && req.method === "GET") { const me = sq.me.get(pid), cr = cq.crewOf.get(pid); return send(res, 200, { enabled: !!me.social, code: me.social ? fcodeOf(pid) : null, friends: friendsOf(pid), crew: cr ? { name: cr.name, emoji: cr.emoji, members: cq.members.all(cr.id).map(x => sq.me.get(x.player).name) } : null }); }
        if (m[2] === "class" && req.method === "GET") { const cm = kq.memberOf.get(pid); return send(res, 200, cm ? { state: cm.status === "ok" ? "member" : "pending", name: cm.name, teacher: cm.tname } : { state: "none" }); }
        if (m[2] === "class" && req.method === "POST") {
          const act = clean((await readJson(req)).action, 10), cm = kq.memberOf.get(pid); if (!cm) return send(res, 404, { error: "Keine Klasse." });
          if (act === "approve" && cm.status === "pending") { kq.setStatus.run("ok", pid); return send(res, 200, { ok: true }); }
          if (act === "decline" || act === "leave") { kq.delMember.run(pid); return send(res, 200, { ok: true }); }
          return send(res, 400, { error: "Unbekannte Aktion." });
        }
        if (m[2] === "crewleave" && req.method === "POST") { crewLeave(pid); return send(res, 200, { ok: true }); }
        if (m[2] === "social" && req.method === "POST") { const on = !!(await readJson(req)).enabled; sq.setSocial.run(on ? 1 : 0, pid); if (on) fcodeOf(pid); return send(res, 200, { ok: true }); }
        if (m[2] === "goals" && req.method === "GET") return send(res, 200, weekGoals(pid));
        if (m[2] === "goals" && req.method === "POST") { const gb = await readJson(req); if (scope && !famRewardsOn()) { gb.coins = 0; gb.item = ""; } const [c, b] = createGoal(pid, gb); return send(res, c, b); }
        if (m[2] === "plans" && req.method === "GET") return send(res, 200, plansOf(pid));
        if (m[2] === "plans" && req.method === "POST") { const pb = await readJson(req); if (scope && !famRewardsOn()) { pb.coins = 0; pb.item = ""; } const [c, b] = createPlan(pid, pb); return send(res, c, b); }
        if (m[2] === "push" && req.method === "GET") return send(res, 200, pushView(pid));
        if (m[2] === "push" && req.method === "POST") {
          const b = await readJson(req), st = pushState(pid);
          if (b.action === "startnow") {   // sofort senden, danach alle N Stunden im Zeitfenster
            const pl2 = q.player.get(pid), t = pushTodayInfo(pid), n = await pushSendTo(pid, pushMessage(pid, pl2.name, t.streak, Math.floor(Date.now() / 3600000)));
            st.on = true; st.lastTs = Date.now(); st.last = dayOf(Date.now()); pushSave(pid, st);
            return send(res, 200, Object.assign(pushView(pid), { sent: n }));
          }
          if (typeof b.on === "boolean") st.on = b.on;
          if (TIME_RE.test(b.time || "")) st.time = b.time;
          if (TIME_RE.test(b.until || "")) st.until = b.until;
          if (b.every != null) { const ev = Math.round(+b.every); if (ev >= 0 && ev <= 12) st.every = ev; }
          if (st.until <= st.time) return send(res, 400, { error: "Das Ende des Zeitfensters muss nach dem Beginn liegen." });
          pushSave(pid, st); return send(res, 200, pushView(pid));
        }
        if (m[2] === "weekplan" && req.method === "GET") return send(res, 200, weekPlanOf(pid));
        if (m[2] === "weekplan" && req.method === "POST") { const [c, b] = setWeekPlan(pid, await readJson(req)); return send(res, c, b); }
        if (m[2] === "season" && scope && !famRewardsOn()) return send(res, 403, { error: "Der Wochenpass wird vom Betreiber zusammengestellt." });
        if (m[2] === "season" && req.method === "GET") return send(res, 200, seasonOf(pid));
        if (m[2] === "season" && req.method === "POST") { const [c, b] = setSeason(pid, await readJson(req)); return send(res, c, b); }
        if ((m[2] === "gifts" || m[2] === "coinfactor") && scope && !famRewardsOn()) return send(res, 403, { error: "Extramünzen und der Münzfaktor sind dem Betreiber vorbehalten." });
        if (m[2] === "gifts" && req.method === "GET") return send(res, 200, giftsOf(pid).slice(-20));
        if (m[2] === "gifts" && req.method === "POST") { const [c, b] = addGift(pid, await readJson(req)); return send(res, c, b); }
        if (m[2] === "coinfactor" && req.method === "GET") return send(res, 200, { factor: coinFactorOf(pid) });
        if (m[2] === "coinfactor" && req.method === "POST") { const [c, b] = setCoinFactor(pid, await readJson(req)); return send(res, c, b); }
        if (m[2] === "selfchoose" && req.method === "GET") return send(res, 200, { on: selfChooseOf(pid) });
        if (m[2] === "selfchoose" && req.method === "POST") { const [c, b] = setSelfChoose(pid, await readJson(req)); return send(res, c, b); }
        if (m[2] === "look" && scope) return send(res, 403, { error: "Die Look-Vorgabe ist dem Betreiber vorbehalten." });
        if (m[2] === "look" && req.method === "GET") return send(res, 200, { look: lookForceOf(pid) });
        if (m[2] === "look" && req.method === "POST") { const [c, b] = setLookForce(pid, await readJson(req)); return send(res, c, b); }
        if (m[2] === "bossdiff" && req.method === "GET") return send(res, 200, { diff: bossDiffOf(pid) });
        if (m[2] === "bossdiff" && req.method === "POST") { const [c, b] = setBossDiff(pid, await readJson(req)); return send(res, c, b); }
        if (m[2] === "pathunits" && req.method === "GET") return send(res, 200, pathUnitsOf(pid));
        if (m[2] === "pathunits" && req.method === "POST") { const [c, b] = setPathUnits(pid, await readJson(req)); return send(res, c, b); }
        if (m[2] === "catalog" && req.method === "GET") { const c = snap(pid, "catalog"); return send(res, 200, c ? c.d : []); }
        if (m[2] === "invite" && req.method === "POST") return send(res, 200, newInvite(pid));
        if (m[2] === "rename" && req.method === "POST") {
          const name = clean((await readJson(req)).name, 20); if (!name) return send(res, 400, { error: "Name fehlt." });
          if (nameTaken(name, scope, pid)) return send(res, 400, { error: "Es gibt schon einen Spieler mit diesem Namen. Bitte unterscheide sie, z. B. „Mia L.“ und „Mia K.“." });
          q.renamePlayer.run(name, pid); return send(res, 200, { ok: true });
        }
        if (m[2] === "hidden" && req.method === "POST") { q.setHidden.run((await readJson(req)).hidden ? 1 : 0, pid); return send(res, 200, { ok: true }); }
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
