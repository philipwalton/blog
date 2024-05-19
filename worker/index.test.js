// eslint-disable-next-line camelcase
import {unstable_dev} from 'wrangler';
import {describe, expect, it, beforeAll, afterAll} from 'vitest';

describe('worker', () => {
  let worker;

  beforeAll(async () => {
    worker = await unstable_dev('./worker/index.js', {
      experimental: {disableExperimentalWarning: true},
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it('sets an xid cookie', async () => {
    const response = await worker.fetch();
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
    const response = await worker.fetch();
    const serverTiming = response.headers.get('server-timing');

    expect(serverTiming).toMatch(/worker;dur=\d+/);
  });

  it('adds Cloudflare cache state to the server-timing header', async () => {
    const mockHeaders = {
      'cf-cache-status': 'HIT',
      'x-cache': 'MISS',
    };

    const response = await worker.fetch(
      '/?h=' + encodeURIComponent(JSON.stringify(mockHeaders)),
    );

    const serverTiming = response.headers.get('server-timing');

    expect(serverTiming).toMatch('cf_cache;desc=HIT');
    expect(serverTiming).toMatch('fastly_cache;desc=MISS');
  });

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
    const response1 = await worker.fetch(
      '/articles/the-google-analytics-setup-i-use-on-every-site-i-build',
    );

    expect(response1.redirected).toEqual(true);
    expect(new URL(response1.url).pathname).toEqual(
      '/articles/the-ga-setup-i-use-on-every-site-i-build/',
    );

    const response2 = await worker.fetch(
      '/articles/' +
        'the-google-analytics-setup-i-use-on-every-site-i-build/index.html',
    );

    expect(response2.redirected).toEqual(true);
    expect(new URL(response2.url).pathname).toEqual(
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
          /<meta http-equiv="origin-trial" content="AiFbmKao6wuKvoETvcxO14nv9K/,
        );

        const b = await worker.fetch('/', {
          headers: {'Cookie': 'xid=.567'},
        });

        expect(await b.text()).not.toMatch(
          /<meta http-equiv="origin-trial" content="AiFbmKao6wuKvoETvcxO14nv9K/,
        );
      });
    });
  });
});
