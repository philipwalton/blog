import {Route} from 'workbox-routing/Route.js';
import {strategy as streamsStrategy} from 'workbox-streams/strategy.js';
import {contentStrategy} from './content.js';
import {precacheHandler} from '../precache.js';


const pagesMatcher = ({url}) => {
  return url.hostname === location.hostname &&
      (url.pathname === '/' ||
      url.pathname.match(/^\/(?:about|articles)\/([\w-]+\/)?$/));
};

const contentHandler = ({event, url}) => {
  return contentStrategy.handle({
    request: new Request(`${url.pathname}index.content.html`),
    event,
  });
};

const streamHandler = streamsStrategy([
  ({event}) => precacheHandler({
    request: new Request('/shell-start.html'),
    event,
  }),
  contentHandler,
  ({event}) => precacheHandler({
    request: new Request('/shell-end.html'),
    event,
  }),
]);

const pagesHandler = (opts) => {
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

export const createPagesRoute = () => {
  return new Route(pagesMatcher, pagesHandler);
};
