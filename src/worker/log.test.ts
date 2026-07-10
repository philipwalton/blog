import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {forwardLog} from './log.ts';

import type {MockInstance} from 'vitest';

let fetchSpy: MockInstance<typeof fetch>;

beforeEach(() => {
  fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async () => new Response('ok'));
});

afterEach(() => {
  fetchSpy.mockRestore();
});

/**
 * Returns the requests made via `fetch()`, with their URL query params,
 * body, and headers parsed for easy assertions.
 */
function forwarded() {
  return fetchSpy.mock.calls.map(([input, init]) => {
    const url = new URL(String(input));
    return {
      url,
      params: url.searchParams,
      body: (init?.body as string | null) ?? null,
      headers: new Headers(init?.headers ?? []),
    };
  });
}

function logRequest(body: string, headers: Record<string, string> = {}) {
  return new Request('https://philipwalton.com/log?v=3', {
    method: 'POST',
    body,
    headers: {
      'user-agent': 'TestUA/1.0',
      'sec-ch-ua': '"Chromium";v="126"',
      ...headers,
    },
  });
}

const PROD_ENV = {ENVIRONMENT: 'production'};

describe('forwardLog', () => {
  it('forwards page params as query params and events as body lines', async () => {
    await forwardLog(
      logRequest('cid=123.4&sid=567\nen=user_engagement&_et=5', {
        'x-real-ip': '1.2.3.4',
      }),
      PROD_ENV,
    );

    const requests = forwarded();
    expect(requests).toHaveLength(1);

    const [request] = requests;
    expect(request!.url.origin).toBe('https://www.google-analytics.com');
    expect(request!.params.get('v')).toBe('2');
    expect(request!.params.get('tid')).toMatch(/^G-/);
    expect(request!.params.get('cid')).toBe('123.4');
    expect(request!.params.get('sid')).toBe('567');
    expect(request!.params.get('_uip')).toBe('1.2.3.4');
    expect(request!.body).toBe('en=user_engagement&_et=5');
  });

  it('forwards only user-agent and client hint headers', async () => {
    await forwardLog(
      logRequest('cid=1\nen=test', {'x-real-ip': '1.2.3.4'}),
      PROD_ENV,
    );

    const [request] = forwarded();
    expect(request!.headers.get('user-agent')).toBe('TestUA/1.0');
    expect(request!.headers.get('sec-ch-ua')).toBe('"Chromium";v="126"');
    expect(request!.headers.has('x-real-ip')).toBe(false);
  });

  it('adds user-agent params to current-version page_view events', async () => {
    await forwardLog(
      logRequest('cid=1\nen=page_view&epn.measurement_version=99'),
      PROD_ENV,
    );

    const [request] = forwarded();
    const event = new URLSearchParams(request!.body!);
    expect(event.get('ep.user_agent_1')).toBe('TestUA/1.0');
    expect(event.get('ep.ua_ch')).toBe('"Chromium";v="126"');
  });

  it('splits new-session page_view events into a separate request', async () => {
    await forwardLog(
      logRequest(
        'cid=1&_ss=1&_fv=1\n' +
          'en=page_view&epn.measurement_version=99\n' +
          'en=CLS&epn.value=0.1',
      ),
      PROD_ENV,
    );

    const requests = forwarded();
    expect(requests).toHaveLength(2);

    const sessionRequest = requests.find((r) => r.params.has('_ss'));
    const otherRequest = requests.find((r) => !r.params.has('_ss'));

    expect(sessionRequest!.params.get('_fv')).toBe('1');
    expect(sessionRequest!.params.get('en')).toBe('page_view');
    expect(sessionRequest!.body).toBeNull();

    expect(otherRequest!.params.has('_fv')).toBe(false);
    const event = new URLSearchParams(otherRequest!.body!);
    expect(event.get('en')).toBe('CLS');
    expect(event.get('epn.value')).toBe('0.1');
  });

  it('does not split when the new session has a single event', async () => {
    await forwardLog(
      logRequest('cid=1&_ss=1\nen=page_view&epn.measurement_version=99'),
      PROD_ENV,
    );

    const requests = forwarded();
    expect(requests).toHaveLength(1);
    expect(requests[0]!.params.get('_ss')).toBe('1');
    expect(new URLSearchParams(requests[0]!.body!).get('en')).toBe('page_view');
  });

  it('sends to the local endpoint in the dev environment', async () => {
    await forwardLog(logRequest('cid=1\nen=test'), {ENVIRONMENT: 'dev'});

    const [request] = forwarded();
    expect(request!.url.origin).toBe('http://localhost:3001');
  });
});
