const fs = require('fs-extra');
const assert = require('assert').strict;
const {initBook} = require('../tasks/utils/book');
const {dimensions} = require('../functions/log');

let articles;
let pages;

const LOG_FILE = 'beacons.log';


describe('analytics', function() {
  before(async () => {
    const book = await initBook();
    articles = book.articles;
    pages = book.pages;
  });

  beforeEach(async () => {
    await clearBeacons();
    await browser.url('/');
  });

  it('should send pageview hits on pageload', async () => {
    await browser.waitUntil(async () => await beaconsContain({
      t: 'pageview',
      dp: '/',
    }));
  });

  it('should include ALL required measurement protocol parameters', async () => {
    await browser.waitUntil(async () => await beaconsContain({
      t: 'pageview',
      dp: '/',
    }));

    const beacons = await getBeacons();
    for (const beacon of beacons) {
      assert.strictEqual(beacon.get('v'), '1');
      assert.strictEqual(beacon.get('tid'), 'UA-21292978-1');

      assert(beacon.get(dimensions.CD_HIT_ID).match(
          /\w{8}-\w{4}-4\w{3}-[89aAbB]\w{3}-\w{12}/));

      assert(beacon.get('uip').length > 0);

      assert.strictEqual(beacon.get('ht'), null);
      assert(beacon.get('qt').match(/\d+/));

      assert.strictEqual(beacon.get(dimensions.CD_HIT_TYPE), beacon.get('t'));

      // // Ensure all custom dimensions have a value
      for (const param of Object.values(dimensions)) {
        assert.notStrictEqual(beacon.get(param), null);
      }

      // Ensure (for event hits), all event dimensions have a value
      if (beacon.get('t') === 'event') {
        for (const param of ['ec', 'ea', 'el']) {
          assert.notStrictEqual(beacon.get(param), null);
        }
      }
    }
  });

  it('should send pageview hits on SPA pageloads', async () => {
    await browser.waitUntil(async () => await beaconsContain({
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
        t: 'pageview',
        dp: articles[0].path,
      });
    });
  });

  it('should send pageview hits on back/forward navigations', async () => {
    await browser.waitUntil(async () => await beaconsContain({
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
      if (beacon.get(param) === params[param]) {
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
  const beacons = await fs.readFile(LOG_FILE, 'utf-8');
  return beacons.trim().split('\n').map((b) => new URLSearchParams(b));
}

/**
 * Clears the array of beacons on the page.
 * @return {Promise<void>}
 */
async function clearBeacons() {
  await fs.remove(LOG_FILE);
}

/**
 * Gets the URL path for the given page.
 * @return {Promise<string>} The URL path.
 */
async function getUrlPath() {
  return new URL(await browser.getUrl()).pathname;
}
