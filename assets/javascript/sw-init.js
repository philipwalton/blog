import {Workbox} from 'workbox-window/Workbox.mjs';
import {loadPage} from './content-loader';
import {initialSWState} from './sw-state';
import {NULL_GA_VALUE} from './constants';


// Defining a Workbox instance has no side effects, so it's OK to do it
// here in the top-level scope.
export const wb = new Workbox('/sw.js');


const MESSAGE_TIMEOUT = 5000;


const setSiteVersionOrTimeout = async () => {
  const {ga, dimensions} = await import('./log');

  // Set the site version, if available.
  const {version} = await new Promise((resolve) => {
    // Uncontrolled pages won't have a version.
    if (initialSWState !== 'controlled') {
      resolve({version: NULL_GA_VALUE});
    }

    wb.messageSW({type: 'GET_METADATA'}).then(resolve);

    setTimeout(() => resolve({version: NULL_GA_VALUE}), MESSAGE_TIMEOUT);
  });

  ga('set', dimensions.SITE_VERSION, version);
};


const setNavigationCacheOrTimeout = async () => {
  const {ga, dimensions} = await import('./log');

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

    setTimeout(() => resolve({cacheHit: NULL_GA_VALUE}), MESSAGE_TIMEOUT);
  });

  ga('set', dimensions.CACHE_HIT, String(cacheHit));
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
        ...performance.getEntriesByType('resource').map((r) => r.name),
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
  wb.addEventListener('message', async ({data}) => {
    if (data && data.type === 'CACHE_UPDATED') {
      const {updatedURL} = data.payload;

      // Perform an in-place update with the next content. In most cases this
      // shouldn't be very noticeable to the user, but we'll track how often
      // it occurs to get a bit more insight into any UX concerns.
      loadPage(updatedURL);

      const {ga} = await import('./log');
      ga('send', 'event', {
        eventCategory: 'Service Worker',
        eventAction: 'cache-update',
        eventLabel: updatedURL,
      });
    }
  });
};


const addSWUpdateListener = () => {
  wb.addEventListener('message', async ({data}) => {
    if (data && data.type === 'UPDATE_AVAILABLE') {
      const {ga} = await import('./log');

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
      } = processMetadata(data.payload);

      const sendEvent = (eventCategory, eventAction) => {
        ga('send', 'event', {
          eventCategory,
          eventAction,
          eventValue: timeSinceNewVersionDeployed || 0,
          eventLabel: newVersion ?
              `${oldVersion || NULL_GA_VALUE} => ${newVersion}` : NULL_GA_VALUE,
        });
      };

      sendEvent('Service Worker', 'sw-update');

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
        const messages = await import('./messages');
        messages.add({
          body: 'A newer version of this site is available.',
          action: 'Reload',
          onAction: async () => {
            sendEvent('Messages', 'sw-update-reload');
            setTimeout(() => location.reload(), 0);
          },
          onDismiss: () => {
            sendEvent('Messages', 'sw-update-dismiss');
          },
        });
        sendEvent('Messages', 'sw-update-notify');
      }
    }
  });
};

export const init = async () => {
  addFirstInstalledListener();
  addCacheUpdateListener();
  addSWUpdateListener();

  const {addPreSendDependency} = await import('./log');
  addPreSendDependency(setSiteVersionOrTimeout());
  addPreSendDependency(setNavigationCacheOrTimeout());

  // Calling register must happen after all presendDependencies get added.
  await wb.register();
};
