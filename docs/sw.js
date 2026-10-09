/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-f701477181';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=f701477181",
  "data/klasse7.js?v=f701477181",
  "data/klasse8.js?v=f701477181",
  "data/business.js?v=f701477181",
  "data/business-basis2.js?v=f701477181",
  "data/business-aufbau2.js?v=f701477181",
  "data/business-profi2.js?v=f701477181",
  "data/smalltalk.js?v=f701477181",
  "data/idioms.js?v=f701477181",
  "data/saetze.js?v=f701477181",
  "data/saetze2.js?v=f701477181",
  "data/lernbuch.js?v=f701477181",
  "data/verben.js?v=f701477181",
  "js/engine.js?v=f701477181",
  "js/cosmetics.js?v=f701477181",
  "js/fortnite.js?v=f701477181",
  "js/figur.js?v=f701477181",
  "js/stila.js?v=f701477181",
  "js/stilb.js?v=f701477181",
  "js/loot.js?v=f701477181",
  "js/film.js?v=f701477181",
  "js/app.js?v=f701477181",
  "js/arena.js?v=f701477181",
  "js/sync.js?v=f701477181",
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
