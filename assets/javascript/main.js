import * as breakpoints from './breakpoints';
import * as contentLoader from './content-loader';
import * as drawer from './drawer';
import * as sw from './sw-init';


const initServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await sw.init();
    } catch (err) {
      const log = await import('./log.js');
      log.trackError(err);
    }
  }
};

const initLog = async () => {
  // Cannot use the variable name `log` until this issue is resolved:
  // https://github.com/rollup/rollup/issues/3245
  const log = await import('./log.js');
  log.init();
};

/**
 * The main script entry point for the site. Initializes all the sub modules
 * log tracking, and the service worker.
 */
export const main = async () => {
  contentLoader.init();
  drawer.init();
  breakpoints.init();

  // Everything after this includes dynamic imports.
  // NOTE: make sure `initServiceWorker()` finishes before running
  // `initLog()` because it needs to add pre-send dependencies.
  await initServiceWorker();
  await initLog();

  // await import('./log2');
};
