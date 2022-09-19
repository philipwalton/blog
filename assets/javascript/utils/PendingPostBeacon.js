/* eslint no-var: 0 */

/**
 * @param {string} url
 * @param {Object} opts
 * @returns {PendingPostBeacon}
 */
export function PendingPostBeacon(url, opts) {
  var _pending = true;
  var _timeoutHandle;
  var _data;
  var _beacon = {
    get url() {
      return url;
    },
    get method() {
      return 'POST';
    },
    get pending() {
      return _pending;
    },
    sendNow() {
      if (_pending && navigator.sendBeacon(url, _data)) {
        _beacon.deactivate();
      }
    },
    setData(data) {
      _data = data;
    },
    deactivate() {
      document.removeEventListener('visibilitychange', _beacon.sendNow);
      clearTimeout(_timeoutHandle);
      _pending = false;
      _data = null;
    },
  };

  if (document.visibilityState === 'hidden') {
    // If the beacon was created while the page is already hidden, send data
    // ASAP but wait until the next microtask to allow all sync code to run.
    Promise.resolve().then(_beacon.sendNow);
  } else {
    document.addEventListener('visibilitychange', _beacon.sendNow);

    if (opts && opts.timeout > -1) {
      _timeoutHandle = setTimeout(_beacon.sendNow, opts.timeout);
    }
  }

  return _beacon;
}
