import * as breakpoints from './breakpoints.ts';
import * as contentLoader from './content-loader.ts';
import * as linkableHeadings from './linkable-headings.ts';
import * as sw from './sw-init.ts';
import * as log from './log.ts';

const initServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await sw.init();
    } catch (err) {
      log.trackUnhandledError(err as Error);
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
  linkableHeadings.init();

  // NOTE: make sure `initServiceWorker()` finishes before running
  // `initLog()` because it needs to add pre-send dependencies.
  await initServiceWorker();
  await initLog();
};

main();
