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
    assert.ok(/^https:\/\/wordy\.explusmore\.com\/#verbinden=/.test(mk.j.invite.link) && decodeURIComponent(mk.j.invite.link.split("=")[1]).endsWith("#" + code), "Verbindungslink");
    assert.equal((await J("/api/admin/players", { method: "POST", headers: H, body: JSON.stringify({ name: "magnus " }) })).s, 400, "gleicher Name abgelehnt");
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
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/season", { headers: H })).j, null, "Pass: Standard leer");
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/season", { method: "POST", headers: H, body: JSON.stringify({ weeks: [] }) })).s, 400, "Pass braucht Wochen");
    const se = await J("/api/admin/players/" + mk.j.id + "/season", { method: "POST", headers: H, body: JSON.stringify({ title: "Test", weeks: [{ title: "W1", need: 9, items: ["av:eisbaer", "böse id", "dn:eislauf"], slot: 1, coins: 999 }], finale: { title: "F", items: ["fr:eis"], coins: 10 } }) });
    assert.equal(se.j.season.weeks[0].need, 7, "Pass: Tage begrenzt"); assert.equal(se.j.season.weeks[0].coins, 500, "Pass: Münzen begrenzt"); assert.deepEqual(se.j.season.weeks[0].items, ["av:eisbaer", "dn:eislauf"], "Pass: nur gültige Artikel");
    const se2 = await J("/api/admin/players/" + mk.j.id + "/season", { method: "POST", headers: H, body: JSON.stringify({ title: "Test2", weeks: [{ title: "W1", need: 3, items: [], coins: 5 }] }) });
    assert.equal(se2.j.season.id, se.j.season.id, "Pass: Bearbeiten behält die Kennung");
    assert.equal((await J("/api/sync", { headers: T })).j.season.title, "Test2", "Pass kommt in der App an");
    await J("/api/admin/players/" + mk.j.id + "/season", { method: "POST", headers: H, body: JSON.stringify({ clear: true }) });
    assert.equal((await J("/api/sync", { headers: T })).j.season, null, "Pass entfernt");
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
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/selfchoose", { headers: H })).j.on, false, "gesteuert ist Standard");
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/selfchoose", { method: "POST", headers: H, body: JSON.stringify({ on: true }) })).s, 200);
    assert.equal((await J("/api/admin/players/" + mk.j.id + "/selfchoose", { headers: H })).j.on, true, "Kind wählt selbst gespeichert");
    const mt = await J("/api/admin/mail", { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ to: "eltern@example.de, oma@example.de" }) });
    assert.equal(mt.s, 200, "Empfänger speichern");
    assert.equal((await J("/api/admin/mail", { headers: H })).j.to, "eltern@example.de,oma@example.de", "Empfänger aus Dashboard");
    assert.equal((await J("/api/admin/mail", { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ to: "kaputt" }) })).s, 400, "ungültige Adresse");
    const decoded = (mailGot.match(/^[A-Za-z0-9+\/=]{20,}$/gm) || []).map(x => Buffer.from(x, "base64").toString("utf8")).join("\n");
    assert.ok(/Magnus/.test(decoded) && /Übungszeit/.test(decoded) && /Wochenziele/.test(decoded) && /Lernplan/.test(decoded), "Mail enthält Spieler, Zeit, Ziele, Lernplan");
    assert.ok(decoded.includes("https://track.wordy.explusmore.com"), "Mail enthält den Dashboard-Link");
    assert.ok(/Subject: =\?UTF-8/.test(mailGot) || /Subject: Wordy/.test(mailGot), "Betreff vorhanden");
    /* Gerät selbst anmelden: Kind fordert Code an, Betreiber gibt frei */
    const rq = await J("/api/pair/request", { method: "POST", body: JSON.stringify({ device: "Test-Handy", name: "Mia" }) });
    assert.equal(rq.s, 200); assert.ok(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(rq.j.code), "Code-Format");
    const pollU = (r) => "/api/pair/request/" + r.j.id + "?secret=" + r.j.secret;
    assert.equal((await J(pollU(rq))).j.status, "pending");
    assert.equal((await J("/api/pair/request/" + rq.j.id + "?secret=falsch")).s, 404, "falsches Geheimnis");
    assert.equal((await J("/api/admin/pairing/ZZZ-ZZZ", { headers: H })).s, 404, "unbekannter Code");
    assert.equal((await J("/api/admin/pairing/" + rq.j.code, { headers: { "X-Wordy": "1" } })).s, 401, "Freigabe nur angemeldet");
    const lk = await J("/api/admin/pairing/" + rq.j.code.toLowerCase(), { headers: H }); assert.equal(lk.j.device, "Test-Handy"); assert.equal(lk.j.hint, "Mia");
    assert.equal((await J("/api/admin/pairing/" + rq.j.code + "/approve", { method: "POST", headers: H, body: JSON.stringify({ player: 99999 }) })).s, 404, "fremder Spieler");
    const ap = await J("/api/admin/pairing/" + rq.j.code + "/approve", { method: "POST", headers: H, body: JSON.stringify({ newName: "Mia" }) });
    assert.equal(ap.s, 200, "Freigabe mit neuem Kind"); assert.equal(ap.j.name, "Mia");
    const got = await J(pollU(rq)); assert.equal(got.j.status, "approved"); assert.equal(got.j.name, "Mia"); assert.ok(/^[0-9a-f]{64}$/.test(got.j.token), "Token");
    assert.equal((await J("/api/ping", { method: "POST", headers: { Authorization: "Bearer " + got.j.token } })).j.name, "Mia", "Token funktioniert");
    assert.equal((await J(pollU(rq))).j.status, "expired", "Token nur einmal abholbar");
    assert.equal((await J("/api/admin/pairing/" + rq.j.code, { headers: H })).s, 404, "Code nur einmal nutzbar");
    const rq2 = await J("/api/pair/request", { method: "POST", body: JSON.stringify({ device: "Tablet" }) });
    assert.equal((await J("/api/admin/pairing/" + rq2.j.code + "/deny", { method: "POST", headers: H })).s, 200);
    assert.equal((await J(pollU(rq2))).j.status, "denied", "Ablehnung kommt an");
    /* Shop-Kalender */
    assert.equal((await J("/api/admin/shopplan", { headers: H })).j.start, "", "Standard: kein eigenes Datum");
    assert.equal((await J("/api/admin/shopplan", { method: "POST", headers: H, body: JSON.stringify({ start: "2026-11-02", over: { "av:fnfrosch": 5, "kaputt": 3 } }) })).s, 200);
    const sp = (await J("/api/admin/shopplan", { headers: H })).j; assert.equal(sp.start, "2026-11-02"); assert.equal(sp.over["av:fnfrosch"], 5); assert.ok(!("kaputt" in sp.over), "ungültige Artikel-ID abgelehnt");
    assert.equal((await J("/api/sync", { headers: { Authorization: "Bearer " + pr.j.token } })).j.shop.start, "2026-11-02", "App bekommt das Datum");
    assert.equal((await J("/api/admin/shopplan", { headers: { "X-Wordy": "1" } })).s, 401, "Shop-Kalender nur Betreiber");
    /* Feedback: Betreiber, App (Bearer), Status/Antwort, Eingabeprüfung */
    const fbA = await J("/api/admin/feedback", { method: "POST", headers: H, body: JSON.stringify({ kind: "idea", text: "Die Challenge sollte kürzer sein." }) });
    assert.equal(fbA.s, 200, "Feedback (Dashboard)");
    assert.equal((await J("/api/admin/feedback", { method: "POST", headers: H, body: JSON.stringify({ kind: "idea", text: "x" }) })).s, 400, "zu kurzer Text");
    const fbB = await J("/api/feedback", { method: "POST", headers: T, body: JSON.stringify({ kind: "bug", text: "Vorlesen hakt manchmal.", ver: "2.57.0", device: "iPhone" }) });
    assert.equal(fbB.s, 200, "Feedback (App)");
    assert.equal((await J("/api/feedback", { method: "POST", body: JSON.stringify({ kind: "bug", text: "ohne Anmeldung" }) })).s, 401, "App-Feedback braucht Verbindung");
    const fbL = await J("/api/admin/feedback", { headers: H });
    assert.equal(fbL.j.items.length, 2); assert.equal(fbL.j.open, 2); assert.equal(fbL.j.hour, 18, "Standard 18 Uhr");
    assert.equal((await J("/api/admin/feedback/" + fbB.j.id, { method: "POST", headers: H, body: JSON.stringify({ status: "in_arbeit", reply: "Danke, wir schauen es uns an.", note: "iOS prüfen" }) })).s, 200);
    const own = await J("/api/feedback", { headers: T });
    const mine = own.j.items.filter(x => x.id === fbB.j.id)[0];
    assert.ok(!own.j.items.some(x => x.id === fbA.j.id), "App-Gerät sieht keine Dashboard-Rückmeldungen");
    assert.equal(mine.status, "in_arbeit"); assert.equal(mine.reply, "Danke, wir schauen es uns an.", "App sieht Status und Antwort");
    assert.equal((await J("/api/admin/feedback/settings", { method: "POST", headers: H, body: JSON.stringify({ hour: 7 }) })).s, 200);
    assert.equal((await J("/api/admin/feedback", { headers: H })).j.hour, 7, "Uhrzeit wählbar");
    assert.equal((await J("/api/admin/feedback/settings", { method: "POST", headers: H, body: JSON.stringify({ hour: 25 }) })).s, 400);
    assert.equal((await J("/api/admin/feedback", { headers: { "X-Wordy": "1" } })).s, 401, "Feedback-Liste nur mit Anmeldung");
    mailGot = "";
    const fbm = await J("/api/admin/feedback/mailnow", { method: "POST", headers: H });
    assert.equal(fbm.j.ok, true, "Feedback-Mail: " + (fbm.j.error || "")); assert.equal(fbm.j.pending, 0, "alle als gesendet markiert");
    const fdec = (mailGot.match(/^[A-Za-z0-9+\/=]{20,}$/gm) || []).map(x => Buffer.from(x, "base64").toString("utf8")).join("\n");
    assert.ok(/Challenge sollte kürzer/.test(fdec) && /Vorlesen hakt/.test(fdec), "Feedback-Mail enthält die Rückmeldungen");
    mailGot = "";
    assert.equal((await J("/api/admin/feedback/mailnow", { method: "POST", headers: H })).j.pending, 0); assert.equal(mailGot, "", "ohne neue Rückmeldungen keine Mail");

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
    // Lesbare Namen statt Nummern: ältere Apps schicken bei Sätzen und Verben nur die ID
    const nn = Date.now();
    await J("/api/events", { method: "POST", headers: T2(pr.j.token), body: JSON.stringify({ events: [
      { i: "nm1" + nn, t: nn, k: "s", d: { id: "s0", g: 0 } }, { i: "nm2" + nn, t: nn, k: "a", d: { id: "v#0", g: 0 } }, { i: "nm3" + nn, t: nn, k: "a", d: { id: "H2-1a#0", g: 0 } },
      { i: "nm4" + nn, t: nn, k: "s", d: { id: "s1", g: 0, en: "Neue App schickt den Text mit.", de: "Der neue Text." } }] }) });
    const rp3 = (await J("/api/admin/players/" + mk.j.id + "/report?days=14", { headers: H })).j;
    assert.ok(rp3.problems.some(x => x.id === "s0" && /sister|My/.test(x.en) && x.de), "Satz-ID wird zum Satz");
    assert.ok(rp3.problems.some(x => x.id === "v#0" && /be, was, been/.test(x.en) && x.de === "sein"), "Verb-ID wird zum Verb");
    assert.ok(rp3.problems.every(x => !/^(s\d+|v#\d+)$/.test(x.en)), "keine nackten Nummern mehr");
    assert.ok(rp3.problems.some(x => x.id === "s1" && x.en === "Neue App schickt den Text mit."), "mitgeschickter Text hat Vorrang");

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

    /* ---------- App-Symbole des Dashboards (öffentlich, ohne Anmeldung) ---------- */
    const mf = await fetch(base + "/app/manifest.webmanifest"); assert.equal(mf.status, 200); assert.equal((await mf.json()).icons.length, 3, "Manifest mit drei Symbolen");
    assert.equal((await (await fetch(base + "/app/family.webmanifest")).json()).start_url, "/f/", "Elternbereich startet unter /f/");
    const ico = await fetch(base + "/app/icon-512.png"); assert.equal(ico.status, 200); assert.equal(ico.headers.get("content-type"), "image/png");
    assert.equal((await fetch(base + "/app/../server.js")).status, 404, "nur die Symbole, keine anderen Dateien");

    /* ---------- Elternkonten ---------- */
    const decMail = () => (mailGot.match(/^[A-Za-z0-9+\/=]{20,}$/gm) || []).map(x => Buffer.from(x, "base64").toString("utf8")).join("");
    const linkOf = () => { const m = decMail().match(/https?:\/\/[^\s"<]+\/f\/login\?t=([0-9a-f]{64})/); return m && m[1]; };
    assert.equal((await J("/api/admin/families", { headers: H })).j.length, 0, "noch keine Familien");
    assert.equal((await J("/api/fam/players")).s, 401, "Familien-Schnittstelle ohne Anmeldung gesperrt");
    assert.equal((await J("/api/family/join", { method: "POST", body: JSON.stringify({ email: "a@example.org", invite: "NOPE", consent: true }) })).s, 400, "falscher Einladungslink");
    const inv = await J("/api/admin/families/invites", { method: "POST", headers: H, body: JSON.stringify({ note: "Test", uses: 2 }) });
    assert.equal(inv.s, 200); assert.ok(/\/f\/join\?i=/.test(inv.j.url));
    assert.equal((await fetch(base + "/f/join?i=" + inv.j.code)).status, 200, "Registrierungsseite");
    const dp = await (await fetch(base + "/f/datenschutz")).text();
    assert.ok(/Datenschutzerklärung/.test(dp) && /Art\. 6 Abs\. 1 lit\. a/.test(dp) && !/\{\{[A-Z]+\}\}/.test(dp), "Datenschutzerklärung ohne offene Platzhalter");
    assert.ok(/<mark>\[Name des Verantwortlichen eintragen\]/.test(dp) && /Entwurf, bitte vervollständigen/.test(dp), "fehlende Betreiber-Angaben werden markiert");
    assert.equal((await J("/api/family/join", { method: "POST", body: JSON.stringify({ email: "mama@example.org", invite: inv.j.code }) })).s, 400, "ohne Einwilligung keine Registrierung");
    mailGot = "";
    assert.equal((await J("/api/family/join", { method: "POST", body: JSON.stringify({ email: "Mama@Example.org", invite: inv.j.code, consent: true }) })).s, 200);
    await wait(300);
    const t1 = linkOf(); assert.ok(t1, "Anmeldelink kommt per Mail");
    const ss = await fetch(base + "/api/family/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: t1 }) });
    assert.equal(ss.status, 200); const cookie = (ss.headers.get("set-cookie") || "").split(";")[0];
    assert.ok(/^wf=[0-9a-f]{64}$/.test(cookie), "Sitzungs-Cookie");
    assert.ok(/HttpOnly/i.test(ss.headers.get("set-cookie")) && /SameSite=Lax/i.test(ss.headers.get("set-cookie")), "Cookie HttpOnly und SameSite");
    assert.equal((await J("/api/family/session", { method: "POST", body: JSON.stringify({ t: t1 }) })).s, 400, "Link nur einmal nutzbar");
    const F = { Cookie: cookie, "Content-Type": "application/json", "X-Wordy": "1" };
    /* Passwort-Anmeldung der Eltern (optional neben dem Link) */
    const JP = (u, b, h) => J(u, { method: "POST", headers: h || { "Content-Type": "application/json", "X-Wordy": "1" }, body: JSON.stringify(b) });
    assert.equal((await JP("/api/family/signin", { email: "mama@example.org", password: "irgendwas-langes-1" })).s, 401, "ohne gesetztes Passwort keine Anmeldung");
    assert.equal((await JP("/api/fam/me/password", { password: "kurz" }, F)).s, 400, "Passwort zu kurz");
    assert.equal((await JP("/api/fam/me/password", { password: "passwort123" }, F)).s, 400, "zu einfaches Passwort");
    assert.equal((await JP("/api/fam/me/password", { password: "Drei Wörter hintereinander" }, F)).s, 200, "Passwort setzen (frisch angemeldet)");
    assert.equal((await J("/api/fam/me", { headers: F })).j.hasPassword, true);
    assert.equal((await JP("/api/family/signin", { email: "mama@example.org", password: "falsches-passwort-1" })).s, 401, "falsches Passwort");
    const si = await fetch(base + "/api/family/signin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: "MAMA@example.org", password: "Drei Wörter hintereinander" }) });
    assert.equal(si.status, 200, "Anmeldung mit Passwort"); const cookiePW = (si.headers.get("set-cookie") || "").split(";")[0];
    assert.equal((await J("/api/fam/me", { headers: { Cookie: cookiePW } })).s, 200, "Sitzung nach Passwort-Anmeldung gültig");
    { const { DatabaseSync } = require("node:sqlite"); const d = new DatabaseSync(path.join(dir, "t.db")); d.exec("UPDATE family_sessions SET created = created - 3600000"); d.close(); }
    const FPW = { Cookie: cookiePW, "Content-Type": "application/json", "X-Wordy": "1" };
    assert.equal((await JP("/api/fam/me/password", { password: "Ein ganz neues Passwort" }, FPW)).s, 403, "Ändern ohne aktuelles Passwort nach älterer Sitzung gesperrt");
    assert.equal((await JP("/api/fam/me/password", { password: "Ein ganz neues Passwort", current: "Drei Wörter hintereinander" }, FPW)).s, 200, "Ändern mit aktuellem Passwort");
    assert.equal((await JP("/api/family/signin", { email: "mama@example.org", password: "Drei Wörter hintereinander" })).s, 401, "altes Passwort gilt nicht mehr");
    for (let i = 0; i < 6; i++) await JP("/api/family/signin", { email: "fremd@example.org", password: "falsch-falsch-" + i });
    assert.equal((await JP("/api/family/signin", { email: "fremd@example.org", password: "falsch-falsch-9" })).s, 429, "Sperre nach Fehlversuchen");
    assert.equal((await J("/api/fam/players", { headers: { Cookie: cookie } })).j.length, 0, "Familie startet ohne Kinder");
    assert.equal((await J("/api/fam/players", { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify({ name: "Lena" }) })).s, 403, "ohne X-Wordy-Kopf kein Schreiben");
    const kid = await J("/api/fam/players", { method: "POST", headers: F, body: JSON.stringify({ name: "Lena" }) });
    { const r3 = await J("/api/pair/request", { method: "POST", body: JSON.stringify({ device: "Lenas Handy" }) });
      assert.equal((await J("/api/fam/pairing/" + r3.j.code + "/approve", { method: "POST", headers: F, body: JSON.stringify({ player: 1 }) })).s, 404, "Familie kann kein fremdes Kind freigeben");
      assert.equal((await J("/api/fam/pairing/" + r3.j.code + "/approve", { method: "POST", headers: F, body: JSON.stringify({ player: kid.j.id }) })).s, 200, "Familie gibt eigenes Kind frei");
      assert.equal((await J("/api/pair/request/" + r3.j.id + "?secret=" + r3.j.secret)).j.status, "approved"); }
    assert.equal(kid.s, 200); assert.ok(kid.j.invite.code);
    const kp = await J("/api/pair", { method: "POST", body: JSON.stringify({ code: kid.j.invite.code, device: "Lena-Handy" }) });
    assert.equal(kp.s, 200, "Kind lässt sich koppeln"); assert.equal((await J("/api/ping", { method: "POST", headers: T2(kp.j.token), body: "{}" })).s, 200);
    assert.deepEqual((await J("/api/fam/players", { headers: F })).j.map(x => x.name), ["Lena"], "Familie sieht ihr Kind");
    assert.ok(!(await J("/api/admin/players", { headers: H })).j.some(x => x.name === "Lena"), "Betreiber sieht fremde Kinder nicht");
    assert.equal((await J("/api/admin/players/" + kid.j.id + "/report", { headers: H })).s, 404, "Betreiber kommt nicht an fremde Berichte");
    assert.equal((await J("/api/fam/players/" + mk.j.id + "/report", { headers: F })).s, 404, "Familie kommt nicht an Spieler des Betreibers");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/goals", { method: "POST", headers: F, body: JSON.stringify({ kind: "minutes", target: 20 }) })).s, 200, "Familie setzt Ziele für ihr Kind");
    assert.equal((await J("/api/fam/families", { headers: F })).s, 403, "Betreiber-Funktionen gesperrt");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/season", { method: "POST", headers: F, body: JSON.stringify({ title: "Eigener Pass" }) })).s, 403, "Eltern stellen den Wochenpass nicht zusammen");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/season", { headers: F })).s, 403, "und lesen ihn im Dashboard auch nicht");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/gifts", { method: "POST", headers: F, body: JSON.stringify({ coins: 50 }) })).s, 403, "Eltern schenken keine Extramünzen");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/coinfactor", { method: "POST", headers: F, body: JSON.stringify({ factor: 2 }) })).s, 403, "Eltern stellen den Münzfaktor nicht um");
    const gq = await J("/api/fam/players/" + kid.j.id + "/goals", { method: "POST", headers: F, body: JSON.stringify({ kind: "days", target: 3, coins: 400 }) }); assert.equal(gq.s, 200);
    assert.ok((await J("/api/fam/players/" + kid.j.id + "/goals", { headers: F })).j.every(x => !x.coins), "Ziele aus Elternkonten haben keine Bonusmünzen");
    const og = await J("/api/admin/players/" + mk.j.id + "/gifts", { method: "POST", headers: H, body: JSON.stringify({ coins: 20 }) }); assert.equal(og.s, 200, "Betreiber darf weiter schenken");
    assert.equal((await J("/api/fam/info", { headers: F })).s, 200);
    // zweite Familie darf die Kinder der ersten nicht sehen
    const inv2 = await J("/api/admin/families/invites", { method: "POST", headers: H, body: JSON.stringify({}) });
    mailGot = ""; await J("/api/family/join", { method: "POST", body: JSON.stringify({ email: "papa@example.org", invite: inv2.j.code, consent: true }) }); await wait(300);
    const ss2 = await fetch(base + "/api/family/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: linkOf() }) });
    const F2 = { Cookie: (ss2.headers.get("set-cookie") || "").split(";")[0], "Content-Type": "application/json", "X-Wordy": "1" };
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/report", { headers: F2 })).s, 404, "fremde Familie sieht das Kind nicht");
    assert.equal((await J("/api/fam/players/" + kid.j.id, { method: "DELETE", headers: F2 })).s, 404, "und kann es nicht löschen");
    // Einladungslink ist verbraucht (1 Nutzung)
    assert.equal((await J("/api/family/join", { method: "POST", body: JSON.stringify({ email: "x@example.org", invite: inv2.j.code, consent: true }) })).s, 400, "Einladung nur einmal nutzbar");
    // Anmeldung für unbekannte Adresse: gleiche Antwort, keine Mail
    mailGot = ""; assert.equal((await J("/api/family/login", { method: "POST", body: JSON.stringify({ email: "niemand@example.org" }) })).s, 200); await wait(200);
    assert.ok(!linkOf(), "unbekannte Adresse bekommt keine Mail");
    // Wochenmail an die Familie
    mailGot = ""; assert.equal((await J("/api/fam/mail/test", { method: "POST", headers: F })).j.ok, true); const fm = decMail();
    assert.ok(/Lena/.test(fm) && !/Magnus|Christian/.test(fm), "Familien-Wochenmail zeigt nur eigene Kinder");
    // Export
    const ex = await J("/api/fam/me/export", { headers: F }); assert.equal(ex.j.children[0].name, "Lena"); assert.equal(ex.j.email, "mama@example.org");

    /* ---------- Freunde, Duelle, Ranglisten ---------- */
    const jm = await J("/api/admin/players", { method: "POST", headers: H, body: JSON.stringify({ name: "Jonas" }) });
    const jt = T2((await J("/api/pair", { method: "POST", body: JSON.stringify({ code: jm.j.invite.code, device: "J" }) })).j.token), lt = T2(kp.j.token);
    assert.equal((await J("/api/social/me", { headers: lt })).j.enabled, false, "Freunde standardmäßig aus");
    assert.equal((await J("/api/social/me", { headers: jt })).j.enabled, true, "Spieler des Betreibers starten mit Freunden (Testphase)");
    assert.equal((await J("/api/social/friends", { method: "POST", headers: lt, body: JSON.stringify({ code: "XXXX" }) })).s, 403, "ohne Freigabe der Eltern keine Freunde");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/social", { method: "POST", headers: F, body: JSON.stringify({ enabled: true }) })).s, 200);
    assert.equal((await J("/api/admin/players/" + jm.j.id + "/social", { method: "POST", headers: H, body: JSON.stringify({ enabled: true }) })).s, 200);
    const lme = (await J("/api/social/me", { headers: lt })).j, jme = (await J("/api/social/me", { headers: jt })).j;
    assert.ok(lme.enabled && /^F[A-Z0-9]{5}$/.test(lme.code), "Freundescode");
    assert.equal((await J("/api/social/friends", { method: "POST", headers: jt, body: JSON.stringify({ code: jme.code }) })).s, 400, "nicht den eigenen Code");
    assert.equal((await J("/api/social/friends", { method: "POST", headers: jt, body: JSON.stringify({ code: lme.code }) })).s, 200, "Anfrage an Lena");
    assert.equal((await J("/api/social/friends", { method: "POST", headers: jt, body: JSON.stringify({ code: lme.code }) })).s, 400, "nur eine Anfrage");
    const WORDS = ["H2-1a#0", "H2-1a#1", "H2-1a#2", "H2-1a#3", "H2-1a#4", "H2-1a#5", "H2-1a#6", "H2-1a#7", "H2-1a#8"];
    assert.equal((await J("/api/social/challenges", { method: "POST", headers: jt, body: JSON.stringify({ to: kid.j.id, mode: "blitz", words: WORDS, seed: 5, score: 100 }) })).s, 403, "vor der Zustimmung der Eltern kein Duell");
    assert.equal((await J("/api/admin/players/" + kid.j.id + "/friends/" + jm.j.id, { method: "POST", headers: H, body: JSON.stringify({ action: "approve" }) })).s, 404, "Betreiber kann nicht für fremde Kinder zustimmen");
    assert.equal((await J("/api/admin/players/" + jm.j.id + "/friends/" + kid.j.id, { method: "POST", headers: H, body: JSON.stringify({ action: "approve" }) })).s, 200);
    assert.equal((await J("/api/social/challenges", { method: "POST", headers: jt, body: JSON.stringify({ to: kid.j.id, mode: "blitz", words: WORDS, seed: 5, score: 100 }) })).s, 403, "eine Zustimmung reicht nicht");
    const pf = (await J("/api/fam/players/" + kid.j.id + "/social", { headers: F })).j.friends[0];
    assert.equal(pf.name, "Jonas"); assert.equal(pf.state, "mine", "Lenas Eltern sehen die offene Anfrage");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/friends/" + jm.j.id, { method: "POST", headers: F, body: JSON.stringify({ action: "approve" }) })).s, 200);
    assert.equal((await J("/api/social/me", { headers: lt })).j.friends[0].state, "ok", "Freunde bestätigt");
    assert.equal((await J("/api/social/challenges", { method: "POST", headers: jt, body: JSON.stringify({ to: kid.j.id, mode: "blitz", words: WORDS.slice(0, 3), seed: 5, score: 100 }) })).s, 400, "zu wenige Wörter");
    assert.equal((await J("/api/social/challenges", { method: "POST", headers: jt, body: JSON.stringify({ to: kid.j.id, mode: "blitz", words: WORDS, seed: 5, score: 999999 }) })).s, 400, "unmögliche Punktzahl");
    const ch = await J("/api/social/challenges", { method: "POST", headers: jt, body: JSON.stringify({ to: kid.j.id, mode: "blitz", words: WORDS, seed: 5, score: 120 }) });
    assert.equal(ch.s, 200);
    const ib = (await J("/api/social/inbox", { headers: lt })).j; assert.equal(ib.open.length, 1); assert.equal(ib.open[0].from.name, "Jonas"); assert.equal(ib.open[0].aScore, 120); assert.deepEqual(ib.open[0].words, WORDS);
    assert.equal((await J("/api/social/challenges/" + ch.j.id + "/result", { method: "POST", headers: jt, body: JSON.stringify({ score: 1 }) })).s, 403, "Herausforderer kann nicht selbst antworten");
    assert.equal((await J("/api/social/challenges/" + ch.j.id + "/react", { method: "POST", headers: lt, body: JSON.stringify({ emoji: "👏" }) })).s, 400, "Reaktion erst nach dem Spiel");
    assert.equal((await J("/api/social/challenges/" + ch.j.id + "/result", { method: "POST", headers: lt, body: JSON.stringify({ score: 150 }) })).s, 200);
    assert.equal((await J("/api/social/challenges/" + ch.j.id + "/result", { method: "POST", headers: lt, body: JSON.stringify({ score: 999 }) })).s, 400, "nur einmal spielen");
    assert.equal((await J("/api/social/challenges/" + ch.j.id + "/react", { method: "POST", headers: lt, body: JSON.stringify({ emoji: "🔥" }) })).s, 200);
    const rc = (await J("/api/social/inbox", { headers: jt })).j.recent[0]; assert.equal(rc.aScore, 120); assert.equal(rc.bScore, 150); assert.equal(rc.theirReact, "🔥");
    assert.equal((await J("/api/social/challenges/" + ch.j.id + "/result", { method: "POST", headers: T, body: JSON.stringify({ score: 1 }) })).s, 401, "fremdes Gerät ohne Zugang");
    await J("/api/social/score", { method: "POST", headers: jt, body: JSON.stringify({ mode: "blitz", score: 30 }) });
    await J("/api/social/score", { method: "POST", headers: lt, body: JSON.stringify({ mode: "blitz", score: 50 }) });
    await J("/api/social/score", { method: "POST", headers: lt, body: JSON.stringify({ mode: "blitz", score: 40 }) });
    const bd = (await J("/api/social/board?mode=blitz", { headers: jt })).j; assert.deepEqual(bd.rows.map(r => r.name + ":" + r.score), ["Lena:50", "Jonas:30"], "Rangliste unter Freunden, bester Wert zählt");
    assert.equal((await J("/api/social/board?mode=nix", { headers: jt })).s, 400);
    await J("/api/social/profile", { method: "POST", headers: lt, body: JSON.stringify({ avatar: "svg:fnwolf" }) });
    assert.equal((await J("/api/social/me", { headers: jt })).j.friends[0].avatar, "svg:fnwolf", "Figur des Freundes");

    /* ---------- Crew-Wochenziele ---------- */
    assert.equal((await J("/api/social/crew", { method: "POST", headers: jt, body: JSON.stringify({ adj: 0, noun: 99, emoji: 1 }) })).s, 400, "Crew-Name nur aus der Liste");
    assert.equal((await J("/api/social/crew", { method: "POST", headers: jt, body: JSON.stringify({ adj: 0, noun: 1, emoji: 1 }) })).s, 200);
    const cv0 = (await J("/api/social/crew", { headers: jt })).j.crew; assert.equal(cv0.name, "Turbo Wölfe"); assert.equal(cv0.members.length, 1);
    assert.equal((await J("/api/social/crew/invite", { method: "POST", headers: jt, body: JSON.stringify({ to: kid.j.id }) })).s, 200, "Freund in die Crew einladen");
    assert.equal((await J("/api/social/crew", { headers: lt })).j.invites.length, 1, "Einladung kommt an");
    assert.equal((await J("/api/social/crew/answer", { method: "POST", headers: lt, body: JSON.stringify({ crew: cv0.id, accept: true }) })).s, 200);
    assert.equal((await J("/api/social/crew", { headers: jt })).j.crew.members.length, 2, "zwei Mitglieder");
    const nowT = Date.now(), ev = (k, d, i) => ({ i: "c" + i + nowT, t: nowT - i, k, d });
    await J("/api/events", { method: "POST", headers: jt, body: JSON.stringify({ events: [ev("ss", { sec: 3600, items: 10, correct: 9 }, 1), ...Array.from({ length: 12 }, (_, i) => ev("a", { id: "H2-1a#" + i, g: 2, b: 1, a: 2 }, 10 + i))] }) });
    await J("/api/events", { method: "POST", headers: lt, body: JSON.stringify({ events: [ev("ss", { sec: 1200, items: 5, correct: 5 }, 2)] }) });
    let cv = (await J("/api/social/crew", { headers: jt })).j.crew, qm = cv.quests.find(x => x.id === "min"), qw = cv.quests.find(x => x.id === "words");
    assert.equal(qm.total, 80); assert.deepEqual(qm.targets, [60, 120, 180]); assert.equal(qm.tier, 1, "Bronze bei Übungszeit"); assert.equal(qw.total, 12); assert.equal(qw.tier, 0);
    assert.equal(cv.members.find(m => m.you).mvp, true, "Jonas ist MVP"); assert.equal(cv.members.find(m => !m.you).name, "Lena");
    assert.equal((await J("/api/social/crew/claim", { method: "POST", headers: jt, body: JSON.stringify({ quest: "min", tier: 2 }) })).s, 400, "Silber noch nicht erreicht");
    const cl = await J("/api/social/crew/claim", { method: "POST", headers: jt, body: JSON.stringify({ quest: "min", tier: 1 }) }); assert.equal(cl.s, 200); assert.equal(cl.j.coins, 3);
    assert.equal((await J("/api/social/crew/claim", { method: "POST", headers: jt, body: JSON.stringify({ quest: "min", tier: 1 }) })).s, 400, "nur einmal abholen");
    assert.equal((await J("/api/social/crew/claim", { method: "POST", headers: lt, body: JSON.stringify({ quest: "words", tier: 1 }) })).s, 400, "Wörter-Ziel nicht erreicht");
    await J("/api/events", { method: "POST", headers: jt, body: JSON.stringify({ events: [ev("ss", { sec: 3600, items: 10, correct: 9 }, 3)] }) });
    assert.equal((await J("/api/social/crew/claim", { method: "POST", headers: lt, body: JSON.stringify({ quest: "min", tier: 2 }) })).s, 200, "Lena darf Silber holen, sie hat mitgeübt");
    assert.equal((await J("/api/social/crew/cheer", { method: "POST", headers: lt, body: JSON.stringify({ to: jm.j.id, emoji: "💪" }) })).s, 200, "Anfeuern");
    assert.equal((await J("/api/social/crew/cheer", { method: "POST", headers: lt, body: JSON.stringify({ to: jm.j.id, emoji: "💪" }) })).s, 429, "nicht dauernd anfeuern");
    assert.equal((await J("/api/social/crew/cheer", { method: "POST", headers: lt, body: JSON.stringify({ to: kid.j.id, emoji: "💪" }) })).s, 403, "nicht sich selbst");
    assert.equal((await J("/api/social/crew/cheer", { method: "POST", headers: lt, body: JSON.stringify({ to: jm.j.id, emoji: "💩" }) })).s, 400, "nur feste Emojis");
    assert.equal((await J("/api/social/crew", { headers: jt })).j.crew.cheers[0].from, "Lena", "Jonas sieht das Anfeuern");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/social", { headers: F })).j.crew.name, "Turbo Wölfe", "Eltern sehen die Crew");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/crewleave", { method: "POST", headers: F, body: "{}" })).s, 200, "Eltern nehmen das Kind aus der Crew");
    assert.equal((await J("/api/social/crew", { headers: jt })).j.crew.members.length, 1, "Crew besteht weiter");
    assert.equal((await J("/api/social/crew/leave", { method: "POST", headers: jt, body: "{}" })).s, 200);
    assert.equal((await J("/api/social/crew", { headers: jt })).j.crew, null, "leere Crew ist weg");
    assert.equal((await J("/api/social/friends/" + kid.j.id, { method: "DELETE", headers: jt })).s, 200);
    assert.equal((await J("/api/social/challenges", { method: "POST", headers: jt, body: JSON.stringify({ to: kid.j.id, mode: "blitz", words: WORDS, seed: 5, score: 10 }) })).s, 403, "nach dem Entfernen keine Duelle mehr");
    /* ---------- Klassen-Modus ---------- */
    const invT = await J("/api/admin/families/invites", { method: "POST", headers: H, body: JSON.stringify({ role: "teacher", note: "Frau Meier" }) });
    assert.equal(invT.s, 200);
    mailGot = ""; assert.equal((await J("/api/family/join", { method: "POST", body: JSON.stringify({ email: "meier@schule.example", invite: invT.j.code, consent: true }) })).s, 200); await wait(300);
    const sT = await fetch(base + "/api/family/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: linkOf() }) });
    const FT = { Cookie: (sT.headers.get("set-cookie") || "").split(";")[0], "Content-Type": "application/json", "X-Wordy": "1" };
    assert.equal((await J("/api/fam/info", { headers: FT })).s, 200);
    assert.equal((await J("/api/fam/classes", { headers: F })).s, 403, "Eltern haben keine Klassen-Verwaltung");
    assert.equal((await J("/api/fam/players", { method: "POST", headers: FT, body: JSON.stringify({ name: "X" }) })).s, 403, "Lehrkraft legt keine Kinder an");
    assert.equal((await J("/api/fam/classes", { method: "POST", headers: FT, body: JSON.stringify({ name: "", teacher: "" }) })).s, 400);
    const cls = await J("/api/fam/classes", { method: "POST", headers: FT, body: JSON.stringify({ name: "6b Englisch", teacher: "Frau Meier" }) });
    assert.equal(cls.s, 200); assert.ok(/^K[A-Z0-9]{5}$/.test(cls.j.code), "Klassencode");
    const un = (await J("/api/fam/units", { headers: FT })).j; assert.ok(un.length > 10 && un.some(u => u.id === "6-01"), "Einheiten-Katalog");
    const todayB = new Date().toLocaleDateString("sv", { timeZone: "Europe/Berlin" }), later = new Date(Date.now() + 5 * 86400000).toLocaleDateString("sv", { timeZone: "Europe/Berlin" });
    assert.equal((await J("/api/social/class/join", { method: "POST", headers: lt, body: JSON.stringify({ code: "KXXXXX" }) })).s, 400, "falscher Klassencode");
    assert.equal((await J("/api/social/class/join", { method: "POST", headers: lt, body: JSON.stringify({ code: cls.j.code.toLowerCase() }) })).s, 200, "Beitritt per Code");
    assert.equal((await J("/api/social/class", { headers: lt })).j.state, "pending", "wartet auf die Eltern");
    assert.equal((await J("/api/fam/classes/" + cls.j.id, { headers: FT })).j.members.length, 0, "Lehrkraft sieht noch keine Anfragen als Mitglieder");
    assert.equal((await J("/api/fam/classes/" + cls.j.id, { headers: FT })).j.pending, 1);
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/class", { headers: F })).j.state, "pending", "Eltern sehen die Anfrage");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/class", { method: "POST", headers: F2, body: JSON.stringify({ action: "approve" }) })).s, 404, "fremde Eltern können nicht zustimmen");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/class", { method: "POST", headers: FT, body: JSON.stringify({ action: "approve" }) })).s, 404, "Lehrkraft kann nicht selbst zustimmen");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/class", { method: "POST", headers: F, body: JSON.stringify({ action: "approve" }) })).s, 200);
    assert.equal((await J("/api/admin/players/" + jm.j.id + "/class", { headers: H })).j.state, "none");
    const jc = await J("/api/social/class/join", { method: "POST", headers: jt, body: JSON.stringify({ code: cls.j.code }) }); assert.equal(jc.s, 200);
    await J("/api/admin/players/" + jm.j.id + "/class", { method: "POST", headers: H, body: JSON.stringify({ action: "approve" }) });
    assert.equal((await J("/api/fam/classes/" + cls.j.id + "/task", { method: "POST", headers: FT, body: JSON.stringify({ title: "x", units: ["nope"], to: later }) })).s, 400, "unbekannte Einheit");
    assert.equal((await J("/api/fam/classes/" + cls.j.id + "/task", { method: "POST", headers: FT, body: JSON.stringify({ title: "x", units: ["6-01"], to: "2020-01-01" }) })).s, 400, "Zeitraum in der Vergangenheit");
    const tk = await J("/api/fam/classes/" + cls.j.id + "/task", { method: "POST", headers: FT, body: JSON.stringify({ title: "Unit 1 Vokabeln", units: ["6-01", "6-02"], from: todayB, to: later, goal: 5 }) });
    assert.equal(tk.s, 200);
    const cv1 = (await J("/api/social/class", { headers: lt })).j;
    assert.equal(cv1.state, "member"); assert.equal(cv1.kids, 2); assert.equal(cv1.task.title, "Unit 1 Vokabeln"); assert.equal(cv1.task.unitTitles.length, 2); assert.equal(cv1.goal.target, 10);
    const cpl = (await J("/api/sync", { headers: lt })).j.plans.find(x => x.cls);
    assert.ok(cpl && cpl.units.join() === "6-01,6-02", "Klassenaufgabe erscheint als Lernplan in der App");
    const aev = (n, g, u, en) => ev("a", { id: u + "#" + n, g, h: 0, b: 1, a: g ? 2 : 0, en, de: "de" + n, u }, 200 + n + (u === "6-02" ? 50 : 0));
    await J("/api/events", { method: "POST", headers: lt, body: JSON.stringify({ events: [aev(1, 1, "6-01", "cat"), aev(2, 1, "6-01", "dog"), aev(3, 1, "6-02", "sun"), aev(4, 1, "6-03", "ignored"), aev(5, 0, "6-01", "tree")] }) });
    await J("/api/events", { method: "POST", headers: jt, body: JSON.stringify({ events: [ev("a", { id: "6-01#5", g: 0, b: 1, a: 0, en: "tree", de: "de5", u: "6-01" }, 400)] }) });
    const ov = (await J("/api/fam/classes/" + cls.j.id, { headers: FT })).j;
    assert.equal(ov.members.length, 2); assert.equal(ov.members.find(r => r.name === "Lena").taskWords, 3, "nur Wörter der gewählten Einheiten zählen");
    assert.equal(ov.goal.total, 3); assert.equal(ov.problems[0].en, "tree"); assert.equal(ov.problems[0].n, 2, "häufige Fehler der ganzen Klasse");
    assert.ok(!JSON.stringify(ov).includes("email"), "keine Kontaktdaten in der Übersicht");
    assert.ok(ov.units.length === 2 && ov.units.every(u => typeof u.pct === "number"));
    assert.equal((await J("/api/social/class", { headers: lt })).j.mine.taskWords, 3, "Kind sieht seinen Beitrag");
    // Abgrenzung
    assert.equal((await J("/api/fam/classes/" + cls.j.id, { headers: F })).s, 403, "Eltern kommen nicht an die Klasse");
    const invT2 = await J("/api/admin/families/invites", { method: "POST", headers: H, body: JSON.stringify({ role: "teacher" }) });
    mailGot = ""; await J("/api/family/join", { method: "POST", body: JSON.stringify({ email: "huber@schule.example", invite: invT2.j.code, consent: true }) }); await wait(300);
    const sT2 = await fetch(base + "/api/family/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: linkOf() }) });
    const FT2 = { Cookie: (sT2.headers.get("set-cookie") || "").split(";")[0], "Content-Type": "application/json", "X-Wordy": "1" };
    assert.equal((await J("/api/fam/classes/" + cls.j.id, { headers: FT2 })).s, 404, "andere Lehrkraft sieht die Klasse nicht");
    assert.equal((await J("/api/fam/players/" + kid.j.id + "/report", { headers: FT })).s, 404, "Lehrkraft sieht keine Einzelberichte");
    assert.equal((await J("/api/fam/players", { headers: FT })).j.length, 0, "Lehrkraft hat keine Kinder");
    assert.equal((await J("/api/fam/classes/" + cls.j.id + "/kick/" + jm.j.id, { method: "POST", headers: FT, body: "{}" })).s, 200);
    assert.equal((await J("/api/social/class", { headers: jt })).j.state, "none", "entfernt");
    assert.equal((await J("/api/fam/classes/" + cls.j.id + "/task/" + tk.j.id, { method: "DELETE", headers: FT })).s, 200);
    assert.ok(!(await J("/api/sync", { headers: lt })).j.plans.some(x => x.cls), "Aufgabe gelöscht, Lernplan weg");
    assert.equal((await J("/api/social/class/leave", { method: "POST", headers: lt, body: "{}" })).s, 200);
    assert.equal((await J("/api/fam/classes/" + cls.j.id, { method: "DELETE", headers: FT })).s, 200);
    await J("/api/admin/players/" + jm.j.id, { method: "DELETE", headers: H });
    // Sperren und wieder anmelden
    const fams = (await J("/api/admin/families", { headers: H })).j, mama = fams.find(x => x.email === "mama@example.org");
    assert.equal(mama.children, 1);
    await J("/api/admin/families/" + mama.id + "/block", { method: "POST", headers: H, body: JSON.stringify({ blocked: true }) });
    assert.equal((await J("/api/fam/players", { headers: F })).s, 401, "gesperrte Familie ist draußen");
    await J("/api/admin/families/" + mama.id + "/block", { method: "POST", headers: H, body: JSON.stringify({ blocked: false }) });
    mailGot = ""; await J("/api/family/login", { method: "POST", body: JSON.stringify({ email: "mama@example.org" }) }); await wait(300);
    const ss3 = await fetch(base + "/api/family/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: linkOf() }) });
    const F3 = { Cookie: (ss3.headers.get("set-cookie") || "").split(";")[0], "Content-Type": "application/json", "X-Wordy": "1" };
    assert.equal((await J("/api/fam/players", { headers: F3 })).j.length, 1, "nach Entsperren wieder drin");
    // Konto löschen: Kinder, Token und Daten verschwinden
    assert.equal((await J("/api/fam/me", { method: "DELETE", headers: F3, body: JSON.stringify({ confirm: "falsch@example.org" }) })).s, 400);
    assert.equal((await J("/api/fam/me", { method: "DELETE", headers: F3, body: JSON.stringify({ confirm: "mama@example.org" }) })).s, 200);
    assert.equal((await J("/api/fam/players", { headers: F3 })).s, 401, "Konto gelöscht");
    assert.equal((await J("/api/ping", { method: "POST", headers: T2(kp.j.token), body: "{}" })).s, 401, "Gerät des Kindes ist getrennt");
    assert.deepEqual((await J("/api/admin/families", { headers: H })).j.map(x => x.role), ["parent", "teacher", "teacher"], "Papa und die zwei Lehrkräfte bleiben");
    console.log("Alle Prüfungen bestanden.");
  } catch (e) { console.error("FEHLER:", e.message); process.exitCode = 1; }
  srv.kill(); fake.close(); fs.rmSync(dir, { recursive: true, force: true });
})();
