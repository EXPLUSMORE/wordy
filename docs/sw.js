/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-3a9635d5ba';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=3a9635d5ba",
  "data/klasse7.js?v=3a9635d5ba",
  "data/klasse8.js?v=3a9635d5ba",
  "data/business.js?v=3a9635d5ba",
  "data/business-basis2.js?v=3a9635d5ba",
  "data/business-aufbau2.js?v=3a9635d5ba",
  "data/business-profi2.js?v=3a9635d5ba",
  "data/smalltalk.js?v=3a9635d5ba",
  "data/idioms.js?v=3a9635d5ba",
  "data/saetze.js?v=3a9635d5ba",
  "data/saetze2.js?v=3a9635d5ba",
  "data/lernbuch.js?v=3a9635d5ba",
  "data/verben.js?v=3a9635d5ba",
  "js/engine.js?v=3a9635d5ba",
  "js/cosmetics.js?v=3a9635d5ba",
  "js/fortnite.js?v=3a9635d5ba",
  "js/figur.js?v=3a9635d5ba",
  "js/stila.js?v=3a9635d5ba",
  "js/stilb.js?v=3a9635d5ba",
  "js/loot.js?v=3a9635d5ba",
  "js/film.js?v=3a9635d5ba",
  "js/app.js?v=3a9635d5ba",
  "js/arena.js?v=3a9635d5ba",
  "js/sync.js?v=3a9635d5ba",
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
