import {initialize as initOfflineGA} from 'workbox-google-analytics';
import {cacheNames, deleteUnusedCaches} from './caches.js';
import {initRouter} from './router.js';


initRouter();

const dimensions = {
  SERVICE_WORKER_REPLAY: 'cd8',
};
initOfflineGA({
  cacheName: cacheNames.THIRD_PARTY_ASSETS,
  parameterOverrides: {[dimensions.SERVICE_WORKER_REPLAY]: 'replay'},
});

addEventListener('install', () => skipWaiting());

addEventListener('activate', (event) => {
  const activationComplete = async () => {
    clients.claim();
    await deleteUnusedCaches();
  };
  event.waitUntil(activationComplete());
});
