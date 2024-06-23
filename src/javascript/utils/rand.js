/**
 * Returns a 13-digit random number.
 * @return {string}
 */
export function rand() {
  const base = String(Math.floor(Math.random() * 1e13));
  return '0'.repeat(13 - base.length) + base;
}
