/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-94e1fb40fa';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=94e1fb40fa",
  "data/klasse7.js?v=94e1fb40fa",
  "data/klasse8.js?v=94e1fb40fa",
  "data/business.js?v=94e1fb40fa",
  "data/business-basis2.js?v=94e1fb40fa",
  "data/business-aufbau2.js?v=94e1fb40fa",
  "data/business-profi2.js?v=94e1fb40fa",
  "data/smalltalk.js?v=94e1fb40fa",
  "data/idioms.js?v=94e1fb40fa",
  "data/saetze.js?v=94e1fb40fa",
  "data/saetze2.js?v=94e1fb40fa",
  "data/lernbuch.js?v=94e1fb40fa",
  "data/verben.js?v=94e1fb40fa",
  "js/engine.js?v=94e1fb40fa",
  "js/cosmetics.js?v=94e1fb40fa",
  "js/fortnite.js?v=94e1fb40fa",
  "js/figur.js?v=94e1fb40fa",
  "js/app.js?v=94e1fb40fa",
  "js/arena.js?v=94e1fb40fa",
  "js/sync.js?v=94e1fb40fa",
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
