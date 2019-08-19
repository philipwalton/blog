export const messageWindows = async (data) => {
  const wins = await clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  for (const win of wins) {
    win.postMessage(data);
  }
};
