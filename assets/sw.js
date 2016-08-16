const offlineGoogleAnalytics = require(
    'sw-helpers/projects/sw-offline-google-analytics/src');


const CACHE_NAME = 'philipwalton:v1';


// Maps relevant custom dimension names to their index.
const dimensions = {
  SERVICE_WORKER_REPLAY: 'cd8'
};


const assetUrlParts = [
  location.hostname,
  'googleapis.com',
  'gstatic.com'
];


offlineGoogleAnalytics.initialize({
  parameterOverrides: {[dimensions.SERVICE_WORKER_REPLAY]: 'replay'}
});


const cacheInitialAssets = async () => {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll([
    '/',
    '/assets/analytics.js',
    '/assets/css/main.css',
    '/assets/javascript/main.js',
  ]);
};


const addToCache = async (request, networkResponse) => {
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, networkResponse.clone());
};


const getCacheResponse = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  return cachedResponse;
};


const getNetworkOrCacheResponse = async (request) => {
  try {
    const networkResponse = await fetch(request);
    addToCache(request, networkResponse);
    return networkResponse;
  } catch (err) {
    const cacheResponse = await getCacheResponse(request);
    return cacheResponse || Response.error();
  }
};


self.addEventListener('fetch', (event) => {
  if (assetUrlParts.some((part) => event.request.url.includes(part))) {
    event.respondWith(getNetworkOrCacheResponse(event.request));
  }
});


self.addEventListener('install', (event) => {
  event.waitUntil(cacheInitialAssets());
});


self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
