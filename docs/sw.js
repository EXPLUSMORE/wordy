/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-7f5ff6036c';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=7f5ff6036c",
  "data/klasse7.js?v=7f5ff6036c",
  "data/klasse8.js?v=7f5ff6036c",
  "data/business.js?v=7f5ff6036c",
  "data/business-basis2.js?v=7f5ff6036c",
  "data/business-aufbau2.js?v=7f5ff6036c",
  "data/business-profi2.js?v=7f5ff6036c",
  "data/smalltalk.js?v=7f5ff6036c",
  "data/idioms.js?v=7f5ff6036c",
  "data/saetze.js?v=7f5ff6036c",
  "data/saetze2.js?v=7f5ff6036c",
  "data/lernbuch.js?v=7f5ff6036c",
  "data/verben.js?v=7f5ff6036c",
  "data/grammatik.js?v=7f5ff6036c",
  "js/engine.js?v=7f5ff6036c",
  "js/cosmetics.js?v=7f5ff6036c",
  "js/fortnite.js?v=7f5ff6036c",
  "js/figur.js?v=7f5ff6036c",
  "js/stila.js?v=7f5ff6036c",
  "js/stilb.js?v=7f5ff6036c",
  "js/loot.js?v=7f5ff6036c",
  "js/film.js?v=7f5ff6036c",
  "js/app.js?v=7f5ff6036c",
  "js/arena.js?v=7f5ff6036c",
  "js/spiele.js?v=7f5ff6036c",
  "js/grammatik.js?v=7f5ff6036c",
  "js/sync.js?v=7f5ff6036c",
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
