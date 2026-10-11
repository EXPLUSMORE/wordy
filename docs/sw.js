/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-e9b6c900b1';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=e9b6c900b1",
  "data/klasse7.js?v=e9b6c900b1",
  "data/klasse8.js?v=e9b6c900b1",
  "data/business.js?v=e9b6c900b1",
  "data/business-basis2.js?v=e9b6c900b1",
  "data/business-aufbau2.js?v=e9b6c900b1",
  "data/business-profi2.js?v=e9b6c900b1",
  "data/smalltalk.js?v=e9b6c900b1",
  "data/idioms.js?v=e9b6c900b1",
  "data/saetze.js?v=e9b6c900b1",
  "data/saetze2.js?v=e9b6c900b1",
  "data/lernbuch.js?v=e9b6c900b1",
  "data/verben.js?v=e9b6c900b1",
  "data/grammatik.js?v=e9b6c900b1",
  "js/engine.js?v=e9b6c900b1",
  "js/cosmetics.js?v=e9b6c900b1",
  "js/fortnite.js?v=e9b6c900b1",
  "js/figur.js?v=e9b6c900b1",
  "js/stila.js?v=e9b6c900b1",
  "js/stilb.js?v=e9b6c900b1",
  "js/loot.js?v=e9b6c900b1",
  "js/film.js?v=e9b6c900b1",
  "js/app.js?v=e9b6c900b1",
  "js/arena.js?v=e9b6c900b1",
  "js/spiele.js?v=e9b6c900b1",
  "js/grammatik.js?v=e9b6c900b1",
  "js/sync.js?v=e9b6c900b1",
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
