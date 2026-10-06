/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-d7bb930ac0';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=d7bb930ac0",
  "data/klasse7.js?v=d7bb930ac0",
  "data/klasse8.js?v=d7bb930ac0",
  "data/business.js?v=d7bb930ac0",
  "data/business-basis2.js?v=d7bb930ac0",
  "data/business-aufbau2.js?v=d7bb930ac0",
  "data/business-profi2.js?v=d7bb930ac0",
  "data/smalltalk.js?v=d7bb930ac0",
  "data/idioms.js?v=d7bb930ac0",
  "data/saetze.js?v=d7bb930ac0",
  "data/saetze2.js?v=d7bb930ac0",
  "data/lernbuch.js?v=d7bb930ac0",
  "data/verben.js?v=d7bb930ac0",
  "js/engine.js?v=d7bb930ac0",
  "js/cosmetics.js?v=d7bb930ac0",
  "js/fortnite.js?v=d7bb930ac0",
  "js/app.js?v=d7bb930ac0",
  "js/arena.js?v=d7bb930ac0",
  "js/sync.js?v=d7bb930ac0",
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
