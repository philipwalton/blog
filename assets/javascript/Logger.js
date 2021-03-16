import {parseUrl} from 'dom-utils';
import {getActiveBreakpoint} from './breakpoints';
import {initialSWState} from './sw-state';
import {get, set} from './utils/kv-store';
import {timeOrigin} from './utils/performance';
import {round} from './utils/round.js';
import {getVisibilityState, onHidden, onVisible} from './utils/visibility.js';
import {uuid} from './utils/uuid';



// Bump this version any time the cloud function logic changes
// in a backward-incompatible way.
const LOG_VERSION = 2;


const SEND_TIMEOUT = 5000;

/**
 * A class to manage building and sending analytics hits to the `/log` route.
 */
export class Logger {
  /**
   * @param {function(Object):void} hitFilter
   */
  constructor(hitFilter) {
    this._hitFilter = hitFilter;
    this._presendDependencies = [];
    this._eventQueue = [];

    this._pageParams = {
      dl: location.href,
      dt: document.title,
      de: document.characterSet,
      ul: navigator.language.toLowerCase(),
      vp: `${innerWidth}x${innerHeight}`,
      sr: `${screen.width}x${screen.height}`,
      sd: `${screen.colorDepth}-bit`,
      dr: getReferrer(),
    };

    this._userParams = prefixParams('u', {
      breakpoint: getActiveBreakpoint().name,
      effective_connection_type: getEffectiveConnectionType(),
      pixel_density: getPixelDensity(),
      service_worker_state: initialSWState,
    });

    // Add the initial values known at instantiation time.
    this._eventParams = {
      page_path: location.pathname,
    };

    this.awaitBeforeSending(this._setClientId());

    onHidden(() => this._send());
  }

  /**
   * @param {Promise} promise
   */
  awaitBeforeSending(promise) {
    this._presendDependencies.push(promise);
  }

  /**
   * @param {Object} params
   */
  set(params) {
    Object.assign(this._eventParams, params);
  }

  /**
   * @param {string} hitType
   * @param {Object} paramOverrides
   * @return {Promise<void>}
   */
  async event(eventName, paramOverrides = {}) {
    if (this._presendDependencies.length) {
      await Promise.all(this._presendDependencies);
      this._presendDependencies = [];
    }

    const params = {...this._eventParams, ...paramOverrides};
    if (this._hitFilter) {
      Object.assign(params, this._hitFilter(params));
    }

    this._eventQueue.push({
      en: eventName,
      ...prefixParams('e', params),
    });

    if (getVisibilityState() === 'hidden') {
      this._send();
    } else {
      this._sendTimeout = setTimeout(() => this._send(), SEND_TIMEOUT);
    }
  }

  /**
   * Sends all queued event data to the log endpoint and resets the queue.
   */
  async _send() {
    clearTimeout(this._sendTimeout);
    if (this._eventQueue.length > 0) {
      const path = [
        `/log?v=${LOG_VERSION}`,
        toQueryString(this._pageParams),
        toQueryString(this._userParams),
      ].join('&');

      const body = this._eventQueue.map((ep) => toQueryString(ep)).join('\n');

      // Use `navigator.sendBeacon()` if available, with a fallback to `fetch()`
      (navigator.sendBeacon && navigator.sendBeacon(path, body)) ||
          fetch(path, {body, method: 'POST', keepalive: true});

      this._eventQueue = [];
    }
  }

  /**
   * @return {Promise<void>}
   */
  async _setClientId() {
    this._pageParams.cid = await getOrCreateClientId();
  }
}

/**
 * Accepts a letter prefix and an object of param/value pairs and returns a
 * new object where every param is prefixed with `_p.` or `_pn.` (for number
 * values).
 * @param {string} initialLetter
 * @param {Object} unprefixedParams
 * @return {Object}
 */
function prefixParams(initialLetter, unprefixedParams) {
  const prefixedParams = {};
  for (const [key, value] of Object.entries(unprefixedParams)) {
    const prefix = initialLetter + (typeof value === 'number' ? 'pn.' : 'p.');
    prefixedParams[prefix + key] =
        typeof value === 'number' ? round(value, 3) : value;
  }
  return prefixedParams;
}


/**
 * Accepts and object of param/value pairs and returns a query string
 * representation of the object with all values URL-encoded.
 * @param {Object} params
 * @return {string}
 */
function toQueryString(params) {
  return Object.keys(params).map((key) => {
    return `${key}=${encodeURIComponent(params[key])}`;
  }).join('&');
}


/**
 * @return {Promise<string>}
 */
async function getOrCreateClientId() {
  try {
    return await get('clientId') || await set('clientId', uuid(timeOrigin));
  } catch (error) {
    return uuid(timeOrigin);
  }
}

/**
 * @return {Promise<string>}
 */
function getReferrer() {
  const referrer = document.referrer;
  if (parseUrl(referrer).hostname !== parseUrl(location.href).hostname) {
    return referrer;
  } else {
    return '';
  }
}

/**
 * Gets the effective connection type information if available.
 * @return {string}
 */
function getEffectiveConnectionType() {
  return navigator.connection &&
      navigator.connection.effectiveType || '(unknown)';
}

/**
 * Returns the currently-active pixel density.
 * @return {string}
 */
function getPixelDensity() {
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
}
