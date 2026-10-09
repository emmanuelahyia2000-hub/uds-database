
const CACHE_NAME = "uds-hub-v10";
const CACHE_PREFIX = "uds-hub-";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/logo.png",
];

// Install: cache the essential app shell.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(ASSETS_TO_CACHE)
    )
  );

  // Intentionally do NOT call skipWaiting() here.
  // The page will ask the waiting worker to activate.
});

// Activate: remove older UDS Hub caches and take control.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith(CACHE_PREFIX) &&
              key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

// The page calls this after the user chooses Update.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting());
  }
});

// Fetch: preserve offline support without caching arbitrary API responses.
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Do not intercept other websites' requests.
  if (url.origin !== self.location.origin) return;

  // HTML navigations: network first, cached page when offline.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);

          if (response.ok && response.type === "basic") {
            const copy = response.clone();

            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) =>
                cache.put("/index.html", copy)
              )
            );
          }

          return response;
        } catch {
          return (
            (await caches.match(request)) ||
            (await caches.match("/index.html")) ||
            Response.error()
          );
        }
      })()
    );

    return;
  }

  // Cache-first for static files, with a background refresh.
  // API responses are intentionally not cached by this handler.
  const isStaticAsset =
    /\.(?:png|jpe?g|gif|svg|webp|ico|css|js|mjs|woff2?|ttf|otf)$/i
      .test(url.pathname);

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);

        const refresh = fetch(request).then((response) => {
          if (
            response &&
            (response.status === 200 ||
              response.type === "opaque")
          ) {
            const copy = response.clone();

            event.waitUntil(
              caches.open(CACHE_NAME).then((cache) =>
                cache.put(request, copy)
              )
            );
          }

          return response;
        });

        if (cached) {
          // Refresh in the background; return cached content now.
          event.waitUntil(refresh.then(() => undefined).catch(() => {}));
          return cached;
        }

        try {
          return await refresh;
        } catch {
          return Response.error();
        }
      })()
    );
  }
});

// Push notifications: preserve existing behavior.
self.addEventListener("push", (event) => {
  let data = {
    title: "UDS Hub Update",
    body: "You have a new notice or marketplace message waiting!",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/logo-192.png",
      badge: "/logo-192.png",
      vibrate: [100, 50, 100],
      data: { url: "/" },
      actions: [
        {
          action: "explore",
          title: "Open App",
          icon: "/logo-192.png",
        },
      ],
    })
  );
});

// Notification click: focus an existing app window or open one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const target = new URL(
        event.notification.data?.url || "/",
        self.location.origin
      ).href;

      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windows) {
        if (client.url.startsWith(self.location.origin)) {
          await client.focus();

          if ("navigate" in client && client.url !== target) {
            await client.navigate(target);
          }

          return;
        }
      }

      await self.clients.openWindow(target);
    })()
  );
});