/**
 * Rounds a number to the given number of significant digits passed.
 */
export function round(value: number, digits: number = 0): number {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}
