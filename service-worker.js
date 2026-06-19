const CACHE_NAME = "uds-hub-v2";

self.addEventListener("install", (e) => {
    self.skipWaiting();
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(["/"])));
});

self.addEventListener("activate", (e) => {
    e.waitUntil(caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
        }));
    }));
    self.clients.claim();
});

self.addEventListener("fetch", (e) => {
    e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});