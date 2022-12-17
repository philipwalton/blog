import sharp from 'sharp';
import {memoize} from './memoize.js';

export const optimizeImage = memoize((src, size, format, opts) => {
  return sharp(src).resize(size)[format](opts).toBuffer();
});
