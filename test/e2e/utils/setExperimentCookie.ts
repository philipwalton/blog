export async function setExperimentCookie(value: string) {
  await browser.setCookies({
    name: 'xid',
    value: value,
    path: '/',
    expiry: Math.floor(Date.now() / 1000 + 60 * 60 * 24 * 365),
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  });
}
