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

  for (const route of Object.values(routes)) {
    router.registerRoute(route());
  }
};
