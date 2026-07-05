import {applyExperiment, getExperiment} from './worker/experiments.js';
import {
  addPriorityHints,
  getPriorityHintKey,
  storePriorityHints,
} from './worker/performance.js';
import {getRedirectPath} from './worker/redirects.js';
import {forwardLog} from './worker/log.js';

interface Env {
  ASSETS: Fetcher;
  PRIORITY_HINTS: KVNamespace;
  ENVIRONMENT: string;
}

function createXID(): string {
  return `${Math.random()}`.slice(1, 5) || '.000';
}

function getXIDFromCookie(cookie: string): string | null {
  const match = cookie.match(/(?:^|;) *xid=(\.\d+) *(?:;|$)/);
  return match && match[1] ? match[1] : null;
}

function normalizePath(path: string): string {
  if (path.endsWith('_index')) {
    return path.slice(0, -6);
  }
  return path;
}

function setXIDToCookie(xid: string, response: Response): void {
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

function addServerTimingHeaders(response: Response, startTime: number): void {
  response.headers.set('Server-Timing', `worker;dur=${Date.now() - startTime}`);
}

async function handleGetRequest(request: Request, env: Env): Promise<Response> {
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

  // Explicitly set cache-control headers.
  const maxAge = url.hostname === 'localhost' ? '0' : '60';
  clone.headers.set('cache-control', `max-age=${maxAge}`);

  setXIDToCookie(xid, clone);
  addServerTimingHeaders(clone, startTime);

  const contentType = clone.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return clone;
  }

  const rewriter = new HTMLRewriter();
  if (priorityHintsSelector) {
    addPriorityHints(rewriter, priorityHintsSelector);
  }
  if (experiment) {
    applyExperiment(experiment, rewriter);
  }
  return rewriter.transform(clone);
}

async function handlePostRequest(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);

  // Handle /hint POST requests
  if (url.pathname === '/hint') {
    await storePriorityHints(request, env.PRIORITY_HINTS);
    return new Response();
  }

  // Handle /log POST requests
  if (url.pathname === '/log') {
    if (url.searchParams.get('v') === '3') {
      await forwardLog(request, env);
    }
    return new Response();
  }

  // For other POST requests, pass through to assets
  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // TODO: add an allowlist of routes so the worker logic is only
    // run for expected URLs.
    if (request.method === 'GET') {
      return handleGetRequest(request, env);
    }

    if (request.method === 'POST') {
      return handlePostRequest(request, env);
    }

    // For other methods, pass through to assets
    return env.ASSETS.fetch(request);
  },
};
