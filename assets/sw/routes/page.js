/* global __SHELL_START_PATH__, __SHELL_END_PATH__ */

import {Route} from 'workbox-routing/Route.mjs';
import {strategy as streamsStrategy} from 'workbox-streams/strategy.mjs';
import {contentStrategy} from './content.js';
import {shellStrategy} from './shell.js';


const shellStartPath = __SHELL_START_PATH__;
const shellEndPath = __SHELL_END_PATH__;

const pageMatcher = ({url}) => {
  return url.hostname === location.hostname &&
      (url.pathname === '/' ||
      url.pathname.match(/^\/(?:about|articles)\/([\w-]+\/)?$/));
};

const contentHandler = ({event, url}) => {
  return contentStrategy.makeRequest({
    request: `${url.pathname}index.content.html`,
    event,
  });
};

const streamHandler = streamsStrategy([
  ({event}) => shellStrategy.makeRequest({request: shellStartPath, event}),
  contentHandler,
  ({event}) => shellStrategy.makeRequest({request: shellEndPath, event}),
]);

const pageHandler = (opts) => {
  // If the request is a navigation request, assume it's going to be consumed
  // by a browser and return the full stream. If the request is from a
  // CACHE_URLS message, only the content partial needs to be cached.
  if (opts.request && opts.request.mode === 'navigate') {
    return streamHandler(opts);
  } else {
    return contentHandler(opts);
  }
};

export const createPageRoute = () => {
  return new Route(pageMatcher, pageHandler);
};
