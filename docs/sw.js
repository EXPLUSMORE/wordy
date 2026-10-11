/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-f098af2ced';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=f098af2ced",
  "data/klasse7.js?v=f098af2ced",
  "data/klasse8.js?v=f098af2ced",
  "data/business.js?v=f098af2ced",
  "data/business-basis2.js?v=f098af2ced",
  "data/business-aufbau2.js?v=f098af2ced",
  "data/business-profi2.js?v=f098af2ced",
  "data/smalltalk.js?v=f098af2ced",
  "data/idioms.js?v=f098af2ced",
  "data/saetze.js?v=f098af2ced",
  "data/saetze2.js?v=f098af2ced",
  "data/lernbuch.js?v=f098af2ced",
  "data/verben.js?v=f098af2ced",
  "data/grammatik.js?v=f098af2ced",
  "js/engine.js?v=f098af2ced",
  "js/cosmetics.js?v=f098af2ced",
  "js/fortnite.js?v=f098af2ced",
  "js/figur.js?v=f098af2ced",
  "js/stila.js?v=f098af2ced",
  "js/stilb.js?v=f098af2ced",
  "js/loot.js?v=f098af2ced",
  "js/film.js?v=f098af2ced",
  "js/app.js?v=f098af2ced",
  "js/arena.js?v=f098af2ced",
  "js/spiele.js?v=f098af2ced",
  "js/grammatik.js?v=f098af2ced",
  "js/sync.js?v=f098af2ced",
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
