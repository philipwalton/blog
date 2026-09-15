export async function setExperimentCookie(value: string) {
  // Use Classic WebDriver to set an unpartitioned cookie, matching the worker's
  // Set-Cookie header. WebdriverIO's BiDi setCookies creates a partitioned cookie
  // that can coexist with the worker's randomly assigned xid.
  await browser.addCookie({
    name: 'xid',
    value: value,
    path: '/',
    expiry: Math.floor(Date.now() / 1000 + 60 * 60 * 24 * 365),
    secure: true,
    httpOnly: true,
    sameSite: 'Strict',
  });
}
