import {describe, expect, it} from 'vitest';
import {getRedirectPath} from './redirects.ts';

describe('getRedirectPath', () => {
  it('renames old google-analytics article paths', () => {
    expect(getRedirectPath('/articles/the-google-analytics-setup-i-use/')).toBe(
      '/articles/the-ga-setup-i-use/',
    );
  });

  it('returns undefined for paths that do not redirect', () => {
    expect(getRedirectPath('/articles/dynamic-rendering/')).toBeUndefined();
    expect(getRedirectPath('/')).toBeUndefined();
  });

  it('only redirects when google-analytics is inside the path', () => {
    // Article paths always have a trailing slash, so a path ending in
    // "google-analytics" is not a real article URL and is left alone.
    expect(getRedirectPath('/articles/google-analytics')).toBeUndefined();
    expect(getRedirectPath('google-analytics/')).toBeUndefined();
  });
});
