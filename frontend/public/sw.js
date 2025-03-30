const CACHE_NAME = 'collabamap-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Try network first, then cache
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            // For navigation requests, return index.html from cache
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return Promise.reject('no-match');
          });
      })
  );
}); 