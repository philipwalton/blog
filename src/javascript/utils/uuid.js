import {timeOrigin, now} from './performance';
import {rand} from './rand.js';
import {round} from './round.js';

/**
 * Performantly generate a unique, 27-char string by combining a
 * timestamp with a 13-digit random number.
 * @return {string}
 */
export function uuid(prefix = timeOrigin + now()) {
  return `${round(prefix)}-${rand()}`;
}
