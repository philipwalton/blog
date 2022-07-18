import {onCLS, onFCP, onFID, onINP, onLCP, onTTFB} from 'web-vitals/attribution';
import {Logger} from './Logger';
import {initialSWState} from './sw-state';
import {now, timeOrigin} from './utils/performance';
import {uuid} from './utils/uuid';

/**
 * Bump this when making backwards incompatible changes to the tracking
 * implementation. This allows you to create a segment or view filter
 * that isolates only data captured with the most recent tracking changes.
 */
const MEASUREMENT_VERSION = 88;

/**
 * A 13-digit, random identifier for the current page.
 * This value, combined with the time origin can provide an even more
 * unique value. Furthermore, this value, combined with the time origin and
 * the pageshow count can provide a unique ID for the page visit.
 */
const PAGE_ID = uuid(timeOrigin);

const originalPathname = location.pathname;


const longTasks = [];

const clampLongTasks = (start, end) => {
  const clampedLongTasks = [];
  for (const task of longTasks) {
    const taskStart = task.startTime;
    const taskEnd = task.startTime + task.duration;

    if (start <= taskEnd && end >= taskStart) {
      clampedLongTasks.push([
        Math.max(start, taskStart),
        Math.min(end, taskEnd),
      ]);
    }
  }
  return clampedLongTasks;
};

const getTBT = (start, end) => {
  let tbt = 0;

  for (const task of clampLongTasks(start, end)) {
    const taskDuration = task[1] - task[0];
    tbt += Math.max(0, taskDuration - 50);
  }
  return tbt;
};

const getLTT = (start, end) => {
  let ltt = 0;

  for (const task of clampLongTasks(start, end)) {
    ltt += task[1] - task[0];
  }
  return ltt;
};


export const log = new Logger((params) => {
  return {
    page_time: now(),
    event_id: params.event_id || uuid(),
  };
});


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
  trackINP();
  trackLCP();
  trackTTFB();

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTasks.push(entry);
      }
    }).observe({type: 'longtask', buffered: true});
  } catch (err) {
    // Do nothing...
  }
};

const setInitialParams = () => {
  log.set({
    measurement_version: MEASUREMENT_VERSION,
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
  log.event('page_view', {visibility_state: document.visibilityState});

  addEventListener('pageshow', (event) => {
    if (event.persisted) {
      pageshowCount++;

      log.set({
        navigation_type: 'bfcache_restore',
        pageshow_count: pageshowCount,
      });
      log.event('page_view', {visibility_state: document.visibilityState});
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
    error_message: `${err.stack || err.message || '(no stack trace)'}`,
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
    // Some browsers don't have an error property, so we fake it.
    const err = event.error || {
      message: `${event.message} (${event.lineno}:${event.colno})`,
    };
    trackError(err, {
      error_name: err.name || 'UncaughtError',
    });
  };

  // Replay any stored load error events.
  for (const event of loadErrorEvents) {
    trackErrorEvent(event);
  }

  // Add a new listener to track event immediately.
  window.addEventListener('error', trackErrorEvent);

  // Remove the old listener.
  window.removeEventListener('error', window.__e);
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
  onCLS(({name, value, delta, id, attribution}) => {
    log.event(name, {
      value: delta,
      metric_rating: getRating(value, [0.1, 0.25]),
      metric_value: value,
      debug_target: attribution.largestShiftTarget ?
          attribution.largestShiftTarget : '(not set)',
      event_id: id,
    });
  });
};

const trackFCP = async () => {
  onFCP(({name, value, delta, id, attribution}) => {
    log.event(name, {
      value: delta,
      metric_rating: getRating(value, [1800, 3000]),
      metric_value: value,
      original_page_path: originalPathname,
      debug_ttfb: attribution.timeToFirstByte,
      debug_fb2fcp: attribution.firstByteToFCP,
      event_id: id,
    });
  });
};

const trackFID = async () => {
  onFID(({name, value, delta, id, attribution}) => {
    log.event(name, {
      value: delta,
      metric_rating: getRating(value, [100, 300]),
      metric_value: value,
      debug_target: attribution.eventTarget || '(not set)',
      debug_event: attribution.eventType,
      debug_time: attribution.eventTime,
      event_id: id,
    });
  });
};

const trackINP = async () => {
  onINP(({name, value, delta, id, attribution}) => {
    const entry = attribution.eventEntry;

    log.event(name, {
      value: delta,
      metric_rating: getRating(value, [200, 500]),
      metric_value: value,
      debug_target: attribution.eventTarget || '(not set)',
      debug_event: attribution.eventType,
      debug_time: attribution.eventTime,
      debug_delay: entry && (entry.processingStart - entry.startTime),
      debug_processing: entry && (entry.processingEnd - entry.processingStart),
      debug_presentation: entry &&
          ((entry.startTime + value) - entry.processingEnd),
      event_id: id,
    });
  }, {durationThreshold: 16});
};

const trackLCP = async () => {
  onLCP(({name, value, delta, id, attribution}) => {
    log.event(name, {
      value: delta,
      metric_rating: getRating(value, [2500, 4000]),
      metric_value: value,
      debug_target: attribution.element || '(not set)',
      debug_url: attribution.url,
      debug_ttfb: attribution.timeToFirstByte,
      debug_rld: attribution.resourceLoadDelay,
      debug_rlt: attribution.resourceLoadTime,
      debug_erd: attribution.elementRenderDelay,
      debug_tbt: getTBT(0, value),
      debug_rbt: getLTT(value - attribution.elementRenderDelay, value),
      event_id: id,
    });
  });
};

const trackTTFB = () => {
  onTTFB(({name, value, entries, id}) => {
    const navEntry = entries[0];
    const params = {
      value: value,
      metric_value: value,
      fetch_start: navEntry.fetchStart,
      domain_lookup_start: navEntry.domainLookupStart,
      domain_lookup_end: navEntry.domainLookupEnd,
      connect_start: navEntry.connectStart,
      connect_end: navEntry.connectEnd,
      request_start: navEntry.requestStart,
      response_start: value,
      response_end: navEntry.responseEnd,
      dom_load_end: navEntry.domContentLoadedEventEnd,
      window_load_end: navEntry.loadEventEnd,
      event_id: id,
    };
    if (initialSWState === 'controlled' && 'workerStart' in navEntry) {
      params.worker_start = navEntry.workerStart;
    }
    if (Array.isArray(navEntry.serverTiming)) {
      for (const {name, description} of navEntry.serverTiming) {
        params[name] = description;
      }
    }
    log.event(name, params);
  });
};
