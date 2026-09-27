const CACHE_NAME = 'uds-hub-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
];

// Install Service Worker and cache essential layouts
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate handler
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch interception for offline loading support (Smart WhatsApp-Style Strategy)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. VISUAL ASSETS (Tailwind, Fonts, Icons, Images): Cache-First + Background Update
  // This keeps the app looking beautiful offline instead of showing a broken skeleton.
  if (url.origin !== location.origin || url.pathname.match(/\.(png|jpg|jpeg|svg|gif|css|js|woff2|woff)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const networkFetch = fetch(event.request).then((networkResponse) => {
          // Allow external CDNs (opaque responses) to be cached
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        }).catch(() => null); // Silent fail if offline
        
        return cachedResponse || networkFetch; // Serve cache instantly, fallback to network
      })
    );
    return;
  }

  // 2. MAIN APP / HTML: Network-First Strategy (Always check for updates)
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If offline, serve the beautifully cached UI
        return caches.match(event.request);
      })
  );
});

// LISTEN FOR PUSH NOTIFICATIONS (Even when the app is completely closed)
self.addEventListener('push', (event) => {
  let data = { title: 'UDS Hub Update', body: 'You have a new notice or marketplace message waiting!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/logo-192.png',
    badge: '/logo-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      { action: 'explore', title: 'Open App', icon: '/logo-192.png' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle Notification Clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});