import {getActiveBreakpoint} from './breakpoints';
import {timeOrigin} from './performance';
import {initialSWState} from './sw-state';
import {uuid} from './uuid';
import {Logger} from './Logger';

/* global CD_BREAKPOINT */ // 'cd1'
/* global CD_PIXEL_DENSITY */ // 'cd2'
/* global CD_HIT_SOURCE */ // 'cd4'
/* global CD_EFFECTIVE_CONNECTION_TYPE */ // 'cd5'
/* global CD_METRIC_VALUE */ // 'cd6'
/* global CD_SERVICE_WORKER_STATE */ // 'cd9'
/* global CD_WINDOW_ID */ // 'cd11'
/* global CD_VISIBILITY_STATE */ // 'cd12'
/* global CD_HIT_TIME */ // 'cd15'
/* global CD_TRACKING_VERSION */ // 'cd16'

/* global CM_FCP */ // 'cm1',
/* global CM_FCP_SAMPLE */ // 'cm2',
/* global CM_NT_SAMPLE */ // 'cm3',
/* global CM_DOM_LOAD_TIME */ // 'cm4',
/* global CM_WINDOW_LOAD_TIME */ // 'cm5',
/* global CM_REQUEST_START_TIME */ // 'cm6',
/* global CM_RESPONSE_END_TIME */ // 'cm7',
/* global CM_RESPONSE_START_TIME */ // 'cm8',
/* global CM_WORKER_START_TIME */ // 'cm9',
/* global CM_FID */ // 'cm10',
/* global CM_FID_SAMPLE */ // 'cm11',


/**
 * Bump this when making backwards incompatible changes to the tracking
 * implementation. This allows you to create a segment or view filter
 * that isolates only data captured with the most recent tracking changes.
 */
const TRACKING_VERSION = '60';

export const log = new Logger((params, state) => {
  params[CD_HIT_TIME] = state.time;
  params[CD_VISIBILITY_STATE] = state.visibilityState;
});


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


/**
 * Initializes all the analytics setup. Creates trackers and sets initial
 * values on the trackers.
 */
export const init = async () => {
  log.set({
    [CD_BREAKPOINT]: getActiveBreakpoint().name,
    [CD_PIXEL_DENSITY]: getPixelDensity(),
    [CD_TRACKING_VERSION]: TRACKING_VERSION,
    // [CD_CLIENT_ID]: log.get('cid'), // TODO: set on the server.
    [CD_WINDOW_ID]: uuid(),
    [CD_SERVICE_WORKER_STATE]: initialSWState,
  });

  const effectiveConnectionType = getEffectiveConnectionType();
  if (effectiveConnectionType) {
    log.set({[CD_EFFECTIVE_CONNECTION_TYPE]: effectiveConnectionType});
  }

  trackErrors();

  log.send('pageview', {[CD_HIT_SOURCE]: 'navigation'});

  if (window.__wasAlwaysVisible) {
    trackFcp();
    trackFid();
    trackNavigationTimingMetrics();
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
 * @param {ParamOverrides=} paramOverrides
 */
export const trackError = (err = {}, paramOverrides = {}) => {
  log.send('event', Object.assign({
    ec: 'Error',
    ev: err.name || '(no error name)',
    el: `${err.message}\n${err.stack || '(no stack trace)'}`,
    ni: '1',
  }, paramOverrides));
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
    // Use a different `ec` value for uncaught errors.
    const paramOverrides = {ec: 'Uncaught Error'};

    // Some browsers don't have an error property, so we fake it.
    const err = event.error || {
      message: `${event.message} (${event.lineno}:${event.colno})`,
    };

    trackError(err, paramOverrides);
  };

  // Replay any stored load error events.
  for (const event of loadErrorEvents) {
    trackErrorEvent(event);
  }

  // Add a new listener to track event immediately.
  window.addEventListener('error', trackErrorEvent);
};


const trackFcp = () => {
  if (window.PerformancePaintTiming) {
    const reportFcpIfAvailable = async (entriesList) => {
      const fcpEntry = entriesList.getEntriesByName(
          'first-contentful-paint', 'paint')[0];

      if (fcpEntry) {
        log.send('event', {
          ec: 'Performance',
          ea: 'first-contentful-paint',
          ni: '1',
          [CM_FCP]: Math.round(fcpEntry.startTime),
          [CM_FCP_SAMPLE]: 1,
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

    log.send('event', {
      ec: 'Performance',
      ea: 'first-input-delay',
      el: event.type,
      ev: delayInMs,
      ni: '1',
      [CM_FID]: delayInMs,
      [CM_FID_SAMPLE]: 1,
      [CD_METRIC_VALUE]: event.timeStamp,
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
        const paramOverrides = {
          ec: 'Performance',
          ea: 'navigation',
          ni: '1',
          [CM_NT_SAMPLE]: 1,
          [CM_REQUEST_START_TIME]: requestStart,
          [CM_RESPONSE_START_TIME]: responseStart,
          [CM_RESPONSE_END_TIME]: responseEnd,
          [CM_DOM_LOAD_TIME]: domLoaded,
          [CM_WINDOW_LOAD_TIME]: windowLoaded,
        };
        if (initialSWState === 'controlled' && 'workerStart' in nt) {
          paramOverrides[CM_WORKER_START_TIME] = Math.round(nt.workerStart);
        }
        log.send('event', paramOverrides);
      }
    }
  }
};

/**
 * Gets the effective connection type information if available.
 * @return {string}
 */
const getEffectiveConnectionType = () => {
  return navigator.connection && navigator.connection.effectiveType;
};


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
