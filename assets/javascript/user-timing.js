import {dimensions, gaTest} from './analytics';


/**
 * Creates a PerformanceMark entry if the browser supports it.
 * @param {string} name The mark name.
 */
export function mark(name) {
  if (window.__perf) {
    performance.mark(name);
  }
}


/**
 * Creates a PerformanceMeasure entry if the browser supports it.
 * @param {string} name The measure name.
 * @param {string} startMark The start mark entry name.
 * @param {string} endMark The end mark entry name.
 */
export function measure(name, startMark, endMark) {
  if (window.__perf) {
    performance.measure(name, startMark, endMark);
  }
}


/**
 * Accepts a PerformanceMeasure entry name and tracks the duration of the
 * measure along with the passed fields.
 * @param {string} name The PerformanceMeasure name.
 * @param {Object} fieldsObj The analytics.js fields object.
 */
export function track(name, fieldsObj) {
  if (window.__perf) {
    const entries = performance.getEntriesByName(name).slice(-1);
    const lastEntry = entries[entries.length - 1];
    if (lastEntry) {
      const duration = Math.round(lastEntry.duration);
      gaTest('send', 'event', {
        eventValue: duration,
        [dimensions.METRIC_VALUE]: duration,
        ...fieldsObj,
      });
    }
  }
}
