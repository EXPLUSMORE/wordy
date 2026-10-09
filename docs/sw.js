/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-dbed3fba22';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=dbed3fba22",
  "data/klasse7.js?v=dbed3fba22",
  "data/klasse8.js?v=dbed3fba22",
  "data/business.js?v=dbed3fba22",
  "data/business-basis2.js?v=dbed3fba22",
  "data/business-aufbau2.js?v=dbed3fba22",
  "data/business-profi2.js?v=dbed3fba22",
  "data/smalltalk.js?v=dbed3fba22",
  "data/idioms.js?v=dbed3fba22",
  "data/saetze.js?v=dbed3fba22",
  "data/saetze2.js?v=dbed3fba22",
  "data/lernbuch.js?v=dbed3fba22",
  "data/verben.js?v=dbed3fba22",
  "js/engine.js?v=dbed3fba22",
  "js/cosmetics.js?v=dbed3fba22",
  "js/fortnite.js?v=dbed3fba22",
  "js/figur.js?v=dbed3fba22",
  "js/stila.js?v=dbed3fba22",
  "js/stilb.js?v=dbed3fba22",
  "js/loot.js?v=dbed3fba22",
  "js/film.js?v=dbed3fba22",
  "js/app.js?v=dbed3fba22",
  "js/arena.js?v=dbed3fba22",
  "js/sync.js?v=dbed3fba22",
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
