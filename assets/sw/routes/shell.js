import {Route} from 'workbox-routing/Route.mjs';
import {CacheFirst} from 'workbox-strategies/CacheFirst.mjs';
import {cacheNames} from '../caches.js';


/**
 * Given an asset URL that we already know to be in `/static/`, return true
 * if this assets is part of the application shell.
 * @param {string} pathname
 * @return {boolean}
 */
export const isShellAsset = (pathname) => {
  return /(html|css|mjs)$/.test(pathname);
};

const shellMatcher = ({url}) => {
  return url.hostname === location.hostname &&
      url.pathname.startsWith('/static/') &&
      isShellAsset(url.pathname);
};

export const shellStrategy = new CacheFirst({
  cacheName: cacheNames.SHELL,
});

export const createShellRoute = () => {
  return new Route(shellMatcher, shellStrategy);
};
