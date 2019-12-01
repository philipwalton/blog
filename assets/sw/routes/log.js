import {Route} from 'workbox-routing';
import {NetworkOnly} from 'workbox-strategies';
import {BackgroundSyncPlugin} from 'workbox-background-sync';


const SERVICE_WORKER_REPLAY_DIMENSION = 'cd8';

const logMatcher = ({url}) => {
  return url.hostname === location.hostname && url.pathname === '/log';
};

const logStrategy = new NetworkOnly({
  plugins: [
    new BackgroundSyncPlugin('log', {
      maxRetentionTime: 60 * 24 * 2, // Retry for 2 days.
      async onSync({queue}) {
        let entry;
        while (entry = await queue.shiftRequest()) {
          const {request} = entry;
          try {
            const params = new URLSearchParams(await request.clone().text());
            params.set(SERVICE_WORKER_REPLAY_DIMENSION, 'replay');

            await fetch(new Request(request.url, {
              body: params.toString(),
              method: 'POST',
            }));
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
