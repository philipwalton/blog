Most web developers I talk to these days love writing JavaScript with all the newest language features&mdash;async/await, classes, arrow functions, etc. However, despite the fact that all modern browsers can run ES2015+ code and natively support the features I just mentioned, most developers still transpile their code to ES5 and bundle it with polyfills to accommodate the small percentage of users still on older browsers.

This kinda sucks. In an ideal world, we wouldn't be shipping unnecessary code.

With new JavaScript and DOM APIs, we can [conditionally load polyfills](https://philipwalton.com/articles/loading-polyfills-only-when-needed/) because we can feature detect their support at runtime. But with new JavaScript *syntax*, this is a lot trickier since any unknown syntax will cause a parse error, and then none of the code will run.

While we don't currently have a good solution for feature-detecting new syntax, we *do* have a way to feature-detect basic ES2015 syntax support today.

The solution is `<script type="module">`.

Most developers think of `<script type="module">` as way to load ES modules (and of course this is true), but `<script type="module">` also has a more immediate and practical use-case&mdash;loading regular JavaScript files with ES2015+ features and knowing the browser can handle it!

To put that another way, every browser that supports `<script type="module">` also supports most of the ES2015+ features you know and love. For example:


* Every browser that supports `<script type="module">` also supports **async/await**
* Every browser that supports `<script type="module">` also supports **Classes**.
* Every browser that supports `<script type="module">` also supports **arrow functions**.
* Every browser that supports `<script type="module">` also supports **fetch**, and **Promises**, and **Map**, and **Set**, and much more!

The only thing left to do is provide a fallback for browsers that don't support `<script type="module">`. Luckily, if you're currently generating an ES5 version of your code, you've already done that work. All you need now is to generate an ES2015+ version!

The rest of this article explains how to implement this technique and discusses how the ability to ship ES2015+ code will change how we author modules going forward.


## Implementation

If you're already using a module bundler like webpack or rollup to generate your JavaScript today, you should continue to do that.

Next, in addition to your current bundle, you'll generate a second bundle just like the first one; the only difference is you won't transpile all the way down to ES5 and you won't need to include legacy polyfills.

If you're already using [`babel-preset-env`](https://github.com/babel/babel-preset-env) (which you should be), this second step is very easy. All you have to do is change your list of browsers to only those that support `<script type="module">` and Babel will automatically not apply transformations it doesn't have to.

In other words, it will output ES2015+ code instead of ES5.

For example, if you're using webpack and your main script entry point is `./path/to/main.js`, then the config for your current, ES5 version might look like this (note, I'm calling this bundle `main-legacy` since it's ES5):


```js
module.exports = {
  entry: {
    **'main-legacy'**: './path/to/main.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public'),
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['env', {
              modules: false,
              useBuiltIns: true,
              targets: {
                browsers: [
                  **'> 1%',**
                  **'last 2 versions',**
                  **'Firefox ESR',**
                ],
              },
            }],
          ],
        },
      },
    }],
  },
};
```

To make a modern, ES2015+ version, all you have to do is make second config and set your target environment to only include browsers that support `<script type="module">`. It might look like this:

```js
module.exports = {
  entry: {
    **'main'**: './path/to/main.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public'),
  },
  module: {
    rules: [{
      test: /\.js$/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['env', {
              modules: false,
              useBuiltIns: true,
              targets: {
                browsers: [
                  **'Chrome >= 60',**
                  **'Safari >= 10.1',**
                  **'iOS >= 10.3',**
                  **'Firefox >= 54',**
                  **'Edge >= 15',**
                ],
              },
            }],
          ],
        },
      },
    }],
  },
};
```

When run, these two configs will output two, production-ready JavaScript files:

* `main.js` (the syntax will be ES2015+)
* `main-legacy.js` (the syntax will be ES5)

The next step is to update your HTML to conditionally load the ES2015+ bundle in browsers that support modules. You can do this with a combination of `<script type="module">` and `<script nomodule>`:


```html
<!-- Browsers with ES module support load this file. -->
<script type="module" src="main.js"></script>

<!-- Older browsers load this file (and module-supporting -->
<!-- browsers know *not* to load this file). -->
<script nomodule src="main-legacy.js"></script>
```

<aside class="Info">

**Warning!** The only gotcha here is Safari 10 doesn't support the `nomodule` attribute, but you can solve this by [inlining a JavaScript snippet](https://gist.github.com/samthor/64b114e4a4f539915a95b91ffd340acc) in your HTML prior to using any `<script nomodule>` tags. *(Note: this has been fixed in Safari 11).*

</aside>

### Important considerations

For the most part, this technique "just works", but there are a few details about how modules are loaded that are important to be aware of before implementing this strategy:

1. Modules are loaded like [`<script defer>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-defer), which means they aren't executed until after the document has been parsed. If some of your code needs to run before that, it's best to split that code out and load it separately.
2. Modules always run code in [strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode), so if for whatever reason any of your code needs to be run outside of strict mode, it'll have to be loaded separately.
3. Modules treat top-level `var` and `function` declarations differently from scripts. For example, in a script `var foo = 'bar'` and `function foo() {…}` can be accessed from `window.foo`, but in a module this is not the case. Make sure you're not depending on this behavior in your code.

## A working example

I created [webpack-esnext-boilerplate](https://github.com/philipwalton/webpack-esnext-boilerplate) so developers could see a real implementation of this technique.

With this boilerplate I intentionally included several advanced webpack features because I wanted to show that this technique is production-ready and works in real-world scenarios. These include well-known bundling best-practices like:

* [Code splitting](https://webpack.js.org/guides/code-splitting/)
* [Dynamic imports](https://webpack.js.org/guides/code-splitting/#dynamic-imports) (loading additional code conditionally at runtime)
* [Asset fingerprinting](https://webpack.js.org/guides/caching/) (for effective long-term caching)

And since I would never recommend something I wouldn't use myself, I've updated this blog to use the technique as well. You can check out the [source code](https://github.com/philipwalton/blog) if you'd like to see more.

If you're using a tool other than webpack to generate your production bundles, the process is more or less the same. I chose to demo this using webpack here because it's currently the most popular bundler, and it's also the most complex. I figure if the technique can work with webpack, it can work with anything.

## Is this really worth the extra effort?

In my opinion, definitely! The savings can be substantial. For example, here's a comparison of the total file sizes for the two versions of the actual generated code from this blog:

<table>
  <tr>
   <th>Version</th>
   <th>Size (minified)</th>
   <th><strong>Size (minified + gzipped)</strong></th>
  </tr>
  <tr>
   <td>ES2015+ (main.js)</td>
   <td>80K</td>
   <td><strong>21K</strong></td>
  </tr>
  <tr>
   <td>ES5 (main-legacy.js)</td>
   <td>175K</td>
   <td><strong>43K</strong></td>
  </tr>
</table>

The legacy, ES5 version is more than twice the size (even gzipped) of the ES2015+ version.

Larger files take longer to download, but they also take longer to parse and evaluate. When comparing the two versions from my site, the parse/eval times were also consistently about twice as long for the legacy version (these tests were run on a Moto G4 using [webpagetest.org](https://webpagetest.org)):

<table>
  <tr>
   <th>Version</th>
   <th>Parse/eval time (individual runs)</th>
   <th><strong>Parse/eval time (avg)</strong></th>
  </tr>
  <tr>
   <td>ES2015+ (main.js)</td>
   <td>184ms, 164ms, 166ms</td>
   <td><strong>172ms</strong></td>
  </tr>
  <tr>
   <td>ES5 (main-legacy.js)</td>
   <td>389ms, 351ms, 360ms</td>
   <td><strong>367ms</strong></td>
  </tr>
</table>

While these absolute file sizes and parse/eval times aren't particularly long, realize that this is a blog and I don't load a lot of script. But this isn't the case for most websites out there. The more script you have, the bigger the gains you'll see by shipping ES2015+.

If you're still skeptical, and you think the file size and execution time differences are primarily due to the fact that a lot more polyfills are needed to support legacy environments, you're not entirely wrong. But, for better or worse, this is an extremely common practice on the web today.

A quick [query of the HTTPArchive dataset](https://bigquery.cloud.google.com/savedquery/438218511550:2cee796ae27f472fbfd517606a4bafc3) shows that 85,181 of the top Alexa-ranked sites include [babel-polyfill](https://babeljs.io/docs/usage/polyfill/), [core-js](https://github.com/zloirock/core-js), or [regenerator-runtime](https://github.com/facebook/regenerator/blob/master/packages/regenerator-runtime/runtime.js) in their production bundles. Six months ago that number was 34,588!

The reality is transpiling and including polyfills is quickly becoming the new norm. What's unfortunate is this means billions of users are getting trillions of bytes sent over the wire unnecessarily to browsers that would have been perfectly capable of running the untranspiled code natively.

## It's time we start publishing our modules as ES2015

The main gotcha for this technique currently is most module authors don't publish ES2015+ versions of their source code, they publish transpiled, ES5 versions.

Now that deploying ES2015+ code is possible, it's time we change this.

I fully understand that this presents a lot of challenges for the immediate future. Most build tools today publish documentation that [recommends configurations](https://github.com/babel/babel-loader/blob/v7.1.2/README.md#usage) which [assume all modules are ES5](https://rollupjs.org/#babel). This means if module authors start publishing ES2015+ source code to npm, they'll probably [break some users' builds](https://github.com/googleanalytics/autotrack/issues/137) and just generally cause confusion.

The problem is most developers that use Babel configure it to not transpile anything in `node_modules`, but if modules are published with ES2015+ source code, this is a problem. Luckily the fix is easy. You just have to remove the `node_modules` exclusion from your build config:

```js
rules: [
  {
    test: /\.js$/,
    **exclude: /node_modules/, // Remove this line**
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['env']
      }
    }
  }
]
```

The downside is that if tools like Babel have to start transpiling dependencies in `node_modules` in addition to local dependencies, builds will be slower. Fortunately this is a problem that can somewhat be addressed [at the tooling level with persistent, local caching](https://github.com/babel/babel-loader/blob/v7.1.2/README.md#babel-loader-is-slow).

Regardless of the bumps we'll likely face on the road to ES2015+ being the new module publishing standard, I think it's a fight worth having. If we, as module authors, only publish ES5 versions of our code to npm, we force bloated and slower code upon on users.

By publishing ES2015, we give developers a choice, and that ultimately benefits everyone.

## Conclusion

While `<script type="module">` was intended to be a mechanism for loading ES modules (and their dependencies) in the browser, it doesn't have to be used *just* for that purpose.

`<script type="module">` will happily load a single JavaScript file, and this gives developers a much-needed means for conditionally loading modern features in browsers that can support it.

This, along with the `nomodule` attribute, gives us a way to use ES2015+ code in production, and we can finally stop sending so much transpiled code to browsers that don't need it.

Writing ES2015 code is a win for developers, and deploying ES2015 code is a win for users.


### Further reading

* [ES6 Modules in Chrome M61+](https://medium.com/dev-channel/es6-modules-in-chrome-canary-m60-ba588dfb8ab7)
* [ECMAScript modules in browsers](https://jakearchibald.com/2017/es-modules-in-browsers/)
* [ES6 Modules in Depth](https://ponyfoo.com/articles/es6-modules-in-depth)