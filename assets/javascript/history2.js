import parseUrl from 'dom-utils/lib/parse-url';


export default class History2 {

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


  add({url, title, isPopState}) {
    const prevState = this.state;
    const nextState = getState(url, title);

    this.state = nextState;

    // Entries that point to the same resource should be ignored.
    if (prevState.path == nextState.path) return Promise.resolve(null);

    return this._onChange(nextState).then(() => {
      // Popstate triggered navigation is already handled by the browser,
      // so we only add to the history in non-popstate cases.
      if (!isPopState) {
        history.pushState(nextState, title, url);
      }
      if (title) document.title = title;
    });
  }
}


function getState(url, title) {
  const state = parseUrl(url);
  state.title = document.title;
  return state;
}
