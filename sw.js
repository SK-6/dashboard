const CACHE = 'dashboard-v1';
const ASSETS = [
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // APIリクエストはキャッシュしない（常に最新を取得）
  if (
    e.request.url.includes('api.open-meteo.com') ||
    e.request.url.includes('api.allorigins.win') ||
    e.request.url.includes('api.p2pquake.net') ||
    e.request.url.includes('fonts.googleapis.com') ||
    e.request.url.includes('fonts.gstatic.com')
  ) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }
  // アプリ本体はキャッシュファースト
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
