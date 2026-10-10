/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-78adedac01';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=78adedac01",
  "data/klasse7.js?v=78adedac01",
  "data/klasse8.js?v=78adedac01",
  "data/business.js?v=78adedac01",
  "data/business-basis2.js?v=78adedac01",
  "data/business-aufbau2.js?v=78adedac01",
  "data/business-profi2.js?v=78adedac01",
  "data/smalltalk.js?v=78adedac01",
  "data/idioms.js?v=78adedac01",
  "data/saetze.js?v=78adedac01",
  "data/saetze2.js?v=78adedac01",
  "data/lernbuch.js?v=78adedac01",
  "data/verben.js?v=78adedac01",
  "js/engine.js?v=78adedac01",
  "js/cosmetics.js?v=78adedac01",
  "js/fortnite.js?v=78adedac01",
  "js/figur.js?v=78adedac01",
  "js/stila.js?v=78adedac01",
  "js/stilb.js?v=78adedac01",
  "js/loot.js?v=78adedac01",
  "js/film.js?v=78adedac01",
  "js/app.js?v=78adedac01",
  "js/arena.js?v=78adedac01",
  "js/spiele.js?v=78adedac01",
  "js/sync.js?v=78adedac01",
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
