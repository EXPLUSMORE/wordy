/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-88e76cfcac';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=88e76cfcac",
  "data/klasse7.js?v=88e76cfcac",
  "data/klasse8.js?v=88e76cfcac",
  "data/business.js?v=88e76cfcac",
  "data/business-basis2.js?v=88e76cfcac",
  "data/business-aufbau2.js?v=88e76cfcac",
  "data/business-profi2.js?v=88e76cfcac",
  "data/smalltalk.js?v=88e76cfcac",
  "data/idioms.js?v=88e76cfcac",
  "data/saetze.js?v=88e76cfcac",
  "data/saetze2.js?v=88e76cfcac",
  "data/lernbuch.js?v=88e76cfcac",
  "data/verben.js?v=88e76cfcac",
  "js/engine.js?v=88e76cfcac",
  "js/cosmetics.js?v=88e76cfcac",
  "js/fortnite.js?v=88e76cfcac",
  "js/figur.js?v=88e76cfcac",
  "js/stila.js?v=88e76cfcac",
  "js/stilb.js?v=88e76cfcac",
  "js/loot.js?v=88e76cfcac",
  "js/film.js?v=88e76cfcac",
  "js/app.js?v=88e76cfcac",
  "js/arena.js?v=88e76cfcac",
  "js/sync.js?v=88e76cfcac",
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
