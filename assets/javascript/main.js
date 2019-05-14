import * as breakpoints from './breakpoints';
import * as contentLoader from './content-loader';
import * as drawer from './drawer';


const initServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const sw = await import('./sw-init');
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
const main = async () => {
  contentLoader.init();
  drawer.init();
  breakpoints.init();

  // Everything after this includes dynamic imports.
  initServiceWorker();
  initAnalytics();
};

// Initialize all code in a separate task.
setTimeout(main, 0);
