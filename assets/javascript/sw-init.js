import {Workbox} from 'workbox-window/Workbox.mjs';
import {gaTest, dimensions, addPreSendDependency, trackError, NULL_VALUE} from './analytics';
import {loadPage} from './content-loader';
import * as messages from './messages';
import {initialSWState} from './sw-state';


// Defining a Workbox instance has no side effects, so it's OK to do it
// here in the top-level scope.
export const wb = new Workbox('/sw.js');

const setSiteVersionOrTimeout = async () => {
  // Set the site version, if available.
  const {version} = await new Promise((resolve) => {
    // Uncontrolled pages won't have a version.
    if (initialSWState !== 'controlled') {
      resolve({version: NULL_VALUE});
    }

    wb.messageSW({type: 'GET_METADATA'}).then(resolve);

    setTimeout(() => resolve({version: NULL_VALUE}), 3000);
  });

  gaTest('set', dimensions.SITE_VERSION, version);
};

const setNavigationCacheOrTimeout = async () => {
  // Before sending any perf data, determine whether the page was served
  // entirely cache-first.
  const {cacheHit} = await new Promise((resolve) => {
    // Uncontrolled pages can never be fully cache-first.
    if (initialSWState !== 'controlled') {
      resolve({cacheHit: false});
    }

    wb.addEventListener('message', ({data}) => {
      if (data.type === 'NAVIGATION_REPORT') {
        resolve(data.payload);
      }
    });

    setTimeout(() => resolve({cacheHit: NULL_VALUE}), 3000);
  });

  gaTest('set', dimensions.CACHE_HIT, String(cacheHit));
};


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

const addFirstInstalledListener = () => {
  wb.addEventListener('installed', (event) => {
    // `isUpdate` means this is not the first install.
    if (!event.isUpdate) {
      const urlsToCache = [
        location.href,
        ...performance.getEntriesByType('resource').map((resource) => {
          const url = resource.name;

          // The analytics.js script must be loaded with `no-cors` mode.
          if (url.includes('google-analytics.com/analytics.js')) {
            return [url, {mode: 'no-cors'}];
          } else {
            return url;
          }
        }),
      ];
      wb.messageSW({
        type: 'CACHE_URLS',
        payload: {urlsToCache},
      });
    }
  });
};


const addCacheUpdateListener = () => {
  // Listen for cache update messages and swap out the content.
  // TODO(philipwalton): consider whether this is the best UX.
  wb.addEventListener('message', ({data}) => {
    if (data.type === 'CACHE_UPDATED') {
      const {updatedURL} = data.payload;

      // Perform an in-place update with the next content. In most cases this
      // shouldn't be very noticeable to the user, but we'll track how often
      // it occurs to get a bit more insight into any UX concerns.
      loadPage(updatedURL);

      gaTest('send', 'event', {
        eventCategory: 'Cache Update',
        eventAction: 'receive',
        eventLabel: updatedURL,
      });
    }
  });
};


const addSWUpdateListener = () => {
  wb.addEventListener('message', ({data}) => {
    if (data.type === 'UPDATE_AVAILABLE') {
      // Default to showing an update message. This is helpful in the event
      // a future version causes an error parsing the message data, the
      // default will be to still show an update notification.
      let shouldNotifyUser = true;

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

      // If this is an update from a brand new SW installation, or if there
      // wasn't a major version change, log that it happened but don't notify
      // the user.
      if (newMajorVersion && newMajorVersion <= oldMajorVersion) {
        shouldNotifyUser = false;
      }

      // Never show update notifications if this is the first SW install.
      if (initialSWState !== 'controlled') {
        shouldNotifyUser = false;
      }

      if (shouldNotifyUser) {
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
      }

      // Track what happened with the udpate
      if (error) {
        trackError(error, {
          eventCategory: 'SW Update',
          eventAction: 'error',
        });
      } else {
        sendUpdateEvent(shouldNotifyUser ? 'notify' : 'receive');
      }
    }
  });
};

export const init = async () => {
  addFirstInstalledListener();
  addCacheUpdateListener();
  addSWUpdateListener();

  await wb.register();

  addPreSendDependency(setSiteVersionOrTimeout());
  addPreSendDependency(setNavigationCacheOrTimeout());
};
