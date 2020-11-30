import {Workbox} from 'workbox-window/Workbox.mjs';
import {loadPage} from './content-loader';
import {initialSWState} from './sw-state';
import {disableLoader} from './content-loader';

/* global CD_SITE_VERSION */
/* global CD_CACHE_HIT */


// Defining a Workbox instance has no side effects, so it's OK to do it
// here in the top-level scope.
let wb;


const MESSAGE_TIMEOUT = 5000;


// A promise that resolves when the navigation report is received.
// NOTE: this needs to be here because the `message` event listener needs
// to be added before DOMContentLoaded fires (or it may be missed).
let navigationReportPromise;
const addNavigationReportListener = () => {
  navigationReportPromise = new Promise((resolve) => {
    wb.addEventListener('message', ({data}) => {
      if (data.type === 'NAVIGATION_REPORT') {
        resolve(data.payload);
      }
    });
  });
};


const setSiteVersionOrTimeout = async () => {
  const {log} = await import('./log');

  // Set the site version, if available.
  const {version} = await new Promise((resolve) => {
    // Uncontrolled pages won't have a version.
    if (initialSWState !== 'controlled') {
      resolve({version: null});
    }

    wb.messageSW({type: 'GET_METADATA'}).then(resolve);

    setTimeout(() => resolve({version: null}), MESSAGE_TIMEOUT);
  });

  if (version !== null) {
    log.set({[CD_SITE_VERSION]: version});
  }
};


const setNavigationCacheOrTimeout = async () => {
  const {log} = await import('./log');

  // Before sending any perf data, determine whether the page was served
  // entirely cache-first.
  const {cacheHit} = await new Promise((resolve) => {
    // Uncontrolled pages can never be fully cache-first.
    if (initialSWState !== 'controlled') {
      resolve({cacheHit: false});
    } else {
      // Otherwise, resolve with the navigation report promise or timeout.
      navigationReportPromise.then(resolve);
      setTimeout(() => resolve({cacheHit: null}), MESSAGE_TIMEOUT);
    }
  });

  if (cacheHit !== null) {
    log.set({[CD_CACHE_HIT]: String(cacheHit)});
  }
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


/**
 * Forces a page reload when the user backgrounds the tab without closing it.
 */
const forceReloadOnHidden = () => {
  const reloadOnHidden = () => {
    if (document.visibilityState === 'hidden') {
      removeEventListener('visibilitychange', reloadOnHidden, true);
      location.reload();
    }
  };
  addEventListener('visibilitychange', reloadOnHidden, true);
  addEventListener('pagehide', () => {
    if (!event.persisted) {
      removeEventListener('visibilitychange', reloadOnHidden, true);
    }
  });
};


const addInstallListener = () => {
  wb.addEventListener('installed', (event) => {
    // `isUpdate` means this is not the first install.
    if (event.isUpdate) {
      // Any time there's a SW update we want to disable SPA loads, since
      // a SW update means the code running on this page may be out of date
      // and we want the user to update as soon as they can.
      disableLoader();

      // We also want to force a reload of the tab if the tab is backgrounded.
      forceReloadOnHidden();
    } else {
      // On the first install, send a list of URLs to cache to the SW.
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

      const {log} = await import('./log');
      log.send('event', {
        ec: 'Service Worker',
        ea: 'cache-update',
        el: updatedURL,
        ni: '1',
      });
    }
  });
};


const addSWUpdateListener = () => {
  wb.addEventListener('message', async ({data}) => {
    if (data && data.type === 'UPDATE_AVAILABLE') {
      const {log} = await import('./log');

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

      const sendEvent = (ec, ea) => {
        const params = {
          ec,
          ea,
          ev: timeSinceNewVersionDeployed || 0,
          ni: '1',
        };

        if (newVersion) {
          params.el = `${oldVersion || '(not set)'} => ${newVersion}`;
        }

        log.send('event', params);
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
  // Instantiating the Workbox instance adds an event listener to
  // `navigator.serviceWorker`, which will be undefined in older browsers.
  wb = new Workbox('/sw.js');

  addNavigationReportListener();
  addInstallListener();
  addCacheUpdateListener();
  addSWUpdateListener();

  const {log} = await import('./log');
  log.awaitBeforeSending(setSiteVersionOrTimeout());
  log.awaitBeforeSending(setNavigationCacheOrTimeout());

  // Calling register must happen after all presend dependencies get added.
  await wb.register();
};
