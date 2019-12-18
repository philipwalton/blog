const IS_FIREFOX = /firefox\/\d+/i.test(navigator.userAgent);

// Support browsers that don't support page transition events.
const PAGESHOW = 'onpageshow' in window ? 'pageshow' : 'load';
const PAGEHIDE = 'onpagehide' in window ? 'pagehide' : 'unload';

let visibilityState;
const callbacks = new Set();

/**
 * Adds a function to be called whenever the `visibilityState` changes.
 * @param {Function} callback
 */
export function addListener(callback) {
  callbacks.add(callback);
}

/**
 * Remove a function that is called whenever the `visibilityState` changes.
 * @param {Function} callback
 */
export function removeListener(callback) {
  callbacks.delete(callback);
}

/**
 * Handles known `visibilityState` changes (via various events) with an
 * optional known `visibilityState`.
 * @param {Event} originalEvent
 * @param {string} state
 */
function handleEvent(originalEvent, state) {
  const newState = state || document.visibilityState;
  if (newState !== visibilityState) {
    visibilityState = newState;
    for (const callback of callbacks) {
      callback({visibilityState, originalEvent});
    }
  }
}

/**
 * Handles changes to the `visible` `visibilityState`.
 * @param {*} event
 */
function onVisible(event) {
  if (document.visibilityState === 'visible') {
    handleEvent(event, 'visible');
  }
}

/**
 * Handles changes to the `hidden` `visibilityState`.
 * @param {*} event
 */
function onHidden(event) {
  handleEvent(event, 'hidden');
}

// Listening for `visibilitychange` is all that *should* be necessary, but
// unfortunately there are issue (see comments below).
self.addEventListener('visibilitychange', handleEvent, true);

// The pageshow event is needed for when pages come out of the bfcache
self.addEventListener(PAGESHOW, onVisible, true);

// Not all browsers will fire `visibilitychange` when unloading a page
// so we have to listen for `pagehide` as well.
// - https://bugs.webkit.org/show_bug.cgi?id=151234
// - https://bugs.chromium.org/p/chromium/issues/detail?id=987409
self.addEventListener(PAGEHIDE, onHidden, true);

// Similar to above, not all browsers will fire `pagehide` either when
// unloading a document, so we also have to listen for `beforeunload`.
// However, we don't want to listen to `beforeunload` unconditionally as
// it will prevent pages from being eligible for bfcache in Firefox.
// - https://bugs.webkit.org/show_bug.cgi?id=151610
if (!IS_FIREFOX) {
  self.addEventListener('beforeunload', (event) => {
    // Use a timeout to ensure this code runs after all added event listeners.
    setTimeout(() => {
      if (!(event.defaultPrevented || event.returnValue)) {
        onHidden(event);
      }
    }, 0);
  }, true);
}
