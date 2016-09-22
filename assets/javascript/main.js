import alerts from './alerts';
import * as analytics from './analytics';
import * as breakpoints from './breakpoints';
import contentLoader from './content-loader';
import drawer from './drawer';


const POLYFILL_PATH = '/assets/javascript/polyfills.js';


function main() {
  alerts.init();
  breakpoints.init();
  contentLoader.init();
  drawer.init();

  // Delays running any analytics or registering the service worker
  // to ensure the don't compete for load resources.
  window.onload = function() {
    analytics.init();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
          .register('/sw.js')
          .catch(analytics.trackError);
    }
  };
};


function browserSupportsAllFeatures() {
  return window.Promise && window.fetch && window.Symbol;
}


function loadScript(src, callback) {
  var js = document.createElement('script');
  var fjs = document.getElementsByTagName('script')[0];
  js.src = src;
  js.onload = callback;
  fjs.parentNode.insertBefore(js, fjs);
}


if (browserSupportsAllFeatures()) {
  main();
} else {
  loadScript(POLYFILL_PATH, main);
}
