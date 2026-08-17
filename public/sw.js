// Service Worker for Durood Campaign PWA
const CACHE_NAME = 'durood-campaign-v10';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/favicon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/icon.png',
  '/apple-touch-icon.png',
  '/assets/images/durood_master_icon.png',
  '/assets/images/durood_master_icon.jpg',
  '/assets/images/durood_goal_tracker_icon_1786785831299.jpg',
  '/assets/images/durood_icon_crop_1786786399478.jpg',
  '/icons/apple-touch-icon.png',
  '/icons/icon-48x48.png',
  '/icons/icon-48x48-maskable.png',
  '/icons/icon-72x72.png',
  '/icons/icon-72x72-maskable.png',
  '/icons/icon-96x96.png',
  '/icons/icon-96x96-maskable.png',
  '/icons/icon-128x128.png',
  '/icons/icon-128x128-maskable.png',
  '/icons/icon-144x144.png',
  '/icons/icon-144x144-maskable.png',
  '/icons/icon-192x192.png',
  '/icons/icon-192x192-maskable.png',
  '/icons/icon-256x256.png',
  '/icons/icon-256x256-maskable.png',
  '/icons/icon-384x384.png',
  '/icons/icon-384x384-maskable.png',
  '/icons/icon-512x512.png',
  '/icons/icon-512x512-maskable.png'
];

// Install Event - Pre-cache critical offline shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA Pre-cache skipped optional assets:', err);
      });
    })
  );
});

// Activate Event - Purge all previous caches immediately and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // 1. Only handle GET requests with http / https
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // 2. Bypass Service Worker entirely for Firebase, Google APIs, and WebSockets
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('google.com') ||
    url.pathname.startsWith('/api') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:'
  ) {
    return;
  }

  // 3. Network-First Strategy for all navigation and assets, with robust Cache Fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // If network returns a valid 200 OK response, cache it for offline resilience
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Offline or Network Failure: check cache
        const cachedMatch = await caches.match(request);
        if (cachedMatch) {
          return cachedMatch;
        }

        // If navigation failed and not cached, fallback to index.html
        if (request.mode === 'navigate') {
          const indexHtml = await caches.match('/index.html');
          if (indexHtml) {
            return indexHtml;
          }
        }

        // Return a valid error response rather than undefined
        return new Response('Network error occurred', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});

