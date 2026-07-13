import fs from 'node:fs';
import {describe, expect, it, beforeEach} from 'vitest';
import {clearBeacons, getLogs} from '../e2e/utils/beacons.ts';

const BASE_URL = 'http://localhost:3000';

// Header exposed to Cloudflare workers:
// https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#cf-connecting-ip
const CLOUDFLARE_HEADERS = {
  'x-real-ip': '1.2.3.4',
};

// Headers sent by the browser, including UA Client Hints:
const BROWSER_HEADERS = {
  'sec-ch-ua':
    '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'user-agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

const HEADERS = {...CLOUDFLARE_HEADERS, ...BROWSER_HEADERS};

const worker = {
  async fetch(path: string, requestInit: RequestInit = {}): Promise<Response> {
    Object.assign((requestInit.headers ||= {}), HEADERS);
    const url = new URL(path, BASE_URL);

    return fetch(url, requestInit);
  },
};

describe('worker', () => {
  it('sets an xid cookie', async () => {
    const response = await worker.fetch('/');
    const xidCookie = response.headers.get('set-cookie');

    expect(xidCookie).toMatch(/xid=\.\d+/);
  });

  it('sets the same xid value if present', async () => {
    const response = await worker.fetch('/', {
      headers: {'Cookie': 'xid=.456'},
    });
    const xidCookie = response.headers.get('set-cookie');

    expect(xidCookie).toMatch(/xid=\.456/);
  });

  it('adds worker processing time to the server-timing header', async () => {
    const response = await worker.fetch('/');
    const serverTiming = response.headers.get('server-timing');

    expect(serverTiming).toMatch(/worker;dur=\d+/);
  });

  // TODO:mock the response rather than pass headers in the request
  // it('adds Cloudflare cache state to the server-timing header', async () => {
  //   const mockHeaders = {
  //     'cf-cache-status': 'HIT',
  //   };

  //   const response = await worker.fetch(
  //     '/?h=' + encodeURIComponent(JSON.stringify(mockHeaders)),
  //   );

  //   const serverTiming = response.headers.get('server-timing');

  //   expect(serverTiming).toMatch('cf_cache;desc=HIT');
  // });

  it('applies redirects for existing URLs', async () => {
    const response1 = await worker.fetch('/about');

    expect(response1.redirected).toEqual(true);
    expect(new URL(response1.url).pathname).toEqual('/about/');
  });

  it('applies redirects for changed URLs', async () => {
    const response = await worker.fetch(
      '/articles/the-google-analytics-setup-i-use-on-every-site-i-build/',
    );

    expect(response.redirected).toEqual(true);
    expect(new URL(response.url).pathname).toEqual(
      '/articles/the-ga-setup-i-use-on-every-site-i-build/',
    );
  });

  it('applies multiple redirects if needed', async () => {
    const response = await worker.fetch(
      '/articles/the-google-analytics-setup-i-use-on-every-site-i-build',
    );

    expect(response.redirected).toEqual(true);
    expect(new URL(response.url).pathname).toEqual(
      '/articles/the-ga-setup-i-use-on-every-site-i-build/',
    );
  });

  it('preserves the query string while doing redirects', async () => {
    const response = await worker.fetch('/about?a=1&b=2');

    expect(response.redirected).toEqual(true);

    const redirectedURL = new URL(response.url);
    expect(redirectedURL.href).toEqual(
      redirectedURL.origin + '/about/?a=1&b=2',
    );
  });

  // The deployed site (philipwalton.com) still has an active service worker in
  // visitors' browsers. Serving a self-destruct `/sw.js` is what unregisters
  // it on their next visit, so the file must stay in place and stay uncached.
  describe('service worker', () => {
    it('serves a self-destruct service worker at /sw.js', async () => {
      const response = await worker.fetch('/sw.js');
      const body = await response.text();

      expect(response.status).toEqual(200);
      expect(response.headers.get('content-type')).toMatch(/javascript/);
      expect(body).toMatch(/registration\.unregister\(\)/);
    });

    it('serves the service worker with a no-cache header', async () => {
      const response = await worker.fetch('/sw.js');

      expect(response.headers.get('cache-control')).toEqual('no-cache');
    });

    it('serves the web app manifest with a no-cache header', async () => {
      const response = await worker.fetch('/site.webmanifest');

      expect(response.headers.get('cache-control')).toEqual('no-cache');
    });
  });

  describe('log', () => {
    beforeEach(() => clearBeacons());

    it('forwards the log data to GA4 in the proper format', async () => {
      const pageParams = new URLSearchParams([
        ['dl', 'https://philipwalton.com/'],
        ['dt', 'Home'],
        ['de', 'UTF-8'],
        ['ul', 'en-us'],
        ['vp', '1792x1008'],
        ['sr', '1792x1120'],
        ['sd', '24-bit'],
        ['_p', '881598807'],
        ['_s', '2'],
        ['cid', '1712876615821-9701338268393'],
        ['sid', '1718512184011'],
        ['sct', '18'],
        ['seg', '0'],
        ['up.breakpoint', 'sm'],
        ['up.connection_type', '4g'],
        ['up.pixel_density', '2x'],
        ['up.color_scheme_preference', 'light'],
        ['up.contrast_preference', 'no-preference'],
        ['up.reduce_data_preference', 'no-preference'],
        ['up.reduce_motion_preference', 'no-preference'],
      ]);
      const events = [
        new URLSearchParams([
          ['en', 'page_view'],
          ['ep.page_path', '/'],
          ['ep.site_version', '(none)'],
          ['ep.content_source', 'network'],
          ['epn.measurement_version', '99'],
          ['epn.time_origin', '1718515562946.3'],
          ['ep.page_id', '1718515562946-5699398476786'],
          ['epn.pageshow_count', '1'],
          ['ep.original_page_path', '/'],
          ['ep.navigation_type', 'reload'],
          ['ep.visibility_state', 'visible'],
          ['epn.page_time', '281.8'],
          ['ep.event_id', '1718515563228-9108535772895'],
        ]),
      ];

      await worker.fetch('/log?v=3', {
        method: 'POST',
        body: [pageParams, ...events].map(String).join('\n'),
      });

      const [log] = await getLogs({count: 1});

      const url = new URL(log?.url || '', BASE_URL);

      expect(url.pathname).toStrictEqual('/log');
      expect(url.search.slice(1)).toStrictEqual(
        new URLSearchParams([
          ['v', '2'],
          ['tid', 'G-0DN98LQF0S'],
          ...pageParams.entries(),
          ['_uip', '1.2.3.4'],
        ]).toString(),
      );

      const eventWithUA = new URLSearchParams(events[0]);
      eventWithUA.set(
        'ep.user_agent_1',
        BROWSER_HEADERS['user-agent'].slice(0, 100),
      );
      eventWithUA.set(
        'ep.user_agent_2',
        BROWSER_HEADERS['user-agent'].slice(100),
      );
      eventWithUA.set('ep.ua_ch', BROWSER_HEADERS['sec-ch-ua']);

      expect(log?.body).toStrictEqual(eventWithUA.toString());

      for (const [key, value] of Object.entries(BROWSER_HEADERS)) {
        expect(log?.headers.get(key)).toStrictEqual(value);
      }
    });

    it('splits logs in two for new session page view events', async () => {
      const pageParams = new URLSearchParams([
        ['dl', 'https://philipwalton.com/'],
        ['dt', 'Home'],
        ['de', 'UTF-8'],
        ['ul', 'en-us'],
        ['vp', '1792x487'],
        ['sr', '1792x1120'],
        ['sd', '24-bit'],
        ['_p', '227314339'],
        ['_s', '1'],
        ['cid', '1718517532407-8640713107508'],
        ['_fv', '1'], // First visit
        ['_ss', '1'], // Session start
        ['sid', '1718517532812'],
        ['sct', '1'],
        ['seg', '0'],
        ['up.breakpoint', 'sm'],
        ['up.connection_type', '4g'],
        ['up.pixel_density', '2x'],
        ['up.color_scheme_preference', 'light'],
        ['up.contrast_preference', 'no-preference'],
        ['up.reduce_data_preference', 'no-preference'],
        ['up.reduce_motion_preference', 'no-preference'],
        ['up.experiment', 'fetch_later'],
      ]);
      const events = [
        new URLSearchParams([
          ['en', 'page_view'],
          ['ep.page_path', '/'],
          ['ep.site_version', '(none)'],
          ['ep.content_source', 'network'],
          ['epn.measurement_version', '99'],
          ['epn.time_origin', '1718515562946.3'],
          ['ep.page_id', '1718515562946-5699398476786'],
          ['epn.pageshow_count', '1'],
          ['ep.original_page_path', '/'],
          ['ep.navigation_type', 'reload'],
          ['ep.visibility_state', 'visible'],
          ['epn.page_time', '281.8'],
          ['ep.event_id', '1718515563228-9108535772895'],
        ]),
        new URLSearchParams([
          ['en', 'FCP'],
          ['ep.page_path', '/'],
          ['ep.site_version', '(none)'],
          ['ep.content_source', 'network'],
          ['epn.measurement_version', '99'],
          ['epn.time_origin', '1718515562946.3'],
          ['ep.page_id', '1718515562946-5699398476786'],
          ['epn.pageshow_count', '1'],
          ['ep.original_page_path', '/'],
          ['ep.navigation_type', 'reload'],
          ['epn.value', '255.6'],
          ['ep.metric_rating', 'good'],
          ['epn.metric_value', '255.6'],
          ['epn.debug_ttfb', '119.3'],
          ['epn.debug_fb2fcp', '136.3'],
          ['ep.event_id', 'v4-1718515563228-6340636480962'],
          ['epn.page_time', '285.9'],
        ]),
        new URLSearchParams([
          ['en', 'LCP'],
          ['ep.page_path', '/'],
          ['ep.site_version', '(none)'],
          ['ep.content_source', 'network'],
          ['epn.measurement_version', '99'],
          ['epn.time_origin', '1718515562946.3'],
          ['ep.page_id', '1718515562946-5699398476786'],
          ['epn.pageshow_count', '1'],
          ['ep.original_page_path', '/'],
          ['ep.navigation_type', 'reload'],
          ['epn.value', '255.6'],
          ['ep.metric_rating', 'good'],
          ['epn.metric_value', '255.6'],
          ['ep.debug_target', '#post>p.ArticlePreview-excerpt'],
          ['epn.debug_ttfb', '119.3'],
          ['epn.debug_rld', '0'],
          ['epn.debug_rlt', '0'],
          ['epn.debug_erd', '136.3'],
          ['ep.event_id', 'v4-1718515563229-5466265848907'],
          ['epn.page_time', '286.5'],
        ]),
      ];

      await worker.fetch('/log?v=3', {
        method: 'POST',
        body: [pageParams, ...events].map(String).join('\n'),
      });

      const logs = await getLogs({count: 2});

      // The two requests are sent in parallel and can arrive in either
      // order, so identify them by shape: the new-session request carries
      // its page_view event in the query params and has an empty body.
      const sessionLog = logs.find((log) => log.body === '');
      const eventsLog = logs.find((log) => log.body !== '');
      expect(sessionLog).toBeDefined();
      expect(eventsLog).toBeDefined();

      const url1 = new URL(sessionLog!.url, BASE_URL);

      expect(url1.pathname).toStrictEqual('/log');
      expect(url1.search.slice(1)).toStrictEqual(
        new URLSearchParams([
          ['v', '2'],
          ['tid', 'G-0DN98LQF0S'],
          ...pageParams.entries(),
          ['_uip', '1.2.3.4'],
          ...events[0]!.entries(),
          ['ep.user_agent_1', BROWSER_HEADERS['user-agent'].slice(0, 100)],
          ['ep.user_agent_2', BROWSER_HEADERS['user-agent'].slice(100)],
          ['ep.ua_ch', BROWSER_HEADERS['sec-ch-ua']],
        ]).toString(),
      );

      for (const [key, value] of Object.entries(BROWSER_HEADERS)) {
        expect(sessionLog!.headers.get(key)).toStrictEqual(value);
      }

      const url2 = new URL(eventsLog!.url, BASE_URL);
      const pageParamsStripped = new URLSearchParams(pageParams);
      pageParamsStripped.delete('_fv');
      pageParamsStripped.delete('_ss');

      expect(url2.pathname).toStrictEqual('/log');
      expect(url2.search.slice(1)).toStrictEqual(
        new URLSearchParams([
          ['v', '2'],
          ['tid', 'G-0DN98LQF0S'],
          ...pageParamsStripped.entries(),
          ['_uip', '1.2.3.4'],
        ]).toString(),
      );
      expect(eventsLog!.body).toStrictEqual(
        [events[1]!.toString(), events[2]!.toString()].join('\n'),
      );

      for (const [key, value] of Object.entries(BROWSER_HEADERS)) {
        expect(eventsLog!.headers.get(key)).toStrictEqual(value);
      }
    });
  });

  describe('atom feed', () => {
    it('lists articles newest first', async () => {
      const response = await worker.fetch('/atom.xml');
      const body = await response.text();

      const entries = [...body.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(
        (match) => match[1]!,
      );
      const dates = entries.map(
        (entry) => new Date(entry.match(/<updated>([^<]+)<\/updated>/)![1]!),
      );

      // The feed must contain every published article (guards against
      // truncation and against the entry regex silently matching nothing),
      // and every entry must be well-formed with a parseable date.
      const articleCount = fs
        .readdirSync(new URL('../../src/content/articles', import.meta.url))
        .filter((file) => file.endsWith('.mdx')).length;

      expect(entries.length).toBe(articleCount);
      for (const entry of entries) {
        expect(entry).toMatch(/<title>[^<]+<\/title>/);
        expect(entry).toMatch(/<link href="[^"]+"\/>/);
        expect(entry).toMatch(/<id>[^<]+<\/id>/);
      }

      // Every entry must be unique (count alone can't catch duplicates).
      const ids = entries.map((entry) => entry.match(/<id>([^<]+)<\/id>/)![1]);
      expect(new Set(ids).size).toBe(entries.length);
      for (const date of dates) {
        expect(date.getTime()).not.toBeNaN();
      }

      // The entire feed must be sorted newest first, not just the endpoints.
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]!.getTime()).toBeGreaterThanOrEqual(
          dates[i]!.getTime(),
        );
      }
    });
  });

  describe('experiments', () => {
    it('adds a script tag setting the experiment', async () => {
      const a = await worker.fetch('/', {
        headers: {'Cookie': 'xid=.456'},
      });

      expect(await a.text()).toMatch(`<script>self.__x='fetch_later'</script>`);

      const b = await worker.fetch('/', {
        headers: {'Cookie': 'xid=.567'},
      });

      expect(await b.text()).not.toMatch(
        `<script>self.__x='fetch_later'</script>`,
      );
    });

    describe('fetch_later', () => {
      it('adds an "origin-trial" meta tag', async () => {
        const a = await worker.fetch('/', {
          headers: {'Cookie': 'xid=.456'},
        });

        expect(await a.text()).toMatch(
          /<meta http-equiv="origin-trial" content="Ao1ryfd8fdqfiAsCIPw8u/,
        );

        const b = await worker.fetch('/', {
          headers: {'Cookie': 'xid=.567'},
        });

        expect(await b.text()).not.toMatch(
          /<meta http-equiv="origin-trial" content="Ao1ryfd8fdqfiAsCIPw8u/,
        );
      });
    });
  });
});
