import {Route} from 'workbox-routing/Route.mjs';
import {CacheFirst} from 'workbox-strategies/CacheFirst.mjs';
import {cacheNames} from '../caches.js';

const shellMatcher = ({url}) => {
  return url.pathname.startsWith('/static/shell-') ||
      url.pathname.endsWith('.mjs') || url.pathname.endsWith('.css');
};

export const shellStrategy = new CacheFirst({
  cacheName: cacheNames.SHELL,
});

export const createShellRoute = () => {
  return new Route(shellMatcher, shellStrategy);
};
