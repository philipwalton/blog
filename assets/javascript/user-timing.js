import {dimensions, gaTest} from './analytics';


export function mark(name) {
  if (window.__perf) {
    performance.mark(name);
  }
}


export function measure(name, start, end) {
  if (window.__perf) {
    performance.measure(name, start, end);
  }
}


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
