/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-3bc887d3bb';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=3bc887d3bb",
  "data/klasse7.js?v=3bc887d3bb",
  "data/klasse8.js?v=3bc887d3bb",
  "data/business.js?v=3bc887d3bb",
  "data/business-basis2.js?v=3bc887d3bb",
  "data/business-aufbau2.js?v=3bc887d3bb",
  "data/business-profi2.js?v=3bc887d3bb",
  "data/smalltalk.js?v=3bc887d3bb",
  "data/idioms.js?v=3bc887d3bb",
  "data/saetze.js?v=3bc887d3bb",
  "data/saetze2.js?v=3bc887d3bb",
  "data/lernbuch.js?v=3bc887d3bb",
  "data/verben.js?v=3bc887d3bb",
  "js/engine.js?v=3bc887d3bb",
  "js/cosmetics.js?v=3bc887d3bb",
  "js/fortnite.js?v=3bc887d3bb",
  "js/figur.js?v=3bc887d3bb",
  "js/stila.js?v=3bc887d3bb",
  "js/stilb.js?v=3bc887d3bb",
  "js/loot.js?v=3bc887d3bb",
  "js/film.js?v=3bc887d3bb",
  "js/app.js?v=3bc887d3bb",
  "js/arena.js?v=3bc887d3bb",
  "js/sync.js?v=3bc887d3bb",
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
