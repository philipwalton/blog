const offlineGoogleAnalytics = require('sw-helpers/projects/sw-offline-google-analytics/src');


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


const cacheAnalyticsJs = async (cache) => {
  let analyticsJsUrl = 'https://www.google-analytics.com/analytics.js';
  let analyticsJsRequest = new Request(analyticsJsUrl, {mode: 'no-cors'});
  let analyticsJsResponse = await fetch(analyticsJsRequest);
  return cache.put(analyticsJsRequest, analyticsJsResponse.clone());
};


const cacheInitialAssets = async () => {
  const cache = await caches.open(CACHE_NAME);
  return await [
    cacheAnalyticsJs(cache),
    cache.addAll([
      '/',
      '/assets/css/main.css',
      '/assets/javascript/main.js',
    ])
  ];
};


const networkFirstWithCacheFallback = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    await cache.put(request, networkResponse.clone());
    return networkResponse;
  }
  catch (err) {
    const cacheResponse = await cache.match(request);
    return cacheResponse || Response.error();
  }
};


self.addEventListener('fetch', (event) => {
  if (assetUrlParts.some((part) => event.request.url.includes(part))) {
    event.respondWith(networkFirstWithCacheFallback(event.request));
  }
});


self.addEventListener('install', (event) => {
  event.waitUntil(cacheInitialAssets());
});


self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
