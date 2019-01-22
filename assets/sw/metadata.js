/* global __VERSION__, __BUILD_TIME__ */

import {cacheNames} from './caches.js';


const META_PATH = '/metadata.json';
const DEFAULT_VERSION = '0.0.0';

const metadata = {
  version: __VERSION__,
  buildTime: __BUILD_TIME__,
};

const getStoredMetadata = async () => {
  const cache = await caches.open(cacheNames.META);
  const response = await cache.match(META_PATH);
  return response ? await response.json() : {
    version: DEFAULT_VERSION,
    buildTime: 0,
  };
};

// TODO(philipwalton): at some point it might make sense to expose a route
// for `/metadata.json` and make it accessible to the window, but until we
// have a use case lets leave it out.

/**
 * Returns a object of metadata assosciated with the current version of
 * the SW as well as the previously installed version.
 * This function should be called in the `install` event, as that's the
 * only time where the versions will be different.
 */
export const getMetadata = async () => ({
  oldMetadata: await getStoredMetadata(),
  newMetadata: metadata,
});

/**
 * Stores the current metadata in the cache.
 * This function should be invoked after you're done with the result of
 * `getMetadata()`, as it will overwrite what that would return.
 */
export const updateStoredMetadata = async () => {
  const cache = await caches.open(cacheNames.META);
  await cache.put(META_PATH, new Response(JSON.stringify(metadata)));
};
