/**
 * Parse the given url and return the properties returned
 * by the `window.location` object.
 * @param {string} url - The url to parse.
 * @return {Object} An object with the same keys as `window.location`.
 */
var parseUrl = (function(a) {
  var cache = {};
  return function parseUrl(url) {
    return cache[url] ? cache[url] : cache[a.href = url] = {
      hash: a.hash,
      // Sometimes IE incorrectly includes the port ':80' even when no port
      // is specified in the URL.
      // http://blogs.msdn.com/b/ieinternals/archive/2011/02/28/internet-explorer-window-location-pathname-missing-slash-and-host-has-port.aspx
      host: url.indexOf(a.host) < 0 ? a.host.replace(':80', '') : a.host,
      hostname: a.hostname,
      href: a.href,
      // Not all browser support `origin` so we have to build it.
      origin: a.origin ? a.origin : a.protocol + '//' + a.host,
      protocol: a.protocol,
      // Sometimes IE doesn't include the leading slash for pathname.
      // http://blogs.msdn.com/b/ieinternals/archive/2011/02/28/internet-explorer-window-location-pathname-missing-slash-and-host-has-port.aspx
      pathname: a.pathname.charAt(0) == '/' ? a.pathname : '/' + a.pathname,
      search: a.search
    };
  };
}(document.createElement('a')));