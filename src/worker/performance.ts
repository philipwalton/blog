class PriorityHintsTransform {
  #applied = false;
  element(element: Element) {
    if (!this.#applied) {
      element.setAttribute('fetchpriority', 'high');
      this.#applied = true;
    }
  }
}

export function addPriorityHints(
  rewriter: HTMLRewriter,
  selector: string,
): void {
  rewriter.on(selector, new PriorityHintsTransform());
}

export function getPriorityHintKey(request: Request, path: string): string {
  const device =
    request.headers.get('sec-ch-ua-mobile') === '?1' ? 'mobile' : 'desktop';

  // URL-encode the path because wrangler doesn't handle slashes when
  // running locally (it treats them as directory separators).
  return `${device}:${encodeURIComponent(path)}`;
}

export async function storePriorityHints(
  request: Request,
  store: KVNamespace,
): Promise<void> {
  const {path, selector} = (await request.json()) as {
    path: string;
    selector: string;
  };
  const key = getPriorityHintKey(request, path);

  const storedSelector = await store.get(key);
  if (selector !== storedSelector) {
    await store.put(key, selector);
  }
}
