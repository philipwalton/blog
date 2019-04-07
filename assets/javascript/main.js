import * as alerts from './alerts';
import * as analytics from './analytics';
import * as breakpoints from './breakpoints';
import * as contentLoader from './content-loader';
import * as drawer from './drawer';
import * as messages from './messages';
import * as sw from './sw-init.js';

/**
 * The main script entry point for the site. Initalizes all the sub modules
 * analytics tracking, and the service worker.
 */
const main = async () => {
  contentLoader.init();
  drawer.init();
  breakpoints.init();
  messages.init();
  alerts.init();

  analytics.init();

  if ('serviceWorker' in navigator) {
    try {
      await sw.init();
    } catch (err) {
      analytics.trackError(err);
    }
  }
};

// Initialize all code in a separate task.
setTimeout(main, 0);
