/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-bd617abf71';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=bd617abf71",
  "data/klasse7.js?v=bd617abf71",
  "data/klasse8.js?v=bd617abf71",
  "data/business.js?v=bd617abf71",
  "data/business-basis2.js?v=bd617abf71",
  "data/business-aufbau2.js?v=bd617abf71",
  "data/business-profi2.js?v=bd617abf71",
  "data/smalltalk.js?v=bd617abf71",
  "data/idioms.js?v=bd617abf71",
  "data/saetze.js?v=bd617abf71",
  "data/saetze2.js?v=bd617abf71",
  "data/lernbuch.js?v=bd617abf71",
  "data/verben.js?v=bd617abf71",
  "data/grammatik.js?v=bd617abf71",
  "js/engine.js?v=bd617abf71",
  "js/cosmetics.js?v=bd617abf71",
  "js/fortnite.js?v=bd617abf71",
  "js/figur.js?v=bd617abf71",
  "js/stila.js?v=bd617abf71",
  "js/stilb.js?v=bd617abf71",
  "js/loot.js?v=bd617abf71",
  "js/film.js?v=bd617abf71",
  "js/app.js?v=bd617abf71",
  "js/arena.js?v=bd617abf71",
  "js/spiele.js?v=bd617abf71",
  "js/grammatik.js?v=bd617abf71",
  "js/sync.js?v=bd617abf71",
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
