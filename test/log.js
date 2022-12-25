import {strict as assert} from 'assert';
import {initBook} from '../tasks/utils/book.js';
import {dimensions} from '../functions/constants.js';
import {beaconsContain, clearBeacons, getBeacons} from './utils/beacons.js';
import {
  clearExperimentCookie,
  setExperimentCookie,
} from './utils/experiments.js';

let articles;
let pages;

let testID = 0;

describe('log', function () {
  before(async () => {
    const book = await initBook();
    articles = book.articles;
    pages = book.pages;
  });

  beforeEach(async () => {
    await clearBeacons();
    await clearExperimentCookie();
  });

  describe('experiments', () => {
    // Unskip when running an experiment
    it('should load the proper experiment', async () => {
      await setExperimentCookie('.234');
      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'page_view',
            'ep.page_path': '/',
            'up.service_worker_state': 'supported',
            'up.experiment': 'pending_beacon',
          })
      );

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            v: '1',
            t: 'pageview',
            dl: new RegExp(`test_id=${testID}`),
            dp: '/',
            cd9: 'supported',
            cd19: 'pending_beacon',
          })
      );

      // Reload to ensure that the experiment works with service worker.

      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'page_view',
            'ep.page_path': '/',
            'up.experiment': 'pending_beacon',
            'up.service_worker_state': 'controlled',
          })
      );

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            v: '1',
            t: 'pageview',
            dl: new RegExp(`test_id=${testID}`),
            dp: '/',
            cd9: 'controlled',
            cd19: 'pending_beacon',
          })
      );

      await browser.url('/__reset__');
      await setExperimentCookie('.789');
      await browser.url(`/articles/?test_id=${++testID}`);

      const beacon1 = await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'page_view',
            'ep.page_path': '/articles/',
            'up.service_worker_state': 'supported',
          })
      );
      assert(!beacon1.has('up.experiment'));

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            v: '1',
            t: 'pageview',
            dl: new RegExp(`test_id=${testID}`),
            dp: '/articles/',
            cd9: 'supported',
            cd19: '(not set)',
          })
      );

      // Reload to ensure that the experiment work with service worker.

      await browser.url(`/articles/?test_id=${++testID}`);

      const beacon2 = await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'page_view',
            'ep.page_path': '/articles/',
            'up.service_worker_state': 'controlled',
          })
      );
      assert(!beacon2.has('up.experiment'));

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            v: '1',
            t: 'pageview',
            dl: new RegExp(`test_id=${testID}`),
            dp: '/articles/',
            cd9: 'controlled',
            cd19: '(not set)',
          })
      );
    });
  });

  describe('v3', () => {
    it('should send pageview hits on pageload', async () => {
      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'page_view',
            'ep.page_path': '/',
          })
      );
      await browser.waitUntil(
        async () =>
          await beaconsContain({
            v: '1',
            t: 'pageview',
            dl: new RegExp(`test_id=${testID}`),
            dp: '/',
          })
      );
    });

    it('should include all relevant parameters', async () => {
      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '1',
            'dl': new RegExp(`test_id=${testID}`),
          })
      );
      await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
          })
      );

      const beacons = await getBeacons((beacons) => {
        return beacons.get('dl').includes(`?test_id=${testID}`);
      });

      for (const beacon of beacons) {
        const v = beacon.get('v');
        assert(v === '2' || v === '1');

        // MPv2
        if (v === '2') {
          assert.strictEqual(beacon.get('v'), '2');
          assert.strictEqual(beacon.get('tid'), 'G-GVKBFZ3VDY');
          assert.match(beacon.get('cid'), /^\d{13}-\d{13}$/);

          assert.match(beacon.get('sid'), /^\d{13}$/);
          assert.match(beacon.get('sct'), /^\d+$/);
          assert.match(beacon.get('seg'), /^(0|1)+$/);

          assert.strictEqual(beacon.get('epn.pageshow_count'), '1');
          assert.strictEqual(beacon.get('ep.original_page_path'), '/');
          assert.match(beacon.get('epn.measurement_version'), /\d+/);
          assert.match(
            beacon.get('ep.navigation_type'),
            /(navigate|reload|route_change)/
          );

          assert(beacon.get('epn.time_origin') <= Date.now());
          assert(beacon.get('epn.time_origin') > Date.now() - 60 * 1000);
          assert(beacon.get('epn.page_time') > 0);
          assert(beacon.get('epn.page_time') < 60 * 1000);
        }

        // MPv1
        if (v === '1') {
          assert.strictEqual(beacon.get('v'), '1');
          assert.strictEqual(beacon.get('tid'), 'UA-21292978-1');
          assert.match(beacon.get('cid'), /^\d{13}-\d{13}$/);

          assert.match(
            beacon.get(dimensions.CD_HIT_ID),
            /\w{8}-\w{4}-4\w{3}-[89aAbB]\w{3}-\w{12}/
          );

          assert.match(beacon.get(dimensions.CD_WINDOW_ID), /\d{13}-\d{13}/);
          assert.match(beacon.get(dimensions.CD_VISIT_ID), /\d{13}-\d{13}-\d+/);

          assert(beacon.get('uip').length > 0);

          // `qt` should be used rather than `ht` in MPv1,
          assert.strictEqual(beacon.get('ht'), null);
          const qt = beacon.get('qt');
          if (qt) {
            assert.strictEqual(qt, /\d+/);
          }

          assert.strictEqual(
            beacon.get(dimensions.CD_HIT_TYPE),
            beacon.get('t')
          );

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

    it('should update the session count and engagement status after additional visits', async () => {
      await browser.url(`/?test_id=${++testID}`);

      const beacon1 = await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'seg': '0',
            'sct': '1',
            'sid': /^\d{13}$/,
            '_ss': '1',
            '_fv': '1',
            'en': 'page_view',
            'ep.page_path': '/',
          })
      );

      const fcp1 = await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'FCP',
            'ep.page_path': '/',
          })
      );

      // Assert that the pageview was sent as a separate request from the
      // FCP metric events (since it has session start data).
      assert(beacon1.get('__idx') < fcp1.get('__idx'));

      await clearBeacons();
      await browser.url(`/about/?test_id=${testID}`);

      const beacon2 = await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'seg': '1',
            'sct': '1',
            'sid': beacon1.get('sid'),
            'en': 'page_view',
            'dl': new RegExp(`test_id=${testID}`),
            'ep.page_path': '/about/',
          })
      );

      assert(!beacon2.has('_ss'));
      assert(!beacon2.has('_fv'));

      const fcp2 = await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'FCP',
            'ep.page_path': '/about/',
          })
      );

      // This time both events should be in the same request
      // because no new session was started.
      assert.equal(beacon2.get('__idx'), fcp2.get('__idx'));

      // Update the data in IndexedDB to expire the session.
      await browser.executeAsync(async (done) => {
        const req = indexedDB.open('kv-store', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('kv-store');
        req.onsuccess = () => {
          const time = Date.now() - 1000 * 60 * 31; // 31 minutes ago...
          const db = req.result;
          const txn = db.transaction('kv-store', 'readwrite');
          txn.oncomplete = () => done();
          txn.objectStore('kv-store').put(time, 'sessionId');
          txn.objectStore('kv-store').put(8, 'sessionCount');
          txn.objectStore('kv-store').put(time, 'lastEngagedTime');
        };
      });

      await clearBeacons();
      await browser.url(`/articles/?test_id=${testID}`);

      const beacon3 = await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'seg': '0',
            'sct': '9',
            'sid': /^\d{13}$/,
            '_ss': '1',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'page_view',
            'ep.page_path': '/articles/',
          })
      );

      assert(!beacon3.has('_fv'));
      assert(beacon3.get('sid') > beacon1.get('sid'));

      const fcp3 = await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'FCP',
            'ep.page_path': '/articles/',
          })
      );

      // A new session was started so the pageview should have been sent
      // as a separate request (similar to the first part of this test).
      assert(beacon3.get('__idx') < fcp3.get('__idx'));
    });

    it('should track engagement time', async () => {
      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'page_view',
            'ep.page_path': '/',
          })
      );

      // Wait a bit then navigate away to trigger a `user_engagement` event.
      await browser.pause(1000);
      await browser.url('about:blank');

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'user_engagement',
            'ep.page_path': '/',
          })
      );

      const beacons = await getBeacons((b) => b.get('v') === '2');

      let totalEngagementTime = 0;
      let beaconsWithEngagementTime = 0;
      for (const beacon of beacons) {
        totalEngagementTime += Number(beacon.get('_et')) || 0;
        beaconsWithEngagementTime += Number(beacon.has('_et')) || 0;
      }

      assert(totalEngagementTime > 1000);
      assert(beaconsWithEngagementTime > 1);
    });

    it('should send pageview hits on SPA pageloads', async () => {
      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'page_view',
            'ep.original_page_path': '/',
          })
      );
      await browser.waitUntil(
        async () =>
          await beaconsContain({
            v: '1',
            t: 'pageview',
            dl: new RegExp(`test_id=${testID}`),
            dp: '/',
          })
      );

      const articleLink = await $(`a[href="${articles[0].path}"]`);
      await articleLink.click();

      // Wait a bit to allow the page to load and send a pageview.
      await browser.waitUntil(async () => {
        const title = await browser.getTitle();
        return title.includes(articles[0].title);
      });

      // Navigate away to trigger sending log data.
      await browser.url('about:blank');

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'en': 'page_view',
            'ep.page_path': articles[0].path,
            'ep.original_page_path': '/',
          })
      );
      await browser.waitUntil(
        async () =>
          await beaconsContain({
            v: '1',
            t: 'pageview',
            dp: articles[0].path,
          })
      );
    });

    it('should send pageview hits on back/forward navigations', async () => {
      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': new RegExp(`test_id=${testID}`),
            'en': 'page_view',
            'ep.page_path': '/',
          })
      );
      await browser.waitUntil(
        async () =>
          await beaconsContain({
            v: '1',
            dl: new RegExp(`test_id=${testID}`),
            t: 'pageview',
            dp: '/',
          })
      );

      // Load a page.

      const articleLink = await $(`a[href="${pages[1].path}"]`);
      await articleLink.click();
      // await browser.pause(1000);
      await browser.waitUntil(async () => {
        const title = await browser.getTitle();
        return title.includes(pages[1].title);
      });

      // Click 'back' to the home page

      await clearBeacons();
      await browser.back();
      // await browser.pause(1000);
      await browser.waitUntil(async () => {
        const title = await browser.getTitle();
        return title.includes(pages[0].title);
      });

      // Click 'forward' to the articles page

      await clearBeacons();
      await browser.forward();
      // await browser.pause(1000);
      await browser.waitUntil(async () => {
        const title = await browser.getTitle();
        return title.includes(pages[1].title);
      });

      await browser.url('about:blank');

      await browser.waitUntil(
        async () =>
          await beaconsContain([
            {
              'v': '2',
              'en': 'page_view',
              'ep.page_path': pages[1].path,
              'ep.original_page_path': '/',
            },
            {
              'v': '2',
              'en': 'page_view',
              'ep.page_path': pages[0].path,
              'ep.original_page_path': '/',
            },
            {
              'v': '2',
              'en': 'page_view',
              'ep.page_path': pages[1].path,
              'ep.original_page_path': '/',
            },
          ])
      );

      await browser.waitUntil(
        async () =>
          await beaconsContain([
            {
              v: '1',
              t: 'pageview',
              dp: pages[1].path,
            },
            {
              v: '1',
              t: 'pageview',
              dp: pages[0].path,
            },
            {
              v: '1',
              t: 'pageview',
              dp: pages[1].path,
            },
          ])
      );
    });
  });

  describe('v2', () => {
    it('should invoke the v2 log function when `v=2` is set', async () => {
      await browser.execute(function () {
        const queryParams = [
          'v=2',
          'dl=https%3A%2F%2Fphilipwalton.com%2F',
          'dt=Home%20%E2%80%94%20Philip%20Walton',
          'de=UTF-8',
          'ul=en-us',
          'vp=474x1016',
          'sr=1792x1120',
          'sd=30-bit',
          'dr=',
          'cid=1633059568188-9970492436839',
          'up.breakpoint=sm',
          'up.effective_connection_type=4g',
          'up.pixel_density=2x',
          'up.service_worker_state=controlled',
        ].join('&');

        const eventParams = [
          'en=page_view',
          'ep.page_path=%2F',
          'ep.content_source=cache',
          'epn.measurement_version=71',
          'epn.time_origin=1633061440539.4',
          'ep.page_id=1633061440539-3930979708627',
          'epn.pageshow_count=1',
          'ep.original_page_path=%2F',
          'ep.navigation_type=reload',
          'ep.site_version=3.6.0',
          'epn.page_time=221.9',
          'ep.visibility_state=hidden',
        ].join('&');

        navigator.sendBeacon('/log?' + queryParams, eventParams);
      });

      await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '2',
            'dl': 'https://philipwalton.com/',
            'dt': 'Home — Philip Walton',
            'de': 'UTF-8',
            'ul': 'en-us',
            'vp': '474x1016',
            'sr': '1792x1120',
            'sd': '30-bit',
            'dr': '',
            'cid': '1633059568188-9970492436839',
            'up.breakpoint': 'sm',
            'up.effective_connection_type': '4g',
            'up.pixel_density': '2x',
            'up.service_worker_state': 'controlled',
            'tid': 'G-GVKBFZ3VDY',
            'en': 'page_view',
            'ep.page_path': '/',
            'ep.content_source': 'cache',
            'epn.measurement_version': '71',
            'epn.time_origin': '1633061440539.4',
            'ep.page_id': '1633061440539-3930979708627',
            'epn.pageshow_count': '1',
            'ep.original_page_path': '/',
            'ep.navigation_type': 'reload',
            'ep.site_version': '3.6.0',
            'epn.page_time': '221.9',
            'ep.visibility_state': 'hidden',
            '_uip': /[.:\w]+/,
          })
      );
      await browser.waitUntil(
        async () =>
          await beaconsContain({
            'v': '1',
            'dl': 'https://philipwalton.com/',
            'dt': 'Home — Philip Walton',
            'de': 'UTF-8',
            'ul': 'en-us',
            'vp': '474x1016',
            'sr': '1792x1120',
            'sd': '30-bit',
            'dr': '',
            'cid': '1633059568188-9970492436839',
            'tid': 'UA-21292978-1',
            't': 'pageview',
            'dp': '/',
            'cd14': /\w{8}-\w{4}-4\w{3}-[89aAbB]\w{3}-\w{12}/,
            'uip': /[.:\w]+/,
            'cd13': 'pageview',
            'cd7': '1633059568188-9970492436839',
            'cd1': 'sm',
            'cd2': '2x',
            'cd3': '3.6.0',
            'cd4': 'cache',
            'cd5': '4g',
            'cd6': '(not set)',
            'cd8': '(not set)',
            'cd9': 'controlled',
            'cd10': '(not set)',
            'cd11': '1633061440539-3930979708627',
            'cd12': 'hidden',
            'cd15': '(not set)',
            'cd16': '71',
            'cd17': '1633061440539-3930979708627-1',
            'cd18': 'reload',
          })
      );
    });
  });

  describe('v1', () => {
    it('should invoke the v1 log function when no `v` param is present', async () => {
      await browser.execute(function () {
        navigator.sendBeacon(
          '/log',
          [
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
          ].join('&')
        );
      });

      await browser.waitUntil(
        async () =>
          await beaconsContain({
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
          })
      );
    });
  });
});
