addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only respond to certain requests:
  if (// Pages and article HTML files
      url.pathname === '/' ||
      url.pathname.startsWith('/about') ||
      url.pathname.startsWith('/articles') ||
      // Pages and article content partials
      url.pathname.endsWith('index.content.html') ||
      // Service worker scripts.
      url.pathname === '/sw.js') {
    event.respondWith(
      handleRequest({request: event.request, url, event}).catch(
        (err) => new Response(err.stack, {status: 500})
      )
    );
  }
});

const experiments = {
  link_css: [0, 1/3],
  control: [1/3, 2/3],
};

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
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest({request, url}) {
  const cookie = request.headers.get('cookie') || '';
  const xid = cookie.match(/(?:^|;) *xid=(\.\d+) *(?:;|$)/) ?
      RegExp.$1 : `${Math.random()}`.slice(1, 5);

  const experimentURL = new URL(
      `${url.origin}${getExperimentPath(xid)}${url.pathname}${url.search}`);

  const response = await fetch(experimentURL, {
    body: request.body,
    headers: request.headers,
    method: request.method,
    redirect: request.redirect,
    cf: {
      cacheEverything: self.__ENV__ === 'production',
    },
  });

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
