import {Plugin as ExpirationPlugin} from 'workbox-cache-expiration/Plugin.mjs';
import {Route} from 'workbox-routing/Route.mjs';
import {CacheFirst} from 'workbox-strategies/CacheFirst.mjs';
import {cacheNames} from '../caches.js';

const staticAssetsMatcher = ({url}) => {
  return url.hostname === location.hostname &&
    url.pathname.startsWith('/static/');
};

const staticAssetsStrategy = new CacheFirst({
  cacheName: cacheNames.STATIC_ASSETS,
  plugins: [new ExpirationPlugin({
    maxEntries: 100,
  })],
});

export const createStaticAssetsRoute = () => {
  return new Route(staticAssetsMatcher, staticAssetsStrategy);
};
