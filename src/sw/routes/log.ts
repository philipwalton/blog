import {Route} from 'workbox-routing/Route.js';
import {NetworkOnly} from 'workbox-strategies/NetworkOnly.js';
import {BackgroundSyncPlugin} from 'workbox-background-sync/BackgroundSyncPlugin.js';

import type {RouteMatchCallback, WorkboxPlugin} from 'workbox-core/types';

const logMatcher: RouteMatchCallback = ({url}) => {
  return url.hostname === location.hostname && url.pathname === '/log';
};

const logStrategy = new NetworkOnly({
  plugins: [
    new BackgroundSyncPlugin('log', {
      maxRetentionTime: 60 * 24 * 4, // Retry for 4 days.
      async onSync({queue}) {
        let entry;
        while ((entry = await queue.shiftRequest())) {
          const {request} = entry;
          try {
            let firstEventTime: number | undefined;
            const originalBody = await request.clone().text();
            const body = originalBody
              .split(/\n/)
              .map((event: string) => {
                const params = new URLSearchParams(event);
                if (!firstEventTime) {
                  const timeOrigin = Number(params.get('epn.time_origin'));
                  const pageTime = Number(params.get('epn.page_time'));
                  firstEventTime =
                    timeOrigin && pageTime && Math.round(timeOrigin + pageTime);
                }
                params.set('ep.sw_replay', 'true');
                return params.toString();
              })
              .join('\n');

            const url = new URL(request.url);
            if (firstEventTime) {
              url.searchParams.set('ht', firstEventTime.toString());
            }
            await fetch(new Request(url, {body, method: 'POST'}));
          } catch (err) {
            await queue.unshiftRequest(entry);
            throw err;
          }
        }
      },
    }) as WorkboxPlugin,
  ],
});

export const createLogRoute = (): Route => {
  return new Route(logMatcher, logStrategy, 'POST');
};
