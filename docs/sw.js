/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-aac1a84c67';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=aac1a84c67",
  "data/klasse7.js?v=aac1a84c67",
  "data/klasse8.js?v=aac1a84c67",
  "data/business.js?v=aac1a84c67",
  "data/business-basis2.js?v=aac1a84c67",
  "data/business-aufbau2.js?v=aac1a84c67",
  "data/business-profi2.js?v=aac1a84c67",
  "data/smalltalk.js?v=aac1a84c67",
  "data/idioms.js?v=aac1a84c67",
  "data/saetze.js?v=aac1a84c67",
  "data/saetze2.js?v=aac1a84c67",
  "data/lernbuch.js?v=aac1a84c67",
  "data/verben.js?v=aac1a84c67",
  "js/engine.js?v=aac1a84c67",
  "js/cosmetics.js?v=aac1a84c67",
  "js/fortnite.js?v=aac1a84c67",
  "js/figur.js?v=aac1a84c67",
  "js/stila.js?v=aac1a84c67",
  "js/stilb.js?v=aac1a84c67",
  "js/loot.js?v=aac1a84c67",
  "js/film.js?v=aac1a84c67",
  "js/app.js?v=aac1a84c67",
  "js/arena.js?v=aac1a84c67",
  "js/sync.js?v=aac1a84c67",
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
