/* Tägliche Sicherung der Wordy-Datenbank (ohne sqlite3-Programm, nur Node).
   Aufruf: node backup.js   Umgebung: DB_FILE, BACKUP_DIR (Standard /var/backups/wordy), KEEP_DAYS (Standard 30) */
"use strict";
const { DatabaseSync } = require("node:sqlite");
const fs = require("node:fs"), path = require("node:path");
const dbFile = process.env.DB_FILE || "/var/lib/wordy/wordy.db";
const dir = process.env.BACKUP_DIR || "/var/backups/wordy";
const keep = +process.env.KEEP_DAYS || 30;
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, "wordy-" + new Date().toISOString().slice(0, 10) + ".db");
if (fs.existsSync(out)) fs.unlinkSync(out);
const db = new DatabaseSync(dbFile);
db.exec("VACUUM INTO '" + out.replace(/'/g, "''") + "'");
db.close();
for (const f of fs.readdirSync(dir)) {
  const p = path.join(dir, f);
  if (/^wordy-\d{4}-\d\d-\d\d\.db$/.test(f) && Date.now() - fs.statSync(p).mtimeMs > keep * 86400000) fs.unlinkSync(p);
}
console.log("Sicherung:", out);
