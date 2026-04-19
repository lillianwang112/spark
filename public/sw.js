const CACHE = 'spark-v1';
const PRECACHE = [
  '/spark/',
  '/spark/index.html',
  '/spark/manifest.json',
  '/spark/ember-icon.svg',
  '/spark/pwa-192x192.png',
  '/spark/pwa-512x512.png',
  '/spark/apple-touch-icon-180x180.png',
  '/spark/hero.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Only handle GET requests for same-origin or CDN assets
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // Network-first for API / AI calls
  if (url.pathname.startsWith('/api/') || url.hostname.includes('anthropic') || url.hostname.includes('puter')) {
    return;
  }

  // Cache-first for static assets (JS/CSS/images/fonts)
  if (
    url.pathname.match(/\.(js|css|png|svg|ico|woff2?|jpg|webp)$/) ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(resp => {
          if (resp.ok) {
            const clone = resp.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return resp;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Network-first with offline fallback for navigation
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match('/spark/index.html'))
    );
  }
});
