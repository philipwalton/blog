import {parseUrl} from 'dom-utils';
import {getActiveBreakpoint} from './breakpoints';
import {initialSWState} from './sw-state';
import {fetchLater} from './utils/fetchLater.js';
import {get, set} from './utils/kv-store';
import {now, timeOrigin} from './utils/performance';
import {round} from './utils/round.js';
import {uuid} from './utils/uuid';

// Bump this version any time the cloud function logic changes
// in a backward-incompatible way.
const LOG_VERSION = 3;

const SESSION_TIMEOUT = 1000 * 60 * 30; // 30 minutes.

// const SEND_TIMEOUT = self.__ENV__ === 'production' ? SESSION_TIMEOUT : 1000;

let index = 1;

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
    this._eventQueue = new Map();

    this._sendCount = 1;
    this._lastActiveTime = 0;
    this._engagedTime = 0;
    this._state = null;

    // Default to an object to allow property access.
    this._fetchLaterResult = {};
    this._fetchLaterController = null;

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
      color_scheme_preference: getColorSchemePreference(),
      contrast_preference: getContrastPreference(),
      reduce_data_preference: getReducedDataPreference(),
      reduce_motion_preference: getReducedMotionPref(),
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

    document.addEventListener('visibilitychange', () => {
      this._updateState();
      if (document.visibilityState === 'hidden') {
        this.event('user_engagement');
      }
    });
  }

  /**
   * Updates the stored lifecycle state and persists `lastEngagedTime`
   * if changing away from the active state.
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

  /**
   * @returns {number}
   */
  _getEngagedTime() {
    let engagedTime = this._engagedTime;
    this._engagedTime = 0;

    if (this._state === 'active') {
      const time = Math.round(now());
      engagedTime += time - this._lastActiveTime;
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

    this._queue(prefixedParams);
  }

  /**
   * Queue a beacon with all event data via fetchLater().
   * @param {Object} params
   */
  async _queue(params) {
    // If the fetchLater request was already sent, reset internal event state.
    if (this._fetchLaterResult.activated) {
      this._sendCount++;
      this._eventQueue.clear();
    }

    this._pageParams._s = this._sendCount;

    // Remove _ss and _fv param after the first beacon is sent for this page.
    if (this._sendCount > 1) {
      delete this._pageParams._ss;
      delete this._pageParams._fv;
    }

    this._eventQueue.set(params['ep.event_id'] || ++index, params);
    // this._dedupeEvents(eventID, params);

    const data =
      toQueryString(this._pageParams) +
      '&' +
      toQueryString(this._userParams) +
      '\n' +
      [...this._eventQueue.values()].map((ep) => toQueryString(ep)).join('\n');

    // Abort any existing `fetchLater()` calls and schedule a new one with
    // the latest event data.
    if (this._fetchLaterController) {
      this._fetchLaterController.abort();
    }

    this._fetchLaterController = new AbortController();

    // To better measure the `fetch_later` experiment, send page_view events
    // right away so we can compare the rate of received fetch_later events
    // with the rate of received page_view events.
    if (params.en === 'page_view' && this._sendCount === 1) {
      this._fetchLaterResult = {
        activated: navigator.sendBeacon(`/log?v=${LOG_VERSION}`, data),
      };
    } else {
      this._fetchLaterResult = fetchLater(`/log?v=${LOG_VERSION}`, {
        method: 'POST',
        body: data,
        signal: this._fetchLaterController.signal,
      });
    }
  }

  // _dedupeEvents(params) {
  //   // If an event with the same ID already exists, replace it,
  //   // but merge the `_et` param values first.
  //   const eventID = params['ep.event_id'];
  //   const existingEvent = eventID && this._eventQueue.get(eventID);

  //   if (existingEvent) {
  //     if (params._et || existingEvent._et) {
  //       params._et = Number(params._et) + Number(existingEvent._et);
  //     }
  //     this._eventQueue.delete(eventID);
  //   }
  // }

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
  async _updateSessionInfo() {
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
  return Object.keys(params)
    .filter((key) => {
      // Filter out, null, undefined, and empty strings, but keep zeros.
      return params[key] || params[key] === 0;
    })
    .map((key) => {
      return `${key}=${encodeURIComponent(params[key])}`;
    })
    .join('&');
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
  return (
    (navigator.connection && navigator.connection.effectiveType) || '(unknown)'
  );
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

/**
 * Returns the user's `prefers-color-scheme` preference.
 * @return {string}
 */
function getColorSchemePreference() {
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'no-preference';
}

/**
 * Returns the user's `prefers-reduced-data` preference.
 * @return {string}
 */
function getReducedDataPreference() {
  return window.matchMedia('(prefers-reduced-data: reduce)').matches
    ? 'reduce'
    : 'no-preference';
}

/**
 * Returns the user's `prefers-reduced-motion` preference.
 * @return {string}
 */
function getReducedMotionPref() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'reduce'
    : 'no-preference';
}

/**
 * Returns the user's `prefers-contrast` preference.
 * @return {string}
 */
function getContrastPreference() {
  return window.matchMedia('(prefers-contrast: more)').matches
    ? 'more'
    : window.matchMedia('(prefers-contrast: less)').matches
      ? 'less'
      : 'no-preference';
}
