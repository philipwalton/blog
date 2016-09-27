import parseUrl from 'dom-utils/lib/parse-url';


export default class History2 {

  constructor(onChange) {
    this._onChange = onChange;

    const state = parseUrl(location.href);
    state.title = document.title;

    // Add history state initially so the first `popstate` event contains data.
    history.replaceState(state, state.title, state.href);

    // Listen for popstate changes and log them.
    window.addEventListener('popstate', (event) => {
      const state = event.state || {};
      const {title} = state;
      const url = window.location.href;
      this.add({url, title, state, isPopState: true});
    });
  }


  add({url, title, isPopState}) {
    // Non-popstate `add()` calls should not generate a history entry if the
    // new URL points to the same resource.
    if (!isPopState) {
      const currentPage = parseUrl(location.href);
      if (url == currentPage.href) {
        return Promise.resolve(null);
      }
    }

    const nextPage = parseUrl(url);
    nextPage.title = title;

    return this._onChange(nextPage).then(() => {
      // Popstate triggered navigation is already handled by the browser,
      // so we only add to the history in non-popstate cases.
      if (!isPopState) {
        history.pushState(nextPage, title, nextPage.href);
      }
      document.title = title ? title : document.title;
    });
  }
}
