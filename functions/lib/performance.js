class PriorityHintsTransform {
  #applied = false;
  element(element) {
    if (!this.#applied) {
      element.setAttribute('fetchpriority', 'high');
      this.#applied = true;
    }
  }
}

/**
 * @param {string} experiment
 * @param {HTMLRewriter} rewriter
 */
export function addPriorityHints(rewriter, selector) {
  rewriter.on(selector, new PriorityHintsTransform());
}

/**
 * @param {Request} request
 * @param {string} path
 * @returns {string}
 */
export function getPriorityHintKey(request, path) {
  const device =
    request.headers.get('sec-ch-ua-mobile') === '?1' ? 'mobile' : 'desktop';

  // URL-encode the path because wrangler doesn't handle slashes when
  // running locally (it treats them as directory separators).
  return `${device}:${encodeURIComponent(path)}`;
}

/**
 * @param {Request} request
 * @param {Object} store
 */
export async function storePriorityHints(request, store) {
  const {path, selector} = await request.json();
  const key = getPriorityHintKey(request, path);

  const storedSelector = await store.get(key);
  if (selector !== storedSelector) {
    await store.put(key, selector);
  }
}
