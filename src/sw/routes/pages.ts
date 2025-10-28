import {Route} from 'workbox-routing/Route.js';
import {strategy as streamsStrategy} from 'workbox-streams/strategy.js';
import {contentStrategy} from './content.js';
import {precacheHandler} from '../precache.js';

import type {
  RouteHandlerCallback,
  RouteHandlerCallbackOptions,
  RouteMatchCallback,
} from 'workbox-core/types.js';

const pagesMatcher: RouteMatchCallback = ({url}) => {
  return (
    url.hostname === location.hostname &&
    (url.pathname === '/' ||
      Boolean(url.pathname.match(/^\/(?:about|articles)\/([\w-]+\/)?$/)))
  );
};

const shellStartHandler: RouteHandlerCallback = ({event}) => {
  return precacheHandler({
    request: new Request('/shell-start'),
    event,
  } as RouteHandlerCallbackOptions);
};

const contentHandler: RouteHandlerCallback = ({event, url}) => {
  return contentStrategy.handle({
    request: new Request(`${url.pathname}${(self as any).__PARTIAL_PATH__}`),
    event,
  });
};

const shellEndHandler: RouteHandlerCallback = ({event}) => {
  return precacheHandler({
    request: new Request('/shell-end'),
    event,
  } as RouteHandlerCallbackOptions);
};

const streamHandler = streamsStrategy(
  [shellStartHandler, contentHandler, shellEndHandler],
  {},
);

const pagesHandler = (opts: RouteHandlerCallbackOptions): Promise<Response> => {
  // If the request is a navigation request, assume it's going to be consumed
  // by a browser and return the full stream. Otherwise assume it's from
  // either an SPA load or a CACHE_URLS message, so only the content partial
  // needs to be returned.
  if (opts.request && opts.request.mode === 'navigate') {
    return streamHandler(opts);
  } else {
    return contentHandler(opts);
  }
};

export const createPagesRoute = (): Route => {
  return new Route(pagesMatcher, pagesHandler);
};
