/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-974fb88cab';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=974fb88cab",
  "data/klasse7.js?v=974fb88cab",
  "data/klasse8.js?v=974fb88cab",
  "data/business.js?v=974fb88cab",
  "data/business-basis2.js?v=974fb88cab",
  "data/business-aufbau2.js?v=974fb88cab",
  "data/business-profi2.js?v=974fb88cab",
  "data/smalltalk.js?v=974fb88cab",
  "data/idioms.js?v=974fb88cab",
  "data/saetze.js?v=974fb88cab",
  "data/saetze2.js?v=974fb88cab",
  "data/lernbuch.js?v=974fb88cab",
  "data/verben.js?v=974fb88cab",
  "js/engine.js?v=974fb88cab",
  "js/cosmetics.js?v=974fb88cab",
  "js/fortnite.js?v=974fb88cab",
  "js/app.js?v=974fb88cab",
  "js/arena.js?v=974fb88cab",
  "js/sync.js?v=974fb88cab",
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
