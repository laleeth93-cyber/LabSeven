// Lab Seven PWA Service Worker for App Installation
const CACHE_NAME = 'labseven-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch handler for PWA criteria
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
