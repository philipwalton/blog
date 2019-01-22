import {deleteUnusedCaches} from './caches.js';
import {messageWindows} from './messenger.js';
import {getMetadata, updateStoredMetadata} from './metadata.js';

import * as precache from './precache.js';
import * as offlineAnalytics from './offline-analytics.js';
import * as router from './router.js';


router.init();
precache.init();
offlineAnalytics.init();


addEventListener('install', (event) => {
  const installComplete = async () => {
    await precache.install();

    const {oldMetadata, newMetadata} = await getMetadata();

    // IMPORTANT!
    // When sending data to the window in an update event, remember that the
    // code that gets served to the page may be an incompatible version.
    // Take care when updating the format of the data being sent.
    await messageWindows({
      type: 'UPDATE_AVAILABLE',
      payload: {
        oldMetadata,
        newMetadata,
      },
    });

    // TODO(philipwalton): in the future consider not calling `skipWaiting()`
    // for a major version bump. Instead, wait for confirmation from the
    // window before calling it.
    await skipWaiting();
  };
  event.waitUntil(installComplete());
});

addEventListener('activate', (event) => {
  const activateComplete = async () => {
    // Run these in parallel so any one of them erroring won't prevent the
    // other ones from finishing.
    await Promise.all([
      updateStoredMetadata(),
      deleteUnusedCaches(),
      precache.activate(),
    ]);

    clients.claim();
  };
  event.waitUntil(activateComplete());
});
