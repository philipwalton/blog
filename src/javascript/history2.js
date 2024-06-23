import {delegate, parseUrl} from 'dom-utils';

/**
 * A class than wraps a lot of the complexity around adding items to the
 * history in a single page application.
 */
export default class History2 {
  /**
   * Initializes the instance with a change handler.
   * @param {!Function} onChange A callback invoked every time a new entry is
   *     added to the history that returns a promise, resolved once the next
   *     page is loaded.
   */
  constructor(onChange) {
    this._onChange = onChange;
    this.state = getState(location.href, document.title);

    // Add history state initially so the first `popstate` event contains data.
    history.replaceState(this.state, this.state.title, this.state.href);

    // Listen for popstate changes and log them.
    window.addEventListener('popstate', (event) => {
      // If there's no state, that means this handler was initiated by a
      // forward history addition like clicking on a hash link.
      const url = location.href;
      const title = event.state && event.state.title;

      this.update({url, title, isPopState: true});
    });

    this._delegate = delegate(
      document,
      'click',
      'a[href]',
      (event, delegateTarget) => {
        // Don't load content if the user is doing anything other than a normal
        // left click to open a page in the same window.
        if (
          // On mac, cmd+click will open a link in a new tab.
          // Ctrl+click does this on windows.
          event.metaKey ||
          event.ctrlKey ||
          // Shift+click in Chrome/Firefox opens the link in a new window
          // In Safari it adds the URL to a favorites list.
          event.shiftKey ||
          // On Mac, opt+click is used to download a resource.
          event.altKey ||
          // Middle mouse button clicks (which == 2) are used to open a link
          // in a new tab, and right clicks (which == 3) on Firefox triggers
          // a click event.
          event.which > 1
        ) {
          return;
        }

        const page = parseUrl(location.href);
        const link = parseUrl(delegateTarget.href);

        if (/\.(png|svg|webp)$/.test(link.href)) return;

        // Don't do anything when clicking on links to the current URL.
        if (link.href == page.href) event.preventDefault();

        // If the clicked link is on the same site but has a different path,
        // prevent the browser from navigating there and load the page manually.
        if (link.origin == page.origin && link.pathname != page.pathname) {
          event.preventDefault();
          this.update({
            url: link.href,
          });
        }
      },
    );
  }

  /**
   * Removes the delegated event listener, effectively disabling all
   * fetch loads.
   */
  disable() {
    this._delegate.destroy();
  }

  /**
   * Pushes a new entry into the history.
   * @param {{
   *   url: (string),
   *   title: (string|undefined),
   *   isPopState: (boolean|undefined),
   * }} arg1
   * - url: The URL for the next page in the history.
   * - title: The title of the next page in the history.
   * - isPopState: true if the entry was added from a popState event.
   */
  async update({url, title, isPopState}) {
    const prevState = this.state;
    const nextState = getState(url, title);

    // Entries that point to the same resource should be ignored.
    if (prevState.pathname == nextState.pathname) return;

    await this._onChange(nextState);

    this.state = nextState;

    // Popstate triggered navigation is already handled by the browser,
    // so we only add to the history in non-popstate cases.
    if (!isPopState) {
      history.pushState(nextState, title, url);
    }
  }
}

/**
 * Gets a state object from a URL and title. The state object is the parsed
 * URL object with an additional `title` property.
 * @param {string} url The page URL.
 * @param {string} title The page title.
 * @return {!Object} The state object.
 */
function getState(url, title) {
  const state = parseUrl(url);
  state.title = title;
  return state;
}
