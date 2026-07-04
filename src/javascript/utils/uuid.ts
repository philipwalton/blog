import {rand} from './rand.ts';
import {round} from './round.ts';

/**
 * Performantly generate a unique, 27-char string by combining a
 * timestamp with a 13-digit random number.
 */
export function uuid(
  prefix: number = performance.timeOrigin + performance.now(),
): string {
  return `${round(prefix)}-${rand()}`;
}
