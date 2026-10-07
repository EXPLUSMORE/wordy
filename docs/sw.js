/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-d975032e68';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=d975032e68",
  "data/klasse7.js?v=d975032e68",
  "data/klasse8.js?v=d975032e68",
  "data/business.js?v=d975032e68",
  "data/business-basis2.js?v=d975032e68",
  "data/business-aufbau2.js?v=d975032e68",
  "data/business-profi2.js?v=d975032e68",
  "data/smalltalk.js?v=d975032e68",
  "data/idioms.js?v=d975032e68",
  "data/saetze.js?v=d975032e68",
  "data/saetze2.js?v=d975032e68",
  "data/lernbuch.js?v=d975032e68",
  "data/verben.js?v=d975032e68",
  "js/engine.js?v=d975032e68",
  "js/cosmetics.js?v=d975032e68",
  "js/fortnite.js?v=d975032e68",
  "js/figur.js?v=d975032e68",
  "js/stila.js?v=d975032e68",
  "js/stilb.js?v=d975032e68",
  "js/loot.js?v=d975032e68",
  "js/film.js?v=d975032e68",
  "js/app.js?v=d975032e68",
  "js/arena.js?v=d975032e68",
  "js/sync.js?v=d975032e68",
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
