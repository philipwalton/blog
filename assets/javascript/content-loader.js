import delegate from 'dom-utils/lib/delegate';
import parseUrl from 'dom-utils/lib/parse-url';
import alerts from './alerts';
import {gaAll} from './analytics';
import drawer from './drawer';
import History2 from './history2';


// Cache the container element to avoid multiple lookups.
var container;

// Store the result of page content requests to avoid multiple
// lookups when navigation to a previously seen page.
var pageCache = {};


function getTitle(a) {
  var title = a.title || a.innerText;
  return title ? title + ' \u2014 Philip Walton' : null;
}


function getMainContent(content) {
  var match = /<main[^>]*>([\s\S]*)<\/main>/.exec(content);
  return match && match[1];
}


function loadPageContent(done) {
  var path = this.nextPage.path;
  if (pageCache[path]) return done();

  var xhr = new XMLHttpRequest();
  xhr.open('GET', path);
  xhr.onload = function() {
    if (xhr.status >= 200 && xhr.status < 400) {
      let content = getMainContent(xhr.responseText);
      if (!content) {
        done(new Error(`Could not parse content from response: ${path}`));
      }
      else {
        pageCache[path] = content;
        done();
      }
    }
    else {
      alerts.add({
        title: `Oops, there was an error making your request`,
        body: `(${xhr.status}) ${xhr.statusText}`
      });
      done(new Error(`(${xhr.status})' ${path}`));
    }
  };
  xhr.onerror = function() {
    alerts.add({
      title: `Oops, there was an error making your request`,
      body: `Check your network connection to ensure you're still online.`
    });
    done(new Error(`Error making request to: ${path}`));
  };
  xhr.send();
}


function showPageContent() {
  var content = pageCache[this.nextPage.path];
  container.innerHTML = content;
}


function closeDrawer() {
  drawer.close();
}


function setScroll() {
  var hash = this.nextPage.hash;
  if (hash) {
    var target = document.getElementById(hash.slice(1));
  }
  var scrollPos = target ? target.offsetTop : 0;

  // TODO: There's a weird chrome bug were sometime this function
  // doesn't do anything if Chrome has already visited this page and
  // thinks it has a scroll position in mind. Just chrome, weird...
  window.scrollTo(0, scrollPos);
}


function handleError(error) {
  gaAll('send', 'exception', {exDescription: error.stack || error.message});
}


module.exports = {

  init: function() {

    // Only load external content via AJAX if the browser support pushState.
    if (!(window.history && window.history.pushState)) return;

    // Add the current page to the cache.
    container = document.querySelector('main');
    pageCache[location.pathname] = container.innerHTML;

    var history2 = new History2()
        .use(loadPageContent)
        .use(showPageContent)
        .use(closeDrawer)
        .use(setScroll)
        .catch(handleError);

    delegate(document, 'click', 'a[href]', function(event) {

      // Don't load content if the user is doing anything other than a normal
      // left click to open a page in the same window.
      if (// On mac, command clicking will open a link in a new tab. Control
          // clicking does this on windows.
          event.metaKey || event.ctrlKey ||
          // Shift clicking in Chrome/Firefox opens the link in a new window
          // In Safari it adds the URL to a favorites list.
          event.shiftKey ||
          // On Mac, clicking with the option key is used to download a resouce.
          event.altKey ||
          // Middle mouse button clicks (which == 2) are used to open a link
          // in a new tab, and right clicks (which == 3) on Firefox trigger
          // a click event.
          event.which > 1) return;

      var page = parseUrl(location.href);
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
  }
};
