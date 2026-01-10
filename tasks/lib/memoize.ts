import crypto from 'node:crypto';
import fs from 'fs-extra';

import type {Cache} from './cache.ts';

function generateCacheKey(data: string) {
  return crypto
    .createHash('BLAKE2b512')
    .update(data)
    .digest('hex')
    .slice(0, 32);
}

export function memoize<T extends (...args: any[]) => unknown>(fn: T): T {
  const cache: Record<string, unknown> = {};
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    if (!cache[key]) {
      cache[key] = fn(...args);
    }
    // Cast only at the moment of exit.
    return cache[key] as ReturnType<T>;
  }) as T;
}

export function memoizeWithSrc<
  T extends (src: string, ...args: any[]) => unknown,
>(fn: T): T {
  const fnText = fn.toString().replace(/\s/g, ' ');

  // `src` must be the first arg in to the memoized function.
  return (async (
    src: string,
    ...args: Parameters<T> extends [string, ...infer R] ? R : never
  ) => {
    const srcStat = await fs.stat(src);
    const cacheKey = generateCacheKey(
      JSON.stringify([src, srcStat.mtimeMs, fnText, args]),
    );

    const cachePath = `./.cache/${cacheKey}`;

    // Next check disk cache:
    try {
      return await fs.readFile(cachePath);
    } catch {
      // An error means the cached file doesn't exist or can't be read.
    }

    // Still here? That means it's not in the cache so generate the result
    // and update the cache for subsequent use.
    const fileResult = await fn(src, ...args);

    // Update the cache, and await (even though blocking) so that
    // subsequent calls will always get the cached version.
    await fs.outputFile(cachePath, fileResult as string | Uint8Array);

    return fileResult;
  }) as unknown as T;
}

export function memoizeWithSrcCache<T extends (...args: any[]) => unknown>(
  srcCache: Cache,
  fn: T,
): T {
  const memoCache: Record<string, {result: ReturnType<T>; time: Date}> = {};
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    let cachedValue = memoCache[key];

    if (!cachedValue || cachedValue.time < srcCache.lastModified) {
      memoCache[key] = cachedValue = {
        result: fn(...args) as ReturnType<T>,
        time: new Date(),
      };
    }
    return cachedValue!.result;
  }) as T;
}
