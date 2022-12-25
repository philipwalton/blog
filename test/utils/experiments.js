/**
 * @param {string} value
 * @returns {Promise}
 */
export async function setExperimentCookie(value) {
  await browser.setCookies({
    name: 'xid',
    value: value,
    path: '/',
    expiry: Math.floor(Date.now() / 1000 + 60 * 60 * 24 * 365),
    secure: true,
    httpOnly: true,
    sameSite: 'Strict',
  });
}

/**
 * @returns {Promise}
 */
export async function clearExperimentCookie() {
  await browser.deleteCookies(['xid']);
  await browser.url('/__reset__');
  await browser.waitUntil(async () => {
    return await browser.execute(() => {
      return window.__ready__ === true;
    });
  });
}
