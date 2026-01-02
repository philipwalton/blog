import crypto from 'node:crypto';
import fs from 'fs-extra';

function generateCacheKey(data) {
  return crypto
    .createHash('BLAKE2b512')
    .update(data)
    .digest('hex')
    .slice(0, 32);
}

export function memoize(fn) {
  const cache = {};
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache[key]) {
      cache[key] = fn(...args);
    }
    return cache[key];
  };
}

export function memoizeWithSrc(fn) {
  const fnText = fn.toString().replace(/\s/g, ' ');

  // `src` must be the first arg in to the memoized function.
  return async (src, ...args) => {
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
    await fs.outputFile(cachePath, fileResult);

    return fileResult;
  };
}

export function memoizeWithSrcCache(srcCache, fn) {
  const memoCache = {};
  return (...args) => {
    const key = JSON.stringify(args);
    let cachedValue = memoCache[key];

    if (!cachedValue || cachedValue.time < srcCache.lastModified) {
      memoCache[key] = cachedValue = {
        result: fn(...args),
        time: new Date(),
      };
    }
    return cachedValue.result;
  };
}
