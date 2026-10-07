/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-fdc3f14a3e';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=fdc3f14a3e",
  "data/klasse7.js?v=fdc3f14a3e",
  "data/klasse8.js?v=fdc3f14a3e",
  "data/business.js?v=fdc3f14a3e",
  "data/business-basis2.js?v=fdc3f14a3e",
  "data/business-aufbau2.js?v=fdc3f14a3e",
  "data/business-profi2.js?v=fdc3f14a3e",
  "data/smalltalk.js?v=fdc3f14a3e",
  "data/idioms.js?v=fdc3f14a3e",
  "data/saetze.js?v=fdc3f14a3e",
  "data/saetze2.js?v=fdc3f14a3e",
  "data/lernbuch.js?v=fdc3f14a3e",
  "data/verben.js?v=fdc3f14a3e",
  "js/engine.js?v=fdc3f14a3e",
  "js/cosmetics.js?v=fdc3f14a3e",
  "js/fortnite.js?v=fdc3f14a3e",
  "js/figur.js?v=fdc3f14a3e",
  "js/app.js?v=fdc3f14a3e",
  "js/arena.js?v=fdc3f14a3e",
  "js/sync.js?v=fdc3f14a3e",
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
