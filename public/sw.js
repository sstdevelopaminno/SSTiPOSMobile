const SW_VERSION = "sstipos-mobile-2026-07-16-notifications";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    self.clients.claim().then(async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: "SSTIPOS_SW_READY", version: SW_VERSION });
      }
    })
  );
});

self.addEventListener("fetch", () => {
  // Network-first by default. Avoid stale POS/auth data and keep the PWA stable.
});
