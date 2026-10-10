/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-81e7254acd';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=81e7254acd",
  "data/klasse7.js?v=81e7254acd",
  "data/klasse8.js?v=81e7254acd",
  "data/business.js?v=81e7254acd",
  "data/business-basis2.js?v=81e7254acd",
  "data/business-aufbau2.js?v=81e7254acd",
  "data/business-profi2.js?v=81e7254acd",
  "data/smalltalk.js?v=81e7254acd",
  "data/idioms.js?v=81e7254acd",
  "data/saetze.js?v=81e7254acd",
  "data/saetze2.js?v=81e7254acd",
  "data/lernbuch.js?v=81e7254acd",
  "data/verben.js?v=81e7254acd",
  "js/engine.js?v=81e7254acd",
  "js/cosmetics.js?v=81e7254acd",
  "js/fortnite.js?v=81e7254acd",
  "js/figur.js?v=81e7254acd",
  "js/stila.js?v=81e7254acd",
  "js/stilb.js?v=81e7254acd",
  "js/loot.js?v=81e7254acd",
  "js/film.js?v=81e7254acd",
  "js/app.js?v=81e7254acd",
  "js/arena.js?v=81e7254acd",
  "js/spiele.js?v=81e7254acd",
  "js/sync.js?v=81e7254acd",
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
