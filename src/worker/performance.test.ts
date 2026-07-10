import {env} from 'cloudflare:test';
import {describe, expect, it} from 'vitest';
import {
  addPriorityHints,
  getPriorityHintKey,
  storePriorityHints,
} from './performance.ts';

describe('addPriorityHints', () => {
  it('sets fetchpriority=high on the first matching element only', async () => {
    const rewriter = new HTMLRewriter();
    addPriorityHints(rewriter, 'img');

    const html = '<body><img src="/a.png"><img src="/b.png"></body>';
    const result = await rewriter.transform(new Response(html)).text();

    const [first, second] = result.match(/<img[^>]+>/g)!;
    expect(first).toContain('fetchpriority="high"');
    expect(first).toContain('src="/a.png"');
    expect(second).not.toContain('fetchpriority');
  });
});

describe('getPriorityHintKey', () => {
  it('keys by device type and URL-encoded path', () => {
    const desktop = new Request('https://example.com/hint', {
      headers: {'sec-ch-ua-mobile': '?0'},
    });
    expect(getPriorityHintKey(desktop, '/articles/foo/')).toBe(
      'desktop:%2Farticles%2Ffoo%2F',
    );

    const mobile = new Request('https://example.com/hint', {
      headers: {'sec-ch-ua-mobile': '?1'},
    });
    expect(getPriorityHintKey(mobile, '/articles/foo/')).toBe(
      'mobile:%2Farticles%2Ffoo%2F',
    );
  });
});

describe('storePriorityHints', () => {
  it('stores the selector from the request body in KV', async () => {
    const request = new Request('https://example.com/hint', {
      method: 'POST',
      headers: {'sec-ch-ua-mobile': '?0'},
      body: JSON.stringify({path: '/articles/foo/', selector: 'img.hero'}),
    });

    await storePriorityHints(request, env.PRIORITY_HINTS);

    expect(await env.PRIORITY_HINTS.get('desktop:%2Farticles%2Ffoo%2F')).toBe(
      'img.hero',
    );
  });

  it('keys mobile and desktop hints separately', async () => {
    const request = new Request('https://example.com/hint', {
      method: 'POST',
      headers: {'sec-ch-ua-mobile': '?1'},
      body: JSON.stringify({path: '/articles/bar/', selector: 'img.mobile'}),
    });

    await storePriorityHints(request, env.PRIORITY_HINTS);

    expect(await env.PRIORITY_HINTS.get('mobile:%2Farticles%2Fbar%2F')).toBe(
      'img.mobile',
    );
    expect(
      await env.PRIORITY_HINTS.get('desktop:%2Farticles%2Fbar%2F'),
    ).toBeNull();
  });
});
