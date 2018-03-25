import {Route} from 'workbox-routing/Route.mjs';
import {strategy} from 'workbox-streams/strategy.mjs';
import {contentStrategy} from './content.js';
import {shellStrategy} from './shell.js';


const pageMatcher = ({url}) => {
  return url.hostname === location.hostname &&
      (url.pathname === '/' ||
      url.pathname.match(/^\/(?:about|articles)\/([\w-]+\/)?$/));
};

const pageHandler = strategy([
  ({event}) => shellStrategy
      .makeRequest({request: `/shell-start.html`, event}),
  ({event, url}) => contentStrategy
      .makeRequest({request: `${url.pathname}index.content.html`, event}),
  ({event}) => shellStrategy
      .makeRequest({request: `/shell-end.html`, event}),
]);

export const createPageRoute = () => {
  return new Route(pageMatcher, pageHandler);
};
