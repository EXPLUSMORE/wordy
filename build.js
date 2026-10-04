/* Baut zwei Fassungen:
   docs/        – Website für GitHub Pages, installierbar, mit Offline-Cache
   wordy.html   – alles in einer Datei, zum Weitergeben ohne Server          */
const fs = require('fs'), path = require('path');

const DATA = ['data/klasse6.js','data/klasse7.js','data/klasse8.js','data/business.js',
  'data/business-basis2.js','data/business-aufbau2.js','data/business-profi2.js',
  'data/smalltalk.js','data/idioms.js','data/saetze.js'];
const CODE = ['js/engine.js','js/app.js','js/arena.js'];
const ICONS = ['icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png','icons/favicon-32.png'];

const APP = 'Wordy';
const THEME = '#1E6273';
const src = fs.readFileSync('index.html', 'utf8');
const head = src.slice(0, src.indexOf('<div id="app">'));
const body = src.slice(src.indexOf('<div id="app">'));

/* ---------- 1. Einzeldatei ---------- */
let inline = src;
[...DATA, ...CODE].forEach(f => {
  inline = inline.replace(`<script src="${f}"></script>`, () => '<script>' + fs.readFileSync(f, 'utf8') + '</script>');
});
const iHead = inline.slice(0, inline.indexOf('<div id="app">'));
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
  background_color: '#EEF2F8', theme_color: THEME,
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
const stamp = require('crypto').createHash('sha1')
  .update([...DATA, ...CODE].map(f => fs.readFileSync(f)).join('') + src).digest('hex').slice(0, 10);

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
</head>
<body>
${body}
<script>
if ('serviceWorker' in navigator) {
  addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
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
