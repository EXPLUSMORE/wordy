/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-e580279e7b';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=e580279e7b",
  "data/klasse7.js?v=e580279e7b",
  "data/klasse8.js?v=e580279e7b",
  "data/business.js?v=e580279e7b",
  "data/business-basis2.js?v=e580279e7b",
  "data/business-aufbau2.js?v=e580279e7b",
  "data/business-profi2.js?v=e580279e7b",
  "data/smalltalk.js?v=e580279e7b",
  "data/idioms.js?v=e580279e7b",
  "data/saetze.js?v=e580279e7b",
  "data/saetze2.js?v=e580279e7b",
  "data/lernbuch.js?v=e580279e7b",
  "data/verben.js?v=e580279e7b",
  "js/engine.js?v=e580279e7b",
  "js/cosmetics.js?v=e580279e7b",
  "js/fortnite.js?v=e580279e7b",
  "js/app.js?v=e580279e7b",
  "js/arena.js?v=e580279e7b",
  "js/sync.js?v=e580279e7b",
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
