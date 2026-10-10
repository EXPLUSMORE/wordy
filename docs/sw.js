/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-632b6657fb';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=632b6657fb",
  "data/klasse7.js?v=632b6657fb",
  "data/klasse8.js?v=632b6657fb",
  "data/business.js?v=632b6657fb",
  "data/business-basis2.js?v=632b6657fb",
  "data/business-aufbau2.js?v=632b6657fb",
  "data/business-profi2.js?v=632b6657fb",
  "data/smalltalk.js?v=632b6657fb",
  "data/idioms.js?v=632b6657fb",
  "data/saetze.js?v=632b6657fb",
  "data/saetze2.js?v=632b6657fb",
  "data/lernbuch.js?v=632b6657fb",
  "data/verben.js?v=632b6657fb",
  "data/grammatik.js?v=632b6657fb",
  "js/engine.js?v=632b6657fb",
  "js/cosmetics.js?v=632b6657fb",
  "js/fortnite.js?v=632b6657fb",
  "js/figur.js?v=632b6657fb",
  "js/stila.js?v=632b6657fb",
  "js/stilb.js?v=632b6657fb",
  "js/loot.js?v=632b6657fb",
  "js/film.js?v=632b6657fb",
  "js/app.js?v=632b6657fb",
  "js/arena.js?v=632b6657fb",
  "js/spiele.js?v=632b6657fb",
  "js/grammatik.js?v=632b6657fb",
  "js/sync.js?v=632b6657fb",
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
