import {describe, expect, it} from 'vitest';
import {get, set} from './kv-store.ts';

/**
 * Deletes the kv-store database, rejecting with `blocked` if another open
 * connection prevents the deletion.
 */
function deleteDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase('kv-store');
    req.onblocked = () => reject(new Error('blocked'));
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
}

describe('kv-store', () => {
  it('returns undefined for missing keys', async () => {
    expect(await get(`missing-${Date.now()}`)).toBeUndefined();
  });

  it('returns the default value for missing keys', async () => {
    expect(await get(`missing-${Date.now()}`, 'fallback')).toBe('fallback');
  });

  it('round-trips values', async () => {
    await set('test:number', 123);
    await set('test:object', {a: 1});

    expect(await get('test:number')).toBe(123);
    expect(await get('test:object')).toEqual({a: 1});
  });

  it('overwrites existing values', async () => {
    await set('test:key', 'one');
    await set('test:key', 'two');

    expect(await get('test:key')).toBe('two');
  });

  it('resolves set() with the stored value', async () => {
    expect(await set('test:key2', 'value')).toBe('value');
  });

  it('closes the connection on pagehide (for bfcache eligibility)', async () => {
    // Ensure a connection is open.
    await set('test:pagehide', 'value');

    // With the connection open, deleting the database must be blocked
    // (the connection has no versionchange handler that would close it).
    await expect(deleteDB()).rejects.toThrow('blocked');

    dispatchEvent(new PageTransitionEvent('pagehide'));

    // With the connection closed, the same deletion must succeed.
    await deleteDB();
  });

  it('reopens the connection after pagehide', async () => {
    await set('test:reopen', 'before');

    dispatchEvent(new PageTransitionEvent('pagehide'));

    // Persisted data must survive the connection closing, and new
    // operations must transparently open a new connection.
    expect(await get('test:reopen')).toBe('before');
    await set('test:reopen', 'after');
    expect(await get('test:reopen')).toBe('after');
  });
});
