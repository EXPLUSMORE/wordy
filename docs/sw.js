/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-62f80c09da';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=62f80c09da",
  "data/klasse7.js?v=62f80c09da",
  "data/klasse8.js?v=62f80c09da",
  "data/business.js?v=62f80c09da",
  "data/business-basis2.js?v=62f80c09da",
  "data/business-aufbau2.js?v=62f80c09da",
  "data/business-profi2.js?v=62f80c09da",
  "data/smalltalk.js?v=62f80c09da",
  "data/idioms.js?v=62f80c09da",
  "data/saetze.js?v=62f80c09da",
  "data/saetze2.js?v=62f80c09da",
  "data/lernbuch.js?v=62f80c09da",
  "data/verben.js?v=62f80c09da",
  "data/grammatik.js?v=62f80c09da",
  "js/engine.js?v=62f80c09da",
  "js/cosmetics.js?v=62f80c09da",
  "js/fortnite.js?v=62f80c09da",
  "js/figur.js?v=62f80c09da",
  "js/stila.js?v=62f80c09da",
  "js/stilb.js?v=62f80c09da",
  "js/loot.js?v=62f80c09da",
  "js/film.js?v=62f80c09da",
  "js/app.js?v=62f80c09da",
  "js/arena.js?v=62f80c09da",
  "js/spiele.js?v=62f80c09da",
  "js/grammatik.js?v=62f80c09da",
  "js/sync.js?v=62f80c09da",
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
