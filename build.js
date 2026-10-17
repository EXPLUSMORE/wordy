/* Baut zwei Fassungen:
   docs/        – Website für GitHub Pages, installierbar, mit Offline-Cache
   wordy.html   – alles in einer Datei, zum Weitergeben ohne Server          */
const fs = require('fs'), path = require('path');

/* Altbestand: wird ohne Herkunftsangaben (src/lic) ausgeliefert, siehe SOURCES.md */
const LEGACY = ['data/klasse6.js','data/klasse7.js','data/klasse8.js','data/business.js',
  'data/business-basis2.js','data/business-aufbau2.js','data/business-profi2.js',
  'data/smalltalk.js','data/idioms.js','data/saetze.js','data/saetze2.js','data/lernbuch.js','data/verben.js','data/grammatik.js'];
/* Offene Daten (data/open/*.js): jeder Eintrag braucht src und lic von der Whitelist, sonst bricht der Build ab.
   Private Dateien (private/, *.private.*, data/private/) werden nie gelesen. */
const OPEN = fs.existsSync('data/open') ? fs.readdirSync('data/open').filter(f => /\.js$/.test(f)).sort().map(f => 'data/open/' + f) : [];
const DATA = LEGACY.concat(OPEN);
const rules = require('./tools/lib/open_rules.js');
if (DATA.some(f => /(^|\/)private\//.test(f) || /\.private\./.test(f))) throw new Error('Private Dateien dürfen nicht in den Build.');
if (OPEN.length) {
  const taken = []; LEGACY.forEach(f => { try { rules.load(f).units.forEach(u => taken.push(u.id)); } catch (e) {} });
  const chk = rules.validate(OPEN, taken);
  if (chk.errs.length) {
    console.error('BUILD ABGEBROCHEN: Verstöße in data/open (' + chk.errs.length + '):');
    chk.errs.slice(0, 100).forEach(e => console.error('  - ' + e));
    if (chk.errs.length > 100) console.error('  … und ' + (chk.errs.length - 100) + ' weitere');
    process.exit(1);
  }
}
const CODE = ['js/engine.js','js/cosmetics.js','js/fortnite.js','js/figur.js','js/stila.js','js/stilb.js','js/loot.js','js/film.js','js/app.js','js/arena.js','js/spiele.js','js/grammatik.js','js/sync.js'];
const ICONS = ['icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png','icons/favicon-32.png'];

const APP = 'Wordy';
const THEME = '#0E1320';   // Nachtgold: Browserleiste und Startbild im selben Dunkelblau wie das Symbol
const src = fs.readFileSync('index.html', 'utf8').replace('<!--OPEN-DATA-->', OPEN.map(f => `<script src="${f}"></script>`).join('\n'));
/* Version aus dem Inhalt: ändert sich der Code, ändert sich auch diese Kennung (Setup zeigt sie, der Offline-Cache nutzt sie) */
const VERSION = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;   // Versionsnummer: nur in package.json pflegen
const AUDIO = fs.existsSync('audio/film') ? fs.readdirSync('audio/film').filter(f => /\.(mp3|json)$/.test(f)).sort().map(f => 'audio/film/' + f) : [];
const stamp = require('crypto').createHash('sha1')
  .update([...DATA, ...CODE].map(f => fs.readFileSync(f)).join('') + src + VERSION)
  .update(Buffer.concat(AUDIO.map(f => fs.readFileSync(f))))
  .update(Buffer.concat(ICONS.map(f => fs.readFileSync(f))))   // neue Symbole lösen ebenfalls ein Update aus
  .digest('hex').slice(0, 10);
if (!/^[0-9a-f]{10}$/.test(stamp)) throw new Error('Build-Kennung ungültig: ' + stamp);   // Sicherung: sonst bekäme der Offline-Cache einen festen Namen und Geräte sähen keine Updates mehr
/* Skripte der Website bekommen die Build-Kennung als Parameter: eine neue index.html holt dadurch immer die passenden Dateien
   und nie alte aus dem Cache (sonst zeigt Setup die neue Version, die Oberfläche ist aber noch die alte). */
const vers = h => [...DATA, ...CODE].reduce((t, f) => t.split(`src="${f}"`).join(`src="${f}?v=${stamp}"`), h);
const head = vers(src.slice(0, src.indexOf('<div id="app">')));
const body = vers(src.slice(src.indexOf('<div id="app">')));

/* ---------- 1. Einzeldatei ---------- */
let inline = src.replace('</head>', `<script>window.WORDY_VERSION="${VERSION}";window.WORDY_BUILD="${stamp}";</script>\n</head>`);
[...DATA, ...CODE].forEach(f => {
  inline = inline.replace(`<script src="${f}"></script>`, () => '<script>' + fs.readFileSync(f, 'utf8') + '</script>');
});
const iHead = inline.slice(0, inline.indexOf('<div id="app">')) + `\n<script>window.WORDY_VERSION="${VERSION}";window.WORDY_BUILD="${stamp}";</script>`;
const iBody = inline.slice(inline.indexOf('<div id="app">'));
fs.writeFileSync('wordy.html',
  '<!doctype html>\n<html lang="de" data-design="gold" data-x="1">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
  `<meta name="theme-color" content="${THEME}">\n` + iHead + '\n</head>\n<body>\n' + iBody + '\n</body>\n</html>\n');

/* ---------- 2. Website ---------- */
fs.rmSync('docs', { recursive: true, force: true });
for (const d of ['docs', 'docs/js', 'docs/data', 'docs/icons', ...(OPEN.length ? ['docs/data/open'] : []), ...(AUDIO.length ? ['docs/audio/film'] : [])]) fs.mkdirSync(d, { recursive: true });
[...DATA, ...CODE, ...ICONS, ...AUDIO].forEach(f => fs.copyFileSync(f, path.join('docs', f)));

const manifest = {
  name: APP, short_name: APP, lang: 'de', dir: 'ltr',
  description: 'Englisch-Vokabeltrainer für Schule und Beruf – mit Spaced Repetition, Satzbau und Arena auf Zeit.',
  start_url: './', scope: './', id: '/', display: 'standalone', orientation: 'portrait',
  background_color: '#0E1320', theme_color: THEME,
  categories: ['education'],
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};
fs.writeFileSync('docs/manifest.webmanifest', JSON.stringify(manifest, null, 2));

const PRECACHE = ['./', 'index.html', 'manifest.webmanifest', ...[...DATA, ...CODE].map(f => `${f}?v=${stamp}`), ...ICONS, ...AUDIO];
/* Version aus dem Inhalt: ändert sich der Code, lädt der Cache neu */


fs.writeFileSync('docs/sw.js', `/* ${APP} – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-${stamp}';
const FILES = ${JSON.stringify(PRECACHE, null, 2)};

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  /* Ist Wordy gerade offen und sichtbar, erscheint die Erinnerung als Fenster in der App (muss weggeklickt werden); sonst als Mitteilung, die stehen bleibt. */
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const vis = list.filter(c => c.visibilityState === 'visible');
    if (vis.length) { vis.forEach(c => c.postMessage({ type: 'wordy-push', title: d.title || 'Wordy', body: d.body || '' })); return; }
    return self.registration.showNotification(d.title || 'Wordy', { body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/favicon-32.png', tag: d.tag || 'wordy', renotify: true, requireInteraction: true, vibrate: [200, 100, 200], actions: [{ action: 'open', title: "Los geht's ▶" }, { action: 'later', title: 'Später' }], data: { url: d.url || './' } });
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'later') return;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return clients.openWindow((e.notification.data && e.notification.data.url) || './');
  }));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
    return res;
  }).catch(() => hit)));
});
`);

const siteHead = `<!doctype html>
<html lang="de" data-design="gold" data-x="1">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${manifest.description}">
<meta name="theme-color" content="${THEME}">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="${APP}">
${head}
<script>window.WORDY_VERSION="${VERSION}";window.WORDY_BUILD="${stamp}";</script>
</head>
<body>
${body}
<script>
if ('serviceWorker' in navigator) {
  var hadController = !!navigator.serviceWorker.controller, bannerShown = false;
  function updateBanner() {
    if (bannerShown) return; bannerShown = true;
    var b = document.createElement('div');
    b.setAttribute('role', 'status');
    b.style.cssText = 'position:fixed;left:12px;right:12px;max-width:560px;margin:0 auto;bottom:78px;z-index:90;display:flex;gap:10px;align-items:center;' +
      'padding:12px 14px;border-radius:14px;background:var(--ink);color:var(--paper);box-shadow:0 8px 24px rgba(0,0,0,.3);font:inherit';
    b.innerHTML = '<span style="flex:1">Neue Version verfügbar.</span>' +
      '<button style="font:inherit;font-weight:600;border:0;border-radius:10px;padding:8px 14px;background:var(--accent);color:var(--accent-ink);cursor:pointer">Neu laden</button>' +
      '<button aria-label="Später" style="font:inherit;border:0;background:none;color:inherit;opacity:.7;cursor:pointer;padding:4px 6px">✕</button>';
    b.firstChild.nextSibling.onclick = function () { location.reload(); };
    b.lastChild.onclick = function () { b.remove(); };
    document.body.appendChild(b);
  }
  /* Eine neue Version übernimmt sofort; die offene Seite läuft aber noch mit dem alten Code. */
  /* Ist gerade nichts im Gang (keine Runde, keine Eingabe), lädt sich die App von selbst neu; sonst erscheint der Hinweis. */
  function idleNow() {
    var s = document.getElementById('session'), a = document.getElementById('arena'), f = document.activeElement;
    return (!s || s.hidden) && (!a || a.hidden) && !(f && /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName));
  }
  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController) return;
    if (idleNow()) { location.reload(); } else { updateBanner(); }
  });
  addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      var check = function () { reg.update().catch(function () {}); };
      document.addEventListener('visibilitychange', function () { if (!document.hidden) check(); });
      setInterval(check, 60 * 60 * 1000);
    }).catch(function () {});
  });
}
</script>
</body>
</html>
`;
fs.writeFileSync('docs/index.html', siteHead);
fs.writeFileSync('docs/CNAME', 'wordy.explusmore.com\n');
fs.writeFileSync('docs/.nojekyll', '');
console.log('Einzeldatei:', (fs.statSync('wordy.html').size / 1024).toFixed(0) + ' KB');
console.log('Website:', fs.readdirSync('docs').join(' '), '| Cache-Version', stamp);

/* Letzter Schritt: nichts aus privat-blocklist.txt darf in getrackten Dateien, docs/ oder wordy.html stehen */
const chk = require('child_process').spawnSync('node', ['tools/check_clean.js'], { stdio: 'inherit' });
if (chk.status !== 0) { console.error('BUILD ABGEBROCHEN: Prüfung auf private Inhalte fehlgeschlagen.'); process.exit(chk.status || 1); }
