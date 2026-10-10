/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-a9e20fefc3';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=a9e20fefc3",
  "data/klasse7.js?v=a9e20fefc3",
  "data/klasse8.js?v=a9e20fefc3",
  "data/business.js?v=a9e20fefc3",
  "data/business-basis2.js?v=a9e20fefc3",
  "data/business-aufbau2.js?v=a9e20fefc3",
  "data/business-profi2.js?v=a9e20fefc3",
  "data/smalltalk.js?v=a9e20fefc3",
  "data/idioms.js?v=a9e20fefc3",
  "data/saetze.js?v=a9e20fefc3",
  "data/saetze2.js?v=a9e20fefc3",
  "data/lernbuch.js?v=a9e20fefc3",
  "data/verben.js?v=a9e20fefc3",
  "data/grammatik.js?v=a9e20fefc3",
  "js/engine.js?v=a9e20fefc3",
  "js/cosmetics.js?v=a9e20fefc3",
  "js/fortnite.js?v=a9e20fefc3",
  "js/figur.js?v=a9e20fefc3",
  "js/stila.js?v=a9e20fefc3",
  "js/stilb.js?v=a9e20fefc3",
  "js/loot.js?v=a9e20fefc3",
  "js/film.js?v=a9e20fefc3",
  "js/app.js?v=a9e20fefc3",
  "js/arena.js?v=a9e20fefc3",
  "js/spiele.js?v=a9e20fefc3",
  "js/grammatik.js?v=a9e20fefc3",
  "js/sync.js?v=a9e20fefc3",
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
