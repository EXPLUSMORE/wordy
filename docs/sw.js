/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-0e73e8726a';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=0e73e8726a",
  "data/klasse7.js?v=0e73e8726a",
  "data/klasse8.js?v=0e73e8726a",
  "data/business.js?v=0e73e8726a",
  "data/business-basis2.js?v=0e73e8726a",
  "data/business-aufbau2.js?v=0e73e8726a",
  "data/business-profi2.js?v=0e73e8726a",
  "data/smalltalk.js?v=0e73e8726a",
  "data/idioms.js?v=0e73e8726a",
  "data/saetze.js?v=0e73e8726a",
  "data/saetze2.js?v=0e73e8726a",
  "data/lernbuch.js?v=0e73e8726a",
  "data/verben.js?v=0e73e8726a",
  "js/engine.js?v=0e73e8726a",
  "js/cosmetics.js?v=0e73e8726a",
  "js/fortnite.js?v=0e73e8726a",
  "js/figur.js?v=0e73e8726a",
  "js/stila.js?v=0e73e8726a",
  "js/stilb.js?v=0e73e8726a",
  "js/loot.js?v=0e73e8726a",
  "js/film.js?v=0e73e8726a",
  "js/app.js?v=0e73e8726a",
  "js/arena.js?v=0e73e8726a",
  "js/sync.js?v=0e73e8726a",
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
