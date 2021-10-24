addEventListener('fetch', (event) => {
  const {pathname} = new URL(event.request.url);

  // Only respond to certain requests:
  if (// Pages and article HTML files
      pathname === '/' ||
      pathname.startsWith('/about') ||
      pathname.startsWith('/articles') ||
      // Pages and article content partials
      pathname.endsWith('index.content.html')) {
    event.respondWith(
      handleDocumentRequest(event.request).catch(
        (err) => new Response(err.stack, {status: 500})
      )
    );
  }
});

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleDocumentRequest(request) {
  const requestOpts = {
    cf: {
      cacheEverything: self.__ENV__ === 'production',
    },
  };

  const response = await fetch(request, requestOpts);
  const clone = new Response(response.body, response);

  addServerTimingHeaders(clone);

  return clone;
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
