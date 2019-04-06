import {Deferred} from 'workbox-core/_private/Deferred.mjs';


// A mapping between navigation events and their deferreds.
const navigationEventsDeferreds = new Map();

// The message listener needs to be added in the initial run of the
// service worker, but since we don't actually need to be listening for
// messages until the cache updates, we only invoke the callback if set.
self.addEventListener('message', (event) => {
  if (event.data.type === 'WINDOW_READY' &&
      navigationEventsDeferreds.size > 0) {
    // Resolve any pending deferreds.
    for (const deferred of navigationEventsDeferreds.values()) {
      deferred.resolve();
    }
    navigationEventsDeferreds.clear();
  }
});

export const windowReadyOrTimeout = (event) => {
  if (!navigationEventsDeferreds.has(event)) {
    const deferred = new Deferred();

    // Set the deferred on the `navigationEventsDeferreds` map so it will
    // be resolved when the next ready message event comes.
    navigationEventsDeferreds.set(event, deferred);

    // But don't wait too long for the message since it may never come.
    const timeout = setTimeout(() => deferred.resolve(), 3000);

    // Ensure the timeout is cleared if the deferred promise is resolved.
    deferred.promise.then(() => clearTimeout(timeout));
  }
  return navigationEventsDeferreds.get(event).promise;
};


export const messageWindows = async (data) => {
  const wins = await clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  for (const win of wins) {
    win.postMessage(data);
  }
};
