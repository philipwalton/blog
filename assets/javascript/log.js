import {getCLS, getFCP, getFID, getLCP, getTTFB} from 'web-vitals/base';
import {Logger} from './Logger';
import {initialSWState} from './sw-state';
import {now, timeOrigin} from './utils/performance';
import {uuid} from './utils/uuid';


/**
 * Bump this when making backwards incompatible changes to the tracking
 * implementation. This allows you to create a segment or view filter
 * that isolates only data captured with the most recent tracking changes.
 */
const TRACKING_VERSION = 70;

/**
 * A 13-digit, random identifier for the current page.
 * This value, combined with the time origin can provide an even more
 * unique value. Furthermore, this value, combined with the time origin and
 * the pageshow count can provide a unique ID for the page visit.
 */
const PAGE_ID = uuid(timeOrigin);

const originalPathname = location.pathname;

export const log = new Logger(() => ({
  page_time: now(),
  visibility_state: document.visibilityState,
}));

const getSelector = (node, max = 100) => {
  let sel = '';
  try {
    while (node && node.nodeType !== 9) {
      const part = node.nodeName.toLowerCase() + (node.id ?
          '#' + node.id : (node.className && node.className.length) ?
          '.' + Array.from(node.classList.values()).join('.') : '');
      if (sel.length + part.length > max - 1) return sel || part;
      sel = sel ? part + '>' + sel : part;
      if (node.id) break;
      node = node.parentNode;
    }
  } catch (err) {
    // Do nothing...
  }
  return sel;
};

/**
 * Initializes all the analytics setup. Creates trackers and sets initial
 * values on the trackers.
 */
export const init = async () => {
  setInitialParams();

  trackErrors();
  trackPageviews();

  trackCLS();
  trackFCP();
  trackFID();
  trackLCP();
  trackTTFB();
};


const setInitialParams = () => {
  log.set({
    measurement_version: TRACKING_VERSION,
    time_origin: timeOrigin,
    page_id: PAGE_ID,
    pageshow_count: 1,
    original_page_path: originalPathname,
  });

  const navigationEntry = performance.getEntriesByType('navigation')[0];
  if (navigationEntry) {
    log.set({navigation_type: navigationEntry.type});
  }
};

let pageshowCount = 1;
const trackPageviews = () => {
  log.event('page_view');

  addEventListener('pageshow', (event) => {
    if (event.persisted) {
      pageshowCount++;

      log.set({
        navigation_type: 'bfcache_restore',
        pageshow_count: pageshowCount,
      });
      log.event('page_view');
    }
  }, true);
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
  log.event('error', Object.assign({
    error_name: err.name || '(no error name)',
    error_message: `${err.message}\n${err.stack || '(no stack trace)'}`,
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
    const paramOverrides = {error_name: 'UncaughtError'};

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


const getRating = (value, thresholds) => {
  if (value > thresholds[1]) {
    return 'poor';
  }
  if (value > thresholds[0]) {
    return 'ni';
  }
  return 'good';
};

const trackCLS = async () => {
  getCLS(({name, value, delta, entries}) => {
    const eventData = {
      value: delta,
      metric_rating: getRating(value, [0.1, 0.25]),
      metric_value: value,
      metric_delta: delta,
      debug_target: '(not set)', // May be overridden below.
    };

    if (entries.length) {
      const largestShift = entries.reduce((a, b) => {
        return a && a.value > b.value ? a : b;
      });
      if (largestShift && largestShift.sources) {
        const largestSource = largestShift.sources.reduce((a, b) => {
          return a.node && a.previousRect.width * a.previousRect.height >
              b.previousRect.width * b.previousRect.height ? a : b;
        });
        if (largestSource) {
          eventData.debug_target = getSelector(largestSource.node);
        }
      }
    }

    log.event(name, eventData);
  });
};

const trackFCP = async () => {
  getFCP(({name, value, delta}) => {
    log.event(name, {
      value: delta,
      metric_rating: getRating(value, [1800, 3000]),
      metric_value: value,
      metric_delta: delta,
      original_page_path: originalPathname,
    });
  });
};

const trackFID = async () => {
  getFID(({name, value, delta, entries}) => {
    const entry = entries[0];

    log.event(name, {
      value: delta,
      metric_rating: getRating(value, [100, 300]),
      metric_value: value,
      metric_delta: delta,
      debug_target: entry ? getSelector(entry.target) : '(not set)',
      debug_event: entry ? entry.name : '(not set)',
    });
  });
};

const trackLCP = async () => {
  getLCP(({name, value, delta, entries}) => {
    const element = entries.length && entries[entries.length - 1].element;

    log.event(name, {
      value: delta,
      metric_rating: getRating(value, [2500, 4000]),
      metric_value: value,
      metric_delta: delta,
      debug_target: element ? getSelector(element) : '(not set)',
    });
  });
};

const trackTTFB = () => {
  getTTFB(({name, value, entries}) => {
    const navEntry = entries[0];
    const params = {
      value: value,
      request_start: navEntry.requestStart,
      response_start: value,
      response_end: navEntry.responseEnd,
      dom_load_end: navEntry.domContentLoadedEventEnd,
      window_load_end: navEntry.loadEventEnd,
    };
    if (initialSWState === 'controlled' && 'workerStart' in navEntry) {
      params.worker_start = navEntry.workerStart;
    }
    log.event(name, params);
  });
};
