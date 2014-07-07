(function(win, doc, loc) {

  // require linkClicked

  // Only load external content via AJAX if the browser support pushState.
  if (!(win.history && win.history.pushState)) return;

  // Store the container element to avoid multiple lookups.
  var container = doc.getElementById('content');

  // Store the result of page content requests to avoid multiple
  // lookups when navigation to a previously seen page.
  var pageCache = {};

  // Add the current page to the cache.
  pageCache[loc.pathname] = container.innerHTML;

  // Add history state initially so the first `popstate` event contains data.
  win.history.replaceState({title: doc.title}, doc.title, loc.href);

  function getTitle(a) {
    var title = a.title || a.innerText;
    return title ? title + ' — Philip Walton' : null;
  }

  /**
   * Checks to see if the link is within the same domain, but not
   * on the same page.
   */
  function isInternalLinkOnDifferentPage(a) {
    return a.pathname != loc.pathname && a.href.indexOf(loc.host) >= 0;
  }

  function get(url, success, error) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 400){
        success(xhr);
      }
    };
    xhr.send();
  }

  function loadPage(path, title, hash) {
    if (pageCache[path]) {
      showPage(title, pageCache[path], hash);
    }
    else {
      get(path + '_index.html', function(xhr) {
        console.log('Loading content for: ' + path);
        pageCache[path] = xhr.responseText;
        showPage(title, xhr.responseText, hash);
      });
    }
  }

  function showPage(title, content, hash) {
    if (title) doc.title = title;
    container.innerHTML = content;

    // If there's a hash fragment, scroll to it,
    // otherwise just scroll to the top.
    if (hash) {
      var target = document.getElementById(hash.slice(1));
    }
    win.scrollTo(0, target ? target.offsetTop : 0);
  }

  win.addEventListener('popstate', function(event) {
    // console.log('popstate', pageCache[loc.pathname] ? 'cache exists' : 'nope')
    loadPage(loc.pathname, event.state && event.state.title, loc.hash);
  });

  linkClicked(function(event) {
    if (isInternalLinkOnDifferentPage(this)) {
      event.preventDefault();

      var title = getTitle(this);
      history.pushState({title: title}, title, this.href);

      loadPage(this.pathname, title, this.hash);
    }
  });

}(window, document, window.location));
