/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-dc158b52aa';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=dc158b52aa",
  "data/klasse7.js?v=dc158b52aa",
  "data/klasse8.js?v=dc158b52aa",
  "data/business.js?v=dc158b52aa",
  "data/business-basis2.js?v=dc158b52aa",
  "data/business-aufbau2.js?v=dc158b52aa",
  "data/business-profi2.js?v=dc158b52aa",
  "data/smalltalk.js?v=dc158b52aa",
  "data/idioms.js?v=dc158b52aa",
  "data/saetze.js?v=dc158b52aa",
  "data/saetze2.js?v=dc158b52aa",
  "data/lernbuch.js?v=dc158b52aa",
  "data/verben.js?v=dc158b52aa",
  "js/engine.js?v=dc158b52aa",
  "js/cosmetics.js?v=dc158b52aa",
  "js/fortnite.js?v=dc158b52aa",
  "js/figur.js?v=dc158b52aa",
  "js/stila.js?v=dc158b52aa",
  "js/stilb.js?v=dc158b52aa",
  "js/loot.js?v=dc158b52aa",
  "js/film.js?v=dc158b52aa",
  "js/app.js?v=dc158b52aa",
  "js/arena.js?v=dc158b52aa",
  "js/sync.js?v=dc158b52aa",
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
