/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-3f5f223b6d';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=3f5f223b6d",
  "data/klasse7.js?v=3f5f223b6d",
  "data/klasse8.js?v=3f5f223b6d",
  "data/business.js?v=3f5f223b6d",
  "data/business-basis2.js?v=3f5f223b6d",
  "data/business-aufbau2.js?v=3f5f223b6d",
  "data/business-profi2.js?v=3f5f223b6d",
  "data/smalltalk.js?v=3f5f223b6d",
  "data/idioms.js?v=3f5f223b6d",
  "data/saetze.js?v=3f5f223b6d",
  "data/saetze2.js?v=3f5f223b6d",
  "data/lernbuch.js?v=3f5f223b6d",
  "data/verben.js?v=3f5f223b6d",
  "js/engine.js?v=3f5f223b6d",
  "js/cosmetics.js?v=3f5f223b6d",
  "js/fortnite.js?v=3f5f223b6d",
  "js/figur.js?v=3f5f223b6d",
  "js/stila.js?v=3f5f223b6d",
  "js/stilb.js?v=3f5f223b6d",
  "js/loot.js?v=3f5f223b6d",
  "js/film.js?v=3f5f223b6d",
  "js/app.js?v=3f5f223b6d",
  "js/arena.js?v=3f5f223b6d",
  "js/sync.js?v=3f5f223b6d",
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
