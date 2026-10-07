/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-63dac420ef';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=63dac420ef",
  "data/klasse7.js?v=63dac420ef",
  "data/klasse8.js?v=63dac420ef",
  "data/business.js?v=63dac420ef",
  "data/business-basis2.js?v=63dac420ef",
  "data/business-aufbau2.js?v=63dac420ef",
  "data/business-profi2.js?v=63dac420ef",
  "data/smalltalk.js?v=63dac420ef",
  "data/idioms.js?v=63dac420ef",
  "data/saetze.js?v=63dac420ef",
  "data/saetze2.js?v=63dac420ef",
  "data/lernbuch.js?v=63dac420ef",
  "data/verben.js?v=63dac420ef",
  "js/engine.js?v=63dac420ef",
  "js/cosmetics.js?v=63dac420ef",
  "js/fortnite.js?v=63dac420ef",
  "js/figur.js?v=63dac420ef",
  "js/stila.js?v=63dac420ef",
  "js/stilb.js?v=63dac420ef",
  "js/loot.js?v=63dac420ef",
  "js/film.js?v=63dac420ef",
  "js/app.js?v=63dac420ef",
  "js/arena.js?v=63dac420ef",
  "js/sync.js?v=63dac420ef",
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
