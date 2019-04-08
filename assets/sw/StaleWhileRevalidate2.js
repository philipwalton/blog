import {StaleWhileRevalidate} from 'workbox-strategies/StaleWhileRevalidate.mjs';
import {isSupported as streamsAreSupported} from 'workbox-streams/isSupported.mjs';
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
        if (cachedResponse) {
          if (event && event.request && event.request.mode === 'navigate') {
            requestToCachedResponseMap.set(event.request, cachedResponse);
          } else {
            // Add a custom header to the response indicating
            const newHeaders = new Headers(cachedResponse.headers);
            newHeaders.append('X-Cache-Hit', '1');

            // Not all browsers support the Response.body stream, so fall back
            // to reading the entire body into memory as text.
            // NOTE: Edge 18 claims supports for the Response.body steam, but
            // it fails when trying to create a new response from that stream,
            // so we instead check the `workbox-streams` support method.
            const body = streamsAreSupported() ?
                cachedResponse.body : await cachedResponse.blob();

            const newResponse = new Response(body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: newHeaders,
            });

            cachedResponse = newResponse;
          }
          return cachedResponse;
        }
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
