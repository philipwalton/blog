import {describe, expect, it} from 'vitest';
import {formatDate, formatDateISO} from './dates.ts';

describe('formatDate', () => {
  it('formats a date as a long US-locale string', () => {
    // Constructed from local date parts (not a UTC ISO string) so the
    // assertion doesn't depend on the timezone the test runs in.
    expect(formatDate(new Date(2024, 2, 5))).toBe('March 5, 2024');
  });
});

describe('formatDateISO', () => {
  it('formats a date as an ISO 8601 string', () => {
    expect(formatDateISO(new Date('2024-03-05T12:34:56.000Z'))).toBe(
      '2024-03-05T12:34:56.000Z',
    );
  });
});
