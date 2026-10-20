/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-91d691a58b';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=91d691a58b",
  "data/klasse7.js?v=91d691a58b",
  "data/klasse8.js?v=91d691a58b",
  "data/business.js?v=91d691a58b",
  "data/business-basis2.js?v=91d691a58b",
  "data/business-aufbau2.js?v=91d691a58b",
  "data/business-profi2.js?v=91d691a58b",
  "data/smalltalk.js?v=91d691a58b",
  "data/idioms.js?v=91d691a58b",
  "data/saetze.js?v=91d691a58b",
  "data/saetze2.js?v=91d691a58b",
  "data/lernbuch.js?v=91d691a58b",
  "data/verben.js?v=91d691a58b",
  "data/grammatik.js?v=91d691a58b",
  "data/open/business-aufbau.js?v=91d691a58b",
  "data/open/business-basis.js?v=91d691a58b",
  "data/open/business-profi.js?v=91d691a58b",
  "data/open/saetze-open.js?v=91d691a58b",
  "js/engine.js?v=91d691a58b",
  "js/cosmetics.js?v=91d691a58b",
  "js/saison.js?v=91d691a58b",
  "js/fortnite.js?v=91d691a58b",
  "js/figur.js?v=91d691a58b",
  "js/stila.js?v=91d691a58b",
  "js/stilb.js?v=91d691a58b",
  "js/loot.js?v=91d691a58b",
  "js/film.js?v=91d691a58b",
  "js/app.js?v=91d691a58b",
  "js/arena.js?v=91d691a58b",
  "js/spiele.js?v=91d691a58b",
  "js/grammatik.js?v=91d691a58b",
  "js/sync.js?v=91d691a58b",
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
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  /* Ist Wordy gerade offen und sichtbar, erscheint die Erinnerung als Fenster in der App (muss weggeklickt werden); sonst als Mitteilung, die stehen bleibt. */
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const vis = list.filter(c => c.visibilityState === 'visible');
    if (vis.length) { vis.forEach(c => c.postMessage({ type: 'wordy-push', title: d.title || 'Wordy', body: d.body || '', kind: d.kind || '' })); return; }
    return self.registration.showNotification(d.title || 'Wordy', { body: d.body || '', icon: 'icons/icon-192.png', badge: 'icons/favicon-32.png', tag: d.tag || 'wordy', renotify: true, requireInteraction: true, vibrate: [200, 100, 200], actions: [{ action: 'open', title: "Los geht's ▶" }, { action: 'later', title: 'Später' }], data: { url: d.url || './' } });
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'later') return;
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) if ('focus' in c) return c.focus();
    return clients.openWindow((e.notification.data && e.notification.data.url) || './');
  }));
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
