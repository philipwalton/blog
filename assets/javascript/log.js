import {getCLS, getFCP, getFID, getLCP, getTTFB} from 'web-vitals';
import {getActiveBreakpoint} from './breakpoints';
import {initialSWState} from './sw-state';
import {uuid} from './uuid';
import {Logger} from './Logger';


/* global CD_BREAKPOINT */ // 'cd1'
/* global CD_PIXEL_DENSITY */ // 'cd2'
/* global CD_HIT_SOURCE */ // 'cd4'
/* global CD_EFFECTIVE_CONNECTION_TYPE */ // 'cd5'
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
/* global CM_LCP */ // 'cm12',
/* global CM_LCP_SAMPLE */ // 'cm13',
/* global CM_CLS */ // 'cm14',
/* global CM_CLS_SAMPLE */ // 'cm15',


/**
 * Bump this when making backwards incompatible changes to the tracking
 * implementation. This allows you to create a segment or view filter
 * that isolates only data captured with the most recent tracking changes.
 */
const TRACKING_VERSION = '63';

export const log = new Logger((params, state) => {
  params[CD_HIT_TIME] = state.time;
  params[CD_VISIBILITY_STATE] = state.visibilityState;
});


const getElementSelector = (el) => {
  let name = el.nodeName.toLowerCase();
  if (el.id) {
    name += `#${el.id}`;
  }
  if (el.className) {
    name += `.${el.className.trim().split(/\s/)[0]}`;
  }
  return name;
};


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

  trackCLS();
  trackFCP();
  trackFID();
  trackLCP();
  trackTTFB();
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

const trackCLS = async () => {
  getCLS(({name, delta}) => {
    const cls = Math.round(delta * 1000);

    log.send('event', {
      ec: 'Web Vitals',
      ea: name,
      ev: cls,
      ni: '1',
      [CM_CLS]: cls,
      [CM_CLS_SAMPLE]: 1,
    });
  });
};

const trackFCP = async () => {
  getFCP(({name, delta}) => {
    const fcp = Math.round(delta);

    log.send('event', {
      ec: 'Web Vitals',
      ea: name,
      ev: fcp,
      ni: '1',
      [CM_FCP]: fcp,
      [CM_FCP_SAMPLE]: 1,
    });
  });
};

const trackFID = async () => {
  getFID(({name, delta, entries}) => {
    const fid = Math.round(delta);

    log.send('event', {
      ec: 'Web Vitals',
      ea: name,
      el: entries[0].name,
      ev: fid,
      ni: '1',
      [CM_FID]: fid,
      [CM_FID_SAMPLE]: 1,
    });
  });
};

const trackLCP = async () => {
  getLCP(({name, delta, entries}) => {
    const {element} = entries[entries.length - 1];
    const lcp = Math.round(delta);

    log.send('event', {
      ec: 'Web Vitals',
      ea: name,
      el: getElementSelector(element),
      ev: lcp,
      ni: '1',
      [CM_LCP]: Math.round(lcp),
      [CM_LCP_SAMPLE]: 1,
    });
  });
};

const trackTTFB = () => {
  getTTFB(({name, delta, entries}) => {
    const ttfb = Math.round(delta);
    const navEntry = entries[0];
    const paramOverrides = {
      ec: 'Web Vitals',
      ea: name,
      ev: ttfb,
      ni: '1',
      [CM_NT_SAMPLE]: 1,
      [CM_REQUEST_START_TIME]: Math.round(navEntry.requestStart),
      [CM_RESPONSE_START_TIME]: ttfb,
      [CM_RESPONSE_END_TIME]: Math.round(navEntry.responseEnd),
      [CM_DOM_LOAD_TIME]: Math.round(navEntry.domContentLoadedEventEnd),
      [CM_WINDOW_LOAD_TIME]: Math.round(navEntry.loadEventEnd),
    };
    if (initialSWState === 'controlled' && 'workerStart' in navEntry) {
      paramOverrides[CM_WORKER_START_TIME] = Math.round(navEntry.workerStart);
    }
    log.send('event', paramOverrides);
  });
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
