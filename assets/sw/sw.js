import core, {LOG_LEVELS} from 'workbox-core';
import {initialize as initializeOfflineAnalytics}
    from 'workbox-google-analytics';
import {cacheNames, deleteUnusedCaches} from './caches.js';
import {router} from './router.js';


if (process.env.NODE_ENV !== 'production') {
  core.setLogLevel(LOG_LEVELS.debug);
}

// A fake FetchEvent is needed until this issue is resolved:
// https://github.com/GoogleChrome/workbox/issues/1630
const createFakeFetchEvent = (url) => {
  const fakeFetchEvent = new FetchEvent('fetch', {
    request: new Request(url, {mode: 'no-cors'}),
  });
  fakeFetchEvent.waitUntil = fakeFetchEvent.respondWith = () => {};

  return fakeFetchEvent;
};

self.addEventListener('message', async (evt) => {
  if (evt.data.type === 'LOADED_RESOURCES') {
    const {urls} = evt.data.payload;

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('Creating fake FetchEvents for loaded resources', urls);
    }

    for (const url of urls) {
      const fakeFetchEvent = createFakeFetchEvent(url);
      evt.waitUntil(router.handleRequest(fakeFetchEvent));
    }
  }
});

self.addEventListener('fetch', (evt) => {
  const responsePromise = router.handleRequest(evt);
  if (responsePromise) {
    evt.respondWith(responsePromise);
  }
});

self.addEventListener('install', (evt) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('install', evt);
  }
  const installationComplete = async () => {
    self.skipWaiting();
  };
  evt.waitUntil(installationComplete());
});

self.addEventListener('activate', (evt) => {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log('activate', evt);
  }
  const activationComplete = async () => {
    await deleteUnusedCaches();

    // TODO(philipwalton): also delete old IDB databases used by precache
    // or other workbox plugins.
  };
  evt.waitUntil(activationComplete());
});

const dimensions = {
  SERVICE_WORKER_REPLAY: 'cd8',
};
initializeOfflineAnalytics({
  cacheName: cacheNames.THIRD_PARTY_ASSETS,
  parameterOverrides: {[dimensions.SERVICE_WORKER_REPLAY]: 'replay'},
});
