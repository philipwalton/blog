import {parseUrl} from 'dom-utils';

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

      this.add({url, title, isPopState: true});
    });
  }

  /**
   * Adds a new entry to the history.
   * @param {{
   *   url: (string),
   *   title: (string),
   *   isPopState: (boolean|undefined),
   * }} arg1
   * - url: The URL for the next page in the history.
   * - title: The title of the next page in the history.
   * - isPopState: true if the entry was added from a popState event.
   */
  async add({url, title, isPopState}) {
    const prevState = this.state;
    const nextState = getState(url, title);

    this.state = nextState;

    // Entries that point to the same resource should be ignored.
    if (prevState.pathname == nextState.pathname) return;

    await this._onChange(nextState);

    if (title) {
      document.title = title;
    }

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
