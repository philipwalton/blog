const calledHiddenListeners = new Set();
const calledVisibleListeners = new Set();

/**
 * Adds an event listener for the passed callback to run anytime the
 * page is backgrounded or unloaded.
 * @param {Function} callback
 */
export function onHidden(callback, opts = {}) {
  const listener = (event) => {
    if (!calledHiddenListeners.has(listener) &&
        (event.type === 'pagehide' || document.visibilityState === 'hidden')) {
      calledVisibleListeners.clear();
      calledHiddenListeners.add(listener);

      callback(event);

      if (opts.once) {
        document.removeEventListener('visibilitychange', listener, opts);
        window.removeEventListener('pagehide', listener, opts);
      }
    }
  };
  document.addEventListener('visibilitychange', listener, opts);
  window.addEventListener('pagehide', listener, opts);
}

/**
 * Adds an event listener for the passed callback to run anytime the
 * page is backgrounded or unloaded.
 * @param {Function} callback
 */
export function onVisible(callback, opts = {}) {
  const listener = (event) => {
    if (event.type === 'pageshow' || document.visibilityState === 'visible') {
      calledHiddenListeners.clear();
      calledVisibleListeners.add(listener);

      callback(event);

      if (opts.once) {
        document.removeEventListener('visibilitychange', listener, opts);
        window.removeEventListener('pageshow', listener, opts);
      }
    }
  };
  document.addEventListener('visibilitychange', listener, opts);
  window.addEventListener('pageshow', listener, opts);
}
