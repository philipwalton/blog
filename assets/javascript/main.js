import * as alerts from './alerts';
import * as analytics from './analytics';
import * as breakpoints from './breakpoints';
import * as contentLoader from './content-loader';
import * as drawer from './drawer';


const POLYFILL_PATH = '/assets/javascript/polyfills.js';


/**
 * The main script entry point for the site. Initalizes all the sub modules
 * analytics tracking, and the service worker.
 * @param {Error=} err Present if an error occurred loading the polyfills.
 */
function main(err = undefined) {
  alerts.init();
  breakpoints.init();
  contentLoader.init();
  drawer.init();

  analytics.init();
  if (err) {
    analytics.trackError(err);
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => analytics.trackError(err));
  }
}


/**
 * The primary site feature detect. Determines whether polyfills are needed.
 * @return {boolean} True if the browser supports all required features and
 *     no polyfills are needed.
 */
function browserSupportsAllFeatures() {
  return !!(Object.assign && window.Promise && window.fetch);
}


/**
 * Creates a new `<script>` element for the passed `src`, and invokes the
 * passed callback once done.
 * @param {string} src The src attribute for the script.
 * @param {!Function<?Error>} done A callback to be invoked once the script has
 *     loaded, if an error occurs loading the script the function is invoked
 *     with the error object.
 */
function loadScript(src, done) {
  const js = document.createElement('script');
  js.src = src;
  js.onload = () => done();
  js.onerror = () => done(new Error('Failed to load script ' + src));
  document.head.appendChild(js);
}


if (browserSupportsAllFeatures()) {
  main();
} else {
  loadScript(POLYFILL_PATH, main);
}
