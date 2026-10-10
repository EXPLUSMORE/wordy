/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-bf16bf2fda';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=bf16bf2fda",
  "data/klasse7.js?v=bf16bf2fda",
  "data/klasse8.js?v=bf16bf2fda",
  "data/business.js?v=bf16bf2fda",
  "data/business-basis2.js?v=bf16bf2fda",
  "data/business-aufbau2.js?v=bf16bf2fda",
  "data/business-profi2.js?v=bf16bf2fda",
  "data/smalltalk.js?v=bf16bf2fda",
  "data/idioms.js?v=bf16bf2fda",
  "data/saetze.js?v=bf16bf2fda",
  "data/saetze2.js?v=bf16bf2fda",
  "data/lernbuch.js?v=bf16bf2fda",
  "data/verben.js?v=bf16bf2fda",
  "data/grammatik.js?v=bf16bf2fda",
  "js/engine.js?v=bf16bf2fda",
  "js/cosmetics.js?v=bf16bf2fda",
  "js/fortnite.js?v=bf16bf2fda",
  "js/figur.js?v=bf16bf2fda",
  "js/stila.js?v=bf16bf2fda",
  "js/stilb.js?v=bf16bf2fda",
  "js/loot.js?v=bf16bf2fda",
  "js/film.js?v=bf16bf2fda",
  "js/app.js?v=bf16bf2fda",
  "js/arena.js?v=bf16bf2fda",
  "js/spiele.js?v=bf16bf2fda",
  "js/grammatik.js?v=bf16bf2fda",
  "js/sync.js?v=bf16bf2fda",
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
