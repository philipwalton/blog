require('async-waituntil-polyfill');


const offlineGoogleAnalytics = require(
    'sw-helpers/projects/sw-offline-google-analytics/src');


const CACHE_NAME = 'philipwalton:v1';


// Maps relevant custom dimension names to their index.
const dimensions = {
  SERVICE_WORKER_REPLAY: 'cd8',
};


const assetUrlParts = [
  new RegExp('^' + location.origin),
  /^https?:\/\/fonts\.googleapis\.com/,
  /^https?:\/\/www\.gstatic\.com/,
  /^https?:\/\/www\.google\-analytics\.com\/analytics\.js/,
];


const cacheAnalyticsJs = async (cache) => {
  let analyticsJsUrl = 'https://www.google-analytics.com/analytics.js';
  let analyticsJsRequest = new Request(analyticsJsUrl, {mode: 'no-cors'});
  let analyticsJsResponse = await fetch(analyticsJsRequest);
  return cache.put(analyticsJsRequest, analyticsJsResponse.clone());
};


const cacheInitialAssets = async () => {
  const cache = await caches.open(CACHE_NAME);
  return Promise.all([
    cacheAnalyticsJs(cache),
    cache.addAll([
      '/',
      '/assets/css/main.css',
      '/assets/javascript/main.js',
      '/assets/javascript/polyfills.js',
    ]),
  ]);
};


const addToCache = async (request, networkResponseClone) => {
  const cache = await caches.open(CACHE_NAME);
  return cache.put(request, networkResponseClone);
};


const getCacheResponse = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  return cachedResponse;
};


self.addEventListener('fetch', (event) => {
  if (assetUrlParts.some((part) => part.test(event.request.url))) {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(event.request);
        event.waitUntil(addToCache(event.request, networkResponse.clone()));
        return networkResponse;
      } catch (err) {
        const cacheResponse = await getCacheResponse(event.request);
        return cacheResponse || err;
      }
    })());
  }
});


self.addEventListener('install', (event) => {
  event.waitUntil(cacheInitialAssets());
});


self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});


offlineGoogleAnalytics.initialize({
  parameterOverrides: {[dimensions.SERVICE_WORKER_REPLAY]: 'replay'},
});
