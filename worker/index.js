import {applyExperiment, getExperiment} from './lib/experiments.js';
import {
  addPriorityHints,
  getPriorityHintKey,
  logPriorityHint,
} from './lib/performance.js';
import {getRedirectPath} from './lib/redirects.js';
import {matchesRoute} from './lib/router.js';

/**
 * @returns {string}
 */
function createXID() {
  return `${Math.random()}`.slice(1, 5) || '.000';
}

/**
 * @param {string} cookie
 * @returns {boolean}
 */
function getXIDFromCookie(cookie) {
  return cookie.match(/(?:^|;) *xid=(\.\d+) *(?:;|$)/) && RegExp.$1;
}

/**
 * Removes a trailing `index.content.html` from a URL path.
 * @param {string} path
 * @returns {string}
 */
function normalizePath(path) {
  if (path.endsWith('index.content.html')) {
    return path.slice(0, -18);
  }
  return path;
}

/**
 * @param {Request} request
 * @param {Response} response
 */
function setXIDToCookie(xid, response) {
  response.headers.set(
    'Set-Cookie',
    [
      'xid=' + xid,
      'Path=/',
      'Max-Age=31536000',
      'SameSite=Strict',
      'HttpOnly',
      'Secure',
    ].join('; '),
  );
}

/**
 * @param {Response} response
 * @returns {Response}
 */
function addServerTimingHeaders(response, startTime) {
  const serverTiming = [];

  const cfCache = response.headers.get('cf-cache-status');
  if (cfCache) {
    serverTiming.push(`cf_cache;desc=${cfCache}`);
  }

  const fastlyCache = response.headers.get('x-cache');
  if (fastlyCache) {
    serverTiming.push(`fastly_cache;desc=${fastlyCache}`);
  }

  serverTiming.push(`worker;dur=${Date.now() - startTime}`);

  response.headers.set('Server-Timing', serverTiming.join(', '));
}

/**
 * @param {Object} param
 * @param {Request} param.request
 * @param {URL} param.url
 * @param {number} param.startTime
 * @param {Object} param.vars
 * @returns {Response}
 */
async function handleRequest({request, url, startTime, vars}) {
  const cookie = request.headers.get('cookie') || '';
  const xid = getXIDFromCookie(cookie) || createXID();

  const experiment = getExperiment(xid);

  const [response, priorityHintsSelector] = await Promise.all([
    fetch(url.href, {
      body: request.body,
      headers: request.headers,
      method: request.method,
      redirect: request.redirect,
      cf: {
        cacheEverything: vars.ENV === 'production',
        cacheTtlByStatus: {'200-299': 604800, '400-599': 0},
      },
    }),
    vars.PRIORITY_HINTS.get(
      getPriorityHintKey(request, normalizePath(url.pathname)),
    ),
  ]);

  const clone = new Response(response.body, response);

  setXIDToCookie(xid, clone);
  addServerTimingHeaders(clone, startTime);

  const rewriter = new HTMLRewriter();
  if (priorityHintsSelector) {
    addPriorityHints(rewriter, priorityHintsSelector);
  }
  if (experiment) {
    applyExperiment(experiment, rewriter);
  }
  return rewriter.transform(clone);
}

export default {
  /**
   * @param {Request} request
   * @param {Object} vars
   * @returns
   */
  async fetch(request, vars) {
    const startTime = Date.now();
    const url = new URL(request.url);

    if (url.pathname === '/hint' && request.method === 'POST') {
      return logPriorityHint(request, vars.PRIORITY_HINTS);
    }

    // Return early if no route matches.
    // Note: this should never happen in production.
    if (!matchesRoute({request, url})) {
      return fetch(request);
    }

    // Redirect if needed.
    const redirectPath = getRedirectPath(url.pathname);
    if (redirectPath) {
      url.pathname = redirectPath;

      // When running locally the worker and server will have
      // different ports, so we have to manually update.
      if (vars.ENV === 'development') {
        url.host = 'localhost:3000';
      }

      return Response.redirect(url.href, 301);
    }

    // Otherwise handle the request.
    return handleRequest({request, url, vars, startTime});
  },
};
