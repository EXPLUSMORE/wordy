/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-534ed876cb';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=534ed876cb",
  "data/klasse7.js?v=534ed876cb",
  "data/klasse8.js?v=534ed876cb",
  "data/business.js?v=534ed876cb",
  "data/business-basis2.js?v=534ed876cb",
  "data/business-aufbau2.js?v=534ed876cb",
  "data/business-profi2.js?v=534ed876cb",
  "data/smalltalk.js?v=534ed876cb",
  "data/idioms.js?v=534ed876cb",
  "data/saetze.js?v=534ed876cb",
  "data/saetze2.js?v=534ed876cb",
  "data/lernbuch.js?v=534ed876cb",
  "data/verben.js?v=534ed876cb",
  "js/engine.js?v=534ed876cb",
  "js/cosmetics.js?v=534ed876cb",
  "js/fortnite.js?v=534ed876cb",
  "js/app.js?v=534ed876cb",
  "js/arena.js?v=534ed876cb",
  "js/sync.js?v=534ed876cb",
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
