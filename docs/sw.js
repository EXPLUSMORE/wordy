/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-731a444149';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=731a444149",
  "data/klasse7.js?v=731a444149",
  "data/klasse8.js?v=731a444149",
  "data/business.js?v=731a444149",
  "data/business-basis2.js?v=731a444149",
  "data/business-aufbau2.js?v=731a444149",
  "data/business-profi2.js?v=731a444149",
  "data/smalltalk.js?v=731a444149",
  "data/idioms.js?v=731a444149",
  "data/saetze.js?v=731a444149",
  "data/saetze2.js?v=731a444149",
  "data/lernbuch.js?v=731a444149",
  "data/verben.js?v=731a444149",
  "js/engine.js?v=731a444149",
  "js/cosmetics.js?v=731a444149",
  "js/fortnite.js?v=731a444149",
  "js/app.js?v=731a444149",
  "js/arena.js?v=731a444149",
  "js/sync.js?v=731a444149",
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
