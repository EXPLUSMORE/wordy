/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-7ddc810ddf';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=7ddc810ddf",
  "data/klasse7.js?v=7ddc810ddf",
  "data/klasse8.js?v=7ddc810ddf",
  "data/business.js?v=7ddc810ddf",
  "data/business-basis2.js?v=7ddc810ddf",
  "data/business-aufbau2.js?v=7ddc810ddf",
  "data/business-profi2.js?v=7ddc810ddf",
  "data/smalltalk.js?v=7ddc810ddf",
  "data/idioms.js?v=7ddc810ddf",
  "data/saetze.js?v=7ddc810ddf",
  "data/saetze2.js?v=7ddc810ddf",
  "data/lernbuch.js?v=7ddc810ddf",
  "data/verben.js?v=7ddc810ddf",
  "js/engine.js?v=7ddc810ddf",
  "js/cosmetics.js?v=7ddc810ddf",
  "js/fortnite.js?v=7ddc810ddf",
  "js/figur.js?v=7ddc810ddf",
  "js/stila.js?v=7ddc810ddf",
  "js/stilb.js?v=7ddc810ddf",
  "js/loot.js?v=7ddc810ddf",
  "js/film.js?v=7ddc810ddf",
  "js/app.js?v=7ddc810ddf",
  "js/arena.js?v=7ddc810ddf",
  "js/sync.js?v=7ddc810ddf",
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
