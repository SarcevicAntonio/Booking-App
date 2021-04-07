// src https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers

const cacheName = "pbt-pwa-v1";

const contentToCache = [
  "/",
  "/icon-192x192.png",
  "/icon-256x256.png",
  "/icon-384x384.png",
  "/icon-512x512.png",
];

self.addEventListener("install", (e) => {
  console.log("[Service Worker] Install");
  // Caching of essential files
  e.waitUntil(
    // Wait in installing phase
    (async () => {
      const cache = await caches.open(cacheName);
      console.log("[Service Worker] Caching app shell");
      await cache.addAll(contentToCache);
    })()
  );
});

// Caching of files for offline functionality
self.addEventListener("fetch", (e) => {
  e.respondWith(
    (async () => {
      const r = await caches.match(e.request);
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (r) {
        return r;
      }
      const response = await fetch(e.request);
      const cache = await caches.open(cacheName);
      console.log(
        `[Service Worker] Trying to cache new resource: ${e.request.url}`
      );

      // handle specific cases
      if (e.request.url.startsWith("chrome-extension")) {
        // Chrome Extentions
        console.log(
          `[Service Worker] Skipping resource to avoid errors because its a chrome extention.`
        );
      } else if (e.request.url.includes("5984")) {
        // CouchDB Server
        console.log(
          `[Service Worker] Skipping resource because its a database call. PouchDB handles this already.`
        );
      } else {
        // other resources can get cached
        cache.put(e.request, response.clone());
        console.log(`[Service Worker] Cached resource!`);
      }
      return response;
    })()
  );
});

// Handle push notifications
// src https://developers.google.com/web/fundamentals/codelabs/push-notifications#subscribe_the_user
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Received.");
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  const title = "Pirate Bay Tours Booking Client";
  const options = {
    body: event.data.text(),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
