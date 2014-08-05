var history2 = (function(window, document, location) {

  if (!(window.history && window.history.pushState)) return;

  /**
   * Parse the given url and return the properties returned
   * by the `window.location` object (hash, href, pathname, and search).
   * @param {string} url - The url to parse.
   * @return {Object} An object with the same keys as `window.location`.
   */
  // TODO, abstract this into a generic URL parsing utility. Keep this in mind:
  // http://blogs.msdn.com/b/ieinternals/archive/2011/02/28/internet-explorer-window-location-pathname-missing-slash-and-host-has-port.aspx
  var parseUrl = (function(a) {
    var cache = {};
    return function parseUrl(url) {
      return cache[url]
        ? cache[url]
        : cache[a.href = url] = {
            hash: a.hash,
            href: a.href,
            // Sometimes IE doesn't include the leading slash for pathname.
            // http://stackoverflow.com/questions/956233/javascript-pathname-ie-quirk
            pathname: a.pathname.charAt(0) == '/'
              ? a.pathname : '/' + a.pathname,
            search: a.search
          };
    };
  }(document.createElement('a')));


  // Store the current url information.
  var current = parseUrl(location.href);


  // Add history state initially so the first `popstate` event contains data.
  window.history.replaceState(current, document.title, current.href);


  // Listen for popstate changes and log them.
  window.addEventListener('popstate', function(event) {
    history2.add(location.href, document.title, event.state, event);
  });


  var history2 = {

    add: function(url, title, state, popstateEvent) {

      // Ignore urls pointing to the current address
      if (url == current.href) return;

      var next = parseUrl(url);
      next.title = title;
      next.state = state;

      // Popstate triggered navigation is already handled by the browser,
      // so we only add to the history when we manually trigger it.
      if (!popstateEvent) {
        history.pushState(state, title, url);
      }

      // If pathname or query are different, that means this resource
      // points to a different page.
      if (next.pathname != current.pathname || next.search != current.search) {
        if (title) document.title = title;
        if (this.change) this.change(next, current, popstateEvent);
      }

      // Update the last url to the current url
      current = next;
    },

    change: function(cb) {
      this.change = cb;
    }

  };

  return history2;

}(window, document, window.location));
