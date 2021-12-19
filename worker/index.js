addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only respond to certain requests:
  if (event.request.method === 'GET' && (
      // Pages and article HTML files
      url.pathname === '/' ||
      url.pathname.startsWith('/about') ||
      url.pathname.startsWith('/articles') ||
      // Pages and article content partials
      url.pathname.endsWith('index.content.html') ||
      // Service worker scripts.
      url.pathname === '/sw.js')) {
    event.respondWith(
      handleRequest({request: event.request, url, event}).catch(
        (err) => new Response(err.stack, {status: 500})
      )
    );
  }
});

// Uncomment to add experiments
const experiments = null; // {
  // experiment_name: [lowerBound, upperBound],
  // };

/**
 * @param {string} xid
 * @returns {string}
 */
function getExperimentPath(xid) {
  for (const [key, range] of Object.entries(experiments)) {
    if (xid >= range[0] && xid < range[1]) {
      return '/_' + key;
    }
  }
  return '';
}

/**
 * @param {URL}
 * @returns {string|void}
 */
function getRedirect(url) {
  // Rename old Google Analytics post.
  if (url.pathname.match(/^(.+)google-analytics(.+)$/)) {
    return `${url.origin}${RegExp.$1}ga${RegExp.$2}`;
  }
  // Check that the URL ends in a file extension or trailing slash.
  if (!url.pathname.match(/(\/|\.(css|gif|html|jpg|js|png|svg|xml))$/)) {
    return `${url.origin}${url.pathname}/${url.search}`;
  }
  // Remove trailing index.html
  if (url.pathname.endsWith('index.html')) {
    return url.href.slice(0, -10);
  }
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest({request, url}) {
  const redirect = getRedirect(url);
  if (redirect) {
    return Response.redirect(redirect, 301);
  }

  const cookie = request.headers.get('cookie') || '';
  const xid = cookie.match(/(?:^|;) *xid=(\.\d+) *(?:;|$)/) ?
      RegExp.$1 : `${Math.random()}`.slice(1, 5);

  const resourceURL = experiments ? new URL([
    url.origin,
    getExperimentPath(xid),
    url.pathname,
    url.search,
  ].join('')) : url;

  const response = await fetch(resourceURL, {
    body: request.body,
    headers: request.headers,
    method: request.method,
    redirect: request.redirect,
    cf: {
      cacheEverything: self.__ENV__ === 'production',
      cacheTtlByStatus: {'200-299': 604800, '400-599': 0},
    },
  });

  // If the response isn't a 2XX, fall back to the original request.
  if (response.status > 300) {
    // TODO: figure out a good way to determine how often this happens.
    return fetch(request);
  }

  const clone = new Response(response.body, response);

  addExperimentIDCookie(xid, clone);
  addServerTimingHeaders(clone);

  return clone;
}

/**
 * @param {Request} request
 * @param {Response} response
 */
function addExperimentIDCookie(xid, response) {
  response.headers.set('Set-Cookie', [
    'xid=' + xid,
    'Path=/',
    'Max-Age=31536000',
    'SameSite=Strict',
    'HttpOnly',
    'Secure',
  ].join('; '));
}

/**
 * @param {Response} response
 * @returns {Response}
 */
function addServerTimingHeaders(response) {
  const serverTiming = [];

  const cfCache = response.headers.get('cf-cache-status');
  if (cfCache) {
    serverTiming.push(`cf_cache;desc=${cfCache}`);
  }

  const fastlyCache = response.headers.get('x-cache');
  if (fastlyCache) {
    serverTiming.push(`fastly_cache;desc=${fastlyCache}`);
  }

  response.headers.set('Server-Timing', serverTiming.join(', '));
}
