/*
 * MAZIGHO deliberately uses a network-only service worker.
 * It makes the HTTPS storefront installable without retaining customer,
 * catalogue, cart, account or administration data on a shared device.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  // No Cache API and no request interception by design.
});
