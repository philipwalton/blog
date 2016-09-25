import delegate from 'dom-utils/lib/delegate';
import parseUrl from 'dom-utils/lib/parse-url';
import alerts from './alerts';
import {trackError} from './analytics';
import drawer from './drawer';
import History2 from './history2';


// Cache the container element to avoid multiple lookups.
let container;

// Store the result of page content requests to avoid multiple
// lookups when navigation to a previously seen page.
const pageCache = {};


function getTitle(a) {
  const title = a.title || a.innerText;
  return title ? title + ' \u2014 Philip Walton' : null;
}


function getMainContent(content) {
  const match = /<main[^>]*>([\s\S]*)<\/main>/.exec(content);
  return match && match[1];
}


function loadPageContent(path) {
  if (pageCache[path]) {
    return Promise.resolve(pageCache[path]);
  } else {
    return fetch(path).then((response) => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error(
            `Response: (${response.status}) ${response.statusText}`);
      }
    }).then((body) => {
      const content = getMainContent(body);
      if (!content) {
        throw new Error(`Could not parse content from response: ${path}`);
      } else {
        return pageCache[path] = content;
      }
    }).catch((err) => {
      const message = (err instanceof TypeError) ?
          'Check your network connection to ensure you\'re still online.' :
          err.message;

      alerts.add({
        title: `Oops, there was an error making your request`,
        body: message,
      });
      // Rethrow to be able to catch it again in an outer scope.
      throw err;
    });
  }
}


function showPageContent(content) {
  container.innerHTML = content;
}


function closeDrawer() {
  drawer.close();
}


function setScroll(hash) {
  let target;
  if (hash) target = document.getElementById(hash.slice(1));

  const scrollPos = target ? target.offsetTop : 0;

  // TODO: There's a weird chrome bug were sometime this function
  // doesn't do anything if Chrome has already visited this page and
  // thinks it has a scroll position in mind. Just chrome, weird...
  window.scrollTo(0, scrollPos);
}


module.exports = {

  init: function() {
    // Only load external content via AJAX if the browser support pushState.
    if (!(window.history && window.history.pushState)) return;

    // Add the current page to the cache.
    container = document.querySelector('main');
    pageCache[location.pathname] = container.innerHTML;

    const history2 = new History2((state) => {
      return loadPageContent(state.path)
          .then((content) => showPageContent(content))
          .then(() => closeDrawer())
          .then(() => setScroll(state.hash))
          .catch((err) => trackError(err));
    });

    delegate(document, 'click', 'a[href]', function(event, delegateTarget) {
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

      const page = parseUrl(location.href);
      const link = parseUrl(delegateTarget.href);

      // Don't do anything when clicking on links to the current URL.
      if (link.href == page.href) event.preventDefault();

      // If the clicked link is on the same site but has a different path,
      // prevent the browser from navigating there and load the page via ajax.
      if ((link.origin == page.origin) && (link.path != page.path)) {
        event.preventDefault();
        history2.add({
          url: link.href,
          title: getTitle(delegateTarget),
        });
      }
    });
  },
};
