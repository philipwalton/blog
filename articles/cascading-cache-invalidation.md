For several years now, pretty much every article published on caching best practices has recommended the following two things for deploying JavaScript code in production:

* Add revision information to the filenames of your assets (usually content hashes)
* Set far-future expiry or max-age caching headers (so they don't have to be revalidated for returning visitors)

Every bundling tool I know of supports adding content hashes with a simple configuration rule (like the following), and as a result this practice has now become ubiquitous:

```js
filename: '[name]-[contenthash].js'
```

The other thing most performance experts recommend is [code splitting](https://web.dev/reduce-javascript-payloads-with-code-splitting), which allows you to split your JavaScript code into several separate bundles that can be loaded in parallel or even on demand.

Specifically in regards to caching best practices, one of the many claimed benefits of code splitting is that changes made to a single source file won't invalidate the entire bundle. In other words, if a security fix is released for a single npm dependency, and you're code-splitting all your `node_module` dependencies into a separate "vendor" chunk, then only your vendor chunk should have to change.

The problem is, when you combine all of these things, it rarely results in effective long-term caching.

In practice, changes to one of your source files almost always invalidates more than one of your output files&mdash;and this happens *because* you've added revision hashes to your filenames.

## The problem with revisioning filenames

Imagine you've built and deployed a website, and you've used code splitting so most of your JavaScript is loaded on demand.

In the following dependency graph, there's a _main_ entry chunk, three asynchronously-loaded dependency chunks (_dep1_, _dep2_ and _dep3_), and then a _vendor_ chunk that includes all the site's `node_module` dependencies. And in following with caching best practices, all filenames include revision hashes.

<figure>
  <img
    src="{{ 'caching-module-dependency-graph-before.svg' | revision }}"
    alt="A typical JavaScript module dependency tree">
  <figcaption>A typical JavaScript module dependency tree</figcaption>
</figure>

Since the _dep2_ and _dep3_ chunks import modules from the _vendor_ chunk, at the top of their generated output code you'll likely see import statements that looks like this:
```js
import {...} from '/vendor-5e6f.mjs';
```

Now consider what happens if the contents of the _vendor_ chunk change.

If the contents of the _vendor_ chunk change, then the hash in the filename will have to change as well. And since the _vendor_ chunk's filename is referenced in import statements in both the _dep2_ and _dep3_ chunks, then those import statements will have to change too:

```diff
-import {...} from '/vendor-5e6f.mjs';
+import {...} from '/vendor-d4a1.mjs';
```

But since those import statements are part of the contents of the _dep2_ and _dep3_ chunks, changing them means _their_ content hash will change, and thus their filenames must *also* change.

But it doesn't stop there. Since the _main_ chunk imports the _dep2_ and _dep3_ chunks and their filenames have changed, the import statements in _main_ will have to change too:

```diff
-import {...} from '/dep2-3c4d.mjs';
+import {...} from '/dep2-2be5.mjs';
-import {...} from '/dep3-d4e5.mjs';
+import {...} from '/dep3-3c6f.mjs';
```

Finally, since the contents of _main_ have changed, its filename must change along with the others.

After all these changes, here's what the new graph looks like:

<figure>
  <img
    src="{{ 'caching-module-dependency-graph-after.svg' | revision }}"
    alt="A JavaScript module dependency tree (after rename)">
  <figcaption>The modules in the tree affected by a single code change in a leaf node</figcaption>
</figure>

As you can see from this example, a tiny code change made to just one source file actually invalidated 80% of the chunks in the bundle.

While it's true that not all changes will be this bad (e.g. leaf node invalidations cascade up to the root nodes, but root node invalidations don't cascade down to the leaf nodes), in an ideal world, you wouldn't have **any** unnecessary cache invalidations.

So this raises the question: _Is it possible to get the benefits of immutable assets and long term caching without cascading cache invalidations?_

## Solutions to the problem

The problem with content hashes in filenames is not technically that the hashes appear in the filenames, the problem is that those hashes then appear in the contents of other files, which causes those files to be invalidated when those hashes change.

So the solution to this problem is to make it possible for the code in _dep2_ and _dep3_ to import the _vendor_ chunk without specifying any version information, and at the same time guarantee that the version loaded is the correct version, given the current versions of _dep2_ and _dep3_.

As it turns out, there are a number of techniques you can use to accomplish this:

- Import Maps
- Service worker
- Custom script-based loaders

### Technique 1: Import Maps

[Import Maps](https://github.com/WICG/import-maps) is the simplest and easiest-to-implement solution to the cascading invalidation problem, but unfortunately it's not currently supported in any browser except Chrome ([behind a flag](https://www.chromestatus.com/feature/5315286962012160)).

But I want to show you this option first because I do think it'll be the solution most people use in the future, and it also helps explain all the other solutions I want to present.

To use Import Maps to prevent cascading cache invalidation, you have to do three things:

_1) configure your bundler to NOT include revision hashes in the filenames and generate your bundle._

Given the module graph in the previous example, when bundled without content hashes, the files in the output directory should look like this:

```
dep1.mjs
dep2.mjs
dep3.mjs
main.mjs
vendor.mjs
```

And the import statements in those modules will also not include revision hashes:

```js
import {...} from '/vendor.mjs';
```

_2) Use a tool like [rev-hash](https://www.npmjs.com/package/rev-hash) to generate a copy of each file with a revision string added to the filename._

Once you've done this, here's how the contents of your output directory should look (notice there are two versions of each file):

```
dep1-b2c3.mjs",
dep1.mjs
dep2-3c4d.mjs",
dep2.mjs
dep3-d4e5.mjs",
dep3.mjs
main-1a2b.mjs",
main.mjs
vendor-5e6f.mjs",
vendor.mjs
```

_3) Create a JSON object mapping each un-revisioned URL to the revisioned URL and add it to your HTML templates_

This JSON object is the import map, and it will look something like this:

```html
<script type="importmap">
{
  "imports": {
    "/main.mjs": "/main-1a2b.mjs",
    "/dep1.mjs": "/dep1-b2c3.mjs",
    "/dep2.mjs": "/dep2-3c4d.mjs",
    "/dep3.mjs": "/dep3-d4e5.mjs",
    "/vendor.mjs": "/vendor-5e6f.mjs",
  }
}
</script>
```

Now, whenever your browser sees an import statement for a URL matching one of the import map keys, it will instead load the URL specified by that key's value.

Using the above as an example, import statements referencing `/vendor.mjs` will actually request and load `/vendor-5e6f.mjs`.

```js
// References `/vendor.mjs` but loads `/vendor-5e6f.mjs`.
import {...} from '/vendor.mjs';
```

This means the source code of your modules can safely reference the un-revisioned module names and the browser will always load the revisioned files. And since the revision hashes don't appear in the module's source code (they only appear in the import map) changes to those hashes won't ever invalidate any modules other than the one that changed.

<aside class="Info">

**Note:** you might be wondering why I made a copy of each file instead of just renaming it. This is necessary in order to support browsers that don't support Import Maps. Those browsers will see a request for `/vendor.mjs` and just load that URL as normal, so both files need to exist on your server.

</aside>

If you want to see Import Maps in action, I've created a [set of demos](https://github.com/philipwalton/import-maps-caching-demos) showcasing all of the techniques outlined in this article. Also check out the [build configuration](https://github.com/philipwalton/import-maps-caching-demos/blob/master/demos/import-maps-native/rollup.config.js) if you want to see how I generate the import map and revision hashes for each file.

### Technique 2: service worker

The second option to solve this problem is to replicate the functionality of Import Maps in a service worker.

For example, with service worker you can listen for fetch events with request URLs that match the keys of an import map and then respond to those events by actually requesting the revisioned version of each URL:

```js
const importMap = {
  '/main.mjs': '/main-1a2b.mjs',
  '/dep1.mjs': '/dep1-b2c3.mjs',
  '/dep2.mjs': '/dep2-3c4d.mjs',
  '/dep3.mjs': '/dep3-d4e5.mjs',
  '/vendor.mjs': '/vendor-5e6f.mjs',
};

addEventListener('fetch', (event) => {
  const oldPath = new URL(event.request.url, location).pathname;
  if (importMap.hasOwnProperty(oldPath)) {
    const newPath = importMap[oldPath];
    event.respondWith(fetch(new Request(newPath, event.request)));
  }
});
```

But given that this is service worker code, it will only take effect *after* the service worker has installed and activated&mdash;which means the un-revisioned files will be requested on the first load, and the revisioned files will be requested every load thereafter. In other words, two downloads for the same file.

Given this, it may seem like service worker is not a viable solution to cascading cache invalidation.

But if you'll allow me to challenge long-standing caching best practices for just a moment, consider what would happen if you stopped using content hashes in your filenames, and instead you put them in your service worker logic.

This is actually what tools like [Workbox](https://developers.google.com/web/tools/workbox/modules/workbox-precaching) do when precaching assets&mdash;they generate a hash of the contents of each file in your build and they store that mapping in the service worker (think of it like an internal import map). They also cache the resources for you when the service worker first installs, and they automatically add fetch listeners to respond to matching requests with the cached files.

While serving un-revisioned assets from your server may seem scary (and counter to everything you've been taught), the request for these assets is only made when your service worker is first installed. Future requests for these resources go through the [Cache Storage API](https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage) (which doesn't use caching headers), and the only time new requests are made to your server is when a new version of your service worker is deployed (and you want a fresh version of those files anyway).

So as long as you don't deploy new versions of your modules without also updating your service worker (which is definitely not recommended), you'll never have version conflicts or mismatches.

To precache files with [workbox-precaching](https://developers.google.com/web/tools/workbox/modules/workbox-precaching), you can pass a list of asset URLs along with their corresponding revision strings to its `precacheAndRoute()` method:

```js
import {preacacheAndRoute} from 'workbox-precaching';

precacheAndRoute([
  {url: '/main.mjs', revision: '1a2b'},
  {url: '/dep1.mjs', revision: 'b2c3'},
  {url: '/dep2.mjs', revision: '3c4d'},
  {url: '/dep3.mjs', revision: 'd4e5'},
  {url: '/vendor.mjs', revision: '5e6f'},
]);
```

How you generate the revision strings for each asset is up to you, but if you don't want to generate them yourself, the [workbox-build](https://developers.google.com/web/tools/workbox/modules/workbox-build), [workbox-cli](https://developers.google.com/web/tools/workbox/modules/workbox-cli), and [workbox-webpack-plugin](https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin) packages make it easy to generate the precache manifest for you (they can even generate your entire service worker).

My [demo app](https://philipwalton-import-maps-caching-demos.glitch.me/) includes examples of using service worker precaching in both [a Rollup app](https://github.com/philipwalton/import-maps-caching-demos/tree/master/demos/sw-precaching-rollup) (via workbox-cli) and a [webpack app](https://github.com/philipwalton/import-maps-caching-demos/tree/master/demos/sw-precaching-webpack) (via workbox-webpack-plugin).

### Technique 3: using a custom script-based loader

If you're unable to use either Import Maps or service worker on your site, a third option is to implement the functionality of Import Maps via a custom script loader.

If you're familiar with AMD-style module loaders (like [SystemJS](https://github.com/systemjs/systemjs) or [RequireJS](https://requirejs.org/)), you're probably aware that these module loaders typically support defining module aliases. In fact, SystemJS actually [supports aliases using Import Map syntax](https://github.com/systemjs/systemjs/blob/master/docs/import-maps.md), so it's really easy to solve this caching problem in a very future-friendly way (that also works in all browsers today).

If you're using Rollup, you can set the [output format option](https://rollupjs.org/guide/en/#outputformat) to `system`, and in that case creating the import map for your app is exactly the same as the process I described in [technique #1](#technique-1%3A-import-maps).

My [demo app](https://philipwalton-import-maps-caching-demos.glitch.me) includes an example site that uses [Rollup to bundle to SystemJS](https://github.com/philipwalton/import-maps-caching-demos/tree/master/demos/import-maps-systemjs) and an import map to load hashed versions of files.

#### What about webpack?

Wepack is a custom script loader as well, but unlike classic AMD-style loaders, the loader that webpack generates is actually tailor made to each specific bundle it produces.

The advantage of this approach is that the [webpack runtime](https://webpack.js.org/concepts/manifest) can (and does) include its own mapping between chunk names/IDs and their URLs (similar to what I recommend in this article), which means code-split, webpack bundles are less likely to experience cascading cache invalidations.

So the good news for webpack users is, as long as you've configured your webpack build correctly (splitting out your runtime chunk, as described in [webpack's caching guide](https://webpack.js.org/guides/caching/)), then changes to a single source module shouldn't ever invalidate more than two chunks (the chunk containing the changed module and the runtime chunk).

The bad news for webpack users is that webpack's internal mapping is non-standard, so it can't integrate with any other tools, and you also can't customize how the mapping is made. For example, you can't hash webpack's output files yourself (as described in [technique #1](#technique-1%3A-import-maps) above) and put your own hashes in the mapping. And this is unfortunate because the content hashes webpack uses [are not actually based on the contents of the output files](https://github.com/webpack/webpack/issues/7787), they're based on the contents of the source files and build configurations, which can lead to subtle and hard to catch bugs ([#1315](https://github.com/webpack/webpack/issues/1315), [#1479](https://github.com/webpack/webpack/issues/1479), [#7787](https://github.com/webpack/webpack/issues/7787#issuecomment-424905647)).

If you're using webpack to build an app that also uses service worker, I'd recommend using [workbox-webpack-plugin](https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin) and the caching strategy I described in the previous section. The plugin will generate revision hashes based on the contents of webpack's output chunks, which means you don't have to worry about these bugs. Plus, *not* dealing with hashed filenames is generally simpler than dealing with hashed filenames.

## What about other assets?

I've shown how referencing revisioned filenames in your JavaScript code can lead to cascading cache invalidation, but this problem can apply to other assets as well.

For example, both CSS and SVG files often reference other assets (e.g. images) that may have revisioned filenames. As with JavaScript files, you can use either Import Maps or service workers to work around the cascading invalidation problem.

For assets like images or video, this is not a problem at all, so all the existing best practices still apply.

The key point to remember is that any time file A loads file B and also includes file B's revision hash in its source code, then invalidating file B will also invalidate file A. For all other assets, you can ignore the advice in this article.

## Final thoughts

Hopefully this article has encouraged you to investigate whether your site might be affected by cascading cache invalidations. An easy way to test is to build your site, change a single line of code in a file lots of modules import, and then rebuild your site. If the filename of more than one file changes in your build directory, then you're seeing cascading cache invalidation, and you might want to consider adopting one of the techniques I discussed above.

As for which technique to pick, honestly, it depends.

When Import Maps ships in browsers, it'll be the easiest and most comprehensive solution. But until that happens, it clearly doesn't make sense.

If you're currently using service workers&mdash;especially if you're currently using Workbox&mdash;then I'd recommend [technique #2](#technique-2%3A-service-worker). Service worker precaching is how I currently solve the problem on this site, and service worker is the only option if you also [deploy native JavaScript modules](https://philipwalton.com/articles/using-native-javascript-modules-in-production-today/). (And given that 98% of my users have browsers that support service worker and native modules, it was an easy decision).

If service worker is not an option, then I'd recommend [technique #3](#technique-3%3A-using-a-custom-script-based-loader) with SystemJS, as it's the most future-friendly of the custom script-loader options available today, and it has a clear upgrade path to using Import Maps in the future.

As with any performance advice, your mileage may vary. it's important to measure and understand whether something is actually a problem before fixing it. If your release cycle is infrequent and your changesets are typically large, then cascading invalidation is probably not a concern for you.

On the other hand, if you frequently deploy small changes, then your returning users may be downloading a lot of code they already have in their cache. And fixing that could significantly improve page load performance.
