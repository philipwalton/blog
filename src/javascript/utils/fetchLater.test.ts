import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type {MockInstance} from 'vitest';

// Remove any native implementation so the module exports the polyfill,
// which is the code under test. Restored after this file so the global
// isn't left polluted for other test files sharing the page.
const nativeFetchLater = self.fetchLater;
delete (self as {fetchLater?: unknown}).fetchLater;
const {fetchLater} = await import('./fetchLater.ts');

afterAll(() => {
  if (nativeFetchLater) {
    self.fetchLater = nativeFetchLater;
  }
});

describe('fetchLater polyfill', () => {
  let sendBeacon: MockInstance<Navigator['sendBeacon']>;

  beforeEach(() => {
    sendBeacon = vi.spyOn(navigator, 'sendBeacon').mockReturnValue(true);
  });

  afterEach(() => {
    sendBeacon.mockRestore();
  });

  it('sends the data via sendBeacon after the activateAfter timeout', async () => {
    const result = fetchLater('/log', {
      method: 'POST',
      body: 'data',
      activateAfter: 10,
    });
    expect(result.activated).toBe(false);

    await vi.waitFor(() => {
      expect(sendBeacon).toHaveBeenCalledWith('/log', 'data');
    });
    expect(result.activated).toBe(true);
  });

  it('sends the data on the next visibilitychange event', () => {
    const result = fetchLater('/log', {
      method: 'POST',
      body: 'data',
      activateAfter: 60000,
    });

    document.dispatchEvent(new Event('visibilitychange'));

    expect(sendBeacon).toHaveBeenCalledWith('/log', 'data');
    expect(result.activated).toBe(true);
  });

  it('does not send after the signal is aborted', () => {
    const controller = new AbortController();
    const result = fetchLater('/log', {
      method: 'POST',
      body: 'data',
      signal: controller.signal,
      activateAfter: 60000,
    });

    controller.abort();
    document.dispatchEvent(new Event('visibilitychange'));

    expect(sendBeacon).not.toHaveBeenCalled();
    expect(result.activated).toBe(false);
  });
});
