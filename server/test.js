/* Ende-zu-Ende-Test: node server/test.js  (startet einen Wegwerf-Server mit eigener Datenbank) */
"use strict";
const { spawn } = require("node:child_process");
const os = require("node:os"), path = require("node:path"), fs = require("node:fs"), assert = require("node:assert");
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "wordy-"));
const PORT = 18900 + Math.floor(Math.random() * 500), base = "http://127.0.0.1:" + PORT;
const auth = "Basic " + Buffer.from("eltern:test-passwort-123").toString("base64");
const net = require("node:net");
let mailGot = "";
const smtpPort = 19900 + Math.floor(Math.random() * 90);
const fake = net.createServer(c => {
  let data = false, buf = "";
  c.write("220 fake\r\n");
  c.on("data", d => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf("\r\n")) >= 0) {
      const l = buf.slice(0, i); buf = buf.slice(i + 2);
      if (data) { if (l === ".") { data = false; c.write("250 ok\r\n"); } else mailGot += l + "\n"; continue; }
      if (/^EHLO/.test(l)) c.write("250-fake\r\n250 AUTH PLAIN\r\n");
      else if (/^AUTH/.test(l)) c.write("235 ok\r\n");
      else if (/^(MAIL|RCPT)/.test(l)) c.write("250 ok\r\n");
      else if (l === "DATA") { data = true; c.write("354 go\r\n"); }
      else if (l === "QUIT") { c.write("221 bye\r\n"); c.end(); }
    }
  });
}).listen(smtpPort, "127.0.0.1");
const srv = spawn(process.execPath, [path.join(__dirname, "server.js")], { env: Object.assign({}, process.env, { PORT, DB_FILE: path.join(dir, "t.db"), ADMIN_PASSWORD: "test-passwort-123", SMTP_HOST: "127.0.0.1", SMTP_PORT: String(smtpPort), SMTP_SECURE: "none", SMTP_USER: "u", SMTP_PASSWORD: "p", MAIL_FROM: "Wordy <w@example.org>", MAIL_TO: "eltern@example.org" }), stdio: "inherit" });
const wait = ms => new Promise(r => setTimeout(r, ms));
const T2 = t => ({ Authorization: "Bearer " + t, "Content-Type": "application/json" });
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
    assert.equal(today.runs.length, 1); assert.equal(today.runs[0].sec, 700); assert.equal(today.problems[0].en, "lake", "Tagesdetail");
    assert.equal(rep.j.today.date, today.date); assert.equal(rep.j.today.items, 2); assert.equal(rep.j.today.sec, 700); assert.equal(rep.j.today.problems[0].en, "lake");
    assert.equal(rep.j.today.runs.length, 1, "Runden heute");
    const cw = rep.j.calWeek; assert.equal(cw.days.length, 7); assert.ok(cw.from <= today.date && today.date <= cw.to, "Heute liegt in der Woche");
    assert.equal(new Date(cw.from + "T00:00:00Z").getUTCDay(), 1, "Woche beginnt am Montag"); assert.ok(cw.items >= 2 && cw.sec >= 700, "Woche enthält heute"); assert.equal(cw.prev.items, 0);
    assert.equal(rep.j.units[0].mastered, 1); assert.equal(rep.j.units[0].seen, 2);
    assert.equal(rep.j.buys[0].name, "Panda");
    const pl = await J("/api/admin/players", { headers: H });
    assert.equal(pl.j[0].events, 4);
    const page = await fetch(base + "/", { headers: { Authorization: auth } });
    assert.equal(page.status, 200);

    // ---- Wochenziele, Lernplan, Abholen, Einheitsdetail, Mail
    const catalog = [{ id: "H2-1a", title: "Headlight 2 · Unit 1 · Together again (1)", k: "Headlight 2", total: 37 }];
    await J("/api/snapshot", { method: "POST", headers: T2(pr.j.token), body: JSON.stringify({ texts: { "H2-1a": [["mountain", "Berg"], ["lake", "See"]] }, catalog }) });
    const mkGoal = b => J("/api/admin/players/" + mk.j.id + "/goals", { method: "POST", headers: H, body: JSON.stringify(b) });
    assert.equal((await mkGoal({ kind: "bogus", target: 5 })).s, 400, "unbekannte Art");
    assert.equal((await mkGoal({ kind: "unit", target: 80, scope: [] })).s, 400, "Einheit fehlt");
    const g1 = await mkGoal({ kind: "minutes", target: 10, coins: 30 });
    const g2 = await mkGoal({ kind: "unit", target: 5, coins: 20, scope: ["H2-1a"] });
    assert.equal(g1.s, 200); assert.equal(g2.s, 200);
    const gl = await J("/api/admin/players/" + mk.j.id + "/goals", { headers: H });
    const m1 = gl.j.find(g => g.kind === "minutes");
    assert.equal(m1.cur, 12, "700 Sekunden = 12 Minuten"); assert.equal(m1.done, true);
    assert.equal(gl.j.find(g => g.kind === "unit").cur, 3, "1 von 37 Wörtern sicher = 3 %");
    assert.ok(gl.j.find(g => g.kind === "unit").title.includes("Unit 1"), "Titel nennt die Einheit");
    const tomorrow = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 3 * 86400000));
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/plans", { method: "POST", headers: H, body: JSON.stringify({ title: "Arbeit", exam: "2020-01-01", units: ["H2-1a"] }) })).s, 400, "Datum in der Vergangenheit");
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/plans", { method: "POST", headers: H, body: JSON.stringify({ title: "Arbeit Unit 1", exam: tomorrow, units: ["H2-1a"], coins: 50 }) })).s, 200);
    const sy = await J("/api/sync", { headers: { Authorization: "Bearer " + pr.j.token } });
    assert.equal(sy.s, 200); assert.equal(sy.j.goals.length, 2); assert.equal(sy.j.plans[0].units[0], "H2-1a");
    assert.equal((await J("/api/sync")).s, 401, "Abholen nur mit Schlüssel");
    const ud = await J("/api/admin/players/" + mk.j.id + "/unit/H2-1a", { headers: H });
    assert.equal(ud.j.words[0].en, "mountain"); assert.equal(ud.j.words[0].lv, 1); assert.equal(ud.j.words[2].lv, 4);
    assert.equal(ud.j.words.length, 37);
    const aw = await J("/api/admin/players/" + mk.j.id + "/words", { headers: H });
    assert.equal(aw.s, 200); assert.ok(aw.j.words.length >= 3, "Wörterliste"); assert.equal(aw.j.words.find(x => x.i === 0 && x.u === "H2-1a").en, "mountain");
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/words")).s, 401, "Wörterliste nur für Admin");
    const pg = await J("/api/ping", { method: "POST", headers: T });
    assert.equal(pg.j.hidden, false, "Ping nennt den Modus");
    await J("/api/admin/players/" + mk.j.id + "/hidden", { method: "POST", headers: H, body: JSON.stringify({ hidden: true }) });
    assert.equal((await J("/api/ping", { method: "POST", headers: T })).j.hidden, true, "Modus nach Umstellung");
    await J("/api/admin/players/" + mk.j.id + "/hidden", { method: "POST", headers: H, body: JSON.stringify({ hidden: false }) });
    assert.deepEqual((await J("/api/admin/players/" + mk.j.id + "/pathunits", { headers: H })).j, [], "Pfad: Standard leer");
    const pu = await J("/api/admin/players/" + mk.j.id + "/pathunits", { method: "POST", headers: H, body: JSON.stringify({ units: ["H2-1a", "nicht-da", "H2-2a"] }) });
    assert.deepEqual(pu.j.units, ["H2-1a"], "Pfad: nur bekannte Einheiten");
    const sy2 = await J("/api/sync", { headers: T }); assert.deepEqual(sy2.j.pathUnits, ["H2-1a"], "Pfad-Einheiten kommen in der App an");
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/bossdiff", { headers: H })).j.diff, "normal", "Boss: Standard normal");
    await J("/api/admin/players/" + mk.j.id + "/bossdiff", { method: "POST", headers: H, body: JSON.stringify({ diff: "leicht" }) });
    assert.equal((await J("/api/sync", { headers: T })).j.bossDiff, "leicht", "Boss-Schwierigkeit kommt in der App an");
    await J("/api/admin/players/" + mk.j.id + "/bossdiff", { method: "POST", headers: H, body: JSON.stringify({ diff: "quatsch" }) });
    assert.equal((await J("/api/sync", { headers: T })).j.bossDiff, "normal", "Boss: ungültiger Wert wird normal");
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/gifts", { method: "POST", headers: H, body: JSON.stringify({ coins: 0 }) })).s, 400, "Geschenk: 0 Münzen abgelehnt");
    const gf = await J("/api/admin/players/" + mk.j.id + "/gifts", { method: "POST", headers: H, body: JSON.stringify({ coins: 25, note: "Tolle Woche!" }) });
    assert.equal(gf.j.gift.coins, 25, "Geschenk gespeichert");
    assert.equal((await J("/api/sync", { headers: T })).j.gifts[0].note, "Tolle Woche!", "Geschenk kommt in der App an");
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/coinfactor", { headers: H })).j.factor, 1, "Münzfaktor: Standard 1");
    await J("/api/admin/players/" + mk.j.id + "/coinfactor", { method: "POST", headers: H, body: JSON.stringify({ factor: 1.5 }) });
    assert.equal((await J("/api/sync", { headers: T })).j.coinFactor, 1.5, "Münzfaktor kommt in der App an");
    await J("/api/admin/players/" + mk.j.id + "/coinfactor", { method: "POST", headers: H, body: JSON.stringify({ factor: 7 }) });
    assert.equal((await J("/api/sync", { headers: T })).j.coinFactor, 1, "Münzfaktor: ungültig wird 1");
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/weekplan", { headers: H })).j, null, "Wochenplan: Standard leer");
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/weekplan", { method: "POST", headers: H, body: JSON.stringify({ min: [10, 10] }) })).s, 400, "Wochenplan braucht sieben Werte");
    const wpost = await J("/api/admin/players/" + mk.j.id + "/weekplan", { method: "POST", headers: H, body: JSON.stringify({ min: [10, 10, 15, 10, 10, 0, 999], bonus: 30 }) });
    assert.deepEqual(wpost.j.plan, { min: [10, 10, 15, 10, 10, 0, 180], bonus: 30 }, "Wochenplan gespeichert und begrenzt");
    assert.deepEqual((await J("/api/sync", { headers: T })).j.weekPlan, wpost.j.plan, "Wochenplan kommt in der App an");
    await J("/api/admin/players/" + mk.j.id + "/weekplan", { method: "POST", headers: H, body: JSON.stringify({ clear: true }) });
    assert.equal((await J("/api/sync", { headers: T })).j.weekPlan, null, "Wochenplan gelöscht");
    const inf = await J("/api/admin/info", { headers: H });
    assert.equal(inf.s, 200); assert.equal(inf.j.version, require("../package.json").version, "Server-Version"); assert.ok(inf.j.started > 0);
    assert.equal((await J("/api/admin/info")).s, 401, "Info nur für Admin");
    const plr = await J("/api/admin/players/" + mk.j.id + "/plans", { headers: H });
    assert.equal(plr.j[0].daysLeft, 3);
    const ml = await J("/api/admin/mail/test", { method: "POST", headers: H });
    assert.equal(ml.j.ok, true, "Testmail: " + (ml.j.error || ""));
    const decoded = (mailGot.match(/^[A-Za-z0-9+\/=]{20,}$/gm) || []).map(x => Buffer.from(x, "base64").toString("utf8")).join("\n");
    assert.ok(/Magnus/.test(decoded) && /Übungszeit/.test(decoded) && /Wochenziele/.test(decoded) && /Lernplan/.test(decoded), "Mail enthält Spieler, Zeit, Ziele, Lernplan");
    assert.ok(decoded.includes("https://track.wordy.explusmore.com"), "Mail enthält den Dashboard-Link");
    assert.ok(/Subject: =\?UTF-8/.test(mailGot) || /Subject: Wordy/.test(mailGot), "Betreff vorhanden");

    // ---- Vollständige Sicherung des Lernstands
    const stFull = { v: 2, coins: 77, xp: 5, settings: { klassen: ["Headlight 2"] }, w: { "H2-1a#0": { reps: 2, iv: 3 }, "H2-1a#1": { reps: 1 } }, profile: { owned: ["av:🦊"] } };
    assert.equal((await J("/api/state", { method: "PUT", headers: T2(pr.j.token), body: JSON.stringify({ state: { v: 1 } }) })).s, 400, "ungültiger Stand");
    assert.equal((await J("/api/state", { method: "PUT", headers: T2(pr.j.token), body: JSON.stringify({ state: stFull }) })).s, 200);
    const empty = { v: 2, coins: 0, xp: 0, settings: {}, w: {} };
    assert.equal((await J("/api/state", { method: "PUT", headers: T2(pr.j.token), body: JSON.stringify({ state: empty }) })).s, 409, "leerer Stand ersetzt keine Sicherung");
    const sl = await J("/api/state/list", { headers: T2(pr.j.token) });
    assert.equal(sl.j.items.length, 1); assert.equal(sl.j.items[0].words, 2); assert.equal(sl.j.items[0].coins, 77);
    const sg = await J("/api/state", { headers: T2(pr.j.token) });
    assert.equal(sg.j.state.coins, 77); assert.equal(sg.j.state.w["H2-1a#0"].iv, 3, "Stand kommt unverändert zurück");
    assert.equal((await J("/api/state?day=2020-01-01", { headers: T2(pr.j.token) })).s, 404);
    assert.equal((await J("/api/state")).s, 401, "Sicherung nur mit Schlüssel");
    const dl = await fetch(base + "/api/admin/players/" + mk.j.id + "/state", { headers: { Authorization: auth } });
    assert.equal(dl.status, 200); assert.ok(/attachment/.test(dl.headers.get("content-disposition")), "Download als Datei");
    assert.equal((await dl.json()).coins, 77);
    const rp2 = await J("/api/admin/players/" + mk.j.id + "/report?days=14", { headers: H });
    assert.equal(rp2.j.backups.length, 1, "Dashboard kennt die Sicherung");

    // ---- "Nur sichern, nicht anzeigen"
    const hk = await J("/api/admin/players", { method: "POST", headers: H, body: JSON.stringify({ name: "Christian", hidden: true }) });
    assert.equal(hk.j.hidden, true);
    const hp = await J("/api/pair", { method: "POST", body: JSON.stringify({ code: hk.j.invite.code, device: "Test" }) });
    assert.equal(hp.j.hidden, true, "App erfährt, dass nur gesichert wird");
    const HT = T2(hp.j.token);
    assert.equal((await J("/api/events", { method: "POST", headers: HT, body: JSON.stringify({ events: [{ i: "h1", t: Date.now(), k: "a", d: { id: "x", g: 1 } }] }) })).j.stored, 0, "keine Lernereignisse gespeichert");
    await J("/api/snapshot", { method: "POST", headers: HT, body: JSON.stringify({ meta: { coins: 1 } }) });
    assert.equal((await J("/api/state", { method: "PUT", headers: HT, body: JSON.stringify({ state: stFull }) })).s, 200, "Sicherung wird gespeichert");
    assert.equal((await J("/api/state", { headers: HT })).j.state.coins, 77, "und lässt sich abrufen");
    const vis = await J("/api/admin/players", { headers: H });
    assert.ok(!vis.j.some(x => x.name === "Christian"), "in der Übersicht nicht sichtbar");
    const hid = await J("/api/admin/players?hidden=1", { headers: H });
    assert.equal(hid.j.length, 1); assert.equal(hid.j[0].backup.words, 2); assert.equal(hid.j[0].events, 0);
    assert.equal((await J("/api/admin/players/" + hk.j.id + "/goals", { method: "POST", headers: H, body: JSON.stringify({ kind: "minutes", target: 5 }) })).s, 400, "keine Ziele für nur gesicherte Spieler");
    mailGot = "";
    assert.equal((await J("/api/admin/mail/test", { method: "POST", headers: H })).j.ok, true);
    const dec2 = (mailGot.match(/^[A-Za-z0-9+\/=]{20,}$/gm) || []).map(x => Buffer.from(x, "base64").toString("utf8")).join("\n");
    assert.ok(/Magnus/.test(dec2) && !/Christian/.test(dec2), "Wochenmail zeigt nur sichtbare Spieler");
    await J("/api/admin/players/" + hk.j.id + "/hidden", { method: "POST", headers: H, body: JSON.stringify({ hidden: false }) });
    assert.ok((await J("/api/admin/players", { headers: H })).j.some(x => x.name === "Christian"), "nach Umschalten sichtbar");
    await J("/api/admin/players/" + mk.j.id + "/revoke", { method: "POST", headers: H });
    assert.equal((await J("/api/events", { method: "POST", headers: T, body: "{}" })).s, 401, "nach Trennen gesperrt");
    console.log("Alle Prüfungen bestanden.");
  } catch (e) { console.error("FEHLER:", e.message); process.exitCode = 1; }
  srv.kill(); fake.close(); fs.rmSync(dir, { recursive: true, force: true });
})();
