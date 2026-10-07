/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-bc7033ecec';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=bc7033ecec",
  "data/klasse7.js?v=bc7033ecec",
  "data/klasse8.js?v=bc7033ecec",
  "data/business.js?v=bc7033ecec",
  "data/business-basis2.js?v=bc7033ecec",
  "data/business-aufbau2.js?v=bc7033ecec",
  "data/business-profi2.js?v=bc7033ecec",
  "data/smalltalk.js?v=bc7033ecec",
  "data/idioms.js?v=bc7033ecec",
  "data/saetze.js?v=bc7033ecec",
  "data/saetze2.js?v=bc7033ecec",
  "data/lernbuch.js?v=bc7033ecec",
  "data/verben.js?v=bc7033ecec",
  "js/engine.js?v=bc7033ecec",
  "js/cosmetics.js?v=bc7033ecec",
  "js/fortnite.js?v=bc7033ecec",
  "js/figur.js?v=bc7033ecec",
  "js/stila.js?v=bc7033ecec",
  "js/stilb.js?v=bc7033ecec",
  "js/loot.js?v=bc7033ecec",
  "js/film.js?v=bc7033ecec",
  "js/app.js?v=bc7033ecec",
  "js/arena.js?v=bc7033ecec",
  "js/sync.js?v=bc7033ecec",
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
