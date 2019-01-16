import {Route} from 'workbox-routing/Route.mjs';
import {StaleWhileRevalidate} from 'workbox-strategies/StaleWhileRevalidate.mjs';
import {cacheNames} from '../caches.js';

const thirdPartyAssetsMatcher = ({url}) => {
  return url.hostname !== location.hostname &&
      // Just match .js now, consider adding images and stuff later,
      // but we probably don't need to be caching videos.
      url.pathname.match(/\.(?:js)$/);
};

const thirdPartyAssetsStrategy = new StaleWhileRevalidate({
  cacheName: cacheNames.THIRD_PARTY_ASSETS,
});

export const createThirdPartyAssetsRoute = () => {
  return new Route(thirdPartyAssetsMatcher, thirdPartyAssetsStrategy);
};
