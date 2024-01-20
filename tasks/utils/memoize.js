import fs from 'fs-extra';

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
  const cache = {};
  return (...args) => {
    const stats = fs.statSync(args[0]); // Assume src is the first arg.
    const key = JSON.stringify(args.concat(stats.mtimeMs));
    if (!cache[key]) {
      cache[key] = fn(...args);
    }
    return cache[key];
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
