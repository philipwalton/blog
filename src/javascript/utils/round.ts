/**
 * Rounds a number to the given number of significant digits passed.
 * @param {number} value
 * @param {number} digits
 * @return {number}
 */
export function round(value, digits = 0) {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}
