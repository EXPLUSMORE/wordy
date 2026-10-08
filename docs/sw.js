/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-9a8d51a8ab';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=9a8d51a8ab",
  "data/klasse7.js?v=9a8d51a8ab",
  "data/klasse8.js?v=9a8d51a8ab",
  "data/business.js?v=9a8d51a8ab",
  "data/business-basis2.js?v=9a8d51a8ab",
  "data/business-aufbau2.js?v=9a8d51a8ab",
  "data/business-profi2.js?v=9a8d51a8ab",
  "data/smalltalk.js?v=9a8d51a8ab",
  "data/idioms.js?v=9a8d51a8ab",
  "data/saetze.js?v=9a8d51a8ab",
  "data/saetze2.js?v=9a8d51a8ab",
  "data/lernbuch.js?v=9a8d51a8ab",
  "data/verben.js?v=9a8d51a8ab",
  "js/engine.js?v=9a8d51a8ab",
  "js/cosmetics.js?v=9a8d51a8ab",
  "js/fortnite.js?v=9a8d51a8ab",
  "js/figur.js?v=9a8d51a8ab",
  "js/stila.js?v=9a8d51a8ab",
  "js/stilb.js?v=9a8d51a8ab",
  "js/loot.js?v=9a8d51a8ab",
  "js/film.js?v=9a8d51a8ab",
  "js/app.js?v=9a8d51a8ab",
  "js/arena.js?v=9a8d51a8ab",
  "js/sync.js?v=9a8d51a8ab",
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
