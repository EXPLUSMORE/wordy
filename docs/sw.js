/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-1093f5a5af';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=1093f5a5af",
  "data/klasse7.js?v=1093f5a5af",
  "data/klasse8.js?v=1093f5a5af",
  "data/business.js?v=1093f5a5af",
  "data/business-basis2.js?v=1093f5a5af",
  "data/business-aufbau2.js?v=1093f5a5af",
  "data/business-profi2.js?v=1093f5a5af",
  "data/smalltalk.js?v=1093f5a5af",
  "data/idioms.js?v=1093f5a5af",
  "data/saetze.js?v=1093f5a5af",
  "data/saetze2.js?v=1093f5a5af",
  "data/lernbuch.js?v=1093f5a5af",
  "data/verben.js?v=1093f5a5af",
  "js/engine.js?v=1093f5a5af",
  "js/cosmetics.js?v=1093f5a5af",
  "js/fortnite.js?v=1093f5a5af",
  "js/figur.js?v=1093f5a5af",
  "js/stila.js?v=1093f5a5af",
  "js/stilb.js?v=1093f5a5af",
  "js/loot.js?v=1093f5a5af",
  "js/film.js?v=1093f5a5af",
  "js/app.js?v=1093f5a5af",
  "js/arena.js?v=1093f5a5af",
  "js/sync.js?v=1093f5a5af",
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
