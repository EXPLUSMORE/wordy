/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-b52f959873';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=b52f959873",
  "data/klasse7.js?v=b52f959873",
  "data/klasse8.js?v=b52f959873",
  "data/business.js?v=b52f959873",
  "data/business-basis2.js?v=b52f959873",
  "data/business-aufbau2.js?v=b52f959873",
  "data/business-profi2.js?v=b52f959873",
  "data/smalltalk.js?v=b52f959873",
  "data/idioms.js?v=b52f959873",
  "data/saetze.js?v=b52f959873",
  "data/saetze2.js?v=b52f959873",
  "data/lernbuch.js?v=b52f959873",
  "data/verben.js?v=b52f959873",
  "js/engine.js?v=b52f959873",
  "js/cosmetics.js?v=b52f959873",
  "js/fortnite.js?v=b52f959873",
  "js/figur.js?v=b52f959873",
  "js/stila.js?v=b52f959873",
  "js/stilb.js?v=b52f959873",
  "js/loot.js?v=b52f959873",
  "js/film.js?v=b52f959873",
  "js/app.js?v=b52f959873",
  "js/arena.js?v=b52f959873",
  "js/sync.js?v=b52f959873",
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
