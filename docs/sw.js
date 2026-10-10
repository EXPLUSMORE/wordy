/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-91f8a3316b';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=91f8a3316b",
  "data/klasse7.js?v=91f8a3316b",
  "data/klasse8.js?v=91f8a3316b",
  "data/business.js?v=91f8a3316b",
  "data/business-basis2.js?v=91f8a3316b",
  "data/business-aufbau2.js?v=91f8a3316b",
  "data/business-profi2.js?v=91f8a3316b",
  "data/smalltalk.js?v=91f8a3316b",
  "data/idioms.js?v=91f8a3316b",
  "data/saetze.js?v=91f8a3316b",
  "data/saetze2.js?v=91f8a3316b",
  "data/lernbuch.js?v=91f8a3316b",
  "data/verben.js?v=91f8a3316b",
  "data/grammatik.js?v=91f8a3316b",
  "js/engine.js?v=91f8a3316b",
  "js/cosmetics.js?v=91f8a3316b",
  "js/fortnite.js?v=91f8a3316b",
  "js/figur.js?v=91f8a3316b",
  "js/stila.js?v=91f8a3316b",
  "js/stilb.js?v=91f8a3316b",
  "js/loot.js?v=91f8a3316b",
  "js/film.js?v=91f8a3316b",
  "js/app.js?v=91f8a3316b",
  "js/arena.js?v=91f8a3316b",
  "js/spiele.js?v=91f8a3316b",
  "js/grammatik.js?v=91f8a3316b",
  "js/sync.js?v=91f8a3316b",
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
