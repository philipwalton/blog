/**
 * Returns the result of performance.now() if the browser supports it, or
 * +new Date() if the browser doesn't.
 * @return {number}
 */
const now = () => {
  return (window.performance && window.performance.now) &&
      window.performance.now() || +new Date;
};


/**
 * A class to more easily record the duration between a start and end time.
 */
export default class Timer {
  /**
   * @return {Timer}
   */
  start() {
    this.startTime = now();
    return this;
  }

  /**
   * @return {Timer}
   */
  stop() {
    this.endTime = now();
    return this;
  }

  /**
   * @return {number|null}
   */
  get duration() {
    return (this.endTime && this.startTime) ?
        this.endTime - this.startTime : null;
  }
}
