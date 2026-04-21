const CACHE = 'dashboard-v4';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // 外部APIはネットワーク優先
  if (url.includes('api.open-meteo.com') ||
      url.includes('api.allorigins.win') ||
      url.includes('api.p2pquake.net') ||
      url.includes('fonts.googleapis.com') ||
      url.includes('fonts.gstatic.com')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('', {status: 503}))
    );
    return;
  }
  // アプリ本体: キャッシュ優先、なければネットワーク
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // 成功したレスポンスはキャッシュに追加
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => {
      // オフライン時はindex.htmlにフォールバック
      return caches.match('./index.html');
    })
  );
});
