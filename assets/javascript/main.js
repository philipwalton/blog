import 'babel-polyfill';

import * as alerts from './alerts';
import * as analytics from './analytics';
import * as breakpoints from './breakpoints';
import * as contentLoader from './content-loader';
import * as drawer from './drawer';

/**
 * The main script entry point for the site. Initalizes all the sub modules
 * analytics tracking, and the service worker.
 */
const main = async () => {
  alerts.init();
  breakpoints.init();
  contentLoader.init();
  drawer.init();

  analytics.init();
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js')
    } catch (err) {
      analytics.trackError(err)
    }
  }
};

main();
