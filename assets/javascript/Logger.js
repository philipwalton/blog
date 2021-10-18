import {parseUrl} from 'dom-utils';
import {getActiveBreakpoint} from './breakpoints';
import {initialSWState} from './sw-state';
import {get, set} from './utils/kv-store';
import {timeOrigin} from './utils/performance';
import {round} from './utils/round.js';
import {onHidden, onVisible} from './utils/visibility.js';
import {uuid} from './utils/uuid';


// Bump this version any time the cloud function logic changes
// in a backward-incompatible way.
const LOG_VERSION = 3;


const SESSION_TIMEOUT = 1000 * 60 * 30; // 30 minutes.


const SEND_TIMEOUT = 5000;

// Managing separately is required until the following bug (currently fixed)
// is actually released in Safari stable (currently only in STP):
// https://bugs.webkit.org/show_bug.cgi?id=151234
let visibilityState;

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
      _p: Math.floor(Math.random() * 1e9),
      _s: 0,
    };

    this._userParams = prefixParams('u', {
      breakpoint: getActiveBreakpoint().name,
      connection_type: getEffectiveConnectionType(),
      pixel_density: getPixelDensity(),
      service_worker_state: initialSWState,
      user_agent: navigator.userAgent,
    });

    // Add the initial values known at instantiation time.
    this._eventParams = {
      page_path: location.pathname,
    };

    this.awaitBeforeSending(this._setClientId());
    this.awaitBeforeSending(this._updateSessionInfo(true));

    if (!visibilityState) {
      visibilityState = document.visibilityState;
      onHidden(() => visibilityState = 'hidden');
      onVisible(() => visibilityState = 'visible');
    }

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
    const params = {...this._eventParams, ...paramOverrides};
    if (this._hitFilter) {
      Object.assign(params, this._hitFilter(params));
    }

    if (this._presendDependencies.length) {
      await Promise.all(this._presendDependencies);
      this._presendDependencies = [];
    }

    this._eventQueue.push({
      en: eventName,
      ...prefixParams('e', params),
    });

    if (visibilityState === 'hidden') {
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
      // Update the session timestamp after hits are sent.
      // Do not await. It's OK if this fails for some reason.
      this._updateSessionInfo();

      this._pageParams._s++;

      const path = `/log?v=${LOG_VERSION}`;
      const body =
          toQueryString(this._pageParams) + '&' +
          toQueryString(this._userParams) + '\n' +
          this._eventQueue.map((ep) => toQueryString(ep)).join('\n');

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
    try {
      this._pageParams.cid =
          await get('clientId') || await set('clientId', uuid(timeOrigin));
    } catch (error) {
      this._pageParams.cid = uuid(timeOrigin);
    }
  }

  /**
   * @return {Promise<void>}
   */
  async _updateSessionInfo(isInitialLoad) {
    const time = Date.now();
    let sessionInfo = {sct: 1, seg: 0, sid: time, _et: time};

    try {
      const storedSessionInfo = await get('sessionInfo');

      if (storedSessionInfo) {
        sessionInfo = storedSessionInfo;
        const isSessionExpired = time - sessionInfo._et > SESSION_TIMEOUT;

        // If the previous session has expired, start a new one.
        // Otherwise, if this is the initial load, mark the session engaged.
        if (isSessionExpired) {
          sessionInfo.seg = 0;
          sessionInfo.sid = time;
          sessionInfo.sct++;
        } else if (isInitialLoad) {
          sessionInfo.seg = 1;
        }

        // Update the session time to the current time.
        sessionInfo._et = time;
      }
    } catch (error) {
      // Do nothing...
    }

    // Update the stored sessionInfo data but don't await
    set('sessionInfo', sessionInfo);

    const {sid, sct, seg} = sessionInfo;
    Object.assign(this._pageParams, {sid, sct, seg});
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
