export const messageWindows = async (data) => {
  // This `includeUncontrolled` flag is needed because we're in the
  // install event, which means this SW is not yet controlling the page.
  const wins = await clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  for (const win of wins) {
    win.postMessage(data);
  }
};
