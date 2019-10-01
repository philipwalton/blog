/* global __PRECACHE_MANIFEST__ */

import {PrecacheController} from 'workbox-precaching/PrecacheController.mjs';
import {Route} from 'workbox-routing/Route.mjs';
import {CacheFirst} from 'workbox-strategies/CacheFirst.mjs';
import {cacheNames} from './caches.js';


const pc = new PrecacheController(cacheNames.SHELL);

const precacheMatcher = ({url}) => {
  return Boolean(pc.getCacheKeyForURL(url.href));
};

const cacheFirst = new CacheFirst({cacheName: cacheNames.SHELL});

export const precacheHandler = ({request, event}) => {
  const cacheKey = pc.getCacheKeyForURL(request.url);

  return cacheFirst.handle({
    request: new Request(cacheKey),
    event,
  });
};

export const createPrecacheRoute = () => {
  return new Route(precacheMatcher, precacheHandler);
};

export const install = (opts) => pc.install(opts);
export const activate = (opts) => pc.activate(opts);

export const init = () => {
  pc.addToCacheList(__PRECACHE_MANIFEST__);
};
