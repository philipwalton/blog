var a = document.createElement('a');
var cache = {};

/**
 * Parse the given url and return the properties returned
 * by the `Location` object with the addition of the `path` property.
 * `path` is the concatenation of the `pathname` and `search` properties.
 * @param {string} url - The url to parse.
 * @return {Object} An object with the same keys as `window.location`.
 */
module.exports = function(url) {

  if (cache[url]) return cache[url];

  a.href = url;

  // Sometimes IE incorrectly includes the port ':80' even when no port
  // is specified in the URL.
  // http://blogs.msdn.com/b/ieinternals/archive/2011/02/28/internet-explorer-window-location-pathname-missing-slash-and-host-has-port.aspx
  var host = url.indexOf(a.host) < 0 ? a.host.replace(':80', '') : a.host;

  // Not all browser support `origin` so we have to build it.
  var origin = a.origin ? a.origin : a.protocol + '//' + a.host;

  // Sometimes IE doesn't include the leading slash for pathname.
  // http://blogs.msdn.com/b/ieinternals/archive/2011/02/28/internet-explorer-window-location-pathname-missing-slash-and-host-has-port.aspx
  var pathname = a.pathname.charAt(0) == '/' ? a.pathname : '/' + a.pathname;

  return cache[url] = {
    hash: a.hash,
    host: host,
    hostname: a.hostname,
    href: a.href,
    origin: origin,
    path: pathname + a.search,
    pathname: pathname,
    protocol: a.protocol,
    search: a.search
  };
};
