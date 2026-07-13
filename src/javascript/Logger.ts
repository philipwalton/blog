import {getActiveBreakpoint} from './breakpoints.ts';
import {fetchLater} from './utils/fetchLater.ts';
import {get, set} from './utils/kv-store.ts';
import {round} from './utils/round.ts';
import {uuid} from './utils/uuid.ts';

export interface Params {
  [key: string]: string | number | boolean | undefined;
}

type HitFilter = (params: Params) => Params;

// Bump this version any time the cloud function logic changes
// in a backward-incompatible way.
const LOG_VERSION = 3;

const SESSION_TIMEOUT = 1000 * 60 * 30; // 30 minutes.

const SEND_TIMEOUT = import.meta.env.MODE === 'test' ? 1000 : 60000;

let index = 1;

/**
 * A class to manage building and sending analytics hits to the `/log` route.
 */
export class Logger {
  private _hitFilter: HitFilter | undefined;
  private _presendDependencies: Promise<unknown>[];

  private _eventQueue: Map<number, Params>;
  private _sendCount: number;
  private _lastActiveTime: number;
  private _engagedTime: number;
  private _pageParams: Params;
  private _userParams: Params;
  private _eventParams: Params;

  private _state?: string;
  private _fetchLaterResult?: FetchLaterResult;
  private _fetchLaterController?: AbortController;

  /**
   * Creates a new Logger instance.
   */
  constructor(hitFilter?: HitFilter) {
    this._hitFilter = hitFilter;
    this._presendDependencies = [];
    this._eventQueue = new Map();

    this._sendCount = 1;
    this._lastActiveTime = 0;
    this._engagedTime = 0;

    this._pageParams = {
      dl: location.href,
      dt: getPageTitle(),
      de: document.characterSet,
      ul: navigator.language.toLowerCase(),
      vp: `${innerWidth}x${innerHeight}`,
      sr: `${screen.width}x${screen.height}`,
      sd: `${screen.colorDepth}-bit`,
      dr: getReferrer(),
      cid: '', // Will be updated asynchronously.
      _p: Math.floor(Math.random() * 1e9),
      _s: 0,
    };

    const userParams: Params = {
      breakpoint: getActiveBreakpoint().name,
      connection_type: getEffectiveConnectionType(),
      pixel_density: getPixelDensity(),
      color_scheme_preference: getColorSchemePreference(),
      contrast_preference: getContrastPreference(),
      reduce_data_preference: getReducedDataPreference(),
      reduce_motion_preference: getReducedMotionPref(),
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
    this.awaitBeforeSending(this._setUACHData());
    this.awaitBeforeSending(this._updateSessionInfo());

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
      const changeTime = Math.round(performance.now());
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
        set(
          'lastEngagedTime',
          Math.round(performance.timeOrigin + performance.now()),
        );
      }
      this._state = nextState;
    }
  }

  /**
   * Gets the amount of time the page has been in the "active" state.
   */
  _getEngagedTime(): number {
    let engagedTime = this._engagedTime;
    this._engagedTime = 0;

    if (this._state === 'active') {
      const time = Math.round(performance.now());
      engagedTime += time - this._lastActiveTime;
      this._lastActiveTime = time;
    }
    return engagedTime;
  }

  /**
   * Adds a promise to the presend dependencies, with a timeout so it
   * can't block send forever. It also includes a built-in catch handler
   * to catch any errors with presend dependencies without blocking send.
   */
  awaitBeforeSending(promise: Promise<unknown>, timeout: number = 5000) {
    this._presendDependencies.push(
      Promise.race([
        new Promise((r) => setTimeout(r, timeout)),
        promise.catch((err) => {
          // Call Promise.reject() to trigger an unhandled promise rejection,
          // without rejecting the current promise and breaking logging.
          Promise.reject(err);
        }),
      ]),
    );
  }

  /**
   * Sets the event parameters.
   */
  set(params: Params) {
    Object.assign(this._eventParams, params);
  }

  /**
   * Updates the page params that can change after an SPA navigation
   * (document location and title) to reflect the current page.
   */
  refreshPageParams() {
    this._pageParams.dl = location.href;
    this._pageParams.dt = getPageTitle();
  }

  /**
   * Logs an event.
   */
  async event(eventName: string, paramOverrides: Params = {}) {
    const params = {...this._eventParams, ...paramOverrides};
    if (this._hitFilter) {
      Object.assign(params, this._hitFilter(params));
    }

    const prefixedParams: Params = {
      en: eventName,
      ...prefixParams('e', params),
    };

    const engagedTime = this._getEngagedTime();

    if (engagedTime) {
      prefixedParams._et = engagedTime;
    }

    // Await presend dependencies after all params are set, so that they
    // relfect the state at the time when the event was logged.
    await Promise.all(this._presendDependencies);

    this._queue(prefixedParams);
  }

  /**
   * Queues a beacon with all event data via fetchLater().
   */
  async _queue(params: Params) {
    // If the fetchLater request was already sent, reset internal event state.
    if (
      this._fetchLaterResult?.activated ||
      // TODO: check the size of `data` (less than 64KB) instead of queue size
      this._eventQueue.size > 10
    ) {
      this._sendCount++;
      this._eventQueue.clear();
      delete this._fetchLaterResult;
    }

    this._pageParams._s = this._sendCount;

    // Remove _ss and _fv param after the first beacon is sent for this page.
    if (this._sendCount > 1) {
      delete this._pageParams._ss;
      delete this._pageParams._fv;
    }

    // Add the event to the queue using either the event ID or a unique index.
    const key = (params['ep.event_id'] as number) || ++index;
    this._eventQueue.set(key, params);

    // TODO: Consider adding a deduplication mechanism.
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
    this._fetchLaterResult = fetchLater(`/log?v=${LOG_VERSION}`, {
      method: 'POST',
      body: data,
      signal: this._fetchLaterController.signal,
      activateAfter: SEND_TIMEOUT,
    });
  }

  // TODO: Consider adding a deduplication mechanism.
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
   * Sets the client ID on the page params object.
   * If the client ID is not set, it generates a new one and sets the first
   * visit and session start parameters. It also persists the client ID to the
   * KV store.
   */
  async _setClientId() {
    let cid = await get<string>('clientId', '');

    if (cid) {
      this._pageParams.cid = cid;
    } else {
      cid = uuid(performance.timeOrigin);
      this._pageParams.cid = cid;
      this._pageParams._fv = 1;
      this._pageParams._ss = 1;

      // Do not await...
      set('clientId', cid);
    }
  }

  /**
   * Sets the UACH data on the page params object.
   */
  async _setUACHData() {
    const uachData = await navigator.userAgentData?.getHighEntropyValues([
      'architecture',
      'bitness',
      'model',
      'fullVersionList',
      'platform',
      'platformVersion',
      'wow64',
    ]);

    if (uachData) {
      this._pageParams['uaa'] = uachData['architecture'];
      this._pageParams['uab'] = uachData['bitness'];
      this._pageParams['uam'] = uachData['model'];
      this._pageParams['uamb'] = Number(uachData.mobile);
      this._pageParams['uafvl'] = uachData['fullVersionList']
        ?.map((e) => {
          return [
            encodeURIComponent(e.brand),
            encodeURIComponent(e.version),
          ].join(';');
        })
        .join('|');
      this._pageParams['uap'] = uachData['platform'];
      this._pageParams['uapv'] = uachData['platformVersion'];
      this._pageParams['uaw'] = Number(uachData['wow64']);
    }
  }

  /**
   * Updates the session information on the page params object.
   */
  async _updateSessionInfo() {
    const time = Date.now();

    let seg = 0;
    // eslint-disable-next-line prefer-const
    let [sid, sct, lastEngagedTime] = await Promise.all([
      get<number>('sessionId', time),
      get<number>('sessionCount', 1),
      get<number>('lastEngagedTime', 0),
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
 * Gets the current lifecycle state of the page.
 */
function getCurrentState(): string {
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
 */
function prefixParams(initialLetter: string, unprefixedParams: Params): Params {
  const prefixedParams: Params = {};
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
 */
function toQueryString(params: Params): string {
  return Object.keys(params)
    .filter((key) => {
      // Filter out empty string param unless they start with "ua".
      if (params[key] === '') {
        return key.startsWith('ua');
      }
      // Filter out all other falsy values except 0
      return params[key] || params[key] === 0;
    })
    .map((key) => {
      // Value cannot be falsy (except for 0) based on the filter above.
      const value = params[key] as string | number | boolean;
      return `${key}=${encodeURIComponent(value)}`;
    })
    .join('&');
}

/**
 * Gets the document title with the site name suffix removed.
 */
function getPageTitle(): string {
  return document.title.replace(/\s+—.*$/, '');
}

/**
 * Gets the referrer of the page.
 */
function getReferrer(): string {
  const referrer = document.referrer;
  if (
    referrer &&
    new URL(referrer).hostname !== new URL(location.href).hostname
  ) {
    return referrer;
  } else {
    return '';
  }
}

/**
 * Gets the effective connection type information if available.
 */
function getEffectiveConnectionType(): string {
  return navigator.connection?.effectiveType || '(unknown)';
}

/**
 * Returns the currently-active pixel density.
 */
function getPixelDensity(): string {
  const densities: [string, string][] = [
    ['1x', 'all'],
    ['1.5x', '(-webkit-min-device-pixel-ratio: 1.5),(min-resolution: 144dpi)'],
    ['2x', '(-webkit-min-device-pixel-ratio: 2),(min-resolution: 192dpi)'],
  ];
  let activeDensity = '1x';
  for (const [density, query] of densities) {
    if (window.matchMedia(query).matches) {
      activeDensity = density;
    }
  }
  return activeDensity;
}

/**
 * Returns the user's `prefers-color-scheme` preference.
 */
function getColorSchemePreference(): string {
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'no-preference';
}

/**
 * Returns the user's `prefers-reduced-data` preference.
 */
function getReducedDataPreference(): string {
  return window.matchMedia('(prefers-reduced-data: reduce)').matches
    ? 'reduce'
    : 'no-preference';
}

/**
 * Returns the user's `prefers-reduced-motion` preference.
 */
function getReducedMotionPref(): string {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'reduce'
    : 'no-preference';
}

/**
 * Returns the user's `prefers-contrast` preference.
 */
function getContrastPreference(): string {
  return window.matchMedia('(prefers-contrast: more)').matches
    ? 'more'
    : window.matchMedia('(prefers-contrast: less)').matches
      ? 'less'
      : 'no-preference';
}
