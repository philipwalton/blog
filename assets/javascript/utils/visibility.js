// Managing separately is required until the following bug (currently fixed)
// is actually released in Safari stable (currently only in STP):
// https://bugs.webkit.org/show_bug.cgi?id=151234
let visibilityState = document.visibilityState;

const calledHiddenListeners = new Set();
const calledVisibleListeners = new Set();


/**
 * Adds an event listener for the passed callback to run anytime the
 * page is backgrounded or unloaded.
 * @param {Function} callback
 */
export function onHidden(callback, opts = {}) {
  const listener = (event) => {
    console.log(event);

    if (!calledHiddenListeners.has(listener) &&
        (event.type === 'pagehide' || document.visibilityState === 'hidden')) {
      calledVisibleListeners.clear();
      calledHiddenListeners.add(listener);

      visibilityState = 'hidden';
      callback();

      if (opts.once) {
        document.removeEventListener('visibilitychange', listener, opts);
        window.removeEventListener('pagehide', listener, opts);
      }
    }
  }
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

      visibilityState = 'visible';
      callback();

      if (opts.once) {
        document.removeEventListener('visibilitychange', listener, opts);
        window.removeEventListener('pageshow', listener, opts);
      }
    }
  }
  document.addEventListener('visibilitychange', listener, opts);
  window.addEventListener('pageshow', listener, opts);
}

/**
 * @return {sting}
 */
export function getVisibilityState() {
  return visibilityState;
}
