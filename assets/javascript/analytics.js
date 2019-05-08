import TrackerQueue from 'autotrack/lib/tracker-queue';
import 'autotrack/lib/plugins/clean-url-tracker';
import 'autotrack/lib/plugins/event-tracker';
import 'autotrack/lib/plugins/impression-tracker';
import 'autotrack/lib/plugins/max-scroll-tracker';
import 'autotrack/lib/plugins/media-query-tracker';
import 'autotrack/lib/plugins/outbound-link-tracker';
import 'autotrack/lib/plugins/page-visibility-tracker';
import 'autotrack/lib/plugins/url-change-tracker';
import {breakpoints} from './breakpoints';
import {fireperf} from './fireperf';
import {now, timeOrigin} from './performance';
import {initialSWState} from './sw-state';


/* global ga */


/**
 * Bump this when making backwards incompatible changes to the tracking
 * implementation. This allows you to create a segment or view filter
 * that isolates only data captured with the most recent tracking changes.
 */
const TRACKING_VERSION = '52';


/**
 * A global list of tracker object.
 */
const ALL_TRACKERS = [
  {name: 'prod', trackingId: 'UA-21292978-1'},
  {name: 'test', trackingId: 'UA-21292978-3'},
];


/**
 * Just the trackers with a name matching `test`.
 */
const TEST_TRACKERS = ALL_TRACKERS.filter(({name}) => /test/.test(name));


/**
 * A default value for dimensions so unset values always are reported as
 * something. This is needed since Google Analytics will drop empty dimension
 * values in reports.
 */
export const NULL_VALUE = '(not set)';


/**
 * A mapping between custom dimension names and their indexes.
 */
export const dimensions = {
  BREAKPOINT: 'dimension1',
  PIXEL_DENSITY: 'dimension2',
  SITE_VERSION: 'dimension3',
  HIT_SOURCE: 'dimension4',
  EFFECTIVE_CONNECTION_TYPE: 'dimension5',
  METRIC_VALUE: 'dimension6',
  CLIENT_ID: 'dimension7',
  SERVICE_WORKER_REPLAY: 'dimension8',
  SERVICE_WORKER_STATE: 'dimension9',
  CACHE_HIT: 'dimension10',
  WINDOW_ID: 'dimension11',
  VISIBILITY_STATE: 'dimension12',
  HIT_TYPE: 'dimension13',
  HIT_ID: 'dimension14',
  HIT_TIME: 'dimension15',
  TRACKING_VERSION: 'dimension16',
  TIME_ORIGIN: 'dimension17',
  PAGE_TIME: 'dimension18',
  QUEUE_TIME: 'dimension19',
  FIRST_INPUT_EVENT: 'dimension20',
};


/**
 * A mapping between custom dimension names and their indexes.
 */
export const metrics = {
  PAGE_VISIBLE: 'metric1',
  MAX_SCROLL_PERCENTAGE: 'metric2',
  SHARE_IMPRESSIONS: 'metric3',
  DOM_LOAD_TIME: 'metric4',
  WINDOW_LOAD_TIME: 'metric5',
  RESPONSE_END_TIME: 'metric6',
  PAGE_LOADS: 'metric7',
  NT_SAMPLE: 'metric8',
  FCP: 'metric9',
  FCP_SAMPLE: 'metric10',
  FID: 'metric11',
  FID_SAMPLE: 'metric12',
  // FID_OT: 'metric13',
  // FID_SAMPLE_OT: 'metric14',
  // FIL_OT: 'metric15',
  SW_START_TIME: 'metric16',
  RESPONSE_START_TIME: 'metric17',
  REQUEST_START_TIME: 'metric18',
};


const whenWindowLoaded = new Promise((resolve) => {
  if (document.readyState === 'complete') {
    resolve();
  } else {
    addEventListener('load', function f() {
      resolve();
      removeEventListener('load', f);
    });
  }
});


let wasEverHidden = document.visibilityState === 'hidden';
addEventListener('visibilitychange', function f() {
  if (document.visibilityState === 'hidden') {
    wasEverHidden = true;
    removeEventListener('visibilitychange', f, true);
  }
}, true);


/**
 * Creates a ga() proxy function that calls commands on all passed trackers.
 * @param {!Array} trackers an array or objects containing the `name` and
 *     `trackingId` fields.
 * @return {!Function} The proxied ga() function.
 */
const createGaProxy = (trackers) => {
  return (command, ...args) => {
    trackers.forEach(({name, trackingId}) => {
      TrackerQueue.getOrCreate(trackingId).pushTask(() => {
        if (typeof command == 'function') {
          ga(() => {
            command(ga.getByName(name));
          });
        } else {
          if (command == 'create') {
            ga('create', Object.assign(
                {}, args[args.length - 1], {name, trackingId}));
          } else {
            ga(`${name}.${command}`, ...args);
          }
        }
      });
    });
  };
};


/**
 * Command queue proxies.
 */
export const gaAll = createGaProxy(ALL_TRACKERS);
export const gaTest = createGaProxy(TEST_TRACKERS);


const preSendDependencies = [];
export const addPreSendDependency = (dependency) => {
  preSendDependencies.push(dependency);
};


/**
 * Initializes all the analytics setup. Creates trackers and sets initial
 * values on the trackers.
 */
export const init = async () => {
  // Initialize the command queue in case analytics.js hasn't loaded yet.
  // https://developers.google.com/analytics/devguides/collection/analyticsjs/
  // eslint-disable-next-line
  window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;

  createTrackers();
  trackErrors();
  trackCustomDimensions();

  // presend dependencies
  await Promise.all(preSendDependencies);

  requireAutotrackPlugins();
  trackFcp();
  trackFid();
  trackNavigationTimingMetrics();
};


/**
 * Creates the trackers and sets the default transport and tracking
 * version fields. In non-production environments it also logs hits.
 */
const createTrackers = () => {
  gaAll('create', {cookieDomain: 'auto', siteSpeedSampleRate: 10});

  // Ensures all hits are sent via `navigator.sendBeacon()`.
  gaAll('set', 'transport', 'beacon');

  // Log hits in development.
  if (process.env.NODE_ENV !== 'production') {
    gaAll((tracker) => {
      const originalSendHitTask = tracker.get('sendHitTask');
      tracker.set('sendHitTask', (model) => {
        originalSendHitTask(model);

        const paramsToIgnore = ['v', 'did', 't', 'tid', 'ec', 'ea', 'el', 'ev',
            'a', 'z', 'ul', 'de', 'sd', 'sr', 'vp', 'je', 'fl', 'jid'];

        const hitType = model.get('&t');
        const hitPayload = model.get('hitPayload');
        const hit = hitPayload
            .split('&')
            .map(decodeURIComponent)
            .filter((item) => {
              const [param] = item.split('=');
              return !(param.charAt(0) === '_' ||
                  paramsToIgnore.indexOf(param) > -1);
            });

        const parts = [model.get('&tid'), hitType];
        if (hitType == 'event') {
          parts.push(model.get('&ec'), model.get('&ea'), model.get('&el'));
          if (model.get('&ev')) {
            parts.push(model.get('&ev'));
          }
        }

        // eslint-disable-next-line no-console
        console.log(...parts, hit);
      });
    });
  }
};


/**
 * Tracks a JavaScript error with optional fields object overrides.
 * This function is exported so it can be used in other parts of the codebase.
 * E.g.:
 *
 *    `fetch('/api.json').catch(trackError);`
 *
 * @param {*=} err
 * @param {FieldsObj=} fieldsObj
 */
export const trackError = (err = {}, fieldsObj = {}) => {
  gaAll('send', 'event', Object.assign({
    eventCategory: 'Error',
    eventAction: err.name || '(no error name)',
    eventLabel: `${err.message}\n${err.stack || '(no stack trace)'}`,
    nonInteraction: true,
  }, fieldsObj));
};


/**
 * Tracks any errors that may have occurred on the page prior to analytics being
 * initialized, then adds an event handler to track future errors.
 */
const trackErrors = () => {
  // Errors that have occurred prior to this script running are stored on
  // `window.__e.q`, as specified in `index.html`.
  const loadErrorEvents = window.__e && window.__e.q || [];

  const trackErrorEvent = (event) => {
    // Use a different eventCategory for uncaught errors.
    /** @type {FieldsObj} */
    const fieldsObj = {eventCategory: 'Uncaught Error'};

    // Some browsers don't have an error property, so we fake it.
    const err = event.error || {
      message: `${event.message} (${event.lineno}:${event.colno})`,
    };

    trackError(err, fieldsObj);
  };

  // Replay any stored load error events.
  for (const event of loadErrorEvents) {
    trackErrorEvent(event);
  }

  // Add a new listener to track event immediately.
  window.addEventListener('error', trackErrorEvent);
};


/**
 * Sets a default dimension value for all custom dimensions on all trackers.
 */
const trackCustomDimensions = () => {
  // Sets a default dimension value for all custom dimensions to ensure
  // that every dimension in every hit has *some* value. This is necessary
  // because Google Analytics will drop rows with empty dimension values
  // in your reports.
  const dimensionsObj = {};
  Object.keys(dimensions).forEach((key) => {
    dimensionsObj[dimensions[key]] = NULL_VALUE;
  });
  gaAll('set', dimensionsObj);

  // Adds tracking of dimensions known at page load time.
  gaTest((tracker) => {
    tracker.set({
      [dimensions.TRACKING_VERSION]: TRACKING_VERSION,
      [dimensions.CLIENT_ID]: tracker.get('clientId'),
      [dimensions.WINDOW_ID]: uuid(),
      [dimensions.SERVICE_WORKER_STATE]: initialSWState,
      [dimensions.EFFECTIVE_CONNECTION_TYPE]: getEffectiveConnectionType(),
      [dimensions.TIME_ORIGIN]: timeOrigin,
    });
  });

  // Adds tracking to record each the type, time, uuid, and visibility state
  // of each hit immediately before it's sent.
  gaTest((tracker) => {
    const originalBuildHitTask = tracker.get('buildHitTask');
    const queue = TrackerQueue.getOrCreate(tracker.get('trackingId'));

    tracker.set('buildHitTask', (model) => {
      const hitType = model.get('hitType');
      model.set(dimensions.HIT_ID, uuid(), true);
      model.set(dimensions.HIT_TYPE, hitType, true);
      model.set(dimensions.PAGE_TIME, now(), true);

      // Use the visibilityState at task queue time if available.
      const visibilityState = (queue.getState() || document).visibilityState;
      model.set(dimensions.VISIBILITY_STATE, visibilityState, true);

      const qt = model.get('queueTime') || 0;
      model.set(dimensions.HIT_TIME, String(new Date - qt), true);

      if (qt) {
        model.set(dimensions.QUEUE_TIME, qt, true);
      }

      // TODO(philipwalton): temporary fix to address an analytics.js bug where
      // custom metrics on the initial pageview are added to timing hits.
      if (hitType == 'timing') {
        model.set(metrics.PAGE_LOADS, undefined, true);
      }

      originalBuildHitTask(model);
    });
  });
};


/**
 * Requires select autotrack plugins for each tracker.
 */
const requireAutotrackPlugins = () => {
  gaAll('require', 'cleanUrlTracker', {
    stripQuery: true,
    indexFilename: 'index.html',
    trailingSlash: 'add',
  });
  gaAll('require', 'eventTracker');
  gaAll('require', 'impressionTracker', {
    elements: ['share'],
    hitFilter: (model) => {
      model.set(metrics.SHARE_IMPRESSIONS, 1, true);
    },
  });
  gaAll('require', 'maxScrollTracker', {
    timeZone: 'America/Los_Angeles',
    maxScrollMetricIndex: getDefinitionIndex(metrics.MAX_SCROLL_PERCENTAGE),
  });
  gaAll('require', 'mediaQueryTracker', {
    definitions: [
      {
        name: 'Breakpoint',
        dimensionIndex: getDefinitionIndex(dimensions.BREAKPOINT),
        items: breakpoints,
      },
      {
        name: 'Pixel Density',
        dimensionIndex: getDefinitionIndex(dimensions.PIXEL_DENSITY),
        items: [
          {name: '1x', media: 'all'},
          {name: '1.5x', media: '(-webkit-min-device-pixel-ratio: 1.5), ' +
                                '(min-resolution: 144dpi)'},
          {name: '2x', media: '(-webkit-min-device-pixel-ratio: 2), ' +
                              '(min-resolution: 192dpi)'},
        ],
      },
    ],
  });
  gaAll('require', 'outboundLinkTracker', {
    events: ['click', 'auxclick', 'contextmenu'],
  });
  gaAll('require', 'pageVisibilityTracker', {
    sendInitialPageview: true,
    pageLoadsMetricIndex: getDefinitionIndex(metrics.PAGE_LOADS),
    visibleMetricIndex: getDefinitionIndex(metrics.PAGE_VISIBLE),
    timeZone: 'America/Los_Angeles',
    fieldsObj: {[dimensions.HIT_SOURCE]: 'pageVisibilityTracker'},
  });
  gaAll('require', 'urlChangeTracker', {
    fieldsObj: {[dimensions.HIT_SOURCE]: 'urlChangeTracker'},
  });
};


const trackFcp = () => {
  if (window.PerformancePaintTiming) {
    const reportFcpIfAvailable = async (entriesList) => {
      const fcpEntry = entriesList.getEntriesByName(
          'first-contentful-paint', 'paint')[0];

      if (fcpEntry) {
        gaTest('send', 'event', {
          eventCategory: 'PW Metrics',
          eventAction: 'FCP',
          eventLabel: wasEverHidden ? 'hidden' : 'visible',
          nonInteraction: true,
          [metrics.FCP]: Math.round(fcpEntry.startTime),
          [metrics.FCP_SAMPLE]: 1,
        });

        gaTest((tracker) => {
          const attributes = {
            cacheHit: tracker.get(dimensions.CACHE_HIT),
            wasEverHidden: String(wasEverHidden),
          };

          const fcp2 = fireperf.trace('FCP2');
          fcp2.record(timeOrigin, fcpEntry.startTime, {attributes});
        });
      } else {
        new PerformanceObserver((list, observer) => {
          observer.disconnect();
          reportFcpIfAvailable(list);
        }).observe({entryTypes: ['paint']});
      }
    };
    reportFcpIfAvailable(window.performance);
  }
};

const trackFid = () => {
  window.perfMetrics.onFirstInputDelay((delay, event) => {
    const delayInMs = Math.round(delay);

    gaTest('send', 'event', {
      eventCategory: 'PW Metrics',
      eventAction: 'FID',
      eventLabel: event.type,
      eventValue: delayInMs,
      nonInteraction: true,
      [metrics.FID]: delayInMs,
      [metrics.FID_SAMPLE]: 1,
      [dimensions.METRIC_VALUE]: event.timeStamp,
    });

    const trace = fireperf.trace('FID2');

    // Some browsers report event timestamps in epoch time.
    const startTime = event.timeStamp > 1e12 ?
        event.timeStamp : event.timeStamp + timeOrigin;

    trace.record(startTime, delay, {
      attributes: {eventType: event.type},
    });
  });
};


/**
 * Gets the DOM and window load times and sends them as custom metrics to
 * Google Analytics via an event hit.
 */
const trackNavigationTimingMetrics = async () => {
  // Only track performance in supporting browsers.
  if (window.performance &&
      window.performance.timing &&
      window.performance.getEntriesByType) {
    await whenWindowLoaded;

    let nt = performance.getEntriesByType('navigation')[0];

    // Fall back to the performance timeline in browsers that don't
    // support Navigation Timing Level 2.
    if (!nt) {
      const pt = performance.timing;
      nt = {
        workerStart: 0,
        requestStart: pt.requestStart - timeOrigin,
        responseStart: pt.responseStart - timeOrigin,
        responseEnd: pt.responseEnd - timeOrigin,
        domContentLoadedEventStart: pt.domContentLoadedEventStart - timeOrigin,
        loadEventStart: pt.loadEventStart - timeOrigin,
      };
    }

    if (nt) {
      const requestStart = Math.round(nt.requestStart);
      const responseStart = Math.round(nt.responseStart);
      const responseEnd = Math.round(nt.responseEnd);
      const domLoaded = Math.round(nt.domContentLoadedEventStart);
      const windowLoaded = Math.round(nt.loadEventStart);

      // In some edge cases browsers return very obviously incorrect NT values,
      // e.g. negative or future times. This validates values before sending.
      const allValuesAreValid = (...values) => {
        return values.every((value) => value >= 0 && value < 6e6);
      };

      if (allValuesAreValid(
          requestStart, responseStart, responseEnd, domLoaded, windowLoaded)) {
        const fieldsObj = {
          eventCategory: 'Navigation Timing',
          eventAction: 'track',
          eventLabel: NULL_VALUE,
          nonInteraction: true,
          [metrics.NT_SAMPLE]: 1,
          [metrics.REQUEST_START_TIME]: requestStart,
          [metrics.RESPONSE_START_TIME]: responseStart,
          [metrics.RESPONSE_END_TIME]: responseEnd,
          [metrics.DOM_LOAD_TIME]: domLoaded,
          [metrics.WINDOW_LOAD_TIME]: windowLoaded,
        };
        if (initialSWState === 'controlled' && 'workerStart' in nt) {
          fieldsObj[metrics.SW_START_TIME] = Math.round(nt.workerStart);
        }
        gaTest('send', 'event', fieldsObj);

        gaTest((tracker) => {
          const attributes = {cacheHit: dimensions.CACHE_HIT};

          const ttfb = fireperf.trace('Time to First Byte');
          ttfb.record(timeOrigin, responseStart, {attributes});

          const ttlb = fireperf.trace('Response End');
          ttlb.record(timeOrigin, responseEnd, {attributes});
        });
      }
    }
  }
};


/**
 * Gets the effective connection type information if available.
 * @return {string}
 */
const getEffectiveConnectionType = () => {
  return navigator.connection &&
      navigator.connection.effectiveType || NULL_VALUE;
};


/**
 * Accepts a custom dimension or metric and returns it's numerical index.
 * @param {string} definition The definition string (e.g. 'dimension1').
 * @return {number} The definition index.
 */
const getDefinitionIndex = (definition) => +/\d+$/.exec(definition)[0];


/**
 * Generates a UUID.
 * https://gist.github.com/jed/982883
 * @param {string|undefined=} a
 * @return {string}
 */
const uuid = function b(a) {
  return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) :
      ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b);
};
