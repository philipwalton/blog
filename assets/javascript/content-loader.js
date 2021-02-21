import * as drawer from './drawer';
import History2 from './history2';
import {now} from './utils/performance';


let history2;

const CONTENT_SUFFIX = '.content.html';

const getContentPartialPath = (pagePath) => {
  if (pagePath.endsWith('/')) {
    pagePath += 'index.html';
  }
  if (!pagePath.includes(CONTENT_SUFFIX)) {
    pagePath = pagePath.replace(/\.html$/, CONTENT_SUFFIX);
  }
  return pagePath;
};

/**
 * Fetches the content of a page at the passed page path and track how long it
 * takes. If the content is already in the page cache, do not make an
 * unnecessary fetch request. If an error occurs making the request, show
 * an alert to the user.
 * @param {string} pathname The page path to load.
 * @return {!Promise} A promise that fulfills with the HTML content of a
 *    page or rejects with the network error.
 */
const fetchPageContent = async (pathname) => {
  try {
    const responseStartTime = now();
    const response = await fetch(getContentPartialPath(pathname));

    let content;
    if (response.ok) {
      content = await response.text();
    } else {
      throw new Error(`Response: (${response.status}) ${response.statusText}`);
    }
    const responseDuration = now() - responseStartTime;
    const cacheHit = Boolean(response.headers.get('X-Cache-Hit'));

    import('./log').then(({log}) => {
      log.set({
        page_path: pathname,
        content_source: cacheHit ? 'cache' : 'network',
      });
      log.event('route_transition', {value: responseDuration});
    });

    return content;
  } catch (err) {
    const message = (err instanceof TypeError) ?
        `Check your network connection to ensure you're still online.` :
        err.message;

    const alerts = await import('./alerts');
    alerts.add({
      title: `Oops, there was an error making your request`,
      body: message,
    });

    // Rethrow to be able to catch it again in an outer scope.
    throw err;
  }
};


/**
 * Update the <main> element with the new content and set the new title.
 * @param {string} content The content to set to the page container.
 */
const updatePageContent = (content) => {
  document.getElementById('content').innerHTML = content;
};

/**
 * Executes any scripts added to the container element since they're not
 * automatically added via `innerHTML`.
 */
const executeContainerScripts = () => {
  const container = document.getElementById('content');

  // TODO: [...] should work once Edge supports iterable HTML collections.
  const containerScripts = Array.from(container.getElementsByTagName('script'));

  for (const containerScript of containerScripts) {
    // Remove the unexecuted container script.
    containerScript.parentNode.removeChild(containerScript);

    const activeScript = document.createElement('script');
    activeScript.text = containerScript.text;
    container.appendChild(activeScript);
  }
};


/**
 * Sets the scroll position of the main document to the top of the page or
 * to the position of an element if a hash fragment is passed.
 * @param {string} hash The hash fragment of a URL to match with an element ID.
 */
const setScroll = (hash) => {
  const target = hash && document.getElementById(hash.slice(1));
  const scrollPos = target ? target.offsetTop : 0;

  // TODO: There's a weird bug were sometimes this function doesn't do anything
  // if the browser has already visited the page and thinks it has a scroll
  // position in mind.
  window.scrollTo(0, scrollPos);
};


/**
 * Updates log to reflect the current page.
 * @param {string} pathname
 */
const trackPageview = async (pathname) => {
  const {log} = await import('./log');

  log.set({page_path: pathname});
  log.event('page_view', {navigation_type: 'route_change'});
};


/**
 * Loads a page partial for the passed pathname and updates the content.
 * @param {string} pathname
 */
export const loadPage = async (pathname) => {
  updatePageContent(await fetchPageContent(pathname));
  executeContainerScripts();
};

/**
 * Disables the history2 instance, which forces a full page load on the next
 * link click.
 */
export const disableLoader = () => {
  history2 && history2.disable();
};

/**
 * Initializes the dynamic, page-loading code.
 */
export const init = () => {
  // Only load external content via fetch if the browser support pushState.
  if (!(window.history && window.history.pushState)) return;

  history2 = new History2(async (state) => {
    try {
      await loadPage(state.pathname);
      drawer.close();
      setScroll(state.hash);
      trackPageview(state.pathname);
    } catch (err) {
      const {trackError} = await import('./log');

      trackError(/** @type {!Error} */ (err));
      throw err;
    }
  });
};
