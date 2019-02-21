import {Router} from 'workbox-routing/Router.mjs';
import {createContentRoute} from './routes/content.js';
import {createPageRoute} from './routes/page.js';
import {createShellRoute} from './routes/shell.js';
import {createStaticAssetsRoute} from './routes/static-assets.js';
import {createThirdPartyAssetsRoute} from './routes/third-party-assets.js';


// Order matters. Earlier routes are tried first.
const precacheRoutes = {
  createShellRoute,
};

// Order matters. Earlier routes are tried first.
const runtimeRoutes = {
  createStaticAssetsRoute,
  createContentRoute,
  createPageRoute,
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
