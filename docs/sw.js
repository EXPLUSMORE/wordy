/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-06c09a676b';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=06c09a676b",
  "data/klasse7.js?v=06c09a676b",
  "data/klasse8.js?v=06c09a676b",
  "data/business.js?v=06c09a676b",
  "data/business-basis2.js?v=06c09a676b",
  "data/business-aufbau2.js?v=06c09a676b",
  "data/business-profi2.js?v=06c09a676b",
  "data/smalltalk.js?v=06c09a676b",
  "data/idioms.js?v=06c09a676b",
  "data/saetze.js?v=06c09a676b",
  "data/saetze2.js?v=06c09a676b",
  "data/lernbuch.js?v=06c09a676b",
  "data/verben.js?v=06c09a676b",
  "data/grammatik.js?v=06c09a676b",
  "js/engine.js?v=06c09a676b",
  "js/cosmetics.js?v=06c09a676b",
  "js/fortnite.js?v=06c09a676b",
  "js/figur.js?v=06c09a676b",
  "js/stila.js?v=06c09a676b",
  "js/stilb.js?v=06c09a676b",
  "js/loot.js?v=06c09a676b",
  "js/film.js?v=06c09a676b",
  "js/app.js?v=06c09a676b",
  "js/arena.js?v=06c09a676b",
  "js/spiele.js?v=06c09a676b",
  "js/grammatik.js?v=06c09a676b",
  "js/sync.js?v=06c09a676b",
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
