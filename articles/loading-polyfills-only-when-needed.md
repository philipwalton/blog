New JavaScript and HTML features are being introduced all the time that make our lives as developers easier.

In many cases, these new features are so helpful we choose to use them on production websites before they're fully implemented in all browsers. To not break the experience for users on older browsers, we of course include polyfills for any not-fully-supported features.

The problem with this approach is it prioritizes developer convenience over user experience, and it unnecessarily penalizes users on modern browsers by forcing them to download a lot of code they don't need.

The solution to this problem is to only load polyfills when they're needed, but as it turns out, in practice that's a lot harder than it sounds. Over the years I've seen a number of attempts to do this right, but (if I'm being honest) I've never liked any of them enough to actually use myself. I've always just done my own thing.

This topic has come up several times in conversation recently, so I decided to write about my approach. I want to stress that I'm not trying to promote this as the *one true way* to conditionally load polyfills&mdash;it just happens to be the way I like to do it. It's the best balance of simplicity and performance for my projects.

## Problems with existing solutions

Before I explain my approach, I think it'll be helpful to state what I don't like about some of the more popular solutions available today.

### yepnope

The [yepnope.js](http://yepnopejs.com/) library (which was also used by `Modernizr.load()`) allowed developers to conditionally load scripts based a feature-detection test.

I say "allowed" (past tense) because yepnope has been deprecated, and instead of saying what I don't like about this approach, it's probably better to just let you read the [deprecation notice](https://github.com/SlexAxton/yepnope.js#deprecation-notice) and see why the creators of yepnope don't recommend using it.

### User agent parsing

The best example of this I know is the Polyfill Service ([polyfill.io](https://polyfill.io)), which is a CDN (with an option to self-host) that accepts a request for a set of browser features and returns only the polyfills that are needed by the requesting browser (based on the User-Agent header).

In a request you can specify individual [features](https://polyfill.io/v2/docs/features/#feature-list) (e.g. `fetch`, `Object.assign`, or `Array.prototype.includes`) or rely on a [default set](https://polyfill.io/v2/docs/features/#default-sets).

While in general I think this service is fantastic, and in some cases I would absolutely recommend using it, the downside is it requires an additional blocking HTTP request even if the user's browser supports all the necessary features.

### `document.write()`

On Twitter recently, Ryan Florence [proposed a solution](https://twitter.com/ryanflorence/status/774723121731567617) that doesn't require any additional requests for browsers that natively support all the required features.

The solution works by using `document.write()`:

```html
<script>
  window.Promise || document.write('<script src="https://unpkg.com/es6-promise@3.2.1/dist/es6-promise.min.js"><\/script>');
  window.fetch || document.write('<script src="https://unpkg.com/whatwg-fetch@1.0.0/fetch.js"><\/script>');
</script>
```

The problem with this solution is it can negatively affect performance for all users (even those with native `Promise` and `fetch` support). For browsers that need the polyfill, it creates a synchronous, blocking script tag, but even for browsers that never execute the `document.write()` statement, it can *still* be problematic. The mere presence of a `document.write()` statement (detected by the browser's preload scanner) can prevent certain optimizations.

The other problem with `document.write()` is it may [not always work](https://developers.google.com/web/updates/2016/08/removing-document-write). Chrome recently started blocking scripts loaded via `document.write()` in some cases, so using this technique going forward is definitely not a good idea.

While Ryan [correctly points out](https://twitter.com/ryanflorence/status/774725504050102276) that this change won't affect his example (since current Chrome versions support `Promise` and `fetch`), it could be an issue for APIs that come out in the future (e.g. any API not currently supported in Chrome 54).

### Asynchronous module loaders

Dependency management via asynchronous module loaders is not a new idea. It was popularized many years ago by [RequireJS](http://requirejs.org/) and the technique is now supported by all modern module loaders like [Webpack](http://webpack.github.io/) and [SystemJS](https://github.com/systemjs/systemjs).

As a web developer, it's critical that you understand asynchronous module loading and the tooling behind it (e.g. Webpack's [code splitting](http://webpack.github.io/docs/code-splitting.html) feature) if you want to build large, complex apps that don't have to load all their dependencies upfront. That being said, I think there's an important distinction to be made between conditionally loading application dependencies and conditionally loading polyfills.

Polyfills are a fundamentally different type of dependency, and the mechanisms all scripts loaders use to resolve application-level dependencies are (in my opinion) not well-suited for the polyfill uses case.<sup>[[1]](#footnote-1)</sup>

There's also the fact that, unlike application-level dependencies, polyfill dependencies can be determined through static analytics, so maintaining these dependencies manually in every single module that might need them is not work a human should do.

This doesn't mean I think module loaders don't have a place in solving this problem&mdash;they definitely do. And I discuss this more at the end of the article.

## Requirements for a good solution

For me to consider using any polyfill-loading solution, it has to pass my list of must-haves:

- The solution must not require supporting browsers to download any unneeded polyfill code.
- The solution must not require supporting browsers to make any extra, blocking HTTP requests.
- The solution must not use any technique (like `document.write()`) that negatively affects rendering, parsing, or the browser's preload scanner.
- The solution must work the first time a user visits a site (not just for repeat visits).
- The solution must be easy to maintain and not require a lot of boilerplate.
- The solution must have a tiny code footprint (ideally less than 1K).

In short, for users on a browser that natively support all the features required to run a site, the performance should be indistinguishable from how the site would perform if it loaded no polyfills at all.

## My strategy

The primary principle of my polyfill strategy is: *I optimize the experience for users on modern browsers.*

That doesn't mean that I don't care about the experience of users on older browsers, it just means in situations where I can't optimize equally for everyone, I'll choose to optimize for users on modern browsers.

It also means I proactively look for ways to optimize for users on modern browsers.

For example, if I discover I can eliminate a lot of extra code in my app by using Promises, I will do so, even though it comes at the cost of requiring a polyfill for older browsers. The same is true for a lot of ES2015 features like [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set), and [`Symbol`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol). Where this can get tricky is situations where I could eek out a 1% performance gain for someone on the latest Chrome, but it might come at the cost of a 50% performance hit for someone on IE11. Situations like this are rare, and in these cases you just have to use your best judgment.

The second principle of my strategy is to keep things simple. They way I do that is to ignore the myriad of support combinations that grow exponentially the more new features I want to add. For example, when only using two new features (X and Y), a browser could be in one of four states:

- It supports both X and Y.
- It supports X but not Y.
- It supports Y but not X.
- It supports neither a nor Y.

If you want to use five new features, the browser can now be in 32 different states. You can see how this gets out of hand rather quickly.

To avoid complexity, I think it's reasonable to group users' browsers into two categories:

- **Full support**: the browser supports 100% of the features required by the site.
- **Partial support**: the browser doesn't support one or more features required by the site, and polyfilling is necessary.

My strategy optimizes for browsers with full support, and treats all other browsers equally. That means for users on fully-supporting browsers I don't load any polyfills, and for users on partially-supporting browsers, I load the same set of polyfills, regardless of how many of those polyfills that particular browser actually needs.

The upside of this approach is it only requires a single extra request for users on partially-supporting browsers, the downside is that it means some people on good (but not fully-supporting) browsers will load polyfills they don't need.

While this obviously isn't 100% optimal, In my experience attempt to make it 100% optimal either add too much complexity, require too much additional code to be downloaded by all users, or require too many individual polyfill requests.

### Choosing what features are acceptable to include

The good in optimizing for fully-supporting browsers is only good if your definition of "fully-supporting" is reasonable based on your user base.

For example, if your app depends on a feature that's only natively supported in Chrome Canary, and then you require all other users to download a large bundle of polyfills, that's not particularly good for your users.

As a general rule, I will only use a new feature if it's natively supported in browsers used by more than half of my user base. And if I'm using a combination of new features, I apply that rule to native support for the entire feature-set. By following that rule, I know I'm always optimizing for the majority rather than some small subset.

I also want to stress that you should be making this decision based on *your* usage data, not global percentages.

For example, on this blog (in the past 30 days), almost 90% of users were running the latest (or second latest) version of Chrome or Firefox. About 8% were running some version of Safari, and every other browser represented less than 1% of the total user base.

That means for this blog I can safely use any feature supported in both Chrome and Firefox (as long as a good polyfill exists), and in many cases I can use features only currently supported in Chrome.

## The implementation

The easiest way to have your code run immediately for most of you users, yet halt execution until polyfills are loaded for all other users is to structure your site so all code paths have a single entry point.

Lots of programs initiate from a single `main()` function, so I'll use that as my example.

Here's the basic idea:

```js
if (browserSupportsAllFeatures()) {
  // Browsers that support all features run `main()` immediately.
  main();
} else {
  // All other browsers loads polyfills and then run `main()`.
  loadScript('/path/to/polyfills.js', main);
}

function main(err) {
  // Initiate all other code paths.
  // If there's an error loading the polyfills, handle that
  // case gracefully and track that the error occurred.
}
```

### Writing the conditional

Of course, for this code to work you have to define a `browserSupportsAllFeatures()` function, and it will be specific to the feature-set you use in the rest of your codebase.

The following is what I use on this site:

```js
function browserSupportsAllFeatures() {
  return window.Promise && window.fetch && window.Symbol;
}
```

In my case, using `Promise`, `fetch` and ES2015 symbols not only makes my development life easier, but it also reduces the total amount of code I need to ship in fully-supporting browsers.

### Loading the polyfills

The last thing you need to do is create the polyfill bundle and then write a function that loads the bundle and accepts a callback to be run once loading is complete.

The load function I use looks likes this:<sup>[[2]](#footnote-2)</sup>

```js
function loadScript(src, done) {
  var js = document.createElement('script');
  js.src = src;
  js.onload = function() {
    done();
  };
  js.onerror = function() {
    done(new Error('Failed to load script ' + src));
  };
  document.head.appendChild(js);
}
```

To generate the polyfill bundle, I recommend using a module bundler like Webpack or Browserify and simply `require` each of the polyfills you want to include. On this site I load select bits from [core-js](https://github.com/zloirock/core-js) as well as Github's [fetch polyfill](https://github.com/Github/fetch).

```js
require('core-js/modules/es6.symbol');
require('core-js/modules/es6.array.iterator');
require('core-js/modules/es6.promise');
require('whatwg-fetch');
```

### Using third-party services instead of creating your own bundle

I mentioned the [Polyfill Service](https://polyfill.io) previously and said I personally wouldn't use it because it requires an additional, blocking HTTP request, even for browsers that support all the features I need.

Of course, that's only true if you use it as documented.

You could also use it with my strategy here&mdash;instead of manually creating your polyfill bundle, you could load the polyfills directly from the polyfill service.

For example, a functionally equivalent version of the bundle I created in the previous section could be generated on-demand from the polyfill service by requesting the following URL:

```
https://cdn.polyfill.io/v2/polyfill.min.js?features=Promise,fetch,Symbol,Array.prototype.@@iterator
```

An added benefit of this approach is if the browser making the request supports all the features except one, that one polyfill is the only one that will be served.

## Areas for improvement

For sites being built by a single person or a small team, manually maintaining a master list of polyfills is pretty easy.

For larger teams, ensuring code changes always stay in sync with the polyfill loading logic is a bit more challenging, but I still firmly believe it's a more manageable solution than listing all polyfill dependencies individually in every module. And if you have good [cross-browser test coverage](/articles/learning-how-to-set-up-automated-cross-browser-javascript-unit-testing/), any code change that fails to properly update the polyfill list should be caught prior to being deployed.

The ultimate solution to this problem is a module loader/bundler that scans your source files, identifies all required polyfills, and manages conditionally loading them for you. It could detect every possible entry point and ensure no code was run without satisfying all missing platform dependencies first.

To make this tool even more useful, it could be configurable to accept browser usage data or some sort of browser support matrix, so as usage of legacy browsers declines over time, the polyfills no longer needed are automatically removed without you having to do anything (a strategy currently usage by tools like [Autoprefixer](https://github.com/postcss/autoprefixer) for CSS).<sup>[[3]](#footnote-3)</sup>

I'm not aware of any tools that do this today. If anyone reading wants to build one, I'm sure the community would be eternally grateful!

To make one last point on this subject, if we can agree that in the future this problem will be solved by tooling, we should make decisions that anticipate that future today. With the solution I'm presenting, the changes required have little to no impact on the majority of your application code. This means it's easy to implement now, and it'll also be easy to move away from when a better solution presents itself. A strategy that conditionally requires polyfill dependencies on a per-module basis is amassing unnecessary technical debt.

## Wrapping up

In my experience, too many people building websites today take a "lowest-common-denominator" approach. By that I mean they ship the same bundle of JavaScript to all users (regardless of browser capabilities), and the bundle they ship contains all code required to make the site work in the oldest browser they want to support.

While I understand that this approach is simple, it's not respectful of your users, and it prioritizes your convenience over their experience.

However, with minimal effort, you can significantly improve the situation for users on modern browsers without sacrificing support for those running legacy browsers.

We as a community should be building experiences that, for the majority of users, are in no way degraded by the fact that legacy browsers exist.

Legacy browser support is your problem; it shouldn't be their problem too.

<aside class="Footnotes">
  <h1 class="Footnotes-title">Footnotes:</h1>
  <ol class="Footnotes-items">
    <li id="footnote-1">Application-level dependencies that are conditionally loaded are still deterministic within an app's module dependency graph. Polyfills, on the other hand, are dependent on both whether the module is ever loaded as well as whether the browser supports the API natively. This means mechanisms like Webpack's <a href="http://webpack.github.io/docs/code-splitting.html">code splitting</a> feature (via <code>require.ensure</code>) are not themselves sufficient to conditionally load polyfills: an additional wrapper module is still necessary to run the feature detect (see <a href="http://ianobermiller.com/blog/2015/06/01/conditionally-load-intl-polyfill-webpack/">previous</a> <a href="http://anujnair.com/blog/13-conditionally-load-multiple-polyfills-using-webpack-promises-and-code-splitting">attempts</a> to accomplish this).</li>
    <li id="footnote-2">Internet Explorer versions before 9 do not support the <code>onload</code> method. If you need to support these old browsers, you also have to add <a href="http://stackoverflow.com/questions/4845762/onload-handler-for-script-tag-in-internet-explorer">an <code>onreadystate</code> handler</a>.</li>
    <li id="footnote-3">Autoprefixer does this via browserlist and its <a href="https://github.com/ai/browserslist#custom-usage-data">custom usage data</a> option.</li>
  </ol>
</aside>
