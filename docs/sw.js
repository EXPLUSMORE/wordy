/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-5d88994994';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=5d88994994",
  "data/klasse7.js?v=5d88994994",
  "data/klasse8.js?v=5d88994994",
  "data/business.js?v=5d88994994",
  "data/business-basis2.js?v=5d88994994",
  "data/business-aufbau2.js?v=5d88994994",
  "data/business-profi2.js?v=5d88994994",
  "data/smalltalk.js?v=5d88994994",
  "data/idioms.js?v=5d88994994",
  "data/saetze.js?v=5d88994994",
  "data/saetze2.js?v=5d88994994",
  "data/lernbuch.js?v=5d88994994",
  "data/verben.js?v=5d88994994",
  "js/engine.js?v=5d88994994",
  "js/cosmetics.js?v=5d88994994",
  "js/fortnite.js?v=5d88994994",
  "js/figur.js?v=5d88994994",
  "js/stila.js?v=5d88994994",
  "js/stilb.js?v=5d88994994",
  "js/loot.js?v=5d88994994",
  "js/film.js?v=5d88994994",
  "js/app.js?v=5d88994994",
  "js/arena.js?v=5d88994994",
  "js/sync.js?v=5d88994994",
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
