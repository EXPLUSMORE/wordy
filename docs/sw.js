/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-d47da93e6a';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=d47da93e6a",
  "data/klasse7.js?v=d47da93e6a",
  "data/klasse8.js?v=d47da93e6a",
  "data/business.js?v=d47da93e6a",
  "data/business-basis2.js?v=d47da93e6a",
  "data/business-aufbau2.js?v=d47da93e6a",
  "data/business-profi2.js?v=d47da93e6a",
  "data/smalltalk.js?v=d47da93e6a",
  "data/idioms.js?v=d47da93e6a",
  "data/saetze.js?v=d47da93e6a",
  "data/saetze2.js?v=d47da93e6a",
  "data/lernbuch.js?v=d47da93e6a",
  "data/verben.js?v=d47da93e6a",
  "js/engine.js?v=d47da93e6a",
  "js/cosmetics.js?v=d47da93e6a",
  "js/fortnite.js?v=d47da93e6a",
  "js/figur.js?v=d47da93e6a",
  "js/stila.js?v=d47da93e6a",
  "js/stilb.js?v=d47da93e6a",
  "js/loot.js?v=d47da93e6a",
  "js/film.js?v=d47da93e6a",
  "js/app.js?v=d47da93e6a",
  "js/arena.js?v=d47da93e6a",
  "js/sync.js?v=d47da93e6a",
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
