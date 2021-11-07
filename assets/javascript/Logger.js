import {parseUrl} from 'dom-utils';
import {getActiveBreakpoint} from './breakpoints';
import {initialSWState} from './sw-state';
import {get, set} from './utils/kv-store';
import {now, timeOrigin} from './utils/performance';
import {round} from './utils/round.js';
import {onHidden, onVisible} from './utils/visibility.js';
import {uuid} from './utils/uuid';


// Bump this version any time the cloud function logic changes
// in a backward-incompatible way.
const LOG_VERSION = 3;


const SESSION_TIMEOUT = 1000 * 60 * 30; // 30 minutes.


const SEND_TIMEOUT = self.__ENV__ === 'production' ? 5000 : 1000;

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
    if (!visibilityState) {
      visibilityState = document.visibilityState;
      onHidden(() => visibilityState = 'hidden', true);
      onVisible(() => visibilityState = 'visible', true);
    }

    this._hitFilter = hitFilter;
    this._presendDependencies = [];
    this._eventQueue = [];
    this._requestCount = 0;
    this._lastActiveTime = 0;
    this._engagedTime = 0;
    this._state = null;

    this._pageParams = {
      dl: location.href,
      dt: document.title.replace(/\s+—.*$/, ''),
      de: document.characterSet,
      ul: navigator.language.toLowerCase(),
      vp: `${innerWidth}x${innerHeight}`,
      sr: `${screen.width}x${screen.height}`,
      sd: `${screen.colorDepth}-bit`,
      dr: getReferrer(),
      _p: Math.floor(Math.random() * 1e9),
      _s: 0,
    };

    const userParams = {
      breakpoint: getActiveBreakpoint().name,
      connection_type: getEffectiveConnectionType(),
      pixel_density: getPixelDensity(),
      service_worker_state: initialSWState,
    };
    if (self.__x) {
      userParams.experiment = self.__x;
    }
    this._userParams = prefixParams('u', userParams);

    // Add the initial values known at instantiation time.
    this._eventParams = {
      page_path: location.pathname,
    };

    this.awaitBeforeSending(this._setClientId());
    this.awaitBeforeSending(this._updateSessionInfo(true));

    this._updateState();

    addEventListener('focus', () => this._updateState(), true);
    addEventListener('blur', () => this._updateState(), true);
    onVisible(() => this._updateState(), true);
    onHidden(() => {
      this._updateState();
      this._send();
      // Queue a microtask to ensure another other queued events run first.
      Promise.resolve().then(() => {
        if (this._engagedTime && this._eventQueue.length === 0) {
          this.event('user_engagement');
        }
      });
    });
  }

  /**
   *
   */
  _updateState() {
    const nextState = getCurrentState();
    if (nextState !== this._state) {
      const changeTime = Math.round(now());
      if (nextState === 'active') {
        // If this is first change, assume active since the document was open.
        if (this._state === null) {
          this._engagedTime = changeTime;
        }
        this._lastActiveTime = changeTime;
      } else if (this._lastActiveTime > 0) {
        this._engagedTime += changeTime - this._lastActiveTime;
        this._lastActiveTime = 0;
        // Do not await...
        set('lastEngagedTime', Math.round(timeOrigin + now));
      }
      this._state = nextState;
    }
  }

  _getEngagedTime() {
    let engagedTime = this._engagedTime;
    this._engagedTime = 0;

    if (this._state === 'active') {
      const time = Math.round(now());
      engagedTime += (time - this._lastActiveTime);
      this._lastActiveTime = time;
    }
    return engagedTime;
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

  setEngaged() {
    this._pageParams.seg = 1;
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

    const prefixedParams = {
      en: eventName,
      ...prefixParams('e', params),
    };

    const engagedTime = this._getEngagedTime();
    if (engagedTime) {
      prefixedParams._et = engagedTime;
    }

    this._eventQueue.push(prefixedParams);

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
      this._requestCount++;
      this._pageParams._s = this._requestCount;

      // Remove _ss and _fv param after the first request.
      if (this._requestCount > 1) {
        delete this._pageParams._ss;
        delete this._pageParams._fv;
      }

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
    let cid = await get('clientId', null);

    if (cid) {
      this._pageParams.cid = cid;
    } else {
      cid = uuid(timeOrigin);
      this._pageParams.cid = cid;
      this._pageParams._fv = 1;
      this._pageParams._ss = 1;

      // Do not await...
      set('clientId', cid);
    }
  }

  /**
   * @return {Promise<void>}
   */
  async _updateSessionInfo(isInitialLoad) {
    const time = Date.now();

    let seg = 0;
    let [sid, sct, lastEngagedTime] = await Promise.all([
      get('sessionId', time),
      get('sessionCount', 1),
      get('lastEngagedTime', 0),
    ]);

    const isFirstVisit = Boolean(this._pageParams._fv);
    const isSessionExpired = time - (lastEngagedTime || sid) > SESSION_TIMEOUT;

    if (isSessionExpired) {
      this._pageParams._ss = 1;
      sid = time;
      seg = 0;
      sct++;
    }

    if (!isFirstVisit && !isSessionExpired) {
      seg = 1;
    }

    Object.assign(this._pageParams, {sid, sct, seg});

    // Do not await
    set('sessionId', sid);
    set('sessionCount', sct);
    set('lastEngagedTime', time);
  }
}

/**
 * @returns {string}
 */
function getCurrentState() {
  if (document.visibilityState === 'hidden') {
    return 'hidden';
  }
  if (document.hasFocus()) {
    return 'active';
  }
  return 'passive';
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
