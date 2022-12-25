/* global __PRECACHE_MANIFEST__ */

import {PrecacheController} from 'workbox-precaching/PrecacheController.js';
import {Route} from 'workbox-routing/Route.js';
import {CacheFirst} from 'workbox-strategies/CacheFirst.js';
import {cacheNames} from './caches.js';
import {streamErrorPlugin} from './plugins/streamErrorPlugin.js';

const pc = new PrecacheController({
  cacheName: cacheNames.SHELL,
});

const precacheMatcher = ({url}) => {
  return Boolean(pc.getCacheKeyForURL(url.href));
};

const cacheFirst = new CacheFirst({
  cacheName: cacheNames.SHELL,
  plugins: [streamErrorPlugin],
});

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

export const install = pc.install;
export const activate = pc.activate;

export const init = () => {
  pc.addToCacheList(__PRECACHE_MANIFEST__);
};
