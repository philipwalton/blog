function fetchLaterPolyfill(url, init) {
  let timeoutHandle;
  let activated = false;

  function destroy() {
    document.removeEventListener('visibilitychange', sendNow);
    clearTimeout(timeoutHandle);
  }

  function sendNow() {
    if (!(init.signal && init.signal.aborted)) {
      activated = navigator.sendBeacon(url, init.body);
    }
    destroy();
  }

  if (document.visibilityState === 'hidden') {
    // If the beacon was created while the page is already hidden, send data
    // ASAP but wait until the next microtask to allow all sync code to run.
    Promise.resolve().then(sendNow);
  } else {
    document.addEventListener('visibilitychange', sendNow);

    if (typeof init.activateAfter === 'number' && init.activateAfter >= 0) {
      timeoutHandle = setTimeout(sendNow, init.activateAfter);
    }
  }

  if (init.signal) {
    init.signal.addEventListener('abort', destroy);
  }

  return {
    get activated() {
      return activated;
    },
  };
}

export const fetchLater = self.fetchLater || fetchLaterPolyfill;
