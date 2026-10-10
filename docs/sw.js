/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-e2834ca0e6';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=e2834ca0e6",
  "data/klasse7.js?v=e2834ca0e6",
  "data/klasse8.js?v=e2834ca0e6",
  "data/business.js?v=e2834ca0e6",
  "data/business-basis2.js?v=e2834ca0e6",
  "data/business-aufbau2.js?v=e2834ca0e6",
  "data/business-profi2.js?v=e2834ca0e6",
  "data/smalltalk.js?v=e2834ca0e6",
  "data/idioms.js?v=e2834ca0e6",
  "data/saetze.js?v=e2834ca0e6",
  "data/saetze2.js?v=e2834ca0e6",
  "data/lernbuch.js?v=e2834ca0e6",
  "data/verben.js?v=e2834ca0e6",
  "data/grammatik.js?v=e2834ca0e6",
  "js/engine.js?v=e2834ca0e6",
  "js/cosmetics.js?v=e2834ca0e6",
  "js/fortnite.js?v=e2834ca0e6",
  "js/figur.js?v=e2834ca0e6",
  "js/stila.js?v=e2834ca0e6",
  "js/stilb.js?v=e2834ca0e6",
  "js/loot.js?v=e2834ca0e6",
  "js/film.js?v=e2834ca0e6",
  "js/app.js?v=e2834ca0e6",
  "js/arena.js?v=e2834ca0e6",
  "js/spiele.js?v=e2834ca0e6",
  "js/grammatik.js?v=e2834ca0e6",
  "js/sync.js?v=e2834ca0e6",
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
