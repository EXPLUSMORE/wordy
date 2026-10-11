/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-144fc78154';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=144fc78154",
  "data/klasse7.js?v=144fc78154",
  "data/klasse8.js?v=144fc78154",
  "data/business.js?v=144fc78154",
  "data/business-basis2.js?v=144fc78154",
  "data/business-aufbau2.js?v=144fc78154",
  "data/business-profi2.js?v=144fc78154",
  "data/smalltalk.js?v=144fc78154",
  "data/idioms.js?v=144fc78154",
  "data/saetze.js?v=144fc78154",
  "data/saetze2.js?v=144fc78154",
  "data/lernbuch.js?v=144fc78154",
  "data/verben.js?v=144fc78154",
  "data/grammatik.js?v=144fc78154",
  "js/engine.js?v=144fc78154",
  "js/cosmetics.js?v=144fc78154",
  "js/fortnite.js?v=144fc78154",
  "js/figur.js?v=144fc78154",
  "js/stila.js?v=144fc78154",
  "js/stilb.js?v=144fc78154",
  "js/loot.js?v=144fc78154",
  "js/film.js?v=144fc78154",
  "js/app.js?v=144fc78154",
  "js/arena.js?v=144fc78154",
  "js/spiele.js?v=144fc78154",
  "js/grammatik.js?v=144fc78154",
  "js/sync.js?v=144fc78154",
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
