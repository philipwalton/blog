import sharp from 'sharp';
import {memoizeWithSrc} from './memoize.js';

export const optimizeImage = memoizeWithSrc((src, size, format, opts) => {
  return sharp(src).resize(size)[format](opts).toBuffer();
});
