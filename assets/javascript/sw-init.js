import {Workbox} from 'workbox-window';
import {gaTest, trackError, NULL_VALUE} from './analytics';
import {loadPage} from './content-loader';
import * as messages from './messages';


// Defining a Workbox instance has no side effects, so it's OK to do
// here in the top-level scope.
const wb = new Workbox('/sw.js');

const isFirstSWInstall = !navigator.serviceWorker.controller;


/**
 * Accepts a payload of data from the SW, processes the data, and returns
 * the bits relevant for the code from this version of the site.
 * Note that the data we get from the SW *might* be from a future version of
 * the site, so we can't make too many assumptions about the format, which
 * is why we wrap everything in a try/catch block, and simply return the error
 * if one occurs.
 * @param {Object} payload
 * @return {Object}
 */
const processMetadata = (payload = {}) => {
  try {
    const {oldMetadata, newMetadata} = payload;

    const oldVersion = oldMetadata.version || '';
    const newVersion = newMetadata.version || '';
    const oldMajorVersion = Number(oldVersion.split('.')[0]);
    const newMajorVersion = Number(newVersion.split('.')[0]);

    const {buildTime} = newMetadata;
    const timeSinceNewVersionDeployed = Date.now() - buildTime;

    return {
      oldVersion,
      oldMajorVersion,
      newVersion,
      newMajorVersion,
      timeSinceNewVersionDeployed,
    };
  } catch (error) {
    return {error};
  }
};

const cacheResources = () => {
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
};


const addCacheUpdateListener = () => {
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
  });
};


const addSWUpdateListener = () => {
  wb.addEventListener('message', (data) => {
    if (data.type === 'UPDATE_AVAILABLE') {
      let shouldNotifyUser;
      const {
        oldVersion,
        oldMajorVersion,
        newVersion,
        newMajorVersion,
        timeSinceNewVersionDeployed,
        error,
      } = processMetadata(data.payload);

      const sendUpdateEvent = (eventAction) => {
        gaTest('send', 'event', {
          eventCategory: 'SW Update',
          eventAction,
          eventValue: timeSinceNewVersionDeployed || 0,
          eventLabel: newVersion ?
              `${oldVersion || NULL_VALUE} => ${newVersion}` : NULL_VALUE,
        });
      };

      if (error) {
        trackError(error, {
          eventCategory: 'SW Update',
          eventAction: 'error',
        });
        shouldNotifyUser = true;
      }

      // If this is an update from a brand new SW installation, or if there
      // wasn't a major version change, log that it happened but don't notify
      // the user.
      if (!isFirstSWInstall && newMajorVersion > oldMajorVersion) {
        shouldNotifyUser = true;
      }

      if (shouldNotifyUser) {
        sendUpdateEvent('notify');
        messages.add({
          body: 'A newer version of this site is available.',
          action: 'Reload',
          onAction: async () => {
            sendUpdateEvent('reload');
            setTimeout(() => location.reload(), 0);
          },
          onDismiss: () => {
            sendUpdateEvent('dismiss');
          },
        });
      } else {
        sendUpdateEvent('receive');
      }
    }
  });
};

export const init = async () => {
  await wb.register();

  addCacheUpdateListener();
  addSWUpdateListener();

  // If this is the very first SW install, send the installing SW a list of
  // URLs to cache from the Resource Timing API.
  if (isFirstSWInstall) {
    cacheResources();
  }
};
