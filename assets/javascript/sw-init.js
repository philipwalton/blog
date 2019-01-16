import {parseUrl} from 'dom-utils';
import {Workbox} from 'workbox-window';
import {gaTest} from './analytics';
import * as messages from './messages';


// We don't want to show a message that there's newer content more than once.
// per page load. This is especially important in the case where we receive
// multiple content partial cache updated messages with large time gaps
// between them.
let updateMessageShownThisPageload = false;


const sendUpdateEvent = (eventAction, eventLabel) => {
  gaTest('send', 'event', {
    eventCategory: 'Cache Update',
    eventAction: eventAction,
    eventLabel: eventLabel,
  });
};

export const init = async () => {
  const wb = new Workbox('/sw.js');
  wb.register();

  // When a new SW is activated, tell it to cache the URLs of all loaded
  // resource, plus the current URL.
  wb.addEventListener('activated', () => {
    const urlsToCache = [
      location.href,
      ...performance.getEntriesByType('resource').map((resource) => {
        const url = resource.name;

        // The analytics.js script must be loaded with `no-cors` mode.
        if (url.includes('google-analytics.com/analytics.js')) {
          return {url, mode: 'no-cors'};
        } else {
          return url;
        }
      }),
    ];
    wb.messageSW({
      type: 'CACHE_URLS',
      meta: 'workbox-window',
      payload: {urlsToCache},
    });
  });

  // Listen for cache update messages and show a notice to the user.
  wb.addEventListener('message', (data) => {
    if (data.type === 'CACHE_UPDATED') {
      const updatedURL = parseUrl(data.payload.updatedURL).pathname;

      if (!updateMessageShownThisPageload) {
        sendUpdateEvent('notify', updatedURL);
        messages.add({
          body: 'A newer version of this page exists.',
          action: 'Reload',
          onAction: () => {
            sendUpdateEvent('reload', updatedURL);
            location.reload();
          },
          onDismiss: () => {
            sendUpdateEvent('dismiss', updatedURL);
          },
        });

        updateMessageShownThisPageload = true;
      } else {
        sendUpdateEvent('receive', updatedURL);
      }
    }
  });
};
