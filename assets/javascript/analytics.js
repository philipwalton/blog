import 'autotrack/lib/plugins/clean-url-tracker';
import 'autotrack/lib/plugins/event-tracker';
import 'autotrack/lib/plugins/impression-tracker';
import 'autotrack/lib/plugins/media-query-tracker';
import 'autotrack/lib/plugins/outbound-link-tracker';
import 'autotrack/lib/plugins/page-visibility-tracker';
import 'autotrack/lib/plugins/url-change-tracker';
import parseUrl from 'dom-utils/lib/parse-url';
import {breakpoints} from './breakpoints';


/**
 * Bump this when making backwards incompatible changes to the tracking
 * implementation. This allows you to create a segment or view filter
 * that isolates only data captured with the most recent tracking changes.
 */
const TRACKING_VERSION = '1';


/**
 * A global list of tracker object, randomized to ensure no one tracker
 * data is always sent first.
 */
const ALL_TRACKERS = shuffleArray([
  {name: 't0', trackingId: 'UA-21292978-1'},
  {name: 'testing', trackingId: 'UA-21292978-3'},
]);


const TEST_TRACKERS = ALL_TRACKERS.filter(({name}) => /test/.test(name));
const NULL_VALUE = '(not set)';


const metrics = {
  PAGE_VISIBLE: 'metric1',
  PAGE_HIDDEN: 'metric2',
  PAGEVIEWS: 'metric3',
};


const dimensions = {
  BREAKPOINT: 'dimension1',
  RESOLUTION: 'dimension2',
  ORIENTATION: 'dimension3',
  HIT_SOURCE: 'dimension4',
  URL_QUERY_PARAMS: 'dimension5',
  METRIC_VALUE: 'dimension6',
  CLIENT_ID: 'dimension7',
  SERVICE_WORKER_REPLAY: 'dimension8',
  SERVICE_WORKER_STATUS: 'dimension9',
  NETWORK_STATUS: 'dimension10',
  WINDOW_ID: 'dimension11',
  VISIBILITY_STATE: 'dimension12',
  HIT_TYPE: 'dimension13',
  HIT_UUID: 'dimension14',
  HIT_TIME: 'dimension15',
  TRACKING_VERSION: 'dimension16',
  PAGE_PATH: 'dimension17',
};


// The command queue proxies.
const gaAll = createGaProxy(ALL_TRACKERS);
const gaTest = createGaProxy(TEST_TRACKERS);


export {metrics, dimensions, gaAll, gaTest};


/**
 * Initializes all the analytics setup. Creates trackers and sets initial
 * values on the trackers.
 */
export function init() {
  createTrackers();
  trackErrors();

  trackCustomDimensions();
  trackNetworkStatusChanges();
  requireAutotrackPlugins();
}


/**
 * Tracks the initial pageload and performance timing data associated with it.
 */
export function trackPageload() {
  sendInitialPageview();
  measureCssBlockTime();
  measureJavaSciptLoadTime();
  measureWebfontPerfAndFailures();
}


/**
 * Tracks a JavaScript error.
 * @param {Error} err The error object to track.
 */
export function trackError(err) {
  gaAll('send', 'event', 'Script', 'error', err.stack || err.toString(), {
    nonInteraction: true,
  });
}


/**
 * Creates the trackers and sets the default transport and tracking
 * version fields. In non-production environments it also logs hits.
 */
function createTrackers() {
  for (let tracker of ALL_TRACKERS) {
    window.ga('create', tracker.trackingId, 'auto', tracker.name, {
      siteSpeedSampleRate: 10
    });
  }

  // Ensures all hits are sent via `navigator.sendBeacon()`.
  // Note: this cannot via the `create` command.
  gaAll('set', 'transport', 'beacon');

  // Log hits in non-production environments.
  if (process.env.NODE_ENV != 'production') {
    gaAll('set', 'sendHitTask', function(model) {
      var paramsToIgnore = ['v', 'did', 't', 'tid', 'ec', 'ea', 'el', 'ev',
          'a', 'z', 'ul', 'de', 'sd', 'sr', 'vp', 'je', 'fl', 'jid'];

      var hitType = model.get('&t');
      var hitPayload = model.get('hitPayload');
      var hit = hitPayload
          .split('&')
          .map(decodeURIComponent)
          .filter((item) => {
            const [param] = item.split('=');
            return !(param.charAt(0) === '_' ||
                paramsToIgnore.indexOf(param) > -1);
          });

      var parts = [model.get('&tid'), hitType];
      if (hitType == 'event') {
        parts = [
          ...parts,
          model.get('&ec'),
          model.get('&ea'),
          model.get('&el'),
        ];
        if (model.get('&ev')) parts.push(model.get('&ev'));
      }

      window['console'].log(...parts, hit);
    });
  }
}


/**
 * Tracks any errors that may have occured on the page prior to analytics being
 * initialized, then adds an event handler to track future errors.
 */
function trackErrors() {
  // Errors that have occurred prior to this script running are stored on
  // the `q` property of the window.onerror function.
  const errorQueue = window.onerror.q || [];

  // Override the temp `onerror()` handler to now send hits to GA.
  window.onerror = (msg, file, line, col, error) => {
    gaAll('send', 'event', {
      eventCategory: 'Script',
      eventAction: 'uncaught error',
      eventLabel: error ? error.stack : `${msg}\n${file}:${line}:${col}`,
      nonInteraction: true,
    });
  };

  // Replay any stored errors in the queue.
  for (let error of errorQueue) {
    window.onerror(...error);
  }
}


/**
 * Sets a default dimension value for all custom dimensions on all trackers.
 */
function trackCustomDimensions() {
  // Sets a default dimension value for all custom dimensions on all trackers.
  // This obviously must be done before setting any other custom dimensions.
  Object.keys(dimensions).forEach((key) => {
    gaAll('set', dimensions[key], NULL_VALUE);
  });

  // Adds tracking of dimensions known at page load time.
  gaTest((tracker) => {
    tracker.set({
      [dimensions.TRACKING_VERSION]: TRACKING_VERSION,
      [dimensions.CLIENT_ID]: tracker.get('clientId'),
      [dimensions.WINDOW_ID]: uuid(),
      [dimensions.SERVICE_WORKER_STATUS]: getServiceWorkerStatus(),
      [dimensions.NETWORK_STATUS]: navigator.onLine ? 'online' : 'offline',
    });
  });

  // Adds tracking to record each the type, time, uuid, and visibility state
  // of each hit immediately before it's sent.
  gaTest((tracker) => {
    const originalBuildHitTask = tracker.get('buildHitTask');
    tracker.set('buildHitTask', (model) => {
      const path = model.get('page') || parseUrl(model.get('location')).path;
      model.set(dimensions.PAGE_PATH, path),

      model.set(dimensions.HIT_TYPE, model.get('hitType'), true);
      model.set(dimensions.HIT_TIME, String(+new Date), true);
      model.set(dimensions.HIT_UUID, uuid(), true);
      model.set(dimensions.VISIBILITY_STATE, document.visibilityState, true);
      originalBuildHitTask(model);
    });
  });
}


/**
 * Sets the network status as a custom dimension on each tracker and adds
 * event listeners to detect future network changes.
 */
function trackNetworkStatusChanges() {
  const updateNetworkStatus = ({type}) => {
    gaTest('set', dimensions.NETWORK_STATUS, type);
    gaTest('send', 'event', 'Network', 'change', type, {
      nonInteraction: true,
    });
  };
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
}


/**
 * Requires select autotrack plugins for each tracker.
 */
function requireAutotrackPlugins() {
  gaAll('require', 'cleanUrlTracker', {
    stripQuery: true,
    queryDimensionIndex: getDefinitionIndex(dimensions.URL_QUERY_PARAMS),
    indexFilename: 'index.html',
    trailingSlash: 'add',
  });
  gaAll('require', 'eventTracker');
  gaAll('require', 'impressionTracker', {elements: ['share']});
  gaAll('require', 'mediaQueryTracker', {
    definitions: [
      {
        name: 'Breakpoint',
        dimensionIndex: getDefinitionIndex(dimensions.BREAKPOINT),
        items: breakpoints,
      },
      {
        name: 'Resolution',
        dimensionIndex: getDefinitionIndex(dimensions.RESOLUTION),
        items: [
          {name: '1x', media: 'all'},
          {name: '1.5x', media: '(-webkit-min-device-pixel-ratio: 1.5), ' +
                                '(min-resolution: 144dpi)'},
          {name: '2x', media: '(-webkit-min-device-pixel-ratio: 2), ' +
                              '(min-resolution: 192dpi)'},
        ],
      },
      {
        name: 'Orientation',
        dimensionIndex: getDefinitionIndex(dimensions.ORIENTATION),
        items: [
          {name: 'landscape', media: '(orientation: landscape)'},
          {name: 'portrait', media: '(orientation: portrait)'},
        ],
      },
    ],
  });
  gaAll('require', 'outboundLinkTracker', {
    events: ['click', 'contextmenu'],
  });
  gaAll('require', 'pageVisibilityTracker', {
    visibleMetricIndex: getDefinitionIndex(metrics.PAGE_VISIBLE),
    hiddenMetricIndex: getDefinitionIndex(metrics.PAGE_HIDDEN),
    heartbeatTimeout: 1,
    sessionTimeout: 30,
    timeZone: 'America/Los_Angeles',
    fieldsObj: {[dimensions.HIT_SOURCE]: 'pageVisibilityTracker'},
    hitFilter: (model) => {
      model.set(dimensions.METRIC_VALUE, String(model.get('eventValue')), true);
      if (model.get('name') == TEST_TRACKERS[0].name &&
          model.get('hitType') == 'pageview') {
        model.set('hitCallback', sendFakePageview, true);
      }
    },
  });
  gaAll('require', 'urlChangeTracker', {
    fieldsObj: {[dimensions.HIT_SOURCE]: 'urlChangeTracker'},
    hitFilter: (model) => {
      if (model.get('name') == TEST_TRACKERS[0].name) {
        model.set('hitCallback', sendFakePageview, true);
      }
    }
  });
}


/**
 * Sends the initial pageview.
 */
function sendInitialPageview() {
  gaAll('send', 'pageview', {[dimensions.HIT_SOURCE]: 'pageload'});
  sendFakePageview();
}


/**
 * Sends an event with the "Pageviews" metric set, as an experiment.
 */
function sendFakePageview() {
  gaTest('send', 'event', 'Fake', 'pageview', NULL_VALUE, {
    [metrics.PAGEVIEWS]: 1
  });
}


/**
 * Tracks the time the CSS stopped blocking rendering.
 */
function measureCssBlockTime() {
  const cssUnblockTime = measureDuration('css:unblock');
  if (cssUnblockTime) {
    // Tracks the amount of time the CSS blocks rendering.
    gaTest('send', 'event', 'CSS', 'unblock', {
      eventLabel: 'local',
      eventValue: cssUnblockTime,
      nonInteraction: true,
      [dimensions.METRIC_VALUE]: String(cssUnblockTime),
    });
  }
}


/**
 * Tracks the point the main JavaScript code was loaded.
 */
function measureJavaSciptLoadTime() {
  const jsExecuteTime = measureDuration('js:execute');
  if (jsExecuteTime) {
    // Tracks the amount of time the JavaScript takes to download and execute.
    gaTest('send', 'event', 'JavaScript', 'execute', {
      eventLabel: 'local',
      eventValue: jsExecuteTime,
      nonInteraction: true,
      [dimensions.METRIC_VALUE]: String(jsExecuteTime),
    });
  }
}


/**
 * Tracks the point at which the webfonts were active as well as whether an
 * error occurred loading them.
 */
function measureWebfontPerfAndFailures() {
  new Promise((resolve, reject) => {
    const loaded = /wf-(in)?active/.exec(document.documentElement.className);
    const success = loaded && !loaded[1]; // No "in" in the capture group.
    if (loaded) {
      success ? resolve() : reject();
    } else {
      const originalAciveCallback = window.WebFontConfig.active;
      window.WebFontConfig.inactive = reject;
      window.WebFontConfig.active = () => {
        originalAciveCallback();
        resolve();
      };
      // In case the webfont.js script failed to load.
      setTimeout(reject, window.WebFontConfig.timeout);
    }
  }).then(() => {
    const fontsActiveTime = measureDuration('fonts:active');
    if (fontsActiveTime) {
      // Tracks the amount of time the web fonts take to activate.
      gaTest('send', 'event', 'Fonts', 'active', {
        eventLabel: 'google',
        eventValue: fontsActiveTime,
        nonInteraction: true,
        [dimensions.METRIC_VALUE]: String(fontsActiveTime),
      });
    }
  }).catch(() => {
    gaTest('send', 'event', 'Fonts', 'error', 'google');
  });
}


/**
 * Measures the time between a PerformanceMark object and a reference time.
 * @param {PerformanceMark} mark The mark to measure duration until.
 * @param {string=} reference The timing reference to measure from.
 * @return {number} The duration in milliseconds.
 */
function measureDuration(mark, reference = 'responseEnd') {
  if (window.__perf) {
    const name = `${reference}:${mark}`;
    performance.clearMeasures(name);
    performance.measure(name, reference, mark);
    const measure = performance.getEntriesByName(name)[0];
    return measure && Math.round(measure.duration);
  }
}


/**
 * Creates a ga() proxy function that calls commands on all but the
 * excluded trackers.
 * @param {Array} trackers an array or objects containing the `name` and
 *     `trackingId` fields.
 * @return {Function} The proxied ga() function.
 */
function createGaProxy(trackers) {
  return (command, ...args) => {
    for (let {name} of trackers) {
      if (typeof command == 'function') {
        window.ga(() => {
          command(window.ga.getByName(name));
        });
      } else {
        window.ga(`${name}.${command}`, ...args);
      }
    }
  };
}



/**
 * Accepts a custom dimension or metric and returns it's numerical index.
 * @param {string} definition The definition string (e.g. 'dimension1').
 * @return {number} The definition index.
 */
function getDefinitionIndex(definition) {
  return +/\d+$/.exec(definition)[0];
}


/**
 * Gets the service worker status. It will be either: 'supported',
 * 'unsupported', or 'controlled'.
 * @return {string} The service worker status.
 */
function getServiceWorkerStatus() {
  return 'serviceWorker' in navigator
    ? (navigator.serviceWorker.controller ? 'controlled' : 'supported')
    : 'unsupported';
}



/**
 * Randomizes array element order in-place using Durstenfeld shuffle algorithm.
 * http://goo.gl/91pjZs
 * @param {Array} array The input array.
 * @return {Array} The randomized array.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}


/*eslint-disable */
// https://gist.github.com/jed/982883
const uuid = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)};
/*eslint-enable */
