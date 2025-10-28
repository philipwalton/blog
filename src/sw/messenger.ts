// Give TypeScript the correct global.
declare const self: ServiceWorkerGlobalScope;

export const messageWindows = async <T>(data: T): Promise<void> => {
  const wins = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  for (const win of wins) {
    win.postMessage(data);
  }
};
