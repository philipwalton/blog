import {describe, expect, it} from 'vitest';
import {round} from './round.ts';

describe('round', () => {
  it('rounds to the nearest integer by default', () => {
    expect(round(1.4)).toBe(1);
    expect(round(1.5)).toBe(2);
    expect(round(-1.4)).toBe(-1);
  });

  it('rounds to the given number of digits', () => {
    expect(round(1.2345, 2)).toBe(1.23);
    expect(round(1.2345, 3)).toBe(1.235);
    expect(round(1.2, 3)).toBe(1.2);
  });
});
