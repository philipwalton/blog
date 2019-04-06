import {StaleWhileRevalidate} from 'workbox-strategies/StaleWhileRevalidate.mjs';
import {messageWindows, windowReadyOrTimeout} from './messenger.js';


/* eslint require-jsdoc: 0 */


const requestToCachedResponseMap = new Map();


export class StaleWhileRevalidate2 extends StaleWhileRevalidate {
  constructor(...args) {
    super(...args);
    this._plugins.push({
      // Keep track of when cached responses were used vs. having to
      // fall back to the network.
      cachedResponseWillBeUsed: async ({cachedResponse, event}) => {
        if (event && event.request && event.request.mode === 'navigate') {
          requestToCachedResponseMap.set(event.request, cachedResponse);
        }
        return cachedResponse;
      },
    });
  }

  async makeRequest(options) {
    const finalResponse = await super.makeRequest(options);

    const {event} = options;
    if (event && event.request && event.request.mode === 'navigate') {
      const cachedResponse = requestToCachedResponseMap.get(event.request);
      const cacheHit = cachedResponse === finalResponse;

      const sendUpdate = async () => {
        await windowReadyOrTimeout(event);
        await messageWindows({
          type: 'NAVIGATION_REPORT',
          payload: {
            url: event.request.url,
            cacheHit,
          },
        });
      };
      event.waitUntil(sendUpdate());

      // Delete the entry as it's no longer needed.
      requestToCachedResponseMap.delete(event.request);
    }
    return finalResponse;
  }
}
