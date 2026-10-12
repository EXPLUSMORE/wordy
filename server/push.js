/* Web Push ohne Fremdbibliothek: VAPID (RFC 8292) und Nachrichtenverschlüsselung aes128gcm (RFC 8291) mit node:crypto. */
"use strict";
const crypto = require("node:crypto");
const b64u = b => Buffer.from(b).toString("base64url");
const unb64u = s => Buffer.from(String(s), "base64url");

/* VAPID-Schlüsselpaar: privat = 32 Byte, öffentlich = 65 Byte (unkomprimiert), beides base64url */
function generateVapid() {
  const e = crypto.createECDH("prime256v1"); e.generateKeys();
  return { publicKey: b64u(e.getPublicKey()), privateKey: b64u(e.getPrivateKey()) };
}
function privateKeyObject(v) {
  const pub = unb64u(v.publicKey);
  return crypto.createPrivateKey({ key: { kty: "EC", crv: "P-256", x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)), d: v.privateKey }, format: "jwk" });
}
function vapidHeader(vapid, endpoint, subject) {
  const aud = new URL(endpoint).origin;
  const head = b64u(JSON.stringify({ typ: "JWT", alg: "ES256" })), body = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject }));
  const sig = crypto.sign("sha256", Buffer.from(head + "." + body), { key: privateKeyObject(vapid), dsaEncoding: "ieee-p1363" });
  return "vapid t=" + head + "." + body + "." + b64u(sig) + ", k=" + vapid.publicKey;
}

/* Verschlüsseln für die Empfängerschlüssel des Geräts (p256dh, auth) */
function encrypt(sub, payload, opt) {
  opt = opt || {};
  const ua = unb64u(sub.keys.p256dh), authSecret = unb64u(sub.keys.auth);
  const as = crypto.createECDH("prime256v1"); as.generateKeys();
  if (opt.asPrivate) as.setPrivateKey(opt.asPrivate);   // nur für Tests mit festen Werten
  const asPub = as.getPublicKey(), secret = as.computeSecret(ua), salt = opt.salt || crypto.randomBytes(16);
  const ikm = Buffer.from(crypto.hkdfSync("sha256", secret, authSecret, Buffer.concat([Buffer.from("WebPush: info\0"), ua, asPub]), 32));
  const cek = Buffer.from(crypto.hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(crypto.hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
  const cipher = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  const ct = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), cipher.final(), cipher.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, ct]);
}
/* Gegenstück (zum Testen): entschlüsselt eine aes128gcm-Nachricht mit den Empfängerschlüsseln */
function decrypt(body, receiver) {
  const salt = body.subarray(0, 16), idlen = body[20], asPub = body.subarray(21, 21 + idlen), ct = body.subarray(21 + idlen);
  const secret = receiver.ecdh.computeSecret(asPub), ua = receiver.ecdh.getPublicKey();
  const ikm = Buffer.from(crypto.hkdfSync("sha256", secret, receiver.auth, Buffer.concat([Buffer.from("WebPush: info\0"), ua, asPub]), 32));
  const cek = Buffer.from(crypto.hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: aes128gcm\0"), 16));
  const nonce = Buffer.from(crypto.hkdfSync("sha256", ikm, salt, Buffer.from("Content-Encoding: nonce\0"), 12));
  const d = crypto.createDecipheriv("aes-128-gcm", cek, nonce); d.setAuthTag(ct.subarray(ct.length - 16));
  const pt = Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]);
  return pt.subarray(0, pt.lastIndexOf(2)).toString("utf8");
}
/* Senden. Ergebnis: { ok, status, gone } – gone = Abo ist ungültig (404/410) und kann gelöscht werden */
async function send(vapid, subject, sub, message, ttl) {
  const body = encrypt(sub, JSON.stringify(message));
  const r = await fetch(sub.endpoint, { method: "POST", headers: { "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: String(ttl || 14400), Urgency: "normal", Authorization: vapidHeader(vapid, sub.endpoint, subject) }, body, signal: AbortSignal.timeout(15000) });
  return { ok: r.status >= 200 && r.status < 300, status: r.status, gone: r.status === 404 || r.status === 410 };
}
module.exports = { generateVapid, vapidHeader, encrypt, decrypt, send, b64u, unb64u };
