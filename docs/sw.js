/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-ac5d8fe2e5';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=ac5d8fe2e5",
  "data/klasse7.js?v=ac5d8fe2e5",
  "data/klasse8.js?v=ac5d8fe2e5",
  "data/business.js?v=ac5d8fe2e5",
  "data/business-basis2.js?v=ac5d8fe2e5",
  "data/business-aufbau2.js?v=ac5d8fe2e5",
  "data/business-profi2.js?v=ac5d8fe2e5",
  "data/smalltalk.js?v=ac5d8fe2e5",
  "data/idioms.js?v=ac5d8fe2e5",
  "data/saetze.js?v=ac5d8fe2e5",
  "data/saetze2.js?v=ac5d8fe2e5",
  "data/lernbuch.js?v=ac5d8fe2e5",
  "data/verben.js?v=ac5d8fe2e5",
  "js/engine.js?v=ac5d8fe2e5",
  "js/cosmetics.js?v=ac5d8fe2e5",
  "js/fortnite.js?v=ac5d8fe2e5",
  "js/figur.js?v=ac5d8fe2e5",
  "js/stila.js?v=ac5d8fe2e5",
  "js/stilb.js?v=ac5d8fe2e5",
  "js/loot.js?v=ac5d8fe2e5",
  "js/film.js?v=ac5d8fe2e5",
  "js/app.js?v=ac5d8fe2e5",
  "js/arena.js?v=ac5d8fe2e5",
  "js/sync.js?v=ac5d8fe2e5",
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
