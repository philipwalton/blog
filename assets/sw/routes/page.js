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

const pageHandler = streamsStrategy([
  ({event}) => shellStrategy
      .makeRequest({request: shellStartPath, event}),
  ({event, url}) => contentStrategy
      .makeRequest({request: `${url.pathname}index.content.html`, event}),
  ({event}) => shellStrategy
      .makeRequest({request: shellEndPath, event}),
]);

export const createPageRoute = () => {
  return new Route(pageMatcher, pageHandler);
};
