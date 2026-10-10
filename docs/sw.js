/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-ed8e1363e9';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=ed8e1363e9",
  "data/klasse7.js?v=ed8e1363e9",
  "data/klasse8.js?v=ed8e1363e9",
  "data/business.js?v=ed8e1363e9",
  "data/business-basis2.js?v=ed8e1363e9",
  "data/business-aufbau2.js?v=ed8e1363e9",
  "data/business-profi2.js?v=ed8e1363e9",
  "data/smalltalk.js?v=ed8e1363e9",
  "data/idioms.js?v=ed8e1363e9",
  "data/saetze.js?v=ed8e1363e9",
  "data/saetze2.js?v=ed8e1363e9",
  "data/lernbuch.js?v=ed8e1363e9",
  "data/verben.js?v=ed8e1363e9",
  "js/engine.js?v=ed8e1363e9",
  "js/cosmetics.js?v=ed8e1363e9",
  "js/fortnite.js?v=ed8e1363e9",
  "js/figur.js?v=ed8e1363e9",
  "js/stila.js?v=ed8e1363e9",
  "js/stilb.js?v=ed8e1363e9",
  "js/loot.js?v=ed8e1363e9",
  "js/film.js?v=ed8e1363e9",
  "js/app.js?v=ed8e1363e9",
  "js/arena.js?v=ed8e1363e9",
  "js/sync.js?v=ed8e1363e9",
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
