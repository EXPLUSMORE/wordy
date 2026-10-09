/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-f810df7a5b';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=f810df7a5b",
  "data/klasse7.js?v=f810df7a5b",
  "data/klasse8.js?v=f810df7a5b",
  "data/business.js?v=f810df7a5b",
  "data/business-basis2.js?v=f810df7a5b",
  "data/business-aufbau2.js?v=f810df7a5b",
  "data/business-profi2.js?v=f810df7a5b",
  "data/smalltalk.js?v=f810df7a5b",
  "data/idioms.js?v=f810df7a5b",
  "data/saetze.js?v=f810df7a5b",
  "data/saetze2.js?v=f810df7a5b",
  "data/lernbuch.js?v=f810df7a5b",
  "data/verben.js?v=f810df7a5b",
  "js/engine.js?v=f810df7a5b",
  "js/cosmetics.js?v=f810df7a5b",
  "js/fortnite.js?v=f810df7a5b",
  "js/figur.js?v=f810df7a5b",
  "js/stila.js?v=f810df7a5b",
  "js/stilb.js?v=f810df7a5b",
  "js/loot.js?v=f810df7a5b",
  "js/film.js?v=f810df7a5b",
  "js/app.js?v=f810df7a5b",
  "js/arena.js?v=f810df7a5b",
  "js/sync.js?v=f810df7a5b",
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
