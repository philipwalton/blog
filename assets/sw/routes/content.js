import {Plugin as BroadcastCacheUpdatePlugin} from 'workbox-broadcast-cache-update/Plugin.mjs';
import {Route} from 'workbox-routing/Route.mjs';
import {StaleWhileRevalidate} from 'workbox-strategies/StaleWhileRevalidate.mjs';
import {cacheNames} from '../caches.js';

const contentMatcher = ({url}) => {
  return url.hostname === location.hostname &&
      url.pathname.endsWith('index.content.html');
};

export const contentStrategy = new StaleWhileRevalidate({
  cacheName: cacheNames.CONTENT,
  plugins: [new BroadcastCacheUpdatePlugin({
    deferNoticationTimeout: navigator.connection &&
        navigator.connection.effectiveType === '4g' ? 3000 : 6000,
  })],
});

export const createContentRoute = () => {
  return new Route(contentMatcher, contentStrategy);
};
