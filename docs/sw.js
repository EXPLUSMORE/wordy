/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-ed7d4fa6f8';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=ed7d4fa6f8",
  "data/klasse7.js?v=ed7d4fa6f8",
  "data/klasse8.js?v=ed7d4fa6f8",
  "data/business.js?v=ed7d4fa6f8",
  "data/business-basis2.js?v=ed7d4fa6f8",
  "data/business-aufbau2.js?v=ed7d4fa6f8",
  "data/business-profi2.js?v=ed7d4fa6f8",
  "data/smalltalk.js?v=ed7d4fa6f8",
  "data/idioms.js?v=ed7d4fa6f8",
  "data/saetze.js?v=ed7d4fa6f8",
  "data/saetze2.js?v=ed7d4fa6f8",
  "data/lernbuch.js?v=ed7d4fa6f8",
  "data/verben.js?v=ed7d4fa6f8",
  "js/engine.js?v=ed7d4fa6f8",
  "js/cosmetics.js?v=ed7d4fa6f8",
  "js/fortnite.js?v=ed7d4fa6f8",
  "js/figur.js?v=ed7d4fa6f8",
  "js/stila.js?v=ed7d4fa6f8",
  "js/stilb.js?v=ed7d4fa6f8",
  "js/loot.js?v=ed7d4fa6f8",
  "js/film.js?v=ed7d4fa6f8",
  "js/app.js?v=ed7d4fa6f8",
  "js/arena.js?v=ed7d4fa6f8",
  "js/sync.js?v=ed7d4fa6f8",
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
