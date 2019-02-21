import {Plugin as ExpirationPlugin} from 'workbox-expiration/Plugin.mjs';
import {Route} from 'workbox-routing/Route.mjs';
import {CacheFirst} from 'workbox-strategies/CacheFirst.mjs';
import {isShellAsset} from './shell.js';
import {cacheNames} from '../caches.js';

// Match anything in the `/static/` folder other than shell assets.
const staticAssetsMatcher = ({url}) => {
  // Note: ensure this logic doesn't overlap with anything matched by the
  // function in `./shell.js`, as it also matches static assets.
  return url.hostname === location.hostname &&
      url.pathname.startsWith('/static/') &&
      !isShellAsset(url.pathname);
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
