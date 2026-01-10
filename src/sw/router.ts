import {Router} from 'workbox-routing/Router.js';
import {createPrecacheRoute} from './precache.ts';
import {createContentRoute} from './routes/content.ts';
import {createPagesRoute} from './routes/pages.ts';
import {createStaticAssetsRoute} from './routes/static-assets.ts';
import {createLogRoute} from './routes/log.ts';

import type {Route} from 'workbox-routing/Route.js';

type RouteList = Array<() => Route>;

// Order matters. Earlier routes are tried first.
const precacheRoutes: RouteList = [createPrecacheRoute];

// Order matters. Earlier routes are tried first.
const runtimeRoutes: RouteList = [
  createStaticAssetsRoute,
  createContentRoute,
  createPagesRoute,
];

// Order matters. Earlier routes are tried first.
const logRoutes: RouteList = [createLogRoute];

const registerRoutes = (router: Router, routes: RouteList): void => {
  for (const route of routes) {
    router.registerRoute(route());
  }
};

export const init = (): void => {
  const precacheRouter = new Router();
  registerRoutes(precacheRouter, precacheRoutes);
  precacheRouter.addFetchListener();

  const runtimeRouter = new Router();
  registerRoutes(runtimeRouter, runtimeRoutes);
  runtimeRouter.addFetchListener();

  // Only add the cache listener for runtime routes.
  runtimeRouter.addCacheListener();

  const logRouter = new Router();
  registerRoutes(logRouter, logRoutes);
  logRouter.addFetchListener();
};
