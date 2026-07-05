import * as alerts from './alerts.ts';
import * as linkableHeadings from './linkable-headings.ts';
import {log, trackUnhandledError} from './log.ts';

let isLoaderDisabled = false;

const getContentPartialPath = (pagePath: string) => {
  if (pagePath.endsWith(import.meta.env.PUBLIC_PARTIAL_PATH)) {
    // If the pagePath already contains the partial path, don't append it.
    // Note: this can happen when the SW notifies of a cache update.
    return pagePath;
  }
  return pagePath + import.meta.env.PUBLIC_PARTIAL_PATH;
};

/**
 * Fetches the content of a page at the passed page path and track how long it
 * takes. If the content is already in the page cache, do not make an
 * unnecessary fetch request. If an error occurs making the request, show
 * an alert to the user.
 */
const fetchPageContent = async (pathname: string) => {
  try {
    const responseStartTime = performance.now();
    const response = await fetch(getContentPartialPath(pathname));

    let content: string;
    if (response.ok) {
      content = await response.text();
    } else {
      throw new Error(`Response: (${response.status}) ${response.statusText}`);
    }
    const responseDuration = performance.now() - responseStartTime;

    // Queue the log logic to not delay returning the response.
    queueMicrotask(() => {
      log.set({page_path: pathname});
      log.event('route_transition', {value: responseDuration});
    });

    return content;
  } catch (err) {
    const message =
      err instanceof TypeError
        ? `Check your network connection to ensure you're still online.`
        : (err as Error).message;

    alerts.add({
      title: `Oops, there was an error making your request`,
      body: message,
    });

    // Rethrow to be able to catch it again in an outer scope.
    throw new Error(`Failed to load '${pathname}'`, {cause: err});
  }
};

/**
 * Update the <main> element with the new content and set the new title.
 */
const updatePageContent = (content: string) => {
  document.getElementById('content')!.innerHTML = content;
};

/**
 * Executes any scripts added to the container element since they're not
 * automatically added via `innerHTML`.
 */
const executeContainerScripts = () => {
  const container = document.getElementById('content')!;

  // TODO: [...] should work once Edge supports iterable HTML collections.
  const containerScripts = Array.from(container.getElementsByTagName('script'));

  for (const containerScript of containerScripts) {
    // Remove the unexecuted container script.
    containerScript.parentNode!.removeChild(containerScript);

    const activeScript = document.createElement('script');
    activeScript.text = containerScript.text;
    container.appendChild(activeScript);
  }
};

/**
 * Updates log to reflect the current page.
 */
const trackPageview = async (url: URL) => {
  log.set({page_path: url.pathname});
  log.event('page_view', {
    navigation_type: 'route_change',
    visibility_state: document.visibilityState,
  });
};

// /**
//  * Sets the scroll position of the main document to the top of the page or
//  * to the position of an element if a hash fragment is passed.
//  */
// const setScroll = (hash) => {
//   const target = hash && document.getElementById(hash.slice(1));
//   const scrollPos = target ? target.offsetTop : 0;

//   // TODO: There's a weird bug were sometimes this function doesn't do anything
//   // if the browser has already visited the page and thinks it has a scroll
//   // position in mind.
//   window.scrollTo(0, scrollPos);
// };

/**
 * Loads a page partial for the passed pathname and updates the content.
 */
export const loadPage = async (url: URL, event?: NavigateEvent) => {
  const content = await fetchPageContent(url.pathname);
  if (event && !url.hash) {
    const state = event.destination.getState();
    window.scrollTo(0, state?.scrollY ?? 0);
  }
  updatePageContent(content);
  executeContainerScripts();
  linkableHeadings.init();
};

/**
 * Disables the history2 instance, which forces a full page load on the next
 * link click.
 */
export const disableLoader = () => {
  isLoaderDisabled = true;
};

/**
 * Initializes the dynamic, page-loading code.
 */
export const init = () => {
  // Only go SPA mode if the browser supports the Navigation API.
  if (!self.navigation) return;

  self.navigation.addEventListener('navigate', (event: NavigateEvent) => {
    const url = new URL(event.destination.url);

    // Don't intercept cross-origin navigations.
    if (url.origin !== location.origin) return;

    // Don't navigate is cases where `isLoaderDisabled` is `true`.
    if (isLoaderDisabled) return;

    // Ignore navigations to resources.
    if (url.pathname.match(/\.(png|svg|webp)$/)) return;

    // Store the current scroll position in the Navigation state.
    self.navigation.updateCurrentEntry({
      state: {scrollY: self.scrollY},
    });

    event.intercept({
      async handler() {
        try {
          await loadPage(url, event);
          trackPageview(url);
        } catch (err) {
          trackUnhandledError(err as Error);
          throw err;
        }
      },
    });
  });
};
