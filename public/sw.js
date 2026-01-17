// Cleanup service worker to replace any previously installed version.
// Unregisters itself and clears all caches.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', async () => {
  // Clear all caches
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));

  // Unregister this service worker
  await self.registration.unregister();

  // Take control and reload clients so they get fresh network responses
  const clients = await self.clients.matchAll({type: 'window'});
  clients.forEach((client) => client.navigate(client.url));
});
