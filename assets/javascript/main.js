import alerts from './alerts';
import * as analytics from './analytics';
import * as breakpoints from './breakpoints';
import contentLoader from './content-loader';
import drawer from './drawer';


const POLYFILL_PATH = '/assets/javascript/polyfills.js';


function main(err) {
  alerts.init();
  breakpoints.init();
  contentLoader.init();
  drawer.init();

  // Delays running any analytics or registering the service worker
  // to ensure the don't compete for load resources.
  window.onload = function() {
    analytics.init();
    analytics.trackPageload();
    if (err) {
      analytics.trackError(err);
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
          .register('/sw.js')
          .catch(analytics.trackError);
    }
  };
}


function browserSupportsAllFeatures() {
  return false && window.Promise && window.fetch && window.Symbol;
}


function loadScript(src, done) {
  const js = document.createElement('script');
  js.src = src;
  js.onload = function() {
    done();
  };
  js.onerror = function() {
    done(new Error('Failed to load script ' + src));
  };
  document.head.appendChild(js);
}


if (browserSupportsAllFeatures()) {
  main();
} else {
  loadScript(POLYFILL_PATH, main);
}
