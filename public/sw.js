const DENY = [/^\/login/, /^\/api\/auth/, /^\/api\/mobile/, /^\/api\/pos/];
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (DENY.some((pattern) => pattern.test(url.pathname))) return;
});
