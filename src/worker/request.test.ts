import {afterEach, describe, expect, it, vi} from 'vitest';
import worker from '../worker.ts';

afterEach(() => vi.restoreAllMocks());

function setup() {
  const assets = vi.fn(
    async () =>
      new Response('<body><img src="/hero.png"></body>', {
        headers: {'content-type': 'text/html'},
      }),
  );
  const get = vi
    .fn<(key: string) => Promise<string | null>>()
    .mockResolvedValue(null);
  const put = vi
    .fn<(key: string, value: string) => Promise<void>>()
    .mockResolvedValue();
  const logError = vi.spyOn(console, 'error').mockImplementation(() => {});
  return {
    assets,
    get,
    put,
    logError,
    bindings: {
      ASSETS: {fetch: assets} as unknown as Fetcher,
      PRIORITY_HINTS: {get, put} as unknown as KVNamespace,
      ENVIRONMENT: 'test',
    },
  };
}

describe('worker KV failures', () => {
  it('serves HTML with its normal headers when the KV read fails', async () => {
    const {bindings, get} = setup();
    get.mockRejectedValue(new Error('KV blocked'));

    const response = await worker.fetch(
      new Request('https://example.com/', {headers: {cookie: 'xid=.456'}}),
      bindings,
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('<body><img src="/hero.png"></body>');
    expect(response.headers.get('cache-control')).toBe('max-age=60');
    expect(response.headers.get('set-cookie')).toContain('xid=.456;');
    expect(response.headers.get('server-timing')).toMatch(/worker;dur=\d+/);
  });

  it('preserves non-HTML responses when the KV read fails', async () => {
    const {bindings, assets, get} = setup();
    assets.mockResolvedValue(
      new Response('missing', {
        status: 404,
        headers: {'content-type': 'text/plain'},
      }),
    );
    get.mockRejectedValue(new Error('KV blocked'));

    const response = await worker.fetch(
      new Request('https://example.com/missing'),
      bindings,
    );
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('missing');
  });

  it('still applies hints when KV is available', async () => {
    const {bindings, get} = setup();
    get.mockResolvedValue('img');

    const response = await worker.fetch(
      new Request('https://example.com/'),
      bindings,
    );
    expect(await response.text()).toContain('fetchpriority="high"');
  });

  it.each(['get', 'put'] as const)(
    'acknowledges hint beacons when KV %s fails',
    async (operation) => {
      const {bindings, get, put, logError} = setup();
      const error = new Error('KV blocked');
      (operation === 'get' ? get : put).mockRejectedValue(error);

      const response = await worker.fetch(
        new Request('https://example.com/hint', {
          method: 'POST',
          body: JSON.stringify({path: '/', selector: 'img'}),
        }),
        bindings,
      );

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('');
      expect(logError).toHaveBeenCalledWith(
        'Failed to store priority hints in KV',
        error,
      );
      if (operation === 'get') {
        expect(put).not.toHaveBeenCalled();
      }
    },
  );

  it('does not hide asset fetch errors', async () => {
    const {bindings, assets, get} = setup();
    get.mockResolvedValue(null);
    assets.mockRejectedValue(new Error('Asset fetch failed'));

    await expect(
      worker.fetch(new Request('https://example.com/'), bindings),
    ).rejects.toThrow('Asset fetch failed');
  });
});
