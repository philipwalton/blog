import {BroadcastUpdatePlugin} from 'workbox-broadcast-update/BroadcastUpdatePlugin.js';
import {resultingClientExists} from 'workbox-core/_private/resultingClientExists.js';
import {copyResponse} from 'workbox-core/copyResponse.js';
import {Route} from 'workbox-routing/Route.js';
import {StaleWhileRevalidate} from 'workbox-strategies/StaleWhileRevalidate.js';
import {cacheNames} from '../caches.js';
import {messageWindows} from '../messenger.js';
import {streamErrorPlugin} from '../plugins/streamErrorPlugin.js';

import type {RouteMatchCallback, WorkboxPlugin} from 'workbox-core/types';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const broadcastUpdatePlugin = new BroadcastUpdatePlugin({
  generatePayload(data: any) {
    return {
      cacheName: data.cacheName,
      updatedURL: data.request.url,
    };
  },
});

const navigationReportPlugin: WorkboxPlugin = {
  async cachedResponseWillBeUsed({cachedResponse, event}) {
    // Check `event.request` instead of `request` since the latter is a
    // code-generated request for the content partial and is not a
    // navigation request.
    if (event instanceof FetchEvent && event.request.mode === 'navigate') {
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

const addCacheHeadersPlugin: WorkboxPlugin = {
  // Add the `X-Cache-Date` header for requests going to the cache
  async cacheWillUpdate({response}) {
    if (response.url && response.ok && response.status < 400) {
      return copyResponse(response, (responseInit) => {
        // The `copyResponse()` function creates `responseInit.headers`
        // as a real `Headers` object.
        (responseInit.headers as Headers).set(
          'X-Cache-Date',
          new Date().toUTCString(),
        );
        return responseInit;
      });
    }
  },
};

const contentMatcher: RouteMatchCallback = ({url}) => {
  return (
    url.hostname === location.hostname &&
    url.pathname.endsWith(self.__PARTIAL_PATH__)
  );
};

export const contentStrategy = new StaleWhileRevalidate({
  cacheName: cacheNames.CONTENT,
  plugins: [
    streamErrorPlugin,
    addCacheHeadersPlugin,
    broadcastUpdatePlugin as WorkboxPlugin,
    navigationReportPlugin,
  ],
});

export const createContentRoute = (): Route => {
  return new Route(contentMatcher, contentStrategy);
};
