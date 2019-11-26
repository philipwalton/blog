/**
 * Performantly generate a unique, 27-char string by combining the current
 * timestamp with a 13-digit random number.
 * @return {string}
 */
export function uuid() {
  return `${Date.now()}-${Math.floor(Math.random() * (9e12 - 1)) + 1e12}`;
}
