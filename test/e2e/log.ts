import {strict as assert} from 'node:assert';
import {beaconsContain, clearBeacons, getBeacons} from './utils/beacons.ts';
import {clearStorage} from './utils/clearStorage.ts';
import {setExperimentCookie} from './utils/setExperimentCookie.ts';
import {initBook, type Article, type Page} from './utils/book.ts';

let articles: Article[];
let pages: Page[];

let testID = 0;

describe('log', function () {
  before(async () => {
    const book = await initBook();
    articles = book.articles;
    pages = book.pages;
  });

  beforeEach(async () => {
    await clearBeacons();
    await clearStorage();
  });

  describe('experiments', () => {
    // Unskip when running an experiment
    it('should load the proper experiment', async () => {
      await setExperimentCookie('.234');
      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(() => {
        return beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'page_view',
          'ep.page_path': '/',
          'up.experiment': 'fetch_later',
        });
      });

      // Reload to ensure that the experiment persists across page loads.

      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(() => {
        return beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'page_view',
          'ep.page_path': '/',
          'up.experiment': 'fetch_later',
        });
      });

      await clearStorage();

      await setExperimentCookie('.789');
      await browser.url(`/articles/?test_id=${++testID}`);

      const beacon1 = await browser.waitUntil(() => {
        return beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'page_view',
          'ep.page_path': '/articles/',
        });
      });
      assert(beacon1 instanceof URLSearchParams);
      assert(!beacon1.has('up.experiment'));

      // Reload to ensure that the experiment persists across page loads.

      await browser.url(`/articles/?test_id=${++testID}`);

      const beacon2 = await browser.waitUntil(async () => {
        const result = await beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'page_view',
          'ep.page_path': '/articles/',
        });
        return result instanceof URLSearchParams ? result : false;
      });
      assert(beacon2 instanceof URLSearchParams);
      assert(!beacon2.has('up.experiment'));
    });
  });

  describe('v3', () => {
    it('should send pageview hits on pageload', async () => {
      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(() => {
        return beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'page_view',
          'ep.page_path': '/',
        });
      });
    });

    it('should include all relevant parameters', async () => {
      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(() => {
        return beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
        });
      });

      const beacons = await getBeacons((params) => {
        const dl = params.get('dl');
        return dl ? dl.includes(`?test_id=${testID}`) : false;
      });

      for (const beacon of beacons) {
        assert.strictEqual(beacon.get('v'), '2');
        assert.strictEqual(beacon.get('tid'), 'G-0DN98LQF0S');
        assert.match(beacon.get('cid') || '', /^\d{13}-\d{13}$/);

        assert.match(beacon.get('sid') || '', /^\d{13}$/);
        assert.match(beacon.get('sct') || '', /^\d+$/);
        assert.match(beacon.get('seg') || '', /^(0|1)+$/);

        assert.strictEqual(beacon.get('epn.pageshow_count'), '1');
        assert.strictEqual(beacon.get('ep.original_page_path'), '/');
        assert.match(beacon.get('epn.measurement_version') || '', /\d+/);
        assert.match(
          beacon.get('ep.navigation_type') || '',
          /(navigate|reload|route_change)/,
        );

        assert(Number(beacon.get('epn.time_origin')) <= Date.now());
        assert(Number(beacon.get('epn.time_origin')) > Date.now() - 60 * 1000);
        assert(Number(beacon.get('epn.page_time')) > 0);
        assert(Number(beacon.get('epn.page_time')) < 60 * 1000);
      }
    });

    it('should update the session count and engagement status after additional visits', async () => {
      await browser.url(`/?test_id=${++testID}`);

      const beacon1 = await browser.waitUntil(async () => {
        const result = await beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'seg': '0',
          'sct': '1',
          'sid': /^\d{13}$/,
          '_ss': '1',
          '_fv': '1',
          'en': 'page_view',
          'ep.page_path': '/',
        });
        return result instanceof URLSearchParams ? result : false;
      });
      assert(beacon1 instanceof URLSearchParams);

      // TODO: remove all navigations to __blank in this test once the
      // fetch_later experiment has ended.
      await browser.url(`/__blank`);

      const fcp1 = await browser.waitUntil(async () => {
        const result = await beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'FCP',
          'ep.page_path': '/',
        });
        return result instanceof URLSearchParams ? result : false;
      });
      assert(fcp1 instanceof URLSearchParams);

      // Only the first event in the session should have `_ss` or `_fv` set.
      assert(!fcp1.has('_ss'));
      assert(!fcp1.has('_fv'));

      await clearBeacons();
      await browser.url(`/about/?test_id=${testID}`);

      const beacon2 = await browser.waitUntil(async () => {
        const result = await beaconsContain({
          'seg': '1',
          'sct': '1',
          'sid': beacon1.get('sid') || '',
          'en': 'page_view',
          'dl': new RegExp(`test_id=${testID}`),
          'ep.page_path': '/about/',
        });
        return result instanceof URLSearchParams ? result : false;
      });
      assert(beacon2 instanceof URLSearchParams);

      assert(!beacon2.has('_ss'));
      assert(!beacon2.has('_fv'));

      await browser.url(`/__blank`);

      const fcp2 = await browser.waitUntil(async () => {
        const result = await beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'FCP',
          'ep.page_path': '/about/',
        });
        return result instanceof URLSearchParams ? result : false;
      });
      assert(fcp2 instanceof URLSearchParams);

      assert(!fcp2.has('_ss'));
      assert(!fcp2.has('_fv'));

      // Update the data in IndexedDB to expire the session.
      await browser.execute(() => {
        return new Promise<void>((resolve) => {
          const req = indexedDB.open('kv-store', 1);
          req.onupgradeneeded = () => req.result.createObjectStore('kv-store');
          req.onsuccess = () => {
            const time = Date.now() - 1000 * 60 * 31; // 31 minutes ago...
            const db = req.result;
            const txn = db.transaction('kv-store', 'readwrite');
            txn.oncomplete = () => resolve();
            txn.objectStore('kv-store').put(time, 'sessionId');
            txn.objectStore('kv-store').put(8, 'sessionCount');
            txn.objectStore('kv-store').put(time, 'lastEngagedTime');
          };
        });
      });

      await clearBeacons();
      await browser.url(`/articles/?test_id=${testID}`);

      const beacon3 = await browser.waitUntil(async () => {
        const result = await beaconsContain({
          'seg': '0',
          'sct': '9',
          'sid': /^\d{13}$/,
          '_ss': '1',
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'page_view',
          'ep.page_path': '/articles/',
        });
        return result instanceof URLSearchParams ? result : false;
      });
      assert(beacon3 instanceof URLSearchParams);

      assert(!beacon3.has('_fv'));
      assert(Number(beacon3.get('sid')) > Number(beacon1.get('sid')));

      await browser.url(`/__blank`);

      const fcp3 = await browser.waitUntil(async () => {
        const result = await beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'FCP',
          'ep.page_path': '/articles/',
        });
        return result instanceof URLSearchParams ? result : false;
      });
      assert(fcp3 instanceof URLSearchParams);

      assert(!fcp3.has('_ss'));
      assert(!fcp3.has('_fv'));
    });

    it('should track engagement time', async () => {
      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(() => {
        return beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'page_view',
          'ep.page_path': '/',
        });
      });

      // Wait a bit then navigate away to trigger a `user_engagement` event.
      await browser.pause(1000);
      await browser.url('/__blank');

      await browser.waitUntil(() => {
        return beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'user_engagement',
          'ep.page_path': '/',
        });
      });

      const beacons = await getBeacons();

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

      await browser.waitUntil(() => {
        return beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'page_view',
          'ep.original_page_path': '/',
        });
      });

      const articleLink = await $(`a[href="${articles[0]?.path}"]`);
      await articleLink.click();

      // Wait a bit to allow the page to load and send a pageview.
      await browser.waitUntil(async () => {
        const title = await browser.getTitle();
        return title.includes(articles[0]?.title || '');
      });

      // Navigate away to trigger sending log data.
      await browser.url('about:blank');

      await browser.waitUntil(() => {
        return beaconsContain({
          // After an SPA navigation, `dl` should reflect the new URL.
          'dl': new RegExp(`${articles[0]?.path}$`),
          'en': 'page_view',
          'ep.page_path': articles[0]?.path || '',
          'ep.original_page_path': '/',
        });
      });
    });

    it('should send pageview hits on back/forward navigations', async () => {
      await browser.url(`/?test_id=${++testID}`);

      await browser.waitUntil(() => {
        return beaconsContain({
          'dl': new RegExp(`test_id=${testID}`),
          'en': 'page_view',
          'ep.page_path': '/',
        });
      });

      // Load a page.

      const articleLink = await $(`a[href="${pages[1]?.path}"]`);
      await articleLink.click();
      // await browser.pause(1000);
      await browser.waitUntil(async () => {
        const title = await browser.getTitle();
        return title.includes(pages[1]?.title || '');
      });

      // Click 'back' to the home page

      await clearBeacons();
      await browser.back();
      // await browser.pause(1000);
      await browser.waitUntil(async () => {
        const title = await browser.getTitle();
        return title.includes(pages[0]?.title || '');
      });

      // Click 'forward' to the articles page

      await clearBeacons();
      await browser.forward();
      // await browser.pause(1000);
      await browser.waitUntil(async () => {
        const title = await browser.getTitle();
        return title.includes(pages[1]?.title || '');
      });

      await browser.url('/__blank');

      await browser.waitUntil(() => {
        return beaconsContain([
          {
            'en': 'page_view',
            'ep.page_path': pages[1]?.path || '',
            'ep.original_page_path': '/',
          },
          {
            'en': 'page_view',
            'ep.page_path': pages[0]?.path || '',
            'ep.original_page_path': '/',
          },
          {
            'en': 'page_view',
            'ep.page_path': pages[1]?.path || '',
            'ep.original_page_path': '/',
          },
        ]);
      });
    });
  });

  describe('legacy versions', () => {
    it('should not error when fetching legacy versions', async () => {
      const statusV2 = await browser.execute(async () => {
        const res = await fetch('/log?v=2', {method: 'POST'});
        return res.status;
      });

      assert.strictEqual(statusV2, 200);

      const statusV1 = await browser.execute(async () => {
        const res = await fetch('/log?v=1', {method: 'POST'});
        return res.status;
      });

      assert.strictEqual(statusV1, 200);

      const statusNoVersion = await browser.execute(async () => {
        const res = await fetch('/log', {method: 'POST'});
        return res.status;
      });

      assert.strictEqual(statusNoVersion, 200);
    });
  });
});
