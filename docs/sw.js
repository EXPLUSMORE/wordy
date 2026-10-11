/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-b959a08477';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=b959a08477",
  "data/klasse7.js?v=b959a08477",
  "data/klasse8.js?v=b959a08477",
  "data/business.js?v=b959a08477",
  "data/business-basis2.js?v=b959a08477",
  "data/business-aufbau2.js?v=b959a08477",
  "data/business-profi2.js?v=b959a08477",
  "data/smalltalk.js?v=b959a08477",
  "data/idioms.js?v=b959a08477",
  "data/saetze.js?v=b959a08477",
  "data/saetze2.js?v=b959a08477",
  "data/lernbuch.js?v=b959a08477",
  "data/verben.js?v=b959a08477",
  "data/grammatik.js?v=b959a08477",
  "js/engine.js?v=b959a08477",
  "js/cosmetics.js?v=b959a08477",
  "js/fortnite.js?v=b959a08477",
  "js/figur.js?v=b959a08477",
  "js/stila.js?v=b959a08477",
  "js/stilb.js?v=b959a08477",
  "js/loot.js?v=b959a08477",
  "js/film.js?v=b959a08477",
  "js/app.js?v=b959a08477",
  "js/arena.js?v=b959a08477",
  "js/spiele.js?v=b959a08477",
  "js/grammatik.js?v=b959a08477",
  "js/sync.js?v=b959a08477",
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
