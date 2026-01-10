declare global {
  interface Window {
    __ready__?: boolean;
  }
}

/**
 * @returns {Promise<void>}
 */
export async function clearStorage() {
  await browser.deleteCookies();
  await browser.url('/__reset');
  await browser.waitUntil(async () => {
    return await browser.execute(() => {
      return window.__ready__ === true;
    });
  });
}
