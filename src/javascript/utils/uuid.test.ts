import {describe, expect, it} from 'vitest';
import {uuid} from './uuid.ts';

describe('uuid', () => {
  it('combines the rounded prefix with a 13-digit random number', () => {
    expect(uuid(1234.56)).toMatch(/^1235-\d{13}$/);
  });

  it('defaults the prefix to the current timestamp', () => {
    const prefix = Number(uuid().split('-')[0]);
    expect(Math.abs(prefix - Date.now())).toBeLessThan(1000);
  });
});
