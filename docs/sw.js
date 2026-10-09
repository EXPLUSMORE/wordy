/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-3b137a1b9f';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=3b137a1b9f",
  "data/klasse7.js?v=3b137a1b9f",
  "data/klasse8.js?v=3b137a1b9f",
  "data/business.js?v=3b137a1b9f",
  "data/business-basis2.js?v=3b137a1b9f",
  "data/business-aufbau2.js?v=3b137a1b9f",
  "data/business-profi2.js?v=3b137a1b9f",
  "data/smalltalk.js?v=3b137a1b9f",
  "data/idioms.js?v=3b137a1b9f",
  "data/saetze.js?v=3b137a1b9f",
  "data/saetze2.js?v=3b137a1b9f",
  "data/lernbuch.js?v=3b137a1b9f",
  "data/verben.js?v=3b137a1b9f",
  "js/engine.js?v=3b137a1b9f",
  "js/cosmetics.js?v=3b137a1b9f",
  "js/fortnite.js?v=3b137a1b9f",
  "js/figur.js?v=3b137a1b9f",
  "js/stila.js?v=3b137a1b9f",
  "js/stilb.js?v=3b137a1b9f",
  "js/loot.js?v=3b137a1b9f",
  "js/film.js?v=3b137a1b9f",
  "js/app.js?v=3b137a1b9f",
  "js/arena.js?v=3b137a1b9f",
  "js/sync.js?v=3b137a1b9f",
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
