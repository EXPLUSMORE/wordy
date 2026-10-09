/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-98fcc2876a';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=98fcc2876a",
  "data/klasse7.js?v=98fcc2876a",
  "data/klasse8.js?v=98fcc2876a",
  "data/business.js?v=98fcc2876a",
  "data/business-basis2.js?v=98fcc2876a",
  "data/business-aufbau2.js?v=98fcc2876a",
  "data/business-profi2.js?v=98fcc2876a",
  "data/smalltalk.js?v=98fcc2876a",
  "data/idioms.js?v=98fcc2876a",
  "data/saetze.js?v=98fcc2876a",
  "data/saetze2.js?v=98fcc2876a",
  "data/lernbuch.js?v=98fcc2876a",
  "data/verben.js?v=98fcc2876a",
  "js/engine.js?v=98fcc2876a",
  "js/cosmetics.js?v=98fcc2876a",
  "js/fortnite.js?v=98fcc2876a",
  "js/figur.js?v=98fcc2876a",
  "js/stila.js?v=98fcc2876a",
  "js/stilb.js?v=98fcc2876a",
  "js/loot.js?v=98fcc2876a",
  "js/film.js?v=98fcc2876a",
  "js/app.js?v=98fcc2876a",
  "js/arena.js?v=98fcc2876a",
  "js/sync.js?v=98fcc2876a",
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
