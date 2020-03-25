import {IdleQueue} from 'idlize/IdleQueue.mjs';
import {parseUrl} from 'dom-utils';
import {get, set} from './kv-store';
import {uuid} from './uuid';


/**
 * @return {Promise<string>}
 */
async function getOrCreateClientId() {
  try {
    return await get('clientId') || await set('clientId', uuid());
  } catch (error) {
    return uuid();
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
 * A class to manage building and sending analytics hits to the `/log` route.
 */
export class Logger {
  /**
   * @param {function(Object):void} hitFilter
   */
  constructor(hitFilter) {
    this._hitFilter = hitFilter;
    this._presendDependencies = [];
    this._queue = new IdleQueue({
      defaultMinTaskTime: 40, // Only run if there's lots of time left.
      ensureTasksRun: true,
    });

    // Add the initial values known at instantiation time.
    this._params = {
      dl: location.href,
      dp: location.pathname,
      dt: document.title,
      de: document.characterSet,
      ul: navigator.language.toLowerCase(),
      vp: `${innerWidth}x${innerHeight}`,
      sr: `${screen.width}x${screen.height}`,
      sd: `${screen.colorDepth}-bit`,
      dr: getReferrer(),
    };

    this.awaitBeforeSending(this._setClientId());
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
    Object.assign(this._params, params);
  }

  /**
   * @param {string} hitType
   * @param {Object} paramOverrides
   * @return {Promise<void>}
   */
  async send(hitType, paramOverrides = {}) {
    await Promise.all(this._presendDependencies);
    this._presendDependencies = [];

    this._queue.pushTask((state) => {
      const data = Object.assign({
        t: hitType,
        ht: state.time || Date.now(),
      }, this._params, paramOverrides);

      if (this._hitFilter) {
        this._hitFilter(data, state);
      }

      const body = Object.keys(data).map((key) => {
        return `${key}=${encodeURIComponent(data[key])}`;
      }).join('&');

      if (process.env.NODE_ENV !== 'production') {
        // Log hits in development.
        if (data.t === 'event') {
          console.log(data.t, data.ec, data.ea, data.ev, data.el, data);
        } else {
          console.log(data.t, data);
        }
      }

      // Use `navigator.sendBeacon()` if available, with a fallback to `fetch()`
      (navigator.sendBeacon && navigator.sendBeacon('/log', body)) ||
          fetch('/log', {body, method: 'POST', keepalive: true});
    });
  }

  /**
   * @return {Promise<void>}
   */
  async _setClientId() {
    this._params.cid = await getOrCreateClientId();
  }
}
