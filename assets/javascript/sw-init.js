import {Workbox} from 'workbox-window';
import {gaTest} from './analytics';
import {loadPage} from './content-loader';
import * as messages from './messages';


// Defining a Workbox instance has no side effects, so it's OK to do
// here in the top-level scope.
const wb = new Workbox('/sw.js');


export const init = async () => {
  await wb.register();

  // If this is the very first SW install, send installing SW a list of
  // URLs to cache from the Resource Timing API.
  if (!navigator.serviceWorker.controller) {
    // When a new SW is activated, tell it to cache the URLs of all loaded
    // resource, plus the current URL.
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
  }

  // Listen for cache update messages and swap out the content.
  // TODO(philipwalton): consider whether this is the best UX.
  wb.addEventListener('message', (data) => {
    if (data.type === 'CACHE_UPDATED') {
      const {updatedURL, _lastCached} = data.payload;

      // Perform an in-place update with the next content. In most cases this
      // shouldn't be very noticeable to the user, but we'll track how often
      // it occurs to get a bit more insight into any UX concerns.
      loadPage(updatedURL);

      let resourceAge = 0;
      if (_lastCached) {
        resourceAge = Math.round((new Date() - new Date(_lastCached)) / 1000);
      }
      gaTest('send', 'event', {
        eventCategory: 'Cache Update',
        eventAction: 'receive',
        eventLabel: updatedURL,
        eventValue: resourceAge,
      });
    }

    if (data.type === 'UPDATE_AVAILABLE') {
      const {updatedURLs} = data.payload;

      // TODO(philipwalton): add logic to compare page version to SW version
      // in the future, so that not all SW updates will generate a
      // notification to the user. Also, to ensure version data doesn't
      // interfere with caching, set the version in a file that you precache.
      // const {swVersion, updatedURLs} = data.payload;
      // const swMajorVersion = swVersion && Number(swVersion.split('.')[0]);
      // const pageVersion = VERSION;
      // const pageMajorVersion = Number(VERSION.split('.')[0]);

      const sendEvent = (eventAction) => {
        gaTest('send', 'event', {
          eventCategory: 'SW Update',
          eventAction,
          eventLabel: `(not set)`,
          // eventLabel: `${pageVersion} => ${swVersion}`,
          eventValue: updatedURLs.length,
        });
      };
      sendEvent('receive');

      messages.add({
        body: 'A newer version of this page exists.',
        action: 'Reload',
        onAction: async () => {
          sendEvent('reload');
          setTimeout(() => location.reload(), 4);
        },
        onDismiss: () => {
          sendEvent('dismiss');
        },
      });
    }
  });
};
