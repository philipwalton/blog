import {initialize as initOfflineGA} from 'workbox-google-analytics/initialize.mjs';
import {PrecacheController} from 'workbox-precaching/PrecacheController.mjs';
import {cacheNames, deleteUnusedCaches} from './caches.js';
import {initRouter} from './router.js';


/* global __PRECACHE_MANIFEST__ */

const SERVICE_WORKER_REPLAY_GA_DIMENSION = 'cd8';

const precache = new PrecacheController(cacheNames.SHELL);
precache.addToCacheList(__PRECACHE_MANIFEST__);

initRouter();

initOfflineGA({
  cacheName: cacheNames.THIRD_PARTY_ASSETS,
  parameterOverrides: {[SERVICE_WORKER_REPLAY_GA_DIMENSION]: 'replay'},
});

addEventListener('install', (event) => {
  const installComplete = async () => {
    const {updatedURLs} = await precache.install();
    if (updatedURLs.length > 0) {
      // This `includeUncontrolled` flag is needed because we're in the
      // install event, which means this SW is not yet controlling the page.
      const wins = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const win of wins) {
        win.postMessage({
          type: 'UPDATE_AVAILABLE',
          payload: {
            updatedURLs,
            // TODO(philipwalton): send the version of this SW to the window
            // as well so it can compare and conditionally notify the user
            // of the update.
            // swVersion: __VERSION__,
          },
        });
      }
    }
    skipWaiting();
  };
  event.waitUntil(installComplete());
});

addEventListener('activate', (event) => {
  const activateComplete = async () => {
    clients.claim();
    await precache.activate();
    await deleteUnusedCaches();
  };
  event.waitUntil(activateComplete());
});
