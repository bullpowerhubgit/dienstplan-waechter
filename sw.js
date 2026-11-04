/* Dienstplan-Wächter Service Worker
   HTML wird IMMER frisch aus dem Netz geladen (nie veraltet).
   Bilder/Manifest werden gecacht (schnell + offline). */
const CACHE = 'dw-2026-11-04-V';
const CORE = ['./manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== location.origin) return;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    // Seite immer frisch holen (umgeht den Browser-Cache); offline -> letzter Stand
    e.respondWith(
      fetch(new Request(req.url, { cache: 'reload' }))
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {}); return res; })
        .catch(() => caches.match('./index.html'))
    );
  } else {
    // Bilder/Manifest: aus Cache (schnell), sonst Netz
    e.respondWith(
      caches.match(req).then(c => c || fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(cc => cc.put(req, copy)).catch(() => {}); return res; }))
    );
  }
});
