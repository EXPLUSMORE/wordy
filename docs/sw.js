/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-8d33f539aa';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=8d33f539aa",
  "data/klasse7.js?v=8d33f539aa",
  "data/klasse8.js?v=8d33f539aa",
  "data/business.js?v=8d33f539aa",
  "data/business-basis2.js?v=8d33f539aa",
  "data/business-aufbau2.js?v=8d33f539aa",
  "data/business-profi2.js?v=8d33f539aa",
  "data/smalltalk.js?v=8d33f539aa",
  "data/idioms.js?v=8d33f539aa",
  "data/saetze.js?v=8d33f539aa",
  "data/saetze2.js?v=8d33f539aa",
  "data/lernbuch.js?v=8d33f539aa",
  "data/verben.js?v=8d33f539aa",
  "data/grammatik.js?v=8d33f539aa",
  "js/engine.js?v=8d33f539aa",
  "js/cosmetics.js?v=8d33f539aa",
  "js/fortnite.js?v=8d33f539aa",
  "js/figur.js?v=8d33f539aa",
  "js/stila.js?v=8d33f539aa",
  "js/stilb.js?v=8d33f539aa",
  "js/loot.js?v=8d33f539aa",
  "js/film.js?v=8d33f539aa",
  "js/app.js?v=8d33f539aa",
  "js/arena.js?v=8d33f539aa",
  "js/spiele.js?v=8d33f539aa",
  "js/grammatik.js?v=8d33f539aa",
  "js/sync.js?v=8d33f539aa",
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
