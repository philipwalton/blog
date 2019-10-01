import * as breakpoints from './breakpoints';
import * as contentLoader from './content-loader';
import * as drawer from './drawer';
import * as sw from './sw-init';


const initServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      await sw.init();
    } catch (err) {
      const analytics = await import('./analytics');
      analytics.trackError(err);
    }
  }
};

const initAnalytics = async () => {
  const analytics = await import('./analytics');
  analytics.init();
};

/**
 * The main script entry point for the site. Initalizes all the sub modules
 * analytics tracking, and the service worker.
 */
export const main = async () => {
  contentLoader.init();
  drawer.init();
  breakpoints.init();

  // Everything after this includes dynamic imports.
  // NOTE: make sure `initServiceWorker()` finishes before running
  // `initAnalytics()` because it needs to add pre-send dependencies.
  await initServiceWorker();
  await initAnalytics();
};
