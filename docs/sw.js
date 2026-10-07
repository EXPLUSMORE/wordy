/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-d0c8b16a4a';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=d0c8b16a4a",
  "data/klasse7.js?v=d0c8b16a4a",
  "data/klasse8.js?v=d0c8b16a4a",
  "data/business.js?v=d0c8b16a4a",
  "data/business-basis2.js?v=d0c8b16a4a",
  "data/business-aufbau2.js?v=d0c8b16a4a",
  "data/business-profi2.js?v=d0c8b16a4a",
  "data/smalltalk.js?v=d0c8b16a4a",
  "data/idioms.js?v=d0c8b16a4a",
  "data/saetze.js?v=d0c8b16a4a",
  "data/saetze2.js?v=d0c8b16a4a",
  "data/lernbuch.js?v=d0c8b16a4a",
  "data/verben.js?v=d0c8b16a4a",
  "js/engine.js?v=d0c8b16a4a",
  "js/cosmetics.js?v=d0c8b16a4a",
  "js/fortnite.js?v=d0c8b16a4a",
  "js/figur.js?v=d0c8b16a4a",
  "js/stila.js?v=d0c8b16a4a",
  "js/stilb.js?v=d0c8b16a4a",
  "js/loot.js?v=d0c8b16a4a",
  "js/film.js?v=d0c8b16a4a",
  "js/app.js?v=d0c8b16a4a",
  "js/arena.js?v=d0c8b16a4a",
  "js/sync.js?v=d0c8b16a4a",
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
