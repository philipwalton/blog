import * as breakpoints from './breakpoints';
import * as contentLoader from './content-loader';
import * as sw from './sw-init';
import * as log from './log';

const initServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await sw.init();
    } catch (err) {
      log.trackError(err);
    }
  }
};

const initLog = async () => {
  log.init();
};

/**
 * The main script entry point for the site. Initializes all the sub modules
 * log tracking, and the service worker.
 */
const main = async () => {
  breakpoints.init();
  contentLoader.init();

  // NOTE: make sure `initServiceWorker()` finishes before running
  // `initLog()` because it needs to add pre-send dependencies.
  await initServiceWorker();
  await initLog();
};

main();
