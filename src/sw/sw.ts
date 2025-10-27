import {deleteUnusedCaches} from './caches.js';
import {messageWindows} from './messenger.js';
import {getStoredMetadata, getAndUpdateMetadata} from './metadata.js';
import * as precache from './precache.js';
import * as router from './router.js';

let metadataChanges: any;

// Give TypeScript the correct global.
declare const self: ServiceWorkerGlobalScope;

precache.init();
router.init();

addEventListener('install', (event: Event) => {
  self.skipWaiting();

  const installComplete = async (): Promise<void> => {
    await precache.install(event as ExtendableEvent);
    metadataChanges = await getAndUpdateMetadata();
  };
  (event as ExtendableEvent).waitUntil(installComplete());
});

addEventListener('activate', (event: Event) => {
  self.clients.claim();

  const activateComplete = async (): Promise<void> => {
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
      precache.activate(event as ExtendableEvent),
      deleteUnusedCaches(),
    ]);
  };
  (event as ExtendableEvent).waitUntil(activateComplete());
});

addEventListener('message', (event: Event) => {
  const messageEvent = event as ExtendableMessageEvent;
  if (messageEvent.data && messageEvent.data.type === 'GET_METADATA') {
    const replySent = async (): Promise<void> => {
      const metadata = await getStoredMetadata();
      if (messageEvent.ports && messageEvent.ports[0]) {
        messageEvent.ports[0].postMessage(metadata);
      }
    };
    messageEvent.waitUntil(replySent());
  }
});
