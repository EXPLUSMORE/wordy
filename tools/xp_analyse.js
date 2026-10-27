#!/usr/bin/env node
/* Auswertung von XP und Münzen aus den Dashboard-Daten (nur lesend).
   Aufruf (vom Betreiber, gegen den Wordy-Server):
     WORDY_URL=https://track.wordy.explusmore.com WORDY_USER=eltern WORDY_PASS='…' node tools/xp_analyse.js [Tage] [Name,Name,…]
   Alternativ offline mit gespeicherten Berichten (JSON aus /api/admin/players/<id>/report?days=90):
     node tools/xp_analyse.js --file magnus.json --file chrissi.json
   Ausgabe: Markdown mit Kennzahlen je Spieler, Anteil Lernrunden/Spiele, Rang-Prognose und Szenarien „weniger XP, mehr Münzen“.
   Es wird nichts verändert und nichts gespeichert. Das Passwort nie in den Chat kopieren. */
"use strict";
const fs = require("fs");

/* gleiche Rangleiter wie js/engine.js (bei Änderungen dort hier nachziehen) */
const RANKS = [[0, "Bronze I"], [150, "Bronze II"], [400, "Bronze III"], [800, "Silber I"], [1400, "Silber II"], [2200, "Silber III"], [3200, "Gold I"], [4600, "Gold II"], [6400, "Gold III"],
  [9000, "Platin I"], [12000, "Platin II"], [15500, "Platin III"], [19500, "Diamant I"], [24000, "Diamant II"], [29000, "Diamant III"]];
(function () {
  let xp = 35000, step = 5000;
  ["Elite", "Champion", "Unreal", "Unreal Gold", "Unreal Platin", "Unreal Diamant"].forEach(n => ["I", "II", "III"].forEach(r => { RANKS.push([xp, n + " " + r]); xp += step; step += 500; }));
  RANKS.push([xp, "The real Unreal"]);
})();
const rankOf = xp => { let i = 0; RANKS.forEach((r, k) => { if (xp >= r[0]) i = k; }); return i; };
const fmt = n => Math.round(n).toLocaleString("de-DE");
const f1 = n => (Math.round(n * 10) / 10).toLocaleString("de-DE");

async function fetchAll(base, user, pass, days, only) {
  const H = { Authorization: "Basic " + Buffer.from(user + ":" + pass).toString("base64"), "X-Wordy": "1" };
  const get = async p => { const r = await fetch(base + p, { headers: H }); if (!r.ok) throw new Error(p + " → " + r.status); return r.json(); };
  let players = await get("/api/admin/players"); players = players.players || players;
  if (only.length) players = players.filter(p => only.some(n => String(p.name).toLowerCase().includes(n.toLowerCase())));
  const out = [];
  for (const p of players) out.push({ name: p.name, rep: await get("/api/admin/players/" + p.id + "/report?days=" + days) });
  return out;
}

function analyse(name, rep) {
  const days = rep.days || [], active = days.filter(d => d.items > 0 || d.sec > 0);
  const t = rep.totals || {}, sec = t.sec || 0, xp = t.xp || 0, coins = t.coins || 0, N = days.length || 1;
  const meta = rep.meta || {}, learn = rep.wordEarn || { xp: 0, coins: 0, runs: 0 };
  const sessions = rep.sessions || [], buys = rep.buys || [];
  const modeSec = {}; sessions.forEach(s => { const k = s.mode === "arena" ? "Spiele/Arena" : "Lernrunden"; modeSec[k] = (modeSec[k] || 0) + (s.sec || 0); });
  return {
    name, days: N, activeDays: active.length, minutes: sec / 60, xp, coins, items: t.items || 0, correct: t.correct || 0,
    xpPerActive: active.length ? xp / active.length : 0, coinsPerActive: active.length ? coins / active.length : 0, minPerActive: active.length ? sec / 60 / active.length : 0,
    xpPerMin: sec ? xp / (sec / 60) : 0, coinsPerMin: sec ? coins / (sec / 60) : 0, coinsPerXp: xp ? coins / xp : 0,
    xpPerDay: xp / N, coinsPerDay: coins / N,
    learnXp: learn.xp, learnCoins: learn.coins, otherXp: Math.max(0, xp - learn.xp), otherCoins: Math.max(0, coins - learn.coins),
    xpNow: meta.xp || 0, coinsNow: meta.coins || 0, spent20: buys.reduce((a, b) => a + (b.cost || 0), 0), buys20: buys.length, modeSec,
    perItem: (t.items || 0) ? xp / t.items : 0,
    timeCoins: (rep.bonus || {}).timeCoins || 0, weekCoins: (rep.bonus || {}).weekCoins || 0, timeDays: (rep.bonus || {}).timeDays || 0, weekN: (rep.bonus || {}).weekN || 0,
    weeklyCoinsReal: coins / (N / 7),
  };
}

function report(list, scen) {
  const L = [];
  L.push("# XP- und Münz-Auswertung\n");
  L.push("| Kennzahl | " + list.map(a => a.name).join(" | ") + " |", "|---|" + list.map(() => "---:").join("|") + "|");
  const row = (label, f) => L.push("| " + label + " | " + list.map(f).join(" | ") + " |");
  row("Zeitraum (Tage)", a => a.days); row("Aktive Tage", a => a.activeDays);
  row("Übzeit je aktivem Tag (Min.)", a => f1(a.minPerActive)); row("Aufgaben gesamt", a => fmt(a.items));
  row("XP gesamt (Zeitraum)", a => fmt(a.xp)); row("Münzen gesamt (Zeitraum)", a => fmt(a.coins));
  row("XP je aktivem Tag", a => fmt(a.xpPerActive)); row("Münzen je aktivem Tag", a => fmt(a.coinsPerActive));
  row("XP je Minute", a => f1(a.xpPerMin)); row("Münzen je Minute", a => f1(a.coinsPerMin));
  row("Münzen je 100 XP", a => f1(a.coinsPerXp * 100)); row("XP je Aufgabe", a => f1(a.perItem));
  row("Davon Lernrunden: XP / Münzen", a => fmt(a.learnXp) + " / " + fmt(a.learnCoins)); row("Davon Spiele, Arena, Grammatik: XP / Münzen", a => fmt(a.otherXp) + " / " + fmt(a.otherCoins));
  row("XP jetzt (Stand App)", a => fmt(a.xpNow)); row("Rang jetzt (neue Leiter)", a => RANKS[rankOf(a.xpNow)][1]);
  row("Münzen jetzt (Kontostand)", a => fmt(a.coinsNow)); row("Käufe (letzte " + 20 + "): Anzahl / Münzen", a => a.buys20 + " / " + fmt(a.spent20));
  row("Zeit-Münzen (seit v2.154): Münzen / Tage", a => fmt(a.timeCoins) + " / " + a.timeDays);
  row("Wochen-Münzen (seit v2.154): Münzen / Mal erreicht", a => fmt(a.weekCoins) + " / " + a.weekN);
  row("Anteil Zeit- und Wochen-Münzen an allen Münzen", a => a.coins ? f1((a.timeCoins + a.weekCoins) * 100 / a.coins) + " %" : "–");
  row("Münzen je Woche (Durchschnitt)", a => fmt(a.weeklyCoinsReal)); row("Aktive Tage je Woche", a => f1(a.activeDays / (a.days / 7)));
  L.push("\n## Rang-Prognose (bei gleichem Tempo wie im Zeitraum, je Kalendertag)\n");
  L.push("| Spieler | Rang jetzt | nächster Rang | Tage bis dorthin | Tage bis „The real Unreal“ |", "|---|---|---|---:|---:|");
  const last = RANKS[RANKS.length - 1][0];
  list.forEach(a => {
    const i = rankOf(a.xpNow), nx = RANKS[i + 1], per = a.xpPerDay;
    L.push("| " + a.name + " | " + RANKS[i][1] + " | " + (nx ? nx[1] : "–") + " | " + (nx && per ? fmt((nx[0] - a.xpNow) / per) : "–") + " | " + (per ? fmt(Math.max(0, last - a.xpNow) / per) : "–") + " |");
  });
  L.push("\n## Szenarien: weniger XP, mehr Münzen\n");
  L.push("Annahme: Verhalten bleibt gleich. „XP ×“ ändert die Vergabe je Aufgabe und Runde, „Münzen ×“ den Münzfaktor.\n");
  L.push("| XP × | Münzen × | " + list.map(a => a.name + ": Tage bis nächster Rang").join(" | ") + " | " + list.map(a => a.name + ": Münzen/Woche").join(" | ") + " |", "|---:|---:|" + list.map(() => "---:|---:").join("|") + "|");
  scen.forEach(([fx, fc]) => {
    L.push("| " + fx + " | " + fc + " | " + list.map(a => { const i = rankOf(a.xpNow), nx = RANKS[i + 1], per = a.xpPerDay * fx; return nx && per ? fmt((nx[0] - a.xpNow) / per) : "–"; }).join(" | ") + " | " + list.map(a => fmt(a.coinsPerDay * 7 * fc)).join(" | ") + " |");
  });
  L.push("\n## Hinweise\n- Münzen kommen auch aus Missionen, Pass und Serien; sie stecken in „Münzen gesamt“, soweit sie über Lernrunden verbucht wurden.\n- Zeit- und Wochen-Münzen sind in den Münzen gesamt schon enthalten (Aufteilung). Zeigt die Zeile 0, hat der Server die Ereignisse noch nicht (Server-Update) oder es wurde noch nichts davon verdient. Für den Zwei-Wochen-Test: „node tools/xp_analyse.js 14 Magnus,Chrissi,Checker“.\n- „Käufe“ zeigt nur die letzten 20; der Kontostand sagt, wie viel ungenutzt liegt.\n- Große Unterschiede bei „XP je Minute“ zwischen Spielern zeigen, ob die Vergabe Vielspieler oder Schnelltipper bevorzugt.");
  return L.join("\n");
}

(async () => {
  const args = process.argv.slice(2), files = [];
  for (let i = 0; i < args.length; i++) if (args[i] === "--file") files.push(args[++i]);
  const rest = args.filter((a, i) => a !== "--file" && args[i - 1] !== "--file");
  const days = +rest[0] || 90, only = rest[1] ? rest[1].split(",") : [];
  let list;
  if (files.length) list = files.map(f => { const rep = JSON.parse(fs.readFileSync(f, "utf8")); return analyse(f.replace(/\.json$/, "").replace(/^.*\//, ""), rep.report || rep); });
  else {
    const base = process.env.WORDY_URL, user = process.env.WORDY_USER, pass = process.env.WORDY_PASS;
    if (!base || !user || !pass) { console.error("WORDY_URL, WORDY_USER und WORDY_PASS setzen oder --file benutzen (siehe Kopf der Datei)."); process.exit(2); }
    list = (await fetchAll(base.replace(/\/$/, ""), user, pass, days, only)).map(x => analyse(x.name, x.rep));
  }
  console.log(report(list, [[1, 1], [0.8, 1.25], [0.7, 1.5], [0.6, 2], [0.5, 2]]));
})().catch(e => { console.error("Fehler:", e.message); process.exit(1); });
