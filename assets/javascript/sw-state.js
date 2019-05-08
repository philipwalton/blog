/**
 * Gets the service worker status at page laod time.
 * @return {number} The service worker status.
 */
export const initialSWState = !navigator.serviceWorker ? 'unsupported' :
    navigator.serviceWorker.controller ? 'controlled' : 'supported';
