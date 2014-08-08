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


  function get(urlData, onSuccess, onError) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', urlData);
    xhr.onload = function() {
      return xhr.status >= 200 && xhr.status < 400 ?
          onSuccess(xhr) : onError(xhr);
    };
    xhr.onerror = function() {
      onError(xhr)
    };
    xhr.send();
  }

  function loadPageContent(done) {
    var path = this.next.path;

    if (pageCache[path]) return done();

    var basename = /(\w+)\.html$/;
    var url = basename.test(path) ?
        path.replace(basename, '_$1.html') : path + '_index.html';

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 400) {
        pageCache[path] = xhr.responseText;
        done();
      }
      else {
        done(new Error('(' + xhr.status + ') ' + xhr.response));
      }
    };
    xhr.onerror = function() {
      done(new Error('Error making request to:' + url));
    };
    xhr.send();
  }

  function showPageContent() {
    var content = pageCache[this.next.path];
    container.innerHTML = content;
  }

  function setScroll() {
    if (this.next.hash) {
      var target = doc.getElementById(opt_hash.slice(1));
    }
    var scrollPos = target ? target.offsetTop : 0;

    // TODO: There's a weird chrome bug were sometime this function
    // doesn't do anything if Chrome has already visited this page and
    // thinks it has a scroll position in mind. Just chrome, weird...
    win.scrollTo(0, scrollPos);
  }

  function trackPage() {
    ga('set', {
      location: this.next.href,
      title: this.next.title
    });
    ga('send', 'pageview');

  }

  function trackError(error) {
    var url = this.next.href;
    ga('send', 'exception', {
      exDescription: error.message,
      exFatal: false,
      hitCallback: function() {
        // If there's an error, attempt to manually navigation to the
        // page. If that fails Github pages will show the actual 404 page.
        loc.href = url;
      }
    });
  }

  var history2 = new History2()
      .use(loadPageContent)
      .use(showPageContent)
      .use(setScroll)
      .use(trackPage)
      ['catch'](trackError);

  linkClicked(function(event) {

    // Don't attempt to AJAX in content if the link was click
    // while the command (meta) or control key was pressed.
    if (event.metaKey || event.ctrlKey) return;

    var page = parseUrl(loc.href);
    var link = parseUrl(this.href);

    // Don't do anything when clicking on links to the current URL.
    if (link.href == page.href) event.preventDefault();

    // If the clicked link is on the same site but has a different path,
    // prevent the browser from navigating there and load the page via ajax.
    if ((link.origin == page.origin) && (link.path != page.path)) {
      event.preventDefault();
      history2.add(link.href, getTitle(this));
    }
  });



}(window, document, window.location));
