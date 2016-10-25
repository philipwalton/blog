import 'autotrack/lib/plugins/clean-url-tracker';
import 'autotrack/lib/plugins/event-tracker';
import 'autotrack/lib/plugins/impression-tracker';
import 'autotrack/lib/plugins/media-query-tracker';
import 'autotrack/lib/plugins/outbound-link-tracker';
import 'autotrack/lib/plugins/page-visibility-tracker';
import 'autotrack/lib/plugins/url-change-tracker';
import {breakpoints} from './breakpoints';


import {
  getStoredData,
  getStoredTrackerData,
  setStoredData,
  setStoredTrackerData,
} from './analytics-storage';


/**
 * A global list of tracker object, randomized to ensure no one tracker
 * data is always sent first.
 */
const ALL_TRACKERS = shuffleArray([
  {name: 't0', trackingId: 'UA-21292978-1'},
  {name: 'testing', trackingId: 'UA-21292978-3'},
]);


const PROD_TRACKERS = ALL_TRACKERS.filter(({name}) => !/test/.test(name));
const TEST_TRACKERS = ALL_TRACKERS.filter(({name}) => /test/.test(name));
const NULL_VALUE = '(not set)';


const metrics = {
  PAGE_VISIBLE: 'metric1',
  PAGE_HIDDEN: 'metric2',
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
  HIT_INDEX: 'dimension11',
  PREVIOUS_HIT_PAYLOAD: 'dimension12',
  HIT_TYPE: 'dimension13',
  HIT_UUID: 'dimension14',
  HIT_TIME: 'dimension15',
  PAGELOAD_ID: 'dimension16',
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

  setDefaultDimensionValues();
  requirePlugins();
  trackClientId();
  trackServiceWorkerStatus();
  trackNetworkStatus();
  trackPageloadId();

  initSessionControl();
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
  gaAll('send', 'event', 'Script', 'error', err.stack || err.toString());
}


/**
 * Creates the trackers and stores the users client ID to localStorage.
 */
function createTrackers() {
  const fields = {siteSpeedSampleRate: 10};
  const data = getStoredData();
  for (let tracker of PROD_TRACKERS) {
    window.ga('create', tracker.trackingId, 'auto', tracker.name, fields);
  }
  window.ga(function() {
    const firstTracker = window.ga.getAll()[0];
    data.clientId = firstTracker.get('clientId') || data.clientId;
    setStoredData(data);

    for (let tracker of TEST_TRACKERS) {
      if (data.clientId) fields.clientId = data.clientId;
      if (window.localStorage) fields.storage = 'none';
      window.ga('create', tracker.trackingId, 'auto', tracker.name, fields);
    }
  });
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
  window.onerror = function(msg, file, line, col, error) {
    gaAll('send', 'event', {
      eventCategory: 'Script',
      eventAction: 'uncaught error',
      eventLabel: error ? error.stack : `${msg}\n${file}:${line}:${col}`,
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
function setDefaultDimensionValues() {
  Object.keys(dimensions).forEach((key) => {
    gaAll('set', dimensions[key], NULL_VALUE);
  });
}


/**
 * Requires select autotrack plugins for each tracker.
 */
function requirePlugins() {
  gaAll('require', 'cleanUrlTracker', {
    stripQuery: true,
    queryDimensionIndex: getDefinitionIndex(dimensions.URL_QUERY_PARAMS),
    indexFilename: 'index.html',
    trailingSlash: 'add',
  });
  gaAll('require', 'eventTracker');
  gaAll('require', 'impressionTracker', {
    elements: [{
      id: 'share',
      trackFirstImpressionOnly: false,
    }],
    hitFilter: (function() {
      let page = null;
      return function hitFilter(model) {
        if (page == model.get('page')) {
          // Throw to abort hit since an impression for this page
          // was already tracked.
          throw new Error();
        } else {
          page = model.get('page');
        }
      };
    }()),
  });
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
    fieldsObj: {
      nonInteraction: null, // Ensure all events are interactive.
      [dimensions.HIT_SOURCE]: 'pageVisibilityTracker',
    },
    hitFilter: function(model) {
      model.set(dimensions.METRIC_VALUE, String(model.get('eventValue')), true);
    },
  });
  gaAll('require', 'urlChangeTracker', {
    fieldsObj: {[dimensions.HIT_SOURCE]: 'urlChangeTracker'},
  });
}


/**
 * Sets the client ID as a custom dimension on each tracker.
 */
function trackClientId() {
  gaAll(function(tracker) {
    const clientId = tracker.get('clientId');
    tracker.set(dimensions.CLIENT_ID, clientId);
  });
}


/**
 * Sets the service worker status as a custom dimension on each tracker.
 */
function trackServiceWorkerStatus() {
  const serviceWorkerStatus = 'serviceWorker' in navigator
    ? (navigator.serviceWorker.controller ? 'controlled' : 'supported')
    : 'unsupported';

  // Note: the service worker may start controlling the page at some point
  // after the initial page load, but since we're primarily concerned with
  // what the status was at initial load, we don't listen for changes.
  gaTest('set', dimensions.SERVICE_WORKER_STATUS, serviceWorkerStatus);
}


/**
 * Sets the network status as a custom dimension on each tracker and adds
 * event listeners to detect future network changes.
 */
function trackNetworkStatus() {
  gaTest('set', dimensions.NETWORK_STATUS,
      navigator.onLine ? 'online' : 'offline');

  const updateNetworkStatus = ({type}) => {
    gaTest('set', dimensions.NETWORK_STATUS, type);
    gaTest('send', 'event', 'Network', 'change', type);
  };

  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
}


/**
 * Tracks a unique ID per unique page load. This help distinguish hits from
 * multiple tabs open at the same time.
 */
function trackPageloadId() {
  gaTest('set', dimensions.PAGELOAD_ID, uuid());
}


/**
 * Adds tracking to record each hit type, time, index,
 * and unique identifier to better detect missing hits.
 */
function initSessionControl() {
  gaTest(function(tracker) {
    const originalBuildHitTask = tracker.get('buildHitTask');
    const originalSendHitTask = tracker.get('sendHitTask');

    tracker.set('buildHitTask', function(model) {
      const name = tracker.get('name');
      const trackerData = getStoredTrackerData(name);

      model.set(dimensions.HIT_TYPE, model.get('hitType'), true);
      model.set(dimensions.HIT_INDEX, String(trackerData.index || 0), true);
      model.set(dimensions.HIT_TIME, String(+new Date), true);
      model.set(dimensions.HIT_UUID, uuid(), true);

      if (trackerData.payload) {
        model.set(dimensions.PREVIOUS_HIT_PAYLOAD, trackerData.payload, true);
      }

      originalBuildHitTask(model);
    });

    tracker.set('sendHitTask', function(model) {
      const name = tracker.get('name');
      const hitTime = model.get(dimensions.HIT_TIME);
      const trackerData = getStoredTrackerData(name);
      trackerData.index = (trackerData.index || 0) + 1;
      trackerData.time = hitTime;
      trackerData.payload = serializeHit(model);
      setStoredTrackerData(name, trackerData);

      originalSendHitTask(model);
    });
  });
}


/**
 * Sends the initial pageview.
 */
function sendInitialPageview() {
  gaAll('send', 'pageview', {[dimensions.HIT_SOURCE]: 'pageload'});
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
  new Promise(function(resolve, reject) {
    const loaded = /wf-(in)?active/.exec(document.documentElement.className);
    const success = loaded && !loaded[1]; // No "in" in the capture group.
    if (loaded) {
      success ? resolve() : reject();
    } else {
      const originalAciveCallback = window.WebFontConfig.active;
      window.WebFontConfig.inactive = reject;
      window.WebFontConfig.active = function() {
        originalAciveCallback();
        resolve();
      };
      // In case the webfont.js script failed to load.
      setTimeout(reject, window.WebFontConfig.timeout);
    }
  }).then(function() {
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
  }).catch(function() {
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
  return function(command, ...args) {
    for (let {name} of trackers) {
      if (typeof command == 'function') {
        window.ga(function() {
          command(window.ga.getByName(name));
        });
      } else {
        window.ga(`${name}.${command}`, ...args);
      }
    }
  };
}


/**
 * Takes a tracker model and extracts the most interesting fields into a
 * serialized string.
 * @param {Object} model The tracker model.
 * @return {string} The serialized model string.
 */
function serializeHit(model) {
  const hit = {
    hitType: model.get('hitType'),
    page: model.get('page'),
  };

  const hitSource = model.get(dimensions.HIT_SOURCE);
  if (hitSource && hitSource != NULL_VALUE) hit.hitSource = hitSource;

  if (hit.hitType == 'event') {
    hit.eventCategory = model.get('eventCategory');
    hit.eventAction = model.get('eventAction');
    hit.eventLabel = model.get('eventLabel');
  }

  hit.hitUuid = model.get(dimensions.HIT_UUID);
  hit.hitTime = model.get(dimensions.HIT_TIME);

  return Object.keys(hit)
      .map((key) => `${key}=${decodeURIComponent(hit[key])}`).join('&');
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
