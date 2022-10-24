/**
 * @param {Object} opts
 * @param {Request} opts.request
 * @param {URL} opts.url
 * @returns
 */
export function matchesRoute({request, url}) {
  return (request.method === 'GET' && (
      // Pages and article HTML files
      url.pathname === '/' ||
      url.pathname.startsWith('/about') ||
      url.pathname.startsWith('/articles') ||
      // Pages and article content partials
      url.pathname.endsWith('index.content.html')));
}
