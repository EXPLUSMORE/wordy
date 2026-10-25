/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-eb3c386add';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=eb3c386add",
  "data/klasse7.js?v=eb3c386add",
  "data/klasse8.js?v=eb3c386add",
  "data/business.js?v=eb3c386add",
  "data/business-basis2.js?v=eb3c386add",
  "data/business-aufbau2.js?v=eb3c386add",
  "data/business-profi2.js?v=eb3c386add",
  "data/smalltalk.js?v=eb3c386add",
  "data/idioms.js?v=eb3c386add",
  "data/saetze.js?v=eb3c386add",
  "data/saetze2.js?v=eb3c386add",
  "data/lernbuch.js?v=eb3c386add",
  "data/verben.js?v=eb3c386add",
  "data/grammatik.js?v=eb3c386add",
  "data/open/business-aufbau.js?v=eb3c386add",
  "data/open/business-basis.js?v=eb3c386add",
  "data/open/business-profi.js?v=eb3c386add",
  "data/open/saetze-open.js?v=eb3c386add",
  "js/engine.js?v=eb3c386add",
  "js/cosmetics.js?v=eb3c386add",
  "js/saison.js?v=eb3c386add",
  "js/saison2.js?v=eb3c386add",
  "js/fortnite.js?v=eb3c386add",
  "js/figur.js?v=eb3c386add",
  "js/stila.js?v=eb3c386add",
  "js/stilb.js?v=eb3c386add",
  "js/acc.js?v=eb3c386add",
  "js/loot.js?v=eb3c386add",
  "js/film.js?v=eb3c386add",
  "js/app.js?v=eb3c386add",
  "js/arena.js?v=eb3c386add",
  "js/spiele.js?v=eb3c386add",
  "js/grammatik.js?v=eb3c386add",
  "js/sync.js?v=eb3c386add",
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
