import {initialize} from 'workbox-google-analytics/initialize.mjs';
import {cacheNames} from './caches.js';


const SERVICE_WORKER_REPLAY_DIMENSION = 'cd8';

export const init = () => {
  initialize({
    cacheName: cacheNames.THIRD_PARTY_ASSETS,
    parameterOverrides: {
      [SERVICE_WORKER_REPLAY_DIMENSION]: 'replay',
    },
  });
};
