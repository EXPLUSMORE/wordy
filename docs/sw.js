/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-f10e9bb60e';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=f10e9bb60e",
  "data/klasse7.js?v=f10e9bb60e",
  "data/klasse8.js?v=f10e9bb60e",
  "data/business.js?v=f10e9bb60e",
  "data/business-basis2.js?v=f10e9bb60e",
  "data/business-aufbau2.js?v=f10e9bb60e",
  "data/business-profi2.js?v=f10e9bb60e",
  "data/smalltalk.js?v=f10e9bb60e",
  "data/idioms.js?v=f10e9bb60e",
  "data/saetze.js?v=f10e9bb60e",
  "data/saetze2.js?v=f10e9bb60e",
  "data/lernbuch.js?v=f10e9bb60e",
  "data/verben.js?v=f10e9bb60e",
  "js/engine.js?v=f10e9bb60e",
  "js/cosmetics.js?v=f10e9bb60e",
  "js/fortnite.js?v=f10e9bb60e",
  "js/figur.js?v=f10e9bb60e",
  "js/stila.js?v=f10e9bb60e",
  "js/stilb.js?v=f10e9bb60e",
  "js/loot.js?v=f10e9bb60e",
  "js/film.js?v=f10e9bb60e",
  "js/app.js?v=f10e9bb60e",
  "js/arena.js?v=f10e9bb60e",
  "js/sync.js?v=f10e9bb60e",
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
