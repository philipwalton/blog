import {parseUrl} from 'dom-utils';
import {onNewSwActive, messageSw} from './sw-utils.js';
import {gaTest} from './analytics';
import * as messages from './messages';

const sendUpdateEvent = (eventAction, eventLabel) => {
  gaTest('send', 'event', {
    eventCategory: 'Cache Update',
    eventAction: eventAction,
    eventLabel: eventLabel,
  });
};

const listenForBroadcastCacheUpdates = () => {
  navigator.serviceWorker.addEventListener('message', async ({data}) => {
    if (data.type === 'CACHE_UPDATED') {
      const updatedUrl = parseUrl(data.payload.updatedUrl).pathname;

      if (!messages.isShowing()) {
        // TODO: handle cases where the analytics.js library isn't loaded yet.
        sendUpdateEvent('notify', updatedUrl);
        messages.add({
          body: 'A newer version of this page exists.',
          action: 'Reload',
          onAction: () => {
            sendUpdateEvent('reload', updatedUrl);
            location.reload();
          },
          onDismiss: () => {
            sendUpdateEvent('dismiss', updatedUrl);
          },
        });
      } else {
        sendUpdateEvent('receive', updatedUrl);
      }
    }
  });
};

const notifyReady = (registration) => {
  if (registration.active) {
    messageSw(registration.active, {
      type: 'WINDOW_READY',
      meta: 'philipwalton',
    });
  }
};

const sendLoadedResources = (sw) => {
  const urls = [
    location.href,
    ...performance.getEntriesByType('resource').map(({name}) => name),
  ];
  messageSw(sw, {
    type: 'LOADED_RESOURCES',
    meta: 'philipwalton',
    payload: {urls},
  });
};


export const init = async () => {
  const registration = await navigator.serviceWorker.register('/sw.js');

  listenForBroadcastCacheUpdates();
  notifyReady(registration);
  onNewSwActive(registration, sendLoadedResources);
};
