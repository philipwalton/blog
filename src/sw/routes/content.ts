import {BroadcastUpdatePlugin} from 'workbox-broadcast-update/BroadcastUpdatePlugin.js';
import {resultingClientExists} from 'workbox-core/_private/resultingClientExists.js';
import {copyResponse} from 'workbox-core/copyResponse.js';
import {Route} from 'workbox-routing/Route.js';
import {StaleWhileRevalidate} from 'workbox-strategies/StaleWhileRevalidate.js';
import {cacheNames} from '../caches.js';
import {messageWindows} from '../messenger.js';
import {streamErrorPlugin} from '../plugins/streamErrorPlugin.js';

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const broadcastUpdatePlugin = new BroadcastUpdatePlugin({
  generatePayload(data: any) {
    return {
      cacheName: data.cacheName,
      updatedURL: data.request.url,
    };
  },
});

const navigationReportPlugin = {
  async cachedResponseWillBeUsed({cachedResponse, event}: any) {
    // Check `event.request` instead of `request` since the latter is a
    // code-generated request for the content partial and is not a
    // navigation request.
    if (event && event.request && event.request.mode === 'navigate') {
      const {resultingClientId} = event;

      // Don't await this promise (otherwise it would delay the response).
      resultingClientExists(resultingClientId).then(async (resultingClient) => {
        // Give browsers that don't implement `resultingClientId`` a bit of time
        // for the JS to load, since it's likely they also don't implement
        // `postMessage()` buffering.
        if (!resultingClient) {
          await sleep(3000);
        }

        messageWindows({
          type: 'NAVIGATION_REPORT',
          payload: {
            url: event.request.url,
            cacheHit: Boolean(cachedResponse),
          },
        });
      });
    }
    return cachedResponse;
  },
};

const addCacheHeadersPlugin = {
  // Add the `X-Cache-Date` header for requests going to the cache
  async cacheWillUpdate({response}: any): Promise<Response | undefined> {
    if (response.url && response.ok && response.status < 400) {
      return copyResponse(response, (responseInit) => {
        if (responseInit.headers) {
          (responseInit.headers as Headers).set('X-Cache-Date', new Date().toUTCString());
        }
        return responseInit;
      });
    }
    return undefined;
  },
};

const contentMatcher = ({url}: {url: URL}): boolean => {
  return (
    url.hostname === location.hostname &&
    url.pathname.endsWith((self as any).__PARTIAL_PATH__)
  );
};

export const contentStrategy = new StaleWhileRevalidate({
  cacheName: cacheNames.CONTENT,
  plugins: [
    streamErrorPlugin,
    addCacheHeadersPlugin,
    broadcastUpdatePlugin as any,
    navigationReportPlugin,
  ],
});

export const createContentRoute = (): Route => {
  return new Route(contentMatcher, contentStrategy);
};
