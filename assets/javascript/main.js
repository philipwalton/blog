import alerts from './alerts';
import * as analytics from './analytics';
import contentLoader from './content-loader';
import drawer from './drawer';


const POLYFILL_PATH = '/assets/javascript/polyfills.js';


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


window.main = function() {
  alerts.init();
  contentLoader.init();
  drawer.init();
};


function supportsAllRequiredApis() {
  return window.Promise && window.fetch && window.Symbol;
}


function loadPolyfills() {
  var js = document.createElement('script');
  var fjs = document.getElementsByTagName('script')[0];
  js.src = POLYFILL_PATH;
  fjs.parentNode.insertBefore(js, fjs);
}


if (supportsAllRequiredApis()) {
  window.main();
} else {
  loadPolyfills();
}
