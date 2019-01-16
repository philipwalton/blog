import {Router} from 'workbox-routing/Router.mjs';
import {createContentRoute} from './routes/content.js';
import {createPageRoute} from './routes/page.js';
import {createShellRoute} from './routes/shell.js';
import {createStaticAssetsRoute} from './routes/static-assets.js';
import {createThirdPartyAssetsRoute} from './routes/third-party-assets.js';

const routes = {
  createContentRoute,
  createPageRoute,
  createShellRoute,
  createStaticAssetsRoute,
  createThirdPartyAssetsRoute,
};

export const initRouter = () => {
  const router = new Router();
  router.addFetchListener();

  // TODO(philipwalton): go back to using `router.addCacheListener()` once
  // this is fixed: https://github.com/GoogleChrome/workbox/issues/1826
  self.addEventListener('message', async (event) => {
    if (event.data.type === 'CACHE_URLS' &&
        event.data.meta === 'workbox-window') {
      const {urlsToCache} = event.data.payload;

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line
        console.debug(`Caching URLs from the window`, urlsToCache);
      }

      for (const entry of urlsToCache) {
        let request;
        if (typeof entry === 'string') {
          request = new Request(entry);
        } else {
          request = new Request(entry.url, entry);
        }

        await router.handleRequest({request, event});
      }
    }
  });

  for (const route of Object.values(routes)) {
    router.registerRoute(route());
  }
};
