import {deleteUnusedCaches} from './caches.js';
import {messageWindows} from './messenger.js';
import {getStoredMetadata, getAndUpdateMetadata} from './metadata.js';
// import * as offlineAnalytics from './offline-analytics.js';
import * as precache from './precache.js';
import * as router from './router.js';


let metadataChanges;

precache.init();
router.init();
// offlineAnalytics.init();

addEventListener('install', (event) => {
  skipWaiting();

  const installComplete = async () => {
    await precache.install({event});
    metadataChanges = await getAndUpdateMetadata();
  };
  event.waitUntil(installComplete());
});

addEventListener('activate', (event) => {
  clients.claim();

  const activateComplete = async () => {
    if (metadataChanges) {
      // IMPORTANT!
      // When sending data to the window in an update event, remember that the
      // code that gets served to the page may be an incompatible version.
      // Take care when updating the format of the data being sent.
      await messageWindows({
        type: 'UPDATE_AVAILABLE',
        payload: metadataChanges,
      });
    }

    // Run these in parallel so any one of them erroring won't prevent the
    // other ones from finishing.
    await Promise.all([
      precache.activate({event}),
      deleteUnusedCaches(),
    ]);
  };
  event.waitUntil(activateComplete());
});

addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_METADATA') {
    const replySent = async () => {
      const metadata = await getStoredMetadata();
      event.ports && event.ports[0].postMessage(metadata);
    };
    event.waitUntil(replySent());
  }
});
