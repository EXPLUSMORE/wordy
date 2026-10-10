/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-6d81f44c30';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=6d81f44c30",
  "data/klasse7.js?v=6d81f44c30",
  "data/klasse8.js?v=6d81f44c30",
  "data/business.js?v=6d81f44c30",
  "data/business-basis2.js?v=6d81f44c30",
  "data/business-aufbau2.js?v=6d81f44c30",
  "data/business-profi2.js?v=6d81f44c30",
  "data/smalltalk.js?v=6d81f44c30",
  "data/idioms.js?v=6d81f44c30",
  "data/saetze.js?v=6d81f44c30",
  "data/saetze2.js?v=6d81f44c30",
  "data/lernbuch.js?v=6d81f44c30",
  "data/verben.js?v=6d81f44c30",
  "js/engine.js?v=6d81f44c30",
  "js/cosmetics.js?v=6d81f44c30",
  "js/fortnite.js?v=6d81f44c30",
  "js/figur.js?v=6d81f44c30",
  "js/stila.js?v=6d81f44c30",
  "js/stilb.js?v=6d81f44c30",
  "js/loot.js?v=6d81f44c30",
  "js/film.js?v=6d81f44c30",
  "js/app.js?v=6d81f44c30",
  "js/arena.js?v=6d81f44c30",
  "js/sync.js?v=6d81f44c30",
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
