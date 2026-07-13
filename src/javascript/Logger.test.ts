import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Logger} from './Logger.ts';
import {fetchLater} from './utils/fetchLater.ts';
import {set} from './utils/kv-store.ts';

vi.mock(import('./utils/fetchLater.ts'), () => ({
  fetchLater: vi.fn(),
}));

const fetchLaterMock = vi.mocked(fetchLater);

beforeEach(async () => {
  fetchLaterMock.mockReset();
  fetchLaterMock.mockReturnValue({activated: false});

  // Reset the client and session state persisted in IndexedDB.
  await Promise.all([
    set('clientId', ''),
    set('sessionId', 0),
    set('sessionCount', 0),
    set('lastEngagedTime', 0),
  ]);
});

/**
 * Returns the most recently scheduled beacon, with its URL, page/user
 * params line, and event lines parsed for easy assertions.
 */
function lastBeacon() {
  const [url, init] = fetchLaterMock.mock.lastCall!;
  const [pageLine = '', ...eventLines] = String(init?.body).split('\n');
  return {
    url: new URL(String(url), location.href),
    init: init!,
    pageParams: new URLSearchParams(pageLine),
    events: eventLines.map((line) => new URLSearchParams(line)),
  };
}

describe('Logger', () => {
  it('schedules events to /log with page, user, and event params', async () => {
    const logger = new Logger();
    await logger.event('test_event', {foo: 'bar'});

    const beacon = lastBeacon();
    expect(beacon.url.pathname).toBe('/log');
    expect(beacon.url.searchParams.get('v')).toBe('3');
    expect(beacon.init.method).toBe('POST');
    expect(beacon.init.activateAfter).toBeTypeOf('number');

    expect(beacon.pageParams.get('dl')).toBe(location.href);
    expect(beacon.pageParams.get('ul')).toBe(navigator.language.toLowerCase());
    expect(beacon.pageParams.get('vp')).toBe(`${innerWidth}x${innerHeight}`);

    expect(beacon.pageParams.get('up.breakpoint')).toBeTruthy();
    expect(beacon.pageParams.get('up.color_scheme_preference')).toMatch(
      /^(light|dark|no-preference)$/,
    );

    expect(beacon.events).toHaveLength(1);
    const [event] = beacon.events;
    expect(event!.get('en')).toBe('test_event');
    expect(event!.get('ep.foo')).toBe('bar');
    expect(event!.get('ep.page_path')).toBe(location.pathname);
  });

  it('prefixes number params with epn. and rounds them', async () => {
    const logger = new Logger();
    await logger.event('test_event', {count: 3, value: 1.23456});

    const [event] = lastBeacon().events;
    expect(event!.get('epn.count')).toBe('3');
    expect(event!.get('epn.value')).toBe('1.235');
  });

  it('applies the hit filter to every event', async () => {
    const logger = new Logger((params) => {
      return {page_path: `/filtered${params.page_path}`};
    });
    await logger.event('test_event');

    const [event] = lastBeacon().events;
    expect(event!.get('ep.page_path')).toBe(`/filtered${location.pathname}`);
  });

  it('merges params set via set() into subsequent events', async () => {
    const logger = new Logger();
    logger.set({page_path: '/custom'});
    await logger.event('test_event');

    const [event] = lastBeacon().events;
    expect(event!.get('ep.page_path')).toBe('/custom');
  });

  it('refreshes the dl and dt params via refreshPageParams()', async () => {
    const originalUrl = location.href;
    const originalTitle = document.title;

    try {
      const logger = new Logger();
      await logger.event('event_1');

      const firstBeacon = lastBeacon();
      expect(firstBeacon.pageParams.get('dl')).toBe(originalUrl);

      // Simulate an SPA navigation.
      history.pushState({}, '', '/spa-page/');
      document.title = 'SPA Page — Site Name';

      await logger.refreshPageParams();
      await logger.event('event_2');

      const beacon = lastBeacon();
      expect(new URL(beacon.pageParams.get('dl')!).pathname).toBe('/spa-page/');
      expect(beacon.pageParams.get('dt')).toBe('SPA Page');

      // Events logged after the refresh start a new beacon, and the beacon
      // containing the pre-navigation events is left scheduled (not
      // aborted), so those events keep the params from when they were
      // logged.
      expect(beacon.pageParams.get('_s')).toBe('2');
      expect(beacon.events.map((e) => e.get('en'))).toEqual(['event_2']);
      expect(firstBeacon.init.signal!.aborted).toBe(false);
    } finally {
      history.replaceState({}, '', originalUrl);
      document.title = originalTitle;
    }
  });

  it('keeps in-flight events in the pre-refresh beacon group', async () => {
    const logger = new Logger();

    // Add a presend dependency that doesn't resolve until later, so
    // events are held in-flight (not yet queued) when the refresh occurs.
    let resolveDependency!: () => void;
    logger.awaitBeforeSending(
      new Promise<void>((r) => (resolveDependency = r)),
    );

    const event1Done = logger.event('event_1');
    const refreshDone = logger.refreshPageParams();
    const event2Done = logger.event('event_2');

    resolveDependency();
    await Promise.all([event1Done, refreshDone, event2Done]);

    // event_1 was logged before the refresh, so it must remain in the
    // first beacon group, which must not be aborted.
    const [, firstInit] = fetchLaterMock.mock.calls.at(0)!;
    expect(String(firstInit!.body)).toContain('en=event_1');
    expect(firstInit!.signal!.aborted).toBe(false);

    // event_2 was logged after the refresh, so it starts a new beacon.
    const beacon = lastBeacon();
    expect(beacon.pageParams.get('_s')).toBe('2');
    expect(beacon.events.map((e) => e.get('en'))).toEqual(['event_2']);
  });

  it('batches queued events, aborting the superseded beacon', async () => {
    const logger = new Logger();
    await logger.event('event_1');
    await logger.event('event_2');

    const beacon = lastBeacon();
    expect(beacon.events.map((e) => e.get('en'))).toEqual([
      'event_1',
      'event_2',
    ]);
    expect(beacon.pageParams.get('_s')).toBe('1');

    // The first beacon (containing only event_1) must be aborted so the
    // data isn't sent twice.
    const [, firstInit] = fetchLaterMock.mock.calls.at(0)!;
    expect(firstInit!.signal!.aborted).toBe(true);
  });

  it('starts a new beacon once the previous one was sent', async () => {
    fetchLaterMock.mockReturnValue({activated: true});

    const logger = new Logger();
    await logger.event('event_1');
    await logger.event('event_2');

    const beacon = lastBeacon();
    expect(beacon.events.map((e) => e.get('en'))).toEqual(['event_2']);
    expect(beacon.pageParams.get('_s')).toBe('2');

    // _fv and _ss only apply to the first beacon of the page.
    expect(beacon.pageParams.get('_fv')).toBeNull();
    expect(beacon.pageParams.get('_ss')).toBeNull();
  });

  it('marks new visitors with _fv and _ss and creates a client ID', async () => {
    const logger = new Logger();
    await logger.event('test_event');

    const {pageParams} = lastBeacon();
    expect(pageParams.get('cid')).toMatch(/^\d+-\d{13}$/);
    expect(pageParams.get('_fv')).toBe('1');
    expect(pageParams.get('_ss')).toBe('1');
  });

  it('reuses the persisted client ID for returning visitors', async () => {
    await Promise.all([
      set('clientId', '12345-0000000000000'),
      set('sessionId', Date.now()),
      set('sessionCount', 2),
      set('lastEngagedTime', Date.now()),
    ]);

    const logger = new Logger();
    await logger.event('test_event');

    const {pageParams} = lastBeacon();
    expect(pageParams.get('cid')).toBe('12345-0000000000000');
    expect(pageParams.get('_fv')).toBeNull();
    expect(pageParams.get('_ss')).toBeNull();
    expect(pageParams.get('seg')).toBe('1');
    expect(pageParams.get('sct')).toBe('2');
  });

  it('starts a new session after 30 minutes of inactivity', async () => {
    const expired = Date.now() - 1000 * 60 * 31;
    await Promise.all([
      set('clientId', '12345-0000000000000'),
      set('sessionId', expired),
      set('sessionCount', 2),
      set('lastEngagedTime', expired),
    ]);

    const logger = new Logger();
    await logger.event('test_event');

    const {pageParams} = lastBeacon();
    expect(pageParams.get('_ss')).toBe('1');
    expect(pageParams.get('sct')).toBe('3');
    expect(pageParams.get('seg')).toBe('0');
  });
});
