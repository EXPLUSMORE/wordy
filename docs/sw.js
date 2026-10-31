/* Wordy – Offline-Cache. Automatisch erzeugt, nicht von Hand ändern. */
const CACHE = 'wordy-e2999858bc';
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "data/klasse6.js?v=e2999858bc",
  "data/klasse7.js?v=e2999858bc",
  "data/klasse8.js?v=e2999858bc",
  "data/business.js?v=e2999858bc",
  "data/business-basis2.js?v=e2999858bc",
  "data/business-aufbau2.js?v=e2999858bc",
  "data/business-profi2.js?v=e2999858bc",
  "data/smalltalk.js?v=e2999858bc",
  "data/advent.js?v=e2999858bc",
  "data/idioms.js?v=e2999858bc",
  "data/saetze.js?v=e2999858bc",
  "data/saetze2.js?v=e2999858bc",
  "data/lernbuch.js?v=e2999858bc",
  "data/verben.js?v=e2999858bc",
  "data/grammatik.js?v=e2999858bc",
  "data/alternativen.js?v=e2999858bc",
  "data/open/business-aufbau.js?v=e2999858bc",
  "data/open/business-basis.js?v=e2999858bc",
  "data/open/business-profi.js?v=e2999858bc",
  "data/open/saetze-open.js?v=e2999858bc",
  "js/engine.js?v=e2999858bc",
  "js/cosmetics.js?v=e2999858bc",
  "js/saison.js?v=e2999858bc",
  "js/saison2.js?v=e2999858bc",
  "js/fortnite.js?v=e2999858bc",
  "js/figur.js?v=e2999858bc",
  "js/stila.js?v=e2999858bc",
  "js/stilb.js?v=e2999858bc",
  "js/acc.js?v=e2999858bc",
  "js/loot.js?v=e2999858bc",
  "js/film.js?v=e2999858bc",
  "js/einmaleins.js?v=e2999858bc",
  "js/app.js?v=e2999858bc",
  "js/arena.js?v=e2999858bc",
  "js/spiele.js?v=e2999858bc",
  "js/grammatik.js?v=e2999858bc",
  "js/sync.js?v=e2999858bc",
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
