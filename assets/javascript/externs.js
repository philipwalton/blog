window.WebFontConfig;

// TTI Polyfill
window.__tti;
window.__tti.o;
window.__tti.e;


/**
 * @constructor
 */
function PerformanceObserverEntry() {}

/**
 * Callback for the PerformanceObserver.
 * @typedef {function(!Array<!PerformanceEntry>,!PerformanceObserver)}
 */
var PerformanceObserverCallback;

/**
 * Options for the PerformanceObserver.
 * @typedef {{
 *   entryTypes: (Array<string>),
 * }}
 */
var PerformanceObserverInit;

/**
 * @param {!PerformanceObserverCallback} handler The callback for the observer.
 * @constructor
 */
function PerformanceObserver(handler) {}

/**
 * @param {PerformanceObserverInit} options
 * @return {undefined}
 */
PerformanceObserver.prototype.observe = function(options) {};

/**
 * Disconnect.
 */
PerformanceObserver.prototype.disconnect = function() {};


/**
 * @constructor
 */
var PerformanceLongTaskTiming
