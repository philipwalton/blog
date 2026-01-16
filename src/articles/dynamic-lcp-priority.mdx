Earlier this year, Chrome shipped the new [Priority Hints API](https://web.dev/priority-hints/), which lets developers set `fetchpriority="high"` on `<img>`, `<script>`, `<link>` or other elements that you want to ensure are loaded with a high priority. Personally, I'm a huge fan of this API. And I think that adding it to your site is one of the simplest and most effective ways to improve [LCP](https://web.dev/lcp/).

There's just one small problem. In order to be able to use this API, you have to know ahead of time what the LCP element is going to be for every page you want to use it on.

For simple sites with mostly static content, that's not usually a problem but for complex sites with dynamic, personalized, or even user-generated content, it may be nearly impossible to know ahead of time what the LCP element will be for a given page.

The only reliable way to determine the LCP element for a page is to actually load that page and then check what element the Largest Contentful Paint API identifies. But by that time, the element has already rendered to the screen, so it's too late to add the `fetchpriority` attribute.

Or is it?

While it may have been too late for the current visitor, it's not too late for the next visitor. The trick is to collect LCP data from your previous visitors and then use that data to optimize future loads. While that might sound complicated, it can actually be done in just a few simple steps:

1. Run a script on each page to detect the LCP element and then send that data to an endpoint on your server.
2. Create a handler at the endpoint to store the LCP data so future requests can reference it.
3. For each page request, check if there is LCP data stored for the given page and, if so, add the `fetchpriority` attribute to the matching element.

While I'm sure there are a number of different ways to implement this technique, the most performant way I know of—and the way I'm currently doing it on this site—is to use [Cloudflare Workers](https://developers.cloudflare.com/workers/), the Worker [KV datastore](https://developers.cloudflare.com/workers/runtime-apis/kv/), and the Worker [HTMLRewriter API](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/), all of which are available on free plans.

In this post I'm going to explain exactly how I've implemented this technique on this site. To make it easier to follow, I've simplified the code examples a bit, but if you want to see the full implementation, you can refer to [this commit on GitHub](https://github.com/philipwalton/blog/commit/a5a02f5e4d994b57809f7436dcb459b80aaccfaa).

## Step 1: determine the LCP element in JavaScript and send it to your server

In order to dynamically set LCP priority based on previous visit data, the first step is to determine what the LCP element actually is and then create some sort of identifier that can be used to match that element on subsequent visits to the same page.

Both of these things are pretty easy to do with the [web-vitals](https://github.com/GoogleChrome/web-vitals/) JavaScript library, which as of version 3 includes an [attribution](https://github.com/GoogleChrome/web-vitals/#attribution-build) build that exposes all of this information. Here's the basic code that I'm using:

```js
// Import from the attribution build.
import {onLCP} from 'web-vitals/attribution';

// Then register a callback to run after LCP.
onLCP(({attribution}) => {
  // If the LCP element is an image, send a request to the `/lcp-data`
  // endpoint containing the page's URL path and LCP element selector.
  if (attribution.lcpEntry?.element?.tagName.toLowerCase() === 'img') {
    navigator.sendBeacon(
      '/lcp-data',
      JSON.stringify({
        url: location.pathname,
        selector: attribution.element,
      })
    );
  }
});
```

In the above code the `attribution.element` value is a CSS selector that can be used to identify the LCP element. For example, on the page [My Challenge to the Web Performance Community](https://philipwalton.com/articles/my-challenge-to-the-web-performance-community/), the following payload will usually be sent:

```json
{
  "url": "/articles/my-challenge-to-the-web-performance-community/",
  "selector": "#post>div.entry-content>figure>a>img"
}
```

Note that I said this payload will _usually_ be sent, but not always. Depending on the user's screen size, the largest element on this page is not always an image. For example, the following visualization shows what the most common LCP element is for this page across typical desktop and mobile viewport sizes.

{% Img
  src="lcp-desktop-mobile.png",
  alt="An example showing how the LCP element for a page can differ across desktop and mobile screen sizes"
%}

And as you can see, the largest element on desktop is usually an image, but on mobile it's often the first paragraph of text.

I want to pause here and really emphasize this point because it's quite important. As this example shows, it's possible for the LCP element to be different for different visitors to the same page. So any dynamic LCP solution needs to take that into account. The next section explains how I handle this on my site.

## Step 2: store the LCP data for page so future requests can reference it

The previous section showed code that sent LCP data for the current page to an `/lcp-data` endpoint. The next step is to create a handler to receive that data and store it so it's available to future visits.

Since I'm using Cloudflare Workers on my site, the best option for me was to use [KV](https://developers.cloudflare.com/workers/runtime-apis/kv/) store. KV store is a key/value data store that is replicated to Cloudflare's edge nodes. Since the data is stored on the edge, reading from it is very fast. However, when updating the data it's not immediately replicated to every edge node and thus might be stale from time to time.

In my case, occasionally getting stale data is not a problem because the whole point of this feature is to improve performance, and anything that delays the request (like having to query data from a database on my origin server halfway around the world) would defeat the purpose entirely. Also, since Priority Hints are strictly an enhancement, it's fine if the LCP data isn't 100% up-to-date all the time.

To access a Cloudflare KV store from an edge worker, you first have to create the store and then set up a [binding](https://developers.cloudflare.com/workers/runtime-apis/kv/#kv-bindings). Once that's done, you can read and write from the store with simple `.get()` and `.put()` methods:

```js
// Read from the store.
const myValue = await store.get('my-key');

// Write to the store.
await store.put('my-key', 'Updated value...');
```

For my LCP data store, I want to be able to look up LCP element selectors based on what page the user is requesting, so the key should be the page URL and the value should be the LCP element selector for that URL.

And remember, since the LCP element can be different based on the device screen size of the user, I also need to key the LCP data by device type, in addition to URL. To determine the device type (i.e. desktop vs. mobile) I'm checking the [`​​sec-ch-ua-mobile`](https://developer.mozilla.org/docs/Web/HTTP/Client_hints#user-agent_client_hints) header on the request. Note that while this header is currently only supported in Chromium-based browsers, that's not a problem because that's also currently true for the Priority Hints API, so it's sufficient for this use case.

Referring back to the page I mentioned above as an example, the key/value pair for that page would be something like this for a desktop visitor:

<table>
  <tr>
    <td><strong>Key</strong></td>
    <td>
      <code>desktop:/articles/my-challenge-to-the-web-performance-community/</code>
    </td>
  </tr>
  <tr>
    <td><strong>Value</strong></td>
    <td>
      <code>#post>div.entry-content>figure>a>img</code>
    </td>
  </tr>
</table>

And something like this on mobile:

<table>
  <tr>
    <td><strong>Key</strong></td>
    <td>
      <code>mobile:/articles/my-challenge-to-the-web-performance-community/</code>
    </td>
  </tr>
  <tr>
    <td><strong>Value</strong></td>
    <td>
      <code>#post>div.entry-content>p</code>
    </td>
  </tr>
</table>

Here's the full worker code I used to store LCP data for requests to the `/lcp-data` endpoint:

```js
export default {
  async fetch(request, env) {
    if (url.endsWith('/lcp-data') && request.method === 'POST') {
      return storePriorityHints(request, env.PRIORITY_HINTS);
    }
  },
};

async function storePriorityHints(request, store) {
  const {url, selector} = await request.json();

  // Determine if the visitor is on mobile or desktop via UA client hints.
  const device =
    request.headers.get('sec-ch-ua-mobile') === '?1' ? 'mobile' : 'desktop';

  // The key is the device joined with the URL path. If the LCP element
  // can vary by more than just the device, more granularity can be added.
  const key = `${device}:${url}`;

  // If the new selector is different from the old selector, update it.
  const storedSelector = await store.get(key);
  if (selector !== storedSelector) {
    await store.put(key, selector);
  }

  // Return a 200 once successful.
  return new Response();
}
```

Here's what the above code does:

1. Exports a `fetch()` handler with logic to check if the request URL is a `POST` request and matches the `/lcp-data` path.
2. If it matches, the `storePriorityHints()` function is invoked with the request as well as a reference to the `PRIORITY_HINTS` KV data store (see the [KV docs](https://developers.cloudflare.com/workers/runtime-apis/kv/) for how to create these).
3. The `storePriorityHints()` function extracts the `url` and `selector` values from the request JSON. It also determines the device type by checking the `sec-ch-ua-mobile` header.
4. The function then checks the KV store for an LCP element selector using a key that joins the device and URL together.
5. If no selector is found, or if the stored selector is different from the selector in the request JSON, the store is updated with the new selector.

## Step 3: add matching fetchpriority data to future requests

Once you have the LCP data stored for each page and device combination, you can use that information to dynamically add the `fetchpriority` attribution to `<img>` elements for future visits.

I mentioned before that I'm using Cloudflare's [HTMLRewriter](https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/) to do this, which conveniently has a selector-based API for rewriting HTML and allows me to easily find an `<img>` element matching the selector I was storing in the previous section.

The logic goes like this:

1. For each page request, use the page URL and the `sec-ch-ua-mobile` header to determine the LCP data key for the current page, and look up that data in the KV store.
2. In parallel, fetch the HTML for the current page
3. If there is stored LCP data for the current page/device combination, create an `HTMLRewriter` instance to add the `fetchpriority` attribute to the matching element selector.
4. If there is no stored LCP data, return the page as normal.

And here's the code for that:

```js
export default {
  async fetch(request, env) {
    // If the request is to the `/lcp-data` endpoint, add it to the KV store.
    if (url.endsWith('/lcp-data') && request.method === 'POST') {
      return storePriorityHints(request, env.PRIORITY_HINTS);
    }
    // For all other requests use the stored LCP data to add the
    // `fetchpriority` attribute to matching <img> elements on the page.
    return addPriorityHintsToResponse(request, env.PRIORITY_HINTS);
  },
};

async function addPriorityHintsToResponse(request, store) {
  const urlPath = new URL(request.url).pathname;
  const device =
    request.headers.get('sec-ch-ua-mobile') === '?1' ? 'mobile' : 'desktop';

  const hintKey = `${device}:${encodeURIComponent(urlPath)}`;

  const [response, hintSelector] = await Promise.all([
    fetch(request),
    store.get(hintKey),
  ]);

  // If a stored selector is found for this page/device, apply it.
  if (hintSelector) {
    return new HTMLRewriter()
      .on(hintSelector, new PriorityHintsHandler())
      .transform(response);
  }
  return response;
}

class PriorityHintsHandler {
  #applied = false;
  element(element) {
    // Only apply the `fetchpriority` attribute to the first matching element.
    if (!this.#applied) {
      element.setAttribute('fetchpriority', 'high');
      this.#applied = true;
    }
  }
}
```

You can see this code working in action by visiting [this page](https://philipwalton.com/articles/my-challenge-to-the-web-performance-community/) on my site on a desktop device, and you should see `fetchpriority="high"` applied to the first image. Note that this attribute is not in the [source code for that page](https://github.com/philipwalton/blog/blob/7ffae317978b37a281d9014710031a59ae36eb8b/articles/my-challenge-to-the-web-performance-community.md?plain=1#L5-L10), it only appears if a previous visitor reported that image as being the LCP image for that page, which has probably happened by the time you're reading this.

I also want to make it clear that this attribute is being added to the HTML itself, it's not being applied using client-side JavaScript. To see that for yourself you can use `curl` to request the HTML source for this page, and in the response you should see a `fetchpriority` attribute:

```sh
curl https://philipwalton.com/articles/my-challenge-to-the-web-performance-community/
```

Again, that attribute is not in the [source code](https://github.com/philipwalton/blog/blob/7ffae317978b37a281d9014710031a59ae36eb8b/articles/my-challenge-to-the-web-performance-community.md?plain=1#L5-L10) for this page. It's being added by the Cloudflare worker based on data from previous visitors.

## Caveats

I honestly believe that a large number of sites on the web today could benefit from a technique like this, but there are a couple of important caveats I need to mention.

First of all, in order for this strategy to work, the LCP `<img>` element for each page needs to be present in the HTML source. In other words, the LCP element cannot be dynamically added via JavaScript—and that includes popular techniques like setting the image URL via the `data-src` attribute instead of the standard `src` attribute:

```html
<img data-src="image.jpg" class="lazyload" />
```

In addition to the fact that it's always a bad idea to lazy load your LCP element, any time you use JavaScript to load images, it won't work with the declarative `fetchpriority` attribute.

A second important caveat is that this technique works best for sites where the LCP element (or at least the selector that would identify the element) doesn't vary dramatically from visitor to visitor. If it does then the code described in this article would result in each visitor overriding the LCP data of the previous visitor, and the correct LCP element would rarely match.

If this describes your site then you'd probably need to include some sort of user ID in your LCP data key; however, that would only be worth it if users frequently revisit your site. If they don't then you wouldn't expect to see much savings.

## Validating that this technique works

As with any performance strategy, it's important to measure the impact and validate that it works. One way to validate how well this technique works for you is to measure the accuracy of the results for your particular site. That is, for cases where the `fetchpriority` was dynamically added, how often did it end up applying to the correct element?

You can do that with something like the following code:

```js
import {onLCP} from 'web-vitals/attribution';

onLCP((metric) => {
  let dynamicPriority = null;

  const {lcpEntry} = metric.attribution;

  // If the LCP element is an image, check to see if a different element
  // on the page was given the `fetchpriority` attribute.
  if (lcpEntry?.url && lcpEntry.element?.tagName.toLowerCase() === 'img') {
    const elementWithPriority = document.querySelector('[fetchpriority]');
    if (elementWithPriority) {
      dynamicPriority =
        elementWithPriority === lcpEntry.element ? 'hit' : 'miss';
    }
  }
  // Log whether the dynamic priority logic was a hit, miss, or not set.
  console.log('Dynamic priority:', dynamicPriority);
});
```

If you only ever add the `fetchpriority` attribute dynamically, then any time there is an element on the page that has the `fetchpriority` attribute but _isn't_ the LCP element, it means the technique got it wrong.

You can use this "hit rate" to test how effective the matching logic is for your visitors. If the logic fails a significant percentage of the time, then it's probably worth tweaking or removing.

## Wrapping up

If you've found the technique I've described here useful, please consider trying it out or sharing it with someone who you think could benefit. My hope is that CDNs like Cloudflare and others can start automatically implementing techniques like this, or adding it as a feature that users can optionally turn on.

If nothing else, my hope is that this post helped shed some light on the fact that LCP is, by its very nature, a dynamic metric that is heavily dependent on user behavior. You can't always know ahead of time what the LCP element is going to be for a given page, so it's important that your optimization techniques can handle a range of possible outcomes, and adapt accordingly.
