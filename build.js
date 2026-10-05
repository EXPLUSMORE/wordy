/* Baut zwei Fassungen:
   docs/        – Website für GitHub Pages, installierbar, mit Offline-Cache
   wordy.html   – alles in einer Datei, zum Weitergeben ohne Server          */
const fs = require('fs'), path = require('path');

const DATA = ['data/klasse6.js','data/klasse7.js','data/klasse8.js','data/business.js',
  'data/business-basis2.js','data/business-aufbau2.js','data/business-profi2.js',
  'data/smalltalk.js','data/idioms.js','data/saetze.js','data/lernbuch.js','data/verben.js'];
const CODE = ['js/engine.js','js/cosmetics.js','js/fortnite.js','js/app.js','js/arena.js','js/sync.js'];
const ICONS = ['icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png','icons/favicon-32.png'];

const APP = 'Wordy';
const THEME = '#1E6273';
const src = fs.readFileSync('index.html', 'utf8');
/* Version aus dem Inhalt: ändert sich der Code, ändert sich auch diese Kennung (Setup zeigt sie, der Offline-Cache nutzt sie) */
const VERSION = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;   // Versionsnummer: nur in package.json pflegen
const stamp = require('crypto').createHash('sha1')
  .update([...DATA, ...CODE].map(f => fs.readFileSync(f)).join('') + src + VERSION)
  .update(Buffer.concat(ICONS.map(f => fs.readFileSync(f))))   // neue Symbole lösen ebenfalls ein Update aus
  .digest('hex').slice(0, 10);
if (!/^[0-9a-f]{10}$/.test(stamp)) throw new Error('Build-Kennung ungültig: ' + stamp);   // Sicherung: sonst bekäme der Offline-Cache einen festen Namen und Geräte sähen keine Updates mehr
const head = src.slice(0, src.indexOf('<div id="app">'));
const body = src.slice(src.indexOf('<div id="app">'));

/* ---------- 1. Einzeldatei ---------- */
let inline = src.replace('</head>', `<script>window.WORDY_VERSION="${VERSION}";window.WORDY_BUILD="${stamp}";</script>\n</head>`);
[...DATA, ...CODE].forEach(f => {
  inline = inline.replace(`<script src="${f}"></script>`, () => '<script>' + fs.readFileSync(f, 'utf8') + '</script>');
});
const iHead = inline.slice(0, inline.indexOf('<div id="app">')) + `\n<script>window.WORDY_VERSION="${VERSION}";window.WORDY_BUILD="${stamp}";</script>`;
const iBody = inline.slice(inline.indexOf('<div id="app">'));
fs.writeFileSync('wordy.html',
  '<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
  `<meta name="theme-color" content="${THEME}">\n` + iHead + '\n</head>\n<body>\n' + iBody + '\n</body>\n</html>\n');

/* ---------- 2. Website ---------- */
fs.rmSync('docs', { recursive: true, force: true });
for (const d of ['docs', 'docs/js', 'docs/data', 'docs/icons']) fs.mkdirSync(d, { recursive: true });
[...DATA, ...CODE, ...ICONS].forEach(f => fs.copyFileSync(f, path.join('docs', f)));

const manifest = {
  name: APP, short_name: APP, lang: 'de', dir: 'ltr',
  description: 'Englisch-Vokabeltrainer für Schule und Beruf – mit Spaced Repetition, Satzbau und Arena auf Zeit.',
  start_url: './', scope: './', id: '/', display: 'standalone', orientation: 'portrait',
  background_color: '#6A5CF0', theme_color: THEME,
  categories: ['education'],
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
  ]
};
fs.writeFileSync('docs/manifest.webmanifest', JSON.stringify(manifest, null, 2));

const PRECACHE = ['./', 'index.html', 'manifest.webmanifest', ...DATA, ...CODE, ...ICONS];
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
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${manifest.description}">
<meta name="theme-color" content="${THEME}">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
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
