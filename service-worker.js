const CACHE_NAME = "uds-hub-v1";

self.addEventListener("install", () => {
  console.log("UDS Hub Service Worker Installed");
});

self.addEventListener("activate", () => {
  console.log("UDS Hub Service Worker Activated");
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});