import {Router} from 'workbox-routing/Router.mjs';
import {createPrecacheRoute} from './precache.js';
import {createContentRoute} from './routes/content.js';
import {createPagesRoute} from './routes/pages.js';
import {createStaticAssetsRoute} from './routes/static-assets.js';
import {createThirdPartyAssetsRoute} from './routes/third-party-assets.js';


// Order matters. Earlier routes are tried first.
const precacheRoutes = {
  createPrecacheRoute,
};

// Order matters. Earlier routes are tried first.
const runtimeRoutes = {
  createStaticAssetsRoute,
  createContentRoute,
  createPagesRoute,
  createThirdPartyAssetsRoute,
};

const registerRoutes = (router, routes) => {
  for (const route of Object.values(routes)) {
    router.registerRoute(route());
  }
};

export const init = () => {
  const precacheRouter = new Router();
  registerRoutes(precacheRouter, precacheRoutes);
  precacheRouter.addFetchListener();

  const runtimeRouter = new Router();
  registerRoutes(runtimeRouter, runtimeRoutes);
  runtimeRouter.addFetchListener();

  // Only add the cache listener for runtime routes.
  runtimeRouter.addCacheListener();
};
