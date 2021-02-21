import {Route} from 'workbox-routing';
import {NetworkOnly} from 'workbox-strategies';
import {BackgroundSyncPlugin} from 'workbox-background-sync';


const logMatcher = ({url}) => {
  return url.hostname === location.hostname && url.pathname === '/log';
};

const logStrategy = new NetworkOnly({
  plugins: [
    new BackgroundSyncPlugin('log', {
      maxRetentionTime: 60 * 24 * 4, // Retry for 4 days.
      async onSync({queue}) {
        let entry;
        while (entry = await queue.shiftRequest()) {
          const {request} = entry;
          try {
            let firstEventTime;
            const originalBody = await request.clone().text();
            const body = originalBody.split(/\n/).map((event) => {
              const params = new URLSearchParams(event);
              if (!firstEventTime) {
                const timeOrigin = Number(params.get('epn.time_origin'));
                const pageTime = Number(params.get('epn.page_time'));
                firstEventTime = timeOrigin && pageTime &&
                    Math.round(timeOrigin + pageTime);
              }
              params.set('ep.sw_replay', true);
              return params.toString();
            }).join('\n');

            const url = new URL(request.url);
            if (firstEventTime) {
              url.searchParams.set('ht', firstEventTime);
            }
            await fetch(new Request(url, {body, method: 'POST'}));
          } catch (err) {
            await queue.unshiftRequest(entry);
            throw err;
          }
        }
      },
    }),
  ],
});

export const createLogRoute = () => {
  return new Route(logMatcher, logStrategy, 'POST');
};
