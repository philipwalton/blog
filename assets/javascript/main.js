import alerts from './alerts';
import * as analytics from './analytics';
import contentLoader from './content-loader';
import drawer from './drawer';


alerts.init();
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
}
