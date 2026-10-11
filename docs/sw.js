/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-c931050773';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=c931050773",
  "data/klasse7.js?v=c931050773",
  "data/klasse8.js?v=c931050773",
  "data/business.js?v=c931050773",
  "data/business-basis2.js?v=c931050773",
  "data/business-aufbau2.js?v=c931050773",
  "data/business-profi2.js?v=c931050773",
  "data/smalltalk.js?v=c931050773",
  "data/idioms.js?v=c931050773",
  "data/saetze.js?v=c931050773",
  "data/saetze2.js?v=c931050773",
  "data/lernbuch.js?v=c931050773",
  "data/verben.js?v=c931050773",
  "data/grammatik.js?v=c931050773",
  "js/engine.js?v=c931050773",
  "js/cosmetics.js?v=c931050773",
  "js/fortnite.js?v=c931050773",
  "js/figur.js?v=c931050773",
  "js/stila.js?v=c931050773",
  "js/stilb.js?v=c931050773",
  "js/loot.js?v=c931050773",
  "js/film.js?v=c931050773",
  "js/app.js?v=c931050773",
  "js/arena.js?v=c931050773",
  "js/spiele.js?v=c931050773",
  "js/grammatik.js?v=c931050773",
  "js/sync.js?v=c931050773",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png"
];

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
