import delegate from 'dom-utils/lib/delegate';
import parseUrl from 'dom-utils/lib/parse-url';
import alerts from './alerts';
import {gaAll, trackError} from './analytics';
import * as drawer from './drawer';
import History2 from './history2';
import {mark, measure, track} from './user-timing';


// Cache the container element to avoid multiple lookups.
let container;

// Store the result of page content requests to avoid multiple
// lookups when navigation to a previously seen page.
const pageCache = {};


/**
 * Marks the beginning of a vitual page fetch.
 */
function trackPageFetchStart() {
  mark('pagefetch:start');
}


/**
 * Marks the end of a virtual page fetch, measures the duration between
 * the start and end mark, and sends that as an event to Google Analytics.
 * @param {{path: (string), fromCache: (boolean)}} arg1
 *     path: The page path of the fetch
 *     fromCache: True if the content is already cached so no network request
 *         needs to be made.
 */
function trackPageFetchEnd({path, fromCache}) {
  mark('pagefetch:end');
  measure('pagefetch', 'pagefetch:start', 'pagefetch:end');
  track('pagefetch', {
    eventCategory: 'Virtual Pageviews',
    eventAction: 'fetch',
    eventLabel: fromCache ? 'cache' : 'network',
    page: path,
  });
}


/**
 * Gets the title of a page from a link element.
 * @param {Element} a The `<a>`` element.
 * @return {string} The title of the page the link will load.
 */
function getTitle(a) {
  const title = a.title || a.innerText;
  return title ? title + ' \u2014 Philip Walton' : null;
}


/**
 * Extracts the markup from inside the `<main>` element of an HTML document.
 * @param {string} html The full HTML document text.
 * @return {string} Just the content inside `<main>`.
 */
function getMainContent(html) {
  const match = /<main[^>]*>([\s\S]*)<\/main>/.exec(html);
  return match && match[1];
}


/**
 * Fetches the content of a page at the passed page path and track how long it
 * takes. If the content is already in the page cache, do not make an
 * unnecessary fetch request. If an error occurs making the request, show
 * an alert to the user.
 * @param {string} path The page path to load.
 * @return {Promise<string>} A promise that fulfills with the HTML content of a
 *    page or rejects with the network error.
 */
function fetchPageContent(path) {
  trackPageFetchStart();
  if (pageCache[path]) {
    trackPageFetchEnd({path, fromCache: true});
    return Promise.resolve(pageCache[path]);
  } else {
    return fetch(path).then((response) => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error(
            `Response: (${response.status}) ${response.statusText}`);
      }
    }).then((html) => {
      const content = getMainContent(html);
      if (!content) {
        throw new Error(`Could not parse content from response: ${path}`);
      } else {
        trackPageFetchEnd({path, fromCache: false});
        pageCache[path] = content;
        return content;
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


/**
 * Adds the new content to the page.
 * @param {string} content The content to set to the page container.
 */
function showPageContent(content) {
  container.innerHTML = content;
}


/**
 * Sets the scroll position of the main document to the top of the page or
 * to the position of an element if a hash fragment is passed.
 * @param {string} hash The hash fragment of a URL to match with an element ID.
 */
function setScroll(hash) {
  const target = hash && document.getElementById(hash.slice(1));
  const scrollPos = target ? target.offsetTop : 0;

  // TODO: There's a weird bug were sometime this function doesn't do anything
  // if the browser has already visited the page and thinks it has a scroll
  // position in mind.
  window.scrollTo(0, scrollPos);
}


/**
 * Removes and re-adds impression observation on the #share call to action
 * since a new page has loaded and thus a new impression should be possible.
 */
function resetImpressionTracking() {
  gaAll('impressionTracker:unobserveAllElements');
  gaAll('impressionTracker:observeElements', ['share']);
}


/**
 * Initializes the dynamic, page-loading code.
 */
export function init() {
  // Only load external content via AJAX if the browser support pushState.
  if (!(window.history && window.history.pushState)) return;

  // Add the current page to the cache.
  container = document.querySelector('main');
  pageCache[location.pathname] = container.innerHTML;

  const history2 = new History2((state) => {
    return fetchPageContent(state.path)
        .then((content) => showPageContent(content))
        .then(() => drawer.close())
        .then(() => setScroll(state.hash))
        .then(() => resetImpressionTracking())
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
}
