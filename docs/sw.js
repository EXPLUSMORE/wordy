/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-e8d2dcfe5d';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=e8d2dcfe5d",
  "data/klasse7.js?v=e8d2dcfe5d",
  "data/klasse8.js?v=e8d2dcfe5d",
  "data/business.js?v=e8d2dcfe5d",
  "data/business-basis2.js?v=e8d2dcfe5d",
  "data/business-aufbau2.js?v=e8d2dcfe5d",
  "data/business-profi2.js?v=e8d2dcfe5d",
  "data/smalltalk.js?v=e8d2dcfe5d",
  "data/idioms.js?v=e8d2dcfe5d",
  "data/saetze.js?v=e8d2dcfe5d",
  "data/saetze2.js?v=e8d2dcfe5d",
  "data/lernbuch.js?v=e8d2dcfe5d",
  "data/verben.js?v=e8d2dcfe5d",
  "data/grammatik.js?v=e8d2dcfe5d",
  "js/engine.js?v=e8d2dcfe5d",
  "js/cosmetics.js?v=e8d2dcfe5d",
  "js/fortnite.js?v=e8d2dcfe5d",
  "js/figur.js?v=e8d2dcfe5d",
  "js/stila.js?v=e8d2dcfe5d",
  "js/stilb.js?v=e8d2dcfe5d",
  "js/loot.js?v=e8d2dcfe5d",
  "js/film.js?v=e8d2dcfe5d",
  "js/app.js?v=e8d2dcfe5d",
  "js/arena.js?v=e8d2dcfe5d",
  "js/spiele.js?v=e8d2dcfe5d",
  "js/grammatik.js?v=e8d2dcfe5d",
  "js/sync.js?v=e8d2dcfe5d",
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
