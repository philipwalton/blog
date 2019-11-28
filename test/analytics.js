const qs = require('qs');
const {initBook} = require('../tasks/utils/book');

let articles;
let pages;

const TRACKING_ID = 'UA-21292978-1';

describe('analytics', function() {
  const browserName = browser.capabilities.browserName;

  // TODO: Safari fails these tests for some reason that's hard to nail down.
  // It appears that in some cases it won't send hits using `sendBeacon()`
  // even when that transport mechanism is set. I'm not able to reproduce
  // this outside of running safari webdriver.
  if (browserName === 'safari') {
    return;
  }

  before(async () => {
    const book = await initBook();
    articles = book.articles;
    pages = book.pages;
  });

  beforeEach(async () => {
    await browser.url('/');

    await browser.execute(function() {
      window.__beacons = [];
      const originalSendBeacon = navigator.sendBeacon;
      Object.defineProperty(navigator, 'sendBeacon', {
        value: function() {
          /* eslint-disable */
          window.__beacons.push(arguments);
          return originalSendBeacon.apply(navigator, arguments);
          /* eslint-enable */
        },
      });
    });
  });

  it('should send pageview hits on pageload', async () => {
    await browser.waitUntil(async () => await beaconsContain({
      tid: TRACKING_ID,
      t: 'pageview',
      dp: '/',
    }));
  });

  it('should send pageview hits on SPA pageloads', async () => {
    await browser.waitUntil(async () => await beaconsContain({
      tid: TRACKING_ID,
      t: 'pageview',
      dp: '/',
    }));

    const articleLink = await $(`a[href="${articles[0].path}"]`);
    await articleLink.click();
    await browser.waitUntil(async () => {
      const urlPath = await getUrlPath();
      return urlPath === articles[0].path;
    });

    await browser.waitUntil(async () => {
      return await beaconsContain({
        tid: TRACKING_ID,
        t: 'pageview',
        dp: articles[0].path,
      });
    });
  });

  it('should send pageview hits on back/forward navigations', async () => {
    await browser.waitUntil(async () => await beaconsContain({
      tid: TRACKING_ID,
      t: 'pageview',
      dp: '/',
    }));

    // Load a page.

    const articleLink = await $(`a[href="${pages[1].path}"]`);
    await articleLink.click();
    await browser.waitUntil(async () => {
      return await getUrlPath() === pages[1].path;
    });

    await browser.waitUntil(async () => await beaconsContain({
      tid: TRACKING_ID,
      t: 'pageview',
      dp: pages[1].path,
    }));

    // Click 'back' to the home page

    await clearBeacons();
    await browser.back();
    await browser.waitUntil(async () => {
      return await getUrlPath() === pages[0].path;
    });

    await browser.waitUntil(async () => await beaconsContain({
      tid: TRACKING_ID,
      t: 'pageview',
      dp: pages[0].path,
    }));

    // Click 'forward' to the articles page

    await clearBeacons();
    await browser.forward();
    await browser.waitUntil(async () => {
      return await getUrlPath() == pages[1].path;
    });

    await browser.waitUntil(async () => await beaconsContain({
      tid: TRACKING_ID,
      t: 'pageview',
      dp: pages[1].path,
    }));
  });
});


/**
 * @param {Object} params
 * @return {Promise<boolean>} True if the params are found in any one of the
 *     beacons.
 */
async function beaconsContain(params) {
  const beacons = await getBeacons();

  for (const beacon of beacons) {
    const paramsToCheck = new Set(Object.keys(params));
    for (const param of paramsToCheck) {
      if (beacon[param] === params[param]) {
        paramsToCheck.delete(param);
      }
    }
    if (paramsToCheck.size === 0) {
      return true;
    }
  }
  return false;
}

/**
 * Gets the array of beacons sent for the current page load.
 * @return {Promise<Array>}
 */
async function getBeacons() {
  const beacons = await browser.execute(() => window.__beacons);
  return beacons
      .filter((args) => args[0].includes('www.google-analytics.com'))
      .map((beacon) => qs.parse(beacon[1]));
}

/**
 * Clears the array of beacons on the page.
 * @return {Promise<void>}
 */
async function clearBeacons() {
  await browser.execute(() => {
    return window.__beacons.splice(0, window.__beacons.length);
  });
}

/**
 * Gets the URL path for the given page.
 * @return {Promise<string>} The URL path.
 */
async function getUrlPath() {
  return new URL(await browser.getUrl()).pathname;
}
