import {describe, expect, it} from 'vitest';
import {rand} from './rand.ts';

describe('rand', () => {
  it('returns a zero-padded, 13-digit string', () => {
    for (let i = 0; i < 100; i++) {
      expect(rand()).toMatch(/^\d{13}$/);
    }
  });
});
