/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-b14d48014a';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=b14d48014a",
  "data/klasse7.js?v=b14d48014a",
  "data/klasse8.js?v=b14d48014a",
  "data/business.js?v=b14d48014a",
  "data/business-basis2.js?v=b14d48014a",
  "data/business-aufbau2.js?v=b14d48014a",
  "data/business-profi2.js?v=b14d48014a",
  "data/smalltalk.js?v=b14d48014a",
  "data/idioms.js?v=b14d48014a",
  "data/saetze.js?v=b14d48014a",
  "data/saetze2.js?v=b14d48014a",
  "data/lernbuch.js?v=b14d48014a",
  "data/verben.js?v=b14d48014a",
  "js/engine.js?v=b14d48014a",
  "js/cosmetics.js?v=b14d48014a",
  "js/fortnite.js?v=b14d48014a",
  "js/app.js?v=b14d48014a",
  "js/arena.js?v=b14d48014a",
  "js/sync.js?v=b14d48014a",
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
