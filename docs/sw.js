/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-de2a5c5211';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=de2a5c5211",
  "data/klasse7.js?v=de2a5c5211",
  "data/klasse8.js?v=de2a5c5211",
  "data/business.js?v=de2a5c5211",
  "data/business-basis2.js?v=de2a5c5211",
  "data/business-aufbau2.js?v=de2a5c5211",
  "data/business-profi2.js?v=de2a5c5211",
  "data/smalltalk.js?v=de2a5c5211",
  "data/idioms.js?v=de2a5c5211",
  "data/saetze.js?v=de2a5c5211",
  "data/saetze2.js?v=de2a5c5211",
  "data/lernbuch.js?v=de2a5c5211",
  "data/verben.js?v=de2a5c5211",
  "js/engine.js?v=de2a5c5211",
  "js/cosmetics.js?v=de2a5c5211",
  "js/fortnite.js?v=de2a5c5211",
  "js/figur.js?v=de2a5c5211",
  "js/stila.js?v=de2a5c5211",
  "js/stilb.js?v=de2a5c5211",
  "js/loot.js?v=de2a5c5211",
  "js/film.js?v=de2a5c5211",
  "js/app.js?v=de2a5c5211",
  "js/arena.js?v=de2a5c5211",
  "js/sync.js?v=de2a5c5211",
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
