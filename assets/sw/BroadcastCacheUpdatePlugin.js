import {responsesAreSame}
    from 'workbox-broadcast-cache-update/utils/responsesAreSame.mjs';

import {logger} from 'workbox-core/_private/logger.mjs';


/**
 * Use this until the workbox-broadcast-cache-update plugin support navigation
 * requests: https://github.com/GoogleChrome/workbox/issues/1399
 */
export class BroadcastCacheUpdatePlugin {
  /**
   * {{deferNoticationTimeout: number}=} param1
   */
  constructor({deferNoticationTimeout} = {}) {
    this._deferNoticationTimeout = deferNoticationTimeout || 0;

    // The message listener needs to be added in the initial run of the
    // service worker, but since we don't actually need to be listening for
    // messages until the cache updates, we only invoke the callback if set.
    this._onReadyMessageCallback = null;
    self.addEventListener('message', (event) => {
      if (event.data.type === 'WINDOW_READY') {
        if (this._onReadyMessageCallback) {
          if (process.env.NODE_ENV !== 'production') {
            logger.debug(`Received WINDOW_READY event: `, event);
          }
          this._onReadyMessageCallback();
        }
      }
    });
  }

  /**
   * @param {!Object} param1 See workbox plugins for details.
   */
  async cacheDidUpdate({cacheName, oldResponse, newResponse, request, event}) {
    if (oldResponse && newResponse &&
        !responsesAreSame(oldResponse, newResponse, ['ETag'])) {
      if (process.env.NODE_ENV !== 'production') {
        logger.log('Newer response found (and cached) for:', request);
      }

      // A ready promise to await. In the case of a navigation request, the
      // requesting page will likely not have loaded its JavaScript in time to
      // recevied the update notification, so we defer it until ready (or we
      // timeout waiting).
      let readyToSendUpdate;

      if (event && event.request.mode === 'navigate') {
        readyToSendUpdate = new Promise((resolve) => {
          if (process.env.NODE_ENV !== 'production') {
            logger.debug(`Original request was a navigation request, ` +
                `waiting for a ready message from the window`, event.request);
          }

          let timeout;

          // Set a callback so that if a message comes in within the next
          // few seconds the promise will resolve.
          this._onReadyMessageCallback = () => {
            this._onReadyMessageCallback = null;
            clearTimeout(timeout);
            resolve();
          };

          // But don't wait too long for the message since it may never come.
          timeout = setTimeout(() => {
            if (process.env.NODE_ENV !== 'production') {
              logger.debug(`Timed out after ${this._deferNoticationTimeout}` +
                  `ms waiting for message from window`);
            }
            resolve();
          }, this._deferNoticationTimeout);
        });
      }

      const notifyWhenReady = async () => {
        await readyToSendUpdate;
        notifyWindows(request.url, cacheName);
      };

      event.waitUntil(notifyWhenReady());
    }
  }
}

/**
 * @param {string} url
 * @param {string} cacheName
 */
const notifyWindows = async (url, cacheName) => {
  const windows = await clients.matchAll({type: 'window'});

  for (const win of windows) {
    win.postMessage({
      type: 'CACHE_UPDATED',
      meta: 'workbox-broadcast-cache-update',
      payload: {
        cacheName: cacheName,
        updatedUrl: url,
      },
    });
  }
};
