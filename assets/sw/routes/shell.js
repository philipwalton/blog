import {Plugin as BroadcastCacheUpdatePlugin} from 'workbox-broadcast-cache-update/Plugin.mjs';
import {Route} from 'workbox-routing/Route.mjs';
import {StaleWhileRevalidate} from 'workbox-strategies/StaleWhileRevalidate.mjs';
import {cacheNames} from '../caches.js';

const shellMatcher = ({url}) => {
  return url.hostname === location.hostname &&
      url.pathname.match(/shell-(start|end)\.html/);
};

export const shellStrategy = new StaleWhileRevalidate({
  cacheName: cacheNames.SHELL,
  plugins: [new BroadcastCacheUpdatePlugin({
    deferNoticationTimeout: navigator.connection &&
        navigator.connection.effectiveType === '4g' ? 3000 : 6000,
  })],
});

export const createShellRoute = () => {
  return new Route(shellMatcher, shellStrategy);
};
