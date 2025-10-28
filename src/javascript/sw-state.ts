/**
 * Gets the service worker status at page load time.
 */
export const initialSWState = !navigator.serviceWorker
  ? 'unsupported'
  : navigator.serviceWorker.controller
    ? 'controlled'
    : 'supported';
