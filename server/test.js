/* Ende-zu-Ende-Test: node server/test.js  (startet einen Wegwerf-Server mit eigener Datenbank) */
"use strict";
const { spawn } = require("node:child_process");
const os = require("node:os"), path = require("node:path"), fs = require("node:fs"), assert = require("node:assert");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wordy-"));
const PORT = 18900 + Math.floor(Math.random() * 500), base = "http://127.0.0.1:" + PORT;
const auth = "Basic " + Buffer.from("eltern:test-passwort-123").toString("base64");
const srv = spawn(process.execPath, [path.join(__dirname, "server.js")], { env: Object.assign({}, process.env, { PORT, DB_FILE: path.join(dir, "t.db"), ADMIN_PASSWORD: "test-passwort-123" }), stdio: "inherit" });
const wait = ms => new Promise(r => setTimeout(r, ms));
const J = (p, o) => fetch(base + p, o).then(async r => ({ s: r.status, j: await r.json().catch(() => null) }));
(async () => {
  try {
    for (let i = 0; i < 40; i++) { try { await fetch(base + "/healthz"); break; } catch (e) { await wait(100); } }
    assert.equal((await J("/api/admin/players")).s, 401, "Dashboard ohne Anmeldung gesperrt");
    assert.equal((await J("/api/events", { method: "POST", body: "{}" })).s, 401, "Events ohne Token gesperrt");
    const H = { Authorization: auth, "Content-Type": "application/json" };
    const mk = await J("/api/admin/players", { method: "POST", headers: H, body: JSON.stringify({ name: "Magnus" }) });
    assert.equal(mk.s, 200); const code = mk.j.invite.code;
    assert.equal((await J("/api/pair", { method: "POST", body: JSON.stringify({ code: "ZZZZ-ZZZZ" }) })).s, 400, "falscher Code");
    const pr = await J("/api/pair", { method: "POST", body: JSON.stringify({ code: code.toLowerCase(), device: "Test" }) });
    assert.equal(pr.s, 200); const T = { Authorization: "Bearer " + pr.j.token, "Content-Type": "application/json" };
    assert.equal((await J("/api/pair", { method: "POST", body: JSON.stringify({ code }) })).s, 400, "Code nur einmal");
    const now = Date.now();
    const evs = [
      { i: "e1", t: now - 5000, k: "a", d: { id: "H2-1a#0", g: 2, b: 0, a: 1, en: "mountain", de: "Berg", u: "H2-1a" } },
      { i: "e2", t: now - 4000, k: "a", d: { id: "H2-1a#1", g: 0, b: 1, a: 0, en: "lake", de: "See", u: "H2-1a" } },
      { i: "e3", t: now - 3000, k: "ss", d: { sec: 700, items: 2, correct: 1, mode: "mix", coins: 4 } },
      { i: "e4", t: now - 2000, k: "buy", d: { id: "av:🐼", name: "Panda", cost: 40 } }
    ];
    let r = await J("/api/events", { method: "POST", headers: T, body: JSON.stringify({ events: evs }) });
    assert.equal(r.j.stored, 4);
    r = await J("/api/events", { method: "POST", headers: T, body: JSON.stringify({ events: evs }) });
    assert.equal(r.j.stored, 0, "doppelt gesendet wird nicht doppelt gespeichert");
    await J("/api/snapshot", { method: "POST", headers: T, body: JSON.stringify({
      words: { "H2-1a#0": [1, 1, 0, now], "H2-1a#1": [0, 0, 1, now], "H2-1a#2": [4, 5, 0, now] },
      catalog: [{ id: "H2-1a", title: "Unit 1", k: "Headlight 2", total: 37 }], meta: { coins: 12, rank: "Bronze I", streak: 3, goalMin: 10 } }) });
    const rep = await J("/api/admin/players/" + mk.j.id + "/report?days=14", { headers: H });
    assert.equal(rep.s, 200);
    const today = rep.j.days[rep.j.days.length - 1];
    assert.equal(today.items, 2); assert.equal(today.correct, 1); assert.equal(today.sec, 700); assert.equal(today.neu, 1);
    assert.equal(rep.j.problems[0].en, "lake");
    assert.equal(rep.j.units[0].mastered, 1); assert.equal(rep.j.units[0].seen, 2);
    assert.equal(rep.j.buys[0].name, "Panda");
    const pl = await J("/api/admin/players", { headers: H });
    assert.equal(pl.j[0].events, 4);
    const page = await fetch(base + "/", { headers: { Authorization: auth } });
    assert.equal(page.status, 200);
    await J("/api/admin/players/" + mk.j.id + "/revoke", { method: "POST", headers: H });
    assert.equal((await J("/api/events", { method: "POST", headers: T, body: "{}" })).s, 401, "nach Trennen gesperrt");
    console.log("Alle Prüfungen bestanden.");
  } catch (e) { console.error("FEHLER:", e.message); process.exitCode = 1; }
  srv.kill(); fs.rmSync(dir, { recursive: true, force: true });
})();
