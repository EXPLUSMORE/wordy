/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-b70de6fd33';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=b70de6fd33",
  "data/klasse7.js?v=b70de6fd33",
  "data/klasse8.js?v=b70de6fd33",
  "data/business.js?v=b70de6fd33",
  "data/business-basis2.js?v=b70de6fd33",
  "data/business-aufbau2.js?v=b70de6fd33",
  "data/business-profi2.js?v=b70de6fd33",
  "data/smalltalk.js?v=b70de6fd33",
  "data/idioms.js?v=b70de6fd33",
  "data/saetze.js?v=b70de6fd33",
  "data/saetze2.js?v=b70de6fd33",
  "data/lernbuch.js?v=b70de6fd33",
  "data/verben.js?v=b70de6fd33",
  "js/engine.js?v=b70de6fd33",
  "js/cosmetics.js?v=b70de6fd33",
  "js/fortnite.js?v=b70de6fd33",
  "js/figur.js?v=b70de6fd33",
  "js/stila.js?v=b70de6fd33",
  "js/stilb.js?v=b70de6fd33",
  "js/loot.js?v=b70de6fd33",
  "js/film.js?v=b70de6fd33",
  "js/app.js?v=b70de6fd33",
  "js/arena.js?v=b70de6fd33",
  "js/spiele.js?v=b70de6fd33",
  "js/sync.js?v=b70de6fd33",
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
