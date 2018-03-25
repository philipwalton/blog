const qs = require('qs');
const {initBook} = require('../tasks/utils/book');


let articles;
let pages;

const prodTid = 'UA-21292978-1';
const testTid = 'UA-21292978-3';


describe('analyitcs', async () => {
  before(async () => {
    const book = await initBook();
    articles = book.articles;
    pages = book.pages;
  });

  beforeEach(() => {
    browser.url('/');

    // In development and test mode, this script is inserted into the head of
    // the page so it runs before anything else. In production mode, we can't
    // test that, so we only test the hits after the initial pageviews.
    if (process.env.NODE_ENV === 'production') {
      browser.execute(function() {
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
    }
  });

  it('should send pageview hits on pageload', () => {
    if (process.env.NODE_ENV !== 'production') {
      browser.waitUntil(() => beaconsContain({
        tid: prodTid,
        t: 'pageview',
        dp: '/',
      }));

      browser.waitUntil(() => beaconsContain({
        tid: testTid,
        t: 'pageview',
        dp: '/',
      }));
    }
  });

  it('should send pageview hits on SPA pageloads', () => {
    if (process.env.NODE_ENV !== 'production') {
      browser.waitUntil(() => beaconsContain({
        tid: prodTid,
        t: 'pageview',
        dp: '/',
      }));

      browser.waitUntil(() => beaconsContain({
        tid: testTid,
        t: 'pageview',
        dp: '/',
      }));
    }

    browser.click(`a[href="${articles[0].path}"]`);
    browser.waitUntil(() => getUrlPath() == articles[0].path);

    browser.waitUntil(() => beaconsContain({
      tid: prodTid,
      t: 'pageview',
      dp: articles[0].path,
    }));

    browser.waitUntil(() => beaconsContain({
      tid: testTid,
      t: 'pageview',
      dp: articles[0].path,
    }));
  });

  it('should send pageview hits on back/forward navigations', () => {
    if (process.env.NODE_ENV !== 'production') {
      browser.waitUntil(() => beaconsContain({
        tid: prodTid,
        t: 'pageview',
        dp: '/',
      }));

      browser.waitUntil(() => beaconsContain({
        tid: testTid,
        t: 'pageview',
        dp: '/',
      }));
    }

    // Load articles page.

    browser.click(`a[href="${pages[1].path}"]`);
    browser.waitUntil(() => getUrlPath() == pages[1].path);

    browser.waitUntil(() => beaconsContain({
      tid: prodTid,
      t: 'pageview',
      dp: pages[1].path,
    }));

    browser.waitUntil(() => beaconsContain({
      tid: testTid,
      t: 'pageview',
      dp: pages[1].path,
    }));

    // Click 'back' to the home page

    clearBeacons();
    browser.back();
    browser.waitUntil(() => getUrlPath() == pages[0].path);

    browser.waitUntil(() => beaconsContain({
      tid: prodTid,
      t: 'pageview',
      dp: pages[0].path,
    }));

    browser.waitUntil(() => beaconsContain({
      tid: testTid,
      t: 'pageview',
      dp: pages[0].path,
    }));

    // Click 'forward' to the articles page

    clearBeacons();
    browser.forward();
    browser.waitUntil(() => getUrlPath() == pages[1].path);

    browser.waitUntil(() => beaconsContain({
      tid: prodTid,
      t: 'pageview',
      dp: pages[1].path,
    }));

    browser.waitUntil(() => beaconsContain({
      tid: testTid,
      t: 'pageview',
      dp: pages[1].path,
    }));
  });
});


/**
 * @param {!Object} params
 * @return {boolean} True if the params are found in any one of the beacons.
 */
const beaconsContain = (params) => {
  const beacons = getBeacons();

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
};

/**
 * Gets the array of beacons sent for the current page load.
 * @return {Array}
 */
const getBeacons = () => {
  const {value: beacons} = browser.execute(() => window.__beacons);
  return beacons.map((beacon) => qs.parse(beacon[1]));
};

/**
 * Clears the array of beacons on the page.
 */
const clearBeacons = () => {
  browser.execute(() => window.__beacons.splice(0, window.__beacons.length));
};

/**
 * Gets the URL path for the given page.
 * @return {string} The URL path.
 */
const getUrlPath = () => {
  // Don't use an arrow function since this is eval'ed in test browsers.
  const {value: urlPath} = browser.execute(function() {
    return location.pathname;
  });
  return urlPath;
};
