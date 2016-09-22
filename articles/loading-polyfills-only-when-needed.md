New JavaScript and HTML features are coming out all the time that make our lives as developers easier.

Sometimes these features are so helpful that we opts to use them on production websites before they're fully implemented in all the browsers. To not break the experience for users with older browsers, we of course include polyfills for any not-fully-supported feature.

The problem with this approach is it prioritizes developer convenience over user experience, and it penalizes users on modern browsers by forcing them to download code they don't need.

The solution to this problem is to only load polyfills when they're needed, but as it turns out, in practice this is a lot harder than it sounds. Over the years I've seen a number attempts to do this right, but if I'm being honest, I've never liked any of the proposed solutions enough to actually use them myself. I've always just done my own thing.

This topic has come up several times in conversation recently, so I decided to write about my approach. I want to stress that I'm not trying to promote this as the *one true way* to conditionally load polyfills&mdash;it just happens to be the way I like to do it. It's the best balance of simplicity and performance for my use cases.

## Existing solutions

Before I explain why I do what I do, I think it'll be helpful to explain what I don't like about some of the more popular approaches available today.

### The Polyfill Service

The polyfill service, or polyfill.io, is a hosted CDN that parses the user agent string of the device making the request and delivers a bundle only containing polyfills not supported by the browser making the request.

The service lets you specify individual [features](https://polyfill.io/v2/docs/features/#feature-list) like `fetch` or `Object.assign` or rely on a [default set](https://polyfill.io/v2/docs/features/#default-sets)

The great thing about this service is it only delivers the code the current browser needs, the downside is it requires an additional blocking HTTP request even if the user's browser supports all the requested features.

### `document.write()`

On Twitter a few days ago, Ryan Florance [proposed a solution](https://twitter.com/ryanflorence/status/774723121731567617) that doesn't require any additional requests for browsers that natively support all the required features.

The solution works by using `document.write()`:

```html
<script>
  window.Promise || document.write('<script src="https://unpkg.com/es6-promise@3.2.1/dist/es6-promise.min.js"><\/script>');
  window.fetch || document.write('<script src="https://unpkg.com/whatwg-fetch@1.0.0/fetch.js"><\/script>');
</script>
```

The problem with this solution is it will still negatively affect the performance


There are a lot of reason to [avoid using `document.write()`](https://www.stevesouders.com/blog/2012/04/10/dont-docwrite-scripts/), and even if a particular technique has minimal performance impact, I still prefer not to promote it, as some developers may mistakenly assume it's fine to use in general.

The other problem with `document.write()` is it may [not always work](https://developers.google.com/web/updates/2016/08/removing-document-write), as Chrome recently started blocking scripts loaded vya `document.write()` in some cases.

While it's true that in Ryan's example, it won't be a proble because Chrome already supports `Promise` and `fetch`, it's not true that it will never be a problem. If someone used this technique to load a polyfill for a feature not supported in Chrome 54, it might break in some cases.

## Requirements for a good solution

I've explained some of the problems with the existing solutions, and before I explain my solution I wanted to outline my personal list of requirements for any solution I'd consider using.

- The solution must not require supporting browsers to download any unneeded polyfill code.
- The solution must not require supporting browsers to make any extra, blocking HTTP requests.
- The solution must not use any technique (like `document.write()`) that negatively affects rendering, parsing, or the browser's preload scanner.
- The solution must work the first time a user visits a site (not just for repeat visits).

In short, for users with a browser that natively supports all the features required to run the site, the performance should be indistinguishable from how the site would perform if it loaded no polyfills at all.

## My strategy

To summarize my strategy in a single sentence: *I choose to optimize the experience for users on modern browsers.*

That doesn't mean that I don't care about the experience of users with older browsers, it simply means that in situations where I can't optimize for everyone, I'll choose to optimize for users on modern browsers. Where this can get tricky is situations where I could eek out a 1% performance gain for someone on the latest Chrome, but it might come at the cost of a 50% performance hit for someone on IE11. Situations like this are rare, and in these cases you just have to use your best judgement.

The second princle of my strategy is to keep things simple. They way I do that is to ignore the myriad of support combinations that grow exponentionally the more new features you add. For example, if you want to use two new features (A and B), a browser could be in one of four states:

- It supports both A and B.
- It supports A but not B.
- It supports B but not A.
- It supports neither a nor B.

If you want to use five new features, the browser can now be in 32 different states. You can see how this gets out of hand rather quickly.

To avoid complexity, I think its reasonable to group users' browsers into two categories:

- **Full support**: the browser supports 100% of the features required by the site.
- **Partial support**: the browser doesn't support one or more features required by the site, and polyfilling is necessary.

My strategy optimizes for browsers with full support



**100% native support**: Users with browers that natively support *all* the new features I want to use.
- **Everyone else**: Users with browsers that *don't* natively support *all* the features I want to use.

### Optimize for users on modern browsers

My approach is to optimize for users on modern browsers, and by that I mean if someone visits my site using a brower that supports 100% of the features in my code, their experience should not degrade in any noticeable way.

To specifically define what I mean by that, here's a rough list of requirements for how an acceptable solution to me would treat users in the "native support" tier:

- The solution must not require browsers to download any polyfill code.
- The solution must not require an additional, blocking HTTP request.
- The solution must not use `document.write()` or any technique that negatively affects DOM parsing or the browser's preload scanner.
- The solution must work the first time a user visits a site (not just for repeat visits).

### Minimally degrade for users on all other browsers

For users with browsers that don't natively support all the features required by my code, I load a single additional JavaScript file that contains polyfills for all the new features used.

The upside of loading all extra polyfills as a single bundle is it only requires a single extra request. The downside is it means browsers that support half the features still end up loading 100% of the polyfills.

While some people may disagree about whether this is an acceptable trade-off, I think it is (more about this in the next section).

### Choosing what features are okay to include

If you're optimizing for the set of users whose browsers support 100% of the features in your code, its important that you make responsible choices as to what features you include.

For example, if you include a feature that is only supported in Chrome Canary and then require all other users to download a large bundle of polyfills, that's not a responsible choice.

As a general rule, I like to only use features that are available to more than 50% of my users. By following that rule, I know I'm always optimizing for the majority rather than some small subset.

I also want to stress that you should be making this decision based on *your* usage data, not global percentages.

## The implementation

The easiest way to have your code run immediately for most of you users, yet support halting execution until polyfills are loaded for all other users is to structure your site or application so all code has a single entry point.

Lots of programing languages take this approach via a single `main()` function, so I'll use that as my example.

Here's the basic idea:

```js
function main() {
  // Initiate all other code paths.
}

if (browserSupportsAllFeatures()) {
  // Browsers that support all features run `main()` immediately.
  main();
} else {
  // All other browsers loads polyfills and then run `main()`.
  loadScript('/path/to/polyfills.js', main);
}
```

### Writing the conditional

Of course, for this code to work we have to define the functions `browserSupportsAllFeatures()`, which is going to be specific to your site and dpending on what the rest of your code looks like.

The following example the actual conditional I use on this site:

```js
function browserSupportsAllFeatures() {
  return window.Promise && window.fetch && window.Symbol;
}
```

As you can see, on my site, I've determined that making use of `Promise`, `fetch` and ES2015 symbols not only makes my development life easier, but it also reduces the total amount of code I need to ship for browsers that support these features.

And according to my Google Analytics reports, almost 90% of visitors to this site are using a browsers that supports all of these features.

### Loading the polyfills

The last thing you need to do is create the polyfill bundle and then write a function that loads them and accepts a callback to be run once loading is complete.

The load function looks likes this:

```js
function loadScript(src, callback) {
  var js = document.createElement('script');
  var fjs = document.getElementsByTagName('script')[0];
  js.src = src;
  js.onload = callback;

  fjs.parentNode.insertBefore(js, fjs);
}
```

To make the polyfill bundle, you can use a module bundler like webpack or browserify and simply list out each of the polyfills you want to include.

On this site I load select bits of [core-js](https://github.com/zloirock/core-js) as well as Github's [fetch polyfill](https://github.com/Github/fetch).

```js
require('core-js/modules/es6.symbol');
require('core-js/modules/es6.array.iterator');
require('core-js/modules/es6.promise');
require('whatwg-fetch');
```

### Using third-party services instead of creating your own bundle

If you're comfortable with depending on a third-party service to load your polyfills, one I higly recommend is [polyfill.io](https://polyfill.io).

For example, a functionally equivalent version of the bundle I created could be created form the polyfill service by requesting the following URL:

```
https://cdn.polyfill.io/v2/polyfill.min.js?features=Promise,fetch,Symbol,Array.prototype.@@iterator
```

A huge benefit of polyfill


## Don't confuse polyfills with code dependencies

I'm some readers are probably thinking that that many of the existing module loaders alread support conditional loading of dependencies. While this is true, I want to make a distinction between a dependency on

## Downsides / areas for improvement

- The process for updating the load conditional is manual. Ideally there would be a tool that could scan your code and create the polyfill bundle (and conditional) for you.
- Whenever you conditionally load JavaScript for some users and not others, you create another point of failure that must be tested. If you use this strategy, it's absolutely critical that you test your site in all browesrs you want to support.





