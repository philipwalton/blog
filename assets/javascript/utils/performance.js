/**
 * The value of performance.timeOrigin if supported, or the navigation
 * start value from the performance timeline if not. The performance timeline
 * is supported back to IE9.
 */
export const timeOrigin =
    performance.timeOrigin || performance.timing.navigationStart;


/**
 * Returns the result of performance.now() if the browser supports it, or
 * Date.now() minus the time origin if the browser doesn't.
 * @return {number}
 */
export const now = () => {
  return performance.now ? performance.now() : (new Date - timeOrigin);
};
