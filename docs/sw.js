/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-bba620b036';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=bba620b036",
  "data/klasse7.js?v=bba620b036",
  "data/klasse8.js?v=bba620b036",
  "data/business.js?v=bba620b036",
  "data/business-basis2.js?v=bba620b036",
  "data/business-aufbau2.js?v=bba620b036",
  "data/business-profi2.js?v=bba620b036",
  "data/smalltalk.js?v=bba620b036",
  "data/idioms.js?v=bba620b036",
  "data/saetze.js?v=bba620b036",
  "data/saetze2.js?v=bba620b036",
  "data/lernbuch.js?v=bba620b036",
  "data/verben.js?v=bba620b036",
  "data/grammatik.js?v=bba620b036",
  "data/alternativen.js?v=bba620b036",
  "data/open/business-aufbau.js?v=bba620b036",
  "data/open/business-basis.js?v=bba620b036",
  "data/open/business-profi.js?v=bba620b036",
  "data/open/saetze-open.js?v=bba620b036",
  "js/engine.js?v=bba620b036",
  "js/cosmetics.js?v=bba620b036",
  "js/saison.js?v=bba620b036",
  "js/saison2.js?v=bba620b036",
  "js/fortnite.js?v=bba620b036",
  "js/figur.js?v=bba620b036",
  "js/stila.js?v=bba620b036",
  "js/stilb.js?v=bba620b036",
  "js/acc.js?v=bba620b036",
  "js/loot.js?v=bba620b036",
  "js/film.js?v=bba620b036",
  "js/einmaleins.js?v=bba620b036",
  "js/app.js?v=bba620b036",
  "js/arena.js?v=bba620b036",
  "js/spiele.js?v=bba620b036",
  "js/grammatik.js?v=bba620b036",
  "js/sync.js?v=bba620b036",
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
