const assert = require('assert').strict;
const {initBook} = require('../tasks/utils/book');
const {dimensions} = require('../functions/constants');
const {beaconsContain, clearBeacons, getBeacons} = require('./utils/beacons');


let articles;
let pages;

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
      'v': '2',
      'en': 'page_view',
      'ep.page_path': '/',
    }));
    await browser.waitUntil(async () => await beaconsContain({
      v: '1',
      t: 'pageview',
      dp: '/',
    }));
  });

  it('should include all relevant parameters', async () => {
    await browser.waitUntil(async () => (await getBeacons()).length > 2);

    const beacons = await getBeacons();
    for (const beacon of beacons) {
      const v = beacon.get('v');
      assert(v === '2' || v === '1');

      // MPv2
      if (v === '2') {
        assert.strictEqual(beacon.get('v'), '2');
        assert.strictEqual(beacon.get('tid'), 'G-GVKBFZ3VDY');
        assert.match(beacon.get('cid'), /^\d{13}-\d{13}$/);

        assert.strictEqual(beacon.get('epn.pageshow_count'), '1');
        assert.strictEqual(beacon.get('ep.original_page_path'), '/');
        assert.match(beacon.get('epn.measurement_version'), /\d+/);
        assert.match(beacon.get('ep.navigation_type'),
            /(navigate|reload|route_change)/);
        assert.match(beacon.get('ep.visibility_state'),
            /(visible|hidden)/);

        assert(beacon.get('epn.time_origin') <= Date.now());
        assert(beacon.get('epn.time_origin') > Date.now() - (60 * 1000));
        assert(beacon.get('epn.page_time') > 0);
        assert(beacon.get('epn.page_time') < 60 * 1000);
      }

      // MPv1
      if (v === '1') {
        assert.strictEqual(beacon.get('v'), '1');
        assert.strictEqual(beacon.get('tid'), 'UA-21292978-1');
        assert.match(beacon.get('cid'), /^\d{13}-\d{13}$/);

        assert.match(beacon.get(dimensions.CD_HIT_ID),
            /\w{8}-\w{4}-4\w{3}-[89aAbB]\w{3}-\w{12}/);

        assert.match(beacon.get(dimensions.CD_WINDOW_ID), /\d{13}-\d{13}/);
        assert.match(beacon.get(dimensions.CD_VISIT_ID), /\d{13}-\d{13}-\d+/);

        assert(beacon.get('uip').length > 0);

        // `qt` should be used rather than `ht` in MPv1,
        assert.strictEqual(beacon.get('ht'), null);
        const qt = beacon.get('qt');
        if (qt) {
          assert.strictEqual(qt, /\d+/);
        }

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
    }
  });

  it('should send pageview hits on SPA pageloads', async () => {
    await browser.waitUntil(async () => await beaconsContain({
      'v': '2',
      'en': 'page_view',
      'ep.original_page_path': '/',
    }));
    await browser.waitUntil(async () => await beaconsContain({
      v: '1',
      t: 'pageview',
      dp: '/',
    }));

    const articleLink = await $(`a[href="${articles[0].path}"]`);
    await articleLink.click();

    await browser.waitUntil(async () => await beaconsContain({
      'v': '2',
      'en': 'page_view',
      'ep.page_path': articles[0].path,
      'ep.original_page_path': '/',
    }));
    await browser.waitUntil(async () => await beaconsContain({
      v: '1',
      t: 'pageview',
      dp: articles[0].path,
    }));
  });

  it('should send pageview hits on back/forward navigations', async () => {
    await browser.waitUntil(async () => await beaconsContain({
      'v': '2',
      'en': 'page_view',
      'ep.page_path': '/',
    }));
    await browser.waitUntil(async () => await beaconsContain({
      v: '1',
      t: 'pageview',
      dp: '/',
    }));

    // Load a page.

    const articleLink = await $(`a[href="${pages[1].path}"]`);
    await articleLink.click();

    await browser.waitUntil(async () => await beaconsContain({
      'v': '2',
      'en': 'page_view',
      'ep.page_path': pages[1].path,
      'ep.original_page_path': '/',
    }));
    await browser.waitUntil(async () => await beaconsContain({
      v: '1',
      t: 'pageview',
      dp: pages[1].path,
    }));

    // Click 'back' to the home page

    await clearBeacons();
    await browser.back();

    await browser.waitUntil(async () => await beaconsContain({
      'v': '2',
      'en': 'page_view',
      'ep.page_path': pages[0].path,
      'ep.original_page_path': '/',
    }));
    await browser.waitUntil(async () => await beaconsContain({
      v: '1',
      t: 'pageview',
      dp: pages[0].path,
    }));

    // Click 'forward' to the articles page

    await clearBeacons();
    await browser.forward();

    await browser.waitUntil(async () => await beaconsContain({
      'v': '2',
      'en': 'page_view',
      'ep.page_path': pages[1].path,
      'ep.original_page_path': '/',
    }));
    await browser.waitUntil(async () => await beaconsContain({
      v: '1',
      t: 'pageview',
      dp: pages[1].path,
    }));
  });

  it('should invoke the v1 log function when no `v` param is present', async () => {
    await browser.execute(function() {
      navigator.sendBeacon('/log', [
        't=pageview',
        'ht=1614466715909',
        'dl=https%3A%2F%2Fphilipwalton.com%2F',
        'dp=%2F',
        'dt=Home%20%E2%80%94%20Philip%20Walton',
        'de=UTF-8',
        'ul=en-us',
        'vp=1792x414',
        'sr=1792x1120',
        'sd=30-bit',
        'dr=',
        'cd10=true',
        'cd1=lg',
        'cd2=2x',
        'cd16=68',
        'cd11=1614466715883-5755939763374',
        'cd17=1614466715883-6197446999056',
        'cd9=controlled',
        'cd18=navigate',
        'cd5=4g',
        'cd3=3.3.0',
        'cid=1600110148295-9925491440728',
        'cd4=navigation',
        'cd15=1614466715909',
        'cd12=visible',
      ].join('&'));
    });

    await browser.waitUntil(async () => await beaconsContain({
      'v': '1',
      't': 'pageview',
      'dl': 'https://philipwalton.com/',
      'dp': '/',
      'dt': 'Home — Philip Walton',
      'de': 'UTF-8',
      'ul': 'en-us',
      'vp': '1792x414',
      'sr': '1792x1120',
      'sd': '30-bit',
      'dr': '',
      'cd10': 'true',
      'cd1': 'lg',
      'cd2': '2x',
      'cd16': '68',
      'cd11': '1614466715883-5755939763374',
      'cd17': '1614466715883-6197446999056',
      'cd9': 'controlled',
      'cd18': 'navigate',
      'cd5': '4g',
      'cd3': '3.3.0',
      'cid': '1600110148295-9925491440728',
      'cd4': 'navigation',
      'cd15': '1614466715909',
      'cd12': 'visible',
    }));
  });
});
