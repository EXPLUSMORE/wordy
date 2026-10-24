/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-80d105794d';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=80d105794d",
  "data/klasse7.js?v=80d105794d",
  "data/klasse8.js?v=80d105794d",
  "data/business.js?v=80d105794d",
  "data/business-basis2.js?v=80d105794d",
  "data/business-aufbau2.js?v=80d105794d",
  "data/business-profi2.js?v=80d105794d",
  "data/smalltalk.js?v=80d105794d",
  "data/idioms.js?v=80d105794d",
  "data/saetze.js?v=80d105794d",
  "data/saetze2.js?v=80d105794d",
  "data/lernbuch.js?v=80d105794d",
  "data/verben.js?v=80d105794d",
  "data/grammatik.js?v=80d105794d",
  "data/open/business-aufbau.js?v=80d105794d",
  "data/open/business-basis.js?v=80d105794d",
  "data/open/business-profi.js?v=80d105794d",
  "data/open/saetze-open.js?v=80d105794d",
  "js/engine.js?v=80d105794d",
  "js/cosmetics.js?v=80d105794d",
  "js/saison.js?v=80d105794d",
  "js/saison2.js?v=80d105794d",
  "js/fortnite.js?v=80d105794d",
  "js/figur.js?v=80d105794d",
  "js/stila.js?v=80d105794d",
  "js/stilb.js?v=80d105794d",
  "js/acc.js?v=80d105794d",
  "js/loot.js?v=80d105794d",
  "js/film.js?v=80d105794d",
  "js/app.js?v=80d105794d",
  "js/arena.js?v=80d105794d",
  "js/spiele.js?v=80d105794d",
  "js/grammatik.js?v=80d105794d",
  "js/sync.js?v=80d105794d",
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
