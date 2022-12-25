/* global __VERSION__, __BUILD_TIME__ */

import {cacheNames} from './caches.js';

const META_PATH = '/metadata.json';
const DEFAULT_VERSION = '0.0.0';

const metadata = {
  version: __VERSION__,
  buildTime: __BUILD_TIME__,
};

export const getStoredMetadata = async () => {
  const cache = await caches.open(cacheNames.META);
  const response = await cache.match(META_PATH);
  return response
    ? await response.json()
    : {
        version: DEFAULT_VERSION,
        buildTime: 0,
      };
};

// TODO(philipwalton): at some point it might make sense to expose a route
// for `/metadata.json` and make it accessible to the window, but until we
// have a use case lets leave it out.

/**
 * Stores the current metadata in the cache.
 * This function should be invoked after you're done with the result of
 * `getMetadata()`, as it will overwrite what that would return.
 */
const updateStoredMetadata = async () => {
  const cache = await caches.open(cacheNames.META);
  await cache.put(META_PATH, new Response(JSON.stringify(metadata)));
};

/**
 * Returns a object of metadata assosciated with the current version of
 * the SW as well as the previously installed version. Also updates the
 * metadata stored, which means this function should only be called once
 * per service worker lifecycle.
 */
export const getAndUpdateMetadata = async () => {
  const oldMetadata = await getStoredMetadata();
  const newMetadata = metadata;

  await updateStoredMetadata();
  return {oldMetadata, newMetadata};
};
