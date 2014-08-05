(function(win, doc, loc) {

  // require linkClicked

  // Only load external content via AJAX if the browser support pushState.
  if (!(win.history && win.history.pushState)) return;

  // Store the container element to avoid multiple lookups.
  var container = doc.querySelector('main');

  // Store the result of page content requests to avoid multiple
  // lookups when navigation to a previously seen page.
  var pageCache = {};

  // Add the current page to the cache.
  pageCache[loc.pathname] = container.innerHTML;


  function getTitle(a) {
    var title = a.title || a.innerText;
    return title ? title + ' \u2014 Philip Walton' : null;
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

  function loadPage(urlData, cb) {
    var path = urlData.pathname + urlData.search;

    if (pageCache[path]) {
      cb(pageCache[path]);
    }
    else {
      var basename = /(\w+)\.html$/;
      var url = basename.test(path)
        ? path.replace(basename, '_$1.html')
        : path + '_index.html';

      get(url, function(xhr) {
        pageCache[path] = xhr.responseText;
        cb(xhr.responseText);
      });
    }
  }

  function showPage(content, next, current) {
    container.innerHTML = content;
    setScroll(next.hash)
  }

  function setScroll(opt_hash) {
    if (opt_hash) {
      var target = doc.getElementById(opt_hash.slice(1));
    }
    var scrollPos = target ? target.offsetTop : 0;

    // TODO: There's a weird chrome bug were sometime this function
    // doesn't do anything if Chrome has already visited this page and
    // thinks it has a scroll position in mind. Just chrome, weird...
    win.scrollTo(0, scrollPos);
  }

  linkClicked(function(event) {
    // Don't do anything when clicking on links to the current URL.
    if (this.href == location.href) event.preventDefault();

    // Don't attempt to AJAX in content if the link was click
    // while the command (meta) or control key was pressed.
    if (event.metaKey || event.ctrlKey) return;

    // If the clicked link is on the same site but the pathnames
    // are different then add it to the history.
    // Note, use `hostname` instead of `host` because of an IE8 bug that would
    // report philipwalton:80 even though the URL didn't show a port.
    if ((this.hostname == loc.hostname) && (this.pathname != loc.pathname)) {
      event.preventDefault();
      history2.add(this.href, getTitle(this));
    }
  });

  history2.change(function(next, current, state, event) {

    loadPage(next, function(content) {

      ga('set', {
        location: next.href,
        title: next.title
      });
      ga('send', 'pageview');

      showPage(content, next, current, event);
    });
  });


}(window, document, window.location));
