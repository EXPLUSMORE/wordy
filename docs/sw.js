/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-a7356c2720';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=a7356c2720",
  "data/klasse7.js?v=a7356c2720",
  "data/klasse8.js?v=a7356c2720",
  "data/business.js?v=a7356c2720",
  "data/business-basis2.js?v=a7356c2720",
  "data/business-aufbau2.js?v=a7356c2720",
  "data/business-profi2.js?v=a7356c2720",
  "data/smalltalk.js?v=a7356c2720",
  "data/idioms.js?v=a7356c2720",
  "data/saetze.js?v=a7356c2720",
  "data/saetze2.js?v=a7356c2720",
  "data/lernbuch.js?v=a7356c2720",
  "data/verben.js?v=a7356c2720",
  "js/engine.js?v=a7356c2720",
  "js/cosmetics.js?v=a7356c2720",
  "js/fortnite.js?v=a7356c2720",
  "js/figur.js?v=a7356c2720",
  "js/stila.js?v=a7356c2720",
  "js/stilb.js?v=a7356c2720",
  "js/loot.js?v=a7356c2720",
  "js/film.js?v=a7356c2720",
  "js/app.js?v=a7356c2720",
  "js/arena.js?v=a7356c2720",
  "js/sync.js?v=a7356c2720",
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
