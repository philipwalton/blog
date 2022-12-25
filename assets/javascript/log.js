import {
  onCLS,
  onFCP,
  onFID,
  onINP,
  onLCP,
  onTTFB,
} from 'web-vitals/attribution';
import {Logger} from './Logger';
import {initialSWState} from './sw-state';
import {now, timeOrigin} from './utils/performance';
import {uuid} from './utils/uuid';

/**
 * Bump this when making backwards incompatible changes to the tracking
 * implementation. This allows you to create a segment or view filter
 * that isolates only data captured with the most recent tracking changes.
 */
const MEASUREMENT_VERSION = 91;

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

  // Start FCP monitoring first, so its the first event to be logged.
  trackFCP();

  // Then start all the other metrics.
  trackCLS();
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
    native_beacon: 'PendingPostBeacon' in self,
    time_origin: timeOrigin,
    page_id: PAGE_ID,
    pageshow_count: 1,
    original_page_path: originalPathname,
  });

  const navigationEntry = performance.getEntriesByType('navigation')[0];
  if (navigationEntry) {
    // Use kebab case.
    let navigationType = navigationEntry.type.replace(/_/g, '-');

    if (document.prerendering || navigationEntry.activationStart > 0) {
      navigationType = 'prerender';
    }

    if (document.wasDiscarded) {
      navigationType = 'restore';
    }

    log.set({navigation_type: navigationType});
  }
};

let pageshowCount = 1;
const trackPageviews = () => {
  log.event('page_view', {visibility_state: document.visibilityState});

  addEventListener(
    'pageshow',
    (event) => {
      if (event.persisted) {
        pageshowCount++;

        log.set({
          navigation_type: 'back-forward-cache',
          pageshow_count: pageshowCount,
        });
        log.event('page_view', {visibility_state: document.visibilityState});
      }
    },
    true
  );
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
  log.event(
    'error',
    Object.assign(
      {
        error_name: err.name || '(no error name)',
        error_message: `${err.stack || err.message || '(no stack trace)'}`,
      },
      paramOverrides
    )
  );
};

/**
 * Tracks any errors that may have occurred on the page prior to analytics being
 * initialized, then adds an event handler to track future errors.
 */
const trackErrors = () => {
  // Errors that have occurred prior to this script running are stored on
  // `window.__e.q`, as specified in `index.html`.
  const loadErrorEvents = (window.__e && window.__e.q) || [];

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

const trackCLS = async () => {
  onCLS(
    (metric) => {
      log.event(metric.name, {
        value: metric.delta,
        metric_rating: metric.rating,
        metric_value: metric.value,
        debug_target: metric.attribution.largestShiftTarget
          ? metric.attribution.largestShiftTarget
          : '(not set)',
        event_id: metric.id,
      });
    },
    {reportAllChanges: true}
  );
};

const trackFCP = async () => {
  onFCP(
    (metric) => {
      log.event(metric.name, {
        value: metric.delta,
        metric_rating: metric.rating,
        metric_value: metric.value,
        original_page_path: originalPathname,
        debug_ttfb: metric.attribution.timeToFirstByte,
        debug_fb2fcp: metric.attribution.firstByteToFCP,
        event_id: metric.id,
      });
    },
    {reportAllChanges: true}
  );
};

const trackFID = async () => {
  onFID(
    (metric) => {
      log.event(metric.name, {
        value: metric.delta,
        metric_rating: metric.rating,
        metric_value: metric.value,
        debug_target: metric.attribution.eventTarget || '(not set)',
        debug_event: metric.attribution.eventType,
        debug_time: metric.attribution.eventTime,
        event_id: metric.id,
      });
    },
    {reportAllChanges: true}
  );
};

const trackINP = async () => {
  onINP(
    (metric) => {
      const entry = metric.attribution.eventEntry;

      log.event(metric.name, {
        value: metric.delta,
        metric_rating: metric.rating,
        metric_value: metric.value,
        debug_target: metric.attribution.eventTarget || '(not set)',
        debug_event: metric.attribution.eventType,
        debug_time: metric.attribution.eventTime,
        debug_delay: entry && entry.processingStart - entry.startTime,
        debug_processing: entry && entry.processingEnd - entry.processingStart,
        debug_presentation:
          entry && entry.startTime + metric.value - entry.processingEnd,
        event_id: metric.id,
      });
    },
    {durationThreshold: 16, reportAllChanges: true}
  );
};

const trackLCP = async () => {
  onLCP(
    (metric) => {
      log.event(metric.name, {
        value: metric.delta,
        metric_rating: metric.rating,
        metric_value: metric.value,
        debug_target: metric.attribution.element || '(not set)',
        debug_url: metric.attribution.url,
        debug_ttfb: metric.attribution.timeToFirstByte,
        debug_rld: metric.attribution.resourceLoadDelay,
        debug_rlt: metric.attribution.resourceLoadTime,
        debug_erd: metric.attribution.elementRenderDelay,
        debug_tbt: getTBT(0, metric.value),
        debug_rbt: getLTT(
          metric.value - metric.attribution.elementRenderDelay,
          metric.value
        ),
        event_id: metric.id,
      });
    },
    {reportAllChanges: true}
  );
};

const trackTTFB = () => {
  onTTFB(
    (metric) => {
      const params = {
        value: metric.delta,
        metric_value: metric.value,
        metric_rating: metric.rating,
        event_id: metric.id,
      };

      const {navigationEntry} = metric.attribution;
      if (navigationEntry) {
        Object.assign(params, {
          fetch_start: navigationEntry.fetchStart,
          domain_lookup_start: navigationEntry.domainLookupStart,
          domain_lookup_end: navigationEntry.domainLookupEnd,
          connect_start: navigationEntry.connectStart,
          connect_end: navigationEntry.connectEnd,
          request_start: navigationEntry.requestStart,
          response_start: navigationEntry.responseStart,
          response_end: navigationEntry.responseEnd,
          dom_load_end: navigationEntry.domContentLoadedEventEnd,
          window_load_end: navigationEntry.loadEventEnd,
        });
      }

      if (initialSWState === 'controlled' && 'workerStart' in navigationEntry) {
        params.worker_start = navigationEntry.workerStart;
      }

      if (navigationEntry.activationStart > 0) {
        params.activation_start = navigationEntry.activationStart;
      }

      if (Array.isArray(navigationEntry.serverTiming)) {
        for (const {name, description} of navigationEntry.serverTiming) {
          params[name] = description;
        }
      }
      log.event(metric.name, params);
    },
    {reportAllChanges: true}
  );
};
