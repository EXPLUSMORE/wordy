/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-8c48e0df4f';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=8c48e0df4f",
  "data/klasse7.js?v=8c48e0df4f",
  "data/klasse8.js?v=8c48e0df4f",
  "data/business.js?v=8c48e0df4f",
  "data/business-basis2.js?v=8c48e0df4f",
  "data/business-aufbau2.js?v=8c48e0df4f",
  "data/business-profi2.js?v=8c48e0df4f",
  "data/smalltalk.js?v=8c48e0df4f",
  "data/idioms.js?v=8c48e0df4f",
  "data/saetze.js?v=8c48e0df4f",
  "data/saetze2.js?v=8c48e0df4f",
  "data/lernbuch.js?v=8c48e0df4f",
  "data/verben.js?v=8c48e0df4f",
  "js/engine.js?v=8c48e0df4f",
  "js/cosmetics.js?v=8c48e0df4f",
  "js/fortnite.js?v=8c48e0df4f",
  "js/app.js?v=8c48e0df4f",
  "js/arena.js?v=8c48e0df4f",
  "js/sync.js?v=8c48e0df4f",
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
