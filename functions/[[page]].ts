import {applyExperiment, getExperiment} from './lib/experiments.js';
import {addPriorityHints, getPriorityHintKey} from './lib/performance.js';
import {getRedirectPath} from './lib/redirects.js';

interface Env extends Cloudflare.Env {
  ASSETS: Fetcher;
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

async function handleRequest({
  request,
  env,
}: EventContext<Env, string, unknown>): Promise<Response> {
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

  const rewriter = new HTMLRewriter();
  if (priorityHintsSelector) {
    addPriorityHints(rewriter, priorityHintsSelector);
  }
  if (experiment) {
    applyExperiment(experiment, rewriter);
  }
  return rewriter.transform(clone);
}

export async function onRequestGet(
  context: EventContext<Env, string, unknown>,
): Promise<Response> {
  return handleRequest(context);
}
