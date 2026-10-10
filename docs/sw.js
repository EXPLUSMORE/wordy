/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-76d929f57e';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=76d929f57e",
  "data/klasse7.js?v=76d929f57e",
  "data/klasse8.js?v=76d929f57e",
  "data/business.js?v=76d929f57e",
  "data/business-basis2.js?v=76d929f57e",
  "data/business-aufbau2.js?v=76d929f57e",
  "data/business-profi2.js?v=76d929f57e",
  "data/smalltalk.js?v=76d929f57e",
  "data/idioms.js?v=76d929f57e",
  "data/saetze.js?v=76d929f57e",
  "data/saetze2.js?v=76d929f57e",
  "data/lernbuch.js?v=76d929f57e",
  "data/verben.js?v=76d929f57e",
  "js/engine.js?v=76d929f57e",
  "js/cosmetics.js?v=76d929f57e",
  "js/fortnite.js?v=76d929f57e",
  "js/figur.js?v=76d929f57e",
  "js/stila.js?v=76d929f57e",
  "js/stilb.js?v=76d929f57e",
  "js/loot.js?v=76d929f57e",
  "js/film.js?v=76d929f57e",
  "js/app.js?v=76d929f57e",
  "js/arena.js?v=76d929f57e",
  "js/spiele.js?v=76d929f57e",
  "js/sync.js?v=76d929f57e",
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
