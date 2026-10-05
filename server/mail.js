/* Minimaler SMTP-Versand ohne Zusatzpakete: gesicherte Verbindung (Port 465) oder STARTTLS (Port 587), Anmeldung PLAIN/LOGIN.
   Für Tests und einen lokalen Mailserver gibt es secure = "none" (nur ohne Anmeldung oder zu localhost). */
"use strict";
const net = require("node:net"), tls = require("node:tls"), crypto = require("node:crypto");

function b64(s) { return Buffer.from(s, "utf8").toString("base64"); }
function wrap76(s) { return s.replace(/(.{76})/g, "$1\r\n"); }
function encHeader(s) { return /^[\x20-\x7e]*$/.test(s) ? s : "=?UTF-8?B?" + b64(s) + "?="; }
function addr(s) { const m = String(s).match(/<([^>]+)>/); return (m ? m[1] : String(s)).trim(); }

function buildMessage(o) {
  const boundary = "wordy-" + crypto.randomBytes(8).toString("hex");
  const lines = [
    "From: " + o.from, "To: " + o.to, "Subject: " + encHeader(o.subject),
    "Date: " + new Date().toUTCString(), "Message-ID: <" + crypto.randomBytes(12).toString("hex") + "@wordy>",
    "MIME-Version: 1.0", 'Content-Type: multipart/alternative; boundary="' + boundary + '"', "",
    "--" + boundary, 'Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", wrap76(b64(o.text)),
    "--" + boundary, 'Content-Type: text/html; charset="UTF-8"', "Content-Transfer-Encoding: base64", "", wrap76(b64(o.html)),
    "--" + boundary + "--", ""
  ];
  return lines.join("\r\n");
}

function sendMail(o) {
  return new Promise((resolve, reject) => {
    const port = +o.port || 587, secure = o.secure || (port === 465 ? "ssl" : "starttls");
    let sock, buf = "", waiter = null, done = false;
    const fail = e => { if (!done) { done = true; try { sock && sock.destroy(); } catch (x) {} reject(e instanceof Error ? e : new Error(String(e))); } };
    const timer = setTimeout(() => fail(new Error("Zeitüberschreitung beim Mailversand")), 25000);
    function feed(d) {
      buf += d.toString("utf8");
      for (;;) {   // eine Antwort ist vollständig, wenn die letzte Zeile "NNN " (mit Leerzeichen) beginnt
        const lines = buf.split("\r\n"); if (lines.length < 2) return;
        const full = []; let end = -1;
        for (let i = 0; i < lines.length - 1; i++) { full.push(lines[i]); if (/^\d{3} /.test(lines[i])) { end = i; break; } }
        if (end < 0) return;
        buf = lines.slice(end + 1).join("\r\n");
        const w = waiter; waiter = null; if (w) w(full);
      }
    }
    const reply = () => new Promise(r => { waiter = r; });
    const code = r => +r[r.length - 1].slice(0, 3);
    const send = l => sock.write(l + "\r\n");
    async function cmd(l, ok) { send(l); const r = await reply(); if (!ok.includes(code(r))) throw new Error("Mailserver: " + r.join(" ").slice(0, 200)); return r; }
    async function dialog() {
      let r = await reply(); if (code(r) !== 220) throw new Error("Mailserver: " + r.join(" "));
      let ehlo = await cmd("EHLO wordy", [250]);
      if (secure === "starttls") {
        await cmd("STARTTLS", [220]);
        sock.removeAllListeners("data");
        sock = tls.connect({ socket: sock, servername: o.host }); sock.on("data", feed); sock.on("error", fail);
        await new Promise((res, rej) => { sock.once("secureConnect", res); sock.once("error", rej); });
        ehlo = await cmd("EHLO wordy", [250]);
      }
      if (o.user) {
        const feats = ehlo.join(" ").toUpperCase();
        if (feats.includes("AUTH") && /AUTH[^\r\n]*PLAIN/.test(feats.replace(/\s+/g, " "))) await cmd("AUTH PLAIN " + b64("\0" + o.user + "\0" + o.pass), [235]);
        else { await cmd("AUTH LOGIN", [334]); await cmd(b64(o.user), [334]); await cmd(b64(o.pass), [235]); }
      }
      await cmd("MAIL FROM:<" + addr(o.from) + ">", [250]);
      for (const t of String(o.to).split(",")) await cmd("RCPT TO:<" + addr(t) + ">", [250, 251]);
      await cmd("DATA", [354]);
      sock.write(buildMessage(o).replace(/^\./gm, "..") + "\r\n.\r\n");
      r = await reply(); if (code(r) !== 250) throw new Error("Mailserver: " + r.join(" "));
      send("QUIT");
    }
    const onConnect = () => dialog().then(() => { done = true; clearTimeout(timer); sock.end(); resolve(true); }, e => { clearTimeout(timer); fail(e); });
    if (secure === "ssl") sock = tls.connect({ host: o.host, port, servername: o.host }, onConnect);
    else sock = net.connect({ host: o.host, port }, onConnect);
    sock.on("data", feed); sock.on("error", e => { clearTimeout(timer); fail(e); });
  });
}

/* Versand über Microsoft Graph (Microsoft 365): Anmeldung der App mit Mandanten-ID, Client-ID und Geheimnis, kein SMTP-Passwort nötig.
   Benötigt in Entra ID eine App-Registrierung mit der Anwendungsberechtigung Mail.Send (Administratorzustimmung). */
let tokenCache = { token: "", exp: 0 };
async function graphToken(o, f) {
  if (tokenCache.token && Date.now() < tokenCache.exp - 60000) return tokenCache.token;
  const r = await f("https://login.microsoftonline.com/" + encodeURIComponent(o.tenant) + "/oauth2/v2.0/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: o.clientId, client_secret: o.clientSecret, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }).toString()
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error("Microsoft-Anmeldung fehlgeschlagen: " + (j.error_description || j.error || r.status).toString().split("\r")[0].slice(0, 200));
  tokenCache = { token: j.access_token, exp: Date.now() + (j.expires_in || 3000) * 1000 };
  return j.access_token;
}
async function sendGraph(o, f) {
  f = f || fetch;
  const token = await graphToken(o, f);
  const msg = {
    message: {
      subject: o.subject, body: { contentType: "HTML", content: o.html },
      toRecipients: String(o.to).split(",").map(t => ({ emailAddress: { address: addr(t) } }))
    },
    saveToSentItems: false
  };
  const r = await f("https://graph.microsoft.com/v1.0/users/" + encodeURIComponent(addr(o.from)) + "/sendMail", {
    method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(msg)
  });
  if (r.status !== 202 && !r.ok) {
    if (r.status === 401 || r.status === 403) tokenCache = { token: "", exp: 0 };   // nächster Versuch holt ein frisches Token
    const j = await r.json().catch(() => ({}));
    throw new Error("Microsoft Graph: " + r.status + " " + ((j.error && (j.error.message || j.error.code)) || "").toString().slice(0, 200));
  }
  return true;
}
module.exports = { sendMail, sendGraph, buildMessage };

