import {applyExperiment, getExperiment} from './lib/experiments.js';
import {addPriorityHints, getPriorityHintKey} from './lib/performance.js';
import {getRedirectPath} from './lib/redirects.js';

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
 * Normalizes by removing any content partial path.
 * @param {string} path
 * @returns {string}
 */
function normalizePath(path) {
  if (path.endsWith('_index')) {
    return path.slice(0, -6);
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
async function handleRequest({request, env}) {
  const startTime = Date.now();
  const url = new URL(request.url);

  // Redirect if needed.
  const redirectPath = getRedirectPath(url.pathname);
  if (redirectPath) {
    url.pathname = redirectPath;
    return Response.redirect(url.href, 308);
  }

  const cookie = request.headers.get('cookie') || '';
  const xid = getXIDFromCookie(cookie) || createXID();

  const experiment = getExperiment(xid);

  const [response, priorityHintsSelector] = await Promise.all([
    env.ASSETS.fetch(url.href, {
      body: request.body,
      headers: request.headers,
      method: request.method,
      redirect: request.redirect,
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: {'200-299': 31536000, '400-599': -1},
      },
    }),
    env.PRIORITY_HINTS.get(
      getPriorityHintKey(request, normalizePath(url.pathname)),
    ),
  ]);

  const clone = new Response(response.body, response);

  // Remove `Etag` headers since the response will be modified.
  // clone.headers.delete('etag');

  // Modify headers set by Cloudflare
  // clone.headers.set('cache-control', 'max-age=0');
  // clone.headers.delete('access-control-allow-origin');

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

export async function onRequestGet(context) {
  return handleRequest(context);
}
