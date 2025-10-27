import {PrecacheController} from 'workbox-precaching/PrecacheController.js';
import {Route} from 'workbox-routing/Route.js';
import {CacheFirst} from 'workbox-strategies/CacheFirst.js';
import {cacheNames} from './caches.js';
import {streamErrorPlugin} from './plugins/streamErrorPlugin.js';

const pc = new PrecacheController({
  cacheName: cacheNames.SHELL,
});

const precacheMatcher = ({url}: {url: URL}): boolean => {
  return Boolean(pc.getCacheKeyForURL(url.href));
};

const cacheFirst = new CacheFirst({
  cacheName: cacheNames.SHELL,
  plugins: [streamErrorPlugin],
});

export const precacheHandler = ({
  request,
  event,
}: {
  request: Request;
  event: ExtendableEvent;
}): Promise<Response> => {
  const cacheKey = pc.getCacheKeyForURL(request.url);

  if (!cacheKey) {
    throw new Error('No cache key found for URL: ' + request.url);
  }

  return cacheFirst.handle({
    request: new Request(cacheKey),
    event,
  });
};

export const createPrecacheRoute = (): Route => {
  return new Route(precacheMatcher, precacheHandler);
};

export const install = pc.install.bind(pc);
export const activate = pc.activate.bind(pc);

export const init = (): void => {
  pc.addToCacheList((self as any).__PRECACHE_MANIFEST__);
};
