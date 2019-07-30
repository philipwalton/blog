import {IdleQueue} from 'idlize/IdleQueue.mjs';
import {getActiveBreakpoint} from './breakpoints';
import {timeOrigin} from './performance';
import {initialSWState} from './sw-state';


// Initialize the command queue in case analytics.js hasn't loaded yet.
// https://developers.google.com/analytics/devguides/collection/analyticsjs/
// eslint-disable-next-line
window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};


/**
 * Bump this when making backwards incompatible changes to the tracking
 * implementation. This allows you to create a segment or view filter
 * that isolates only data captured with the most recent tracking changes.
 */
const TRACKING_VERSION = '55';


/**
 * The property ID for philipwalton.com
 */
const TRACKING_ID = 'UA-21292978-1';


// A queue to ensure all analytics tasks to run when idle.
const queue = new IdleQueue({
  defaultMinTaskTime: 40, // Only run if there's lots of time left.
  ensureTasksRun: true,
});


/**
 * A wrapper function for the global `ga()` provided by analytics.js that
 * runs all commands via an IdleQueue.
 * @param {...*} args
 */
export const ga = (...args) => {
  queue.pushTask(() => window.ga(...args));
};


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
};


/**
 * A mapping between custom dimension names and their indexes.
 */
export const metrics = {
  FCP: 'metric1',
  FCP_SAMPLE: 'metric2',
  NT_SAMPLE: 'metric3',
  DOM_LOAD_TIME: 'metric4',
  WINDOW_LOAD_TIME: 'metric5',
  REQUEST_START_TIME: 'metric6',
  RESPONSE_END_TIME: 'metric7',
  RESPONSE_START_TIME: 'metric8',
  WORKER_START_TIME: 'metric9',
  FID: 'metric10',
  FID_SAMPLE: 'metric11',
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


const preSendDependencies = [];
export const addPreSendDependency = (dependency) => {
  preSendDependencies.push(dependency);
};


/**
 * Initializes all the analytics setup. Creates trackers and sets initial
 * values on the trackers.
 */
export const init = async () => {
  createTracker();
  trackErrors();
  trackCustomDimensions();

  // presend dependencies
  await Promise.all(preSendDependencies);

  ga('send', 'pageview', {[dimensions.HIT_SOURCE]: 'navigation'});

  if (window.__wasAlwaysVisible) {
    trackFcp();
    trackFid();
    trackNavigationTimingMetrics();
  }
};


/**
 * Creates the trackers and sets the default transport and tracking
 * version fields. In non-production environments it also logs hits.
 */
const createTracker = () => {
  ga('create', TRACKING_ID, 'auto', {siteSpeedSampleRate: 0});

  // Ensures all hits are sent via `navigator.sendBeacon()`.
  ga('set', 'transport', 'beacon');

  // Set the page field and ignore any search params.
  ga('set', 'page', location.pathname);

  // Log hits in development.
  if (process.env.NODE_ENV !== 'production') {
    ga((tracker) => {
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

        const parts = [hitType];
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
  ga('send', 'event', Object.assign({
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
  // Set a default dimension value for all custom dimensions to ensure
  // that every dimension in every hit has *some* value. This is necessary
  // because Google Analytics will drop rows with empty dimension values
  // in your reports.
  const dimensionsObj = {};
  Object.keys(dimensions).forEach((key) => {
    dimensionsObj[dimensions[key]] = NULL_VALUE;
  });
  ga('set', dimensionsObj);

  // Add tracking of dimensions known at page load time.
  ga((tracker) => {
    tracker.set({
      [dimensions.BREAKPOINT]: getActiveBreakpoint().name,
      [dimensions.PIXEL_DENSITY]: getPixelDensity(),
      [dimensions.TRACKING_VERSION]: TRACKING_VERSION,
      [dimensions.CLIENT_ID]: tracker.get('clientId'),
      [dimensions.WINDOW_ID]: uuid(),
      [dimensions.SERVICE_WORKER_STATE]: initialSWState,
      [dimensions.EFFECTIVE_CONNECTION_TYPE]: getEffectiveConnectionType(),
    });
  });

  // Add tracking to record each the type, time, uuid, and visibility state
  // of each hit immediately before it's sent.
  ga((tracker) => {
    const originalBuildHitTask = tracker.get('buildHitTask');

    tracker.set('buildHitTask', (model) => {
      const hitType = model.get('hitType');
      model.set(dimensions.HIT_ID, uuid(), true);
      model.set(dimensions.HIT_TYPE, hitType, true);

      // Use the visibilityState at task queue time if available.
      const visibilityState = (queue.getState() || document).visibilityState;
      model.set(dimensions.VISIBILITY_STATE, visibilityState, true);
      model.set(dimensions.HIT_TIME, `${+new Date}`, true);

      originalBuildHitTask(model);
    });
  });
};


const trackFcp = () => {
  if (window.PerformancePaintTiming) {
    const reportFcpIfAvailable = async (entriesList) => {
      const fcpEntry = entriesList.getEntriesByName(
          'first-contentful-paint', 'paint')[0];

      if (fcpEntry) {
        ga('send', 'event', {
          eventCategory: 'Performance',
          eventAction: 'first-contentful-paint',
          eventLabel: NULL_VALUE,
          nonInteraction: true,
          [metrics.FCP]: Math.round(fcpEntry.startTime),
          [metrics.FCP_SAMPLE]: 1,
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

    ga('send', 'event', {
      eventCategory: 'Performance',
      eventAction: 'first-input-delay',
      eventLabel: event.type,
      eventValue: delayInMs,
      nonInteraction: true,
      [metrics.FID]: delayInMs,
      [metrics.FID_SAMPLE]: 1,
      [dimensions.METRIC_VALUE]: event.timeStamp,
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
          eventCategory: 'Performance',
          eventAction: 'navigation',
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
          fieldsObj[metrics.WORKER_START_TIME] = Math.round(nt.workerStart);
        }
        ga('send', 'event', fieldsObj);
      }
    }
  }
};

/**
 * Gets the effective connection type information if available.
 * @return {string}
 */
const getEffectiveConnectionType = () => navigator.connection &&
    navigator.connection.effectiveType || NULL_VALUE;


const getPixelDensity = () => {
  const densities = [
    ['1x', 'all'],
    ['1.5x', '(-webkit-min-device-pixel-ratio: 1.5),(min-resolution: 144dpi)'],
    ['2x', '(-webkit-min-device-pixel-ratio: 2),(min-resolution: 192dpi)'],
  ];
  let activeDensity;
  for (const [density, query] of densities) {
    if (window.matchMedia(query).matches) {
      activeDensity = density;
    }
  }
  return activeDensity;
};


/**
 * Performantly generate a unique, 27-char string by combining the current
 * timestamp with a 13-digit random number.
 * @return {string}
 */
const uuid = () => {
  return `${Date.now()}-${Math.floor(Math.random() * (9e12 - 1)) + 1e12}`;
};
