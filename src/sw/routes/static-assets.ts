import {ExpirationPlugin} from 'workbox-expiration/ExpirationPlugin.js';
import {Route} from 'workbox-routing/Route.js';
import {CacheFirst} from 'workbox-strategies/CacheFirst.js';
import {cacheNames} from '../caches.js';

const staticAssetsMatcher = ({url}: {url: URL}): boolean => {
  return (
    url.hostname === location.hostname && url.pathname.startsWith('/static/')
  );
};

const staticAssetsStrategy = new CacheFirst({
  cacheName: cacheNames.STATIC_ASSETS,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 100,
    }) as any,
  ],
});

export const createStaticAssetsRoute = (): Route => {
  return new Route(staticAssetsMatcher, staticAssetsStrategy);
};
