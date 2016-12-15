Earlier this year I wrote an [article for Smashing Magazine](https://www.smashingmagazine.com/2016/03/houdini-maybe-the-most-exciting-development-in-css-youve-never-heard-of/) about [Houdini](https://github.com/w3c/css-houdini-drafts/wiki), and I called it the "most exciting development in CSS you've never heard of". In the article I argue that Houdini APIs will (among other things) make it possible to polyfill CSS features in a way the cannot be easily accomplished today.

While the article was generally quite well-received, I did notice the same question popping up over and over again in my inbox and on Twitter. The basic gist of the question was:

> What's so hard about polyfilling CSS? I've used lot of CSS polyfills, and they worked fine for me.

And I realized&mdash;of course people have this question. If you've never tried writing a CSS polyfill yourself, then you've probably never experienced the pain.

So the best way I can think of to answer this question&mdash;and explain why I'm excited about Houdini&mdash;is to show you exactly why polyfilling CSS is hard.

And the best way to show you is to build a polyfill ourselves.

<div class="Callout">

**Note:** this article is a complement to a talk I gave at dotCSS on December 2, 2016. This article goes into a bit more detail, but if you'd prefer to watch the video (22 minutes), you can find it on the dotCSS YouTube channel.

</div>

## The `random` keyword

The feature we're going to polyfill is a (pretend) new CSS keyword called `random`. Random is a number between 0 and 1, just like what `Math.random()` returns in JavaScript.

Here's an example showing how random might be used in CSS:

```css
.foo {
  color: hsl(calc(random * 360), 50%, 50%);
  opacity: random;
  width: calc(random * 100%);
}
```
As you can see, since `random` returns a unitless number, it can be used with `calc()` to essentially become any value. And since it can be any value, it can be applied to any property (e.g. `color`, `opacity`, `width`, etc).

For the rest of this post, we're going to be working with the [demo page](https://philipwalton.github.io/talks/2016-12-02/demos/1/) I used in my talk. Here's what it looks like:

<figure>
  <a href="https://philipwalton.github.io/talks/2016-12-02/demos/1/">
    <img srcset="
      ../../assets/images/random-polyfill-demo-page-1400w.png 1400w,
      ../../assets/images/random-polyfill-demo-page.png 700w"
      src="../../assets/images/random-polyfill-demo-page.png"
      alt="Random keywork polyfill demo page">
  </a>
  <figcaption>
    An <a href="https://philipwalton.github.io/talks/2016-12-02/demos/1/">example </a> of what a site using the <code>random</code> keyword might look like.
  </figcaption>
</figure>

This page is the basic "Hello World" Bootstrap starter template with four `.progress-bar` elements added at the top of the content area.

In addition to `bootstrap.css`, it includes another CSS file with the following rule:

```css
.progress-bar {
  width: calc(random * 100%);
}
```

While the demo I've linked to uses hard-coded progress bar width values, the idea is that once the polyfill is implemented, every time you refresh the page the progress bars will have different, random widths.

## How polyfills work

In JavaScript, writing polyfills is relatively easy because the language is so dynamic and allows you to modify built-in objects at runtime.

For example, if you wanted to polyfill `Math.random()`, you'd do something like this:

```js
if (typeof Math.random != 'function') {
  Math.random = function() {
    // Implement polyfill here...
  };
}
```

CSS, on the other hand, is not dynamic in this way. It's not possible (at least not yet) to modify the runtime to tell the browser about a new feature it doesn't natively understand.

This means that to polyfill a CSS feature that the browser *doesn't* understand, you have to dynamically modify the CSS to fake the feature's behavior using CSS the browser *does* understand.

In other words, you have to turn this:

```css
.foo {
  width: calc(**random** * 100%);
}
```

into something like this, that's randomly generated at runtime:

```css
.foo {
  width: calc(**0.35746** * 100%);
}
```

### Transforming the CSS

So we know we have to modify the existing CSS to add new style rules that mimic the behavior of the feature we're trying to polyfill.

The most natural place to assume you'd be able to do that is the CSS Object Model (CSSOM) which can be accessed on `document.styleSheets`. The code might look something like this:

```js
for (const stylesheet of document.styleSheets) {
  // Flatten nested rules (@media blocks, etc.) into a single array.
  const rules = [...stylesheet.rules].reduce((prev, next) => {
    return prev.concat(next.cssRules ? [...next.cssRules] : [next]);
  }, []);

  // Loop through each of the flattened rules and replace the
  // keyword `random` with a random number.
  for (const rule of rules) {
    for (const property of Object.keys(rule.style)) {
      const value = rule.style[property];

      if (value.includes('random')) {
        rule.style[property] = **value.replace('random', Math.random());**
      }
    }
  }
}
```

<div class="Info">

**Note:** in a real polyfill you wouldn't just do a simple find and replace for the word `random`, as it could be present in many forms outside of its keyword form (e.g. in a URL, in a custom property name, in quoted text in the `content` property, etc.). The actual code in the final demo uses a more robust replacement mechanism, but for the sake of simplicity I'm using the simple version here.

</div>

If you load [demo #2](https://philipwalton.github.io/talks/2016-12-02/demos/2/) and paste the above code into the JavaScript console and run it, it'll actually do what it's supposed to do, but you won't see any random-width progress bars when it's done.

The reason is because rules containing the `random` keyword *aren't in the CSSOM*!

As you're probably aware, when a browser encounters a CSS rule it doesn't understand, it simply ignores it. In most situations that's a good thing because it means you can load CSS in old browsers and the page doesn't completely break. Unfortunately, it also means if you want access to the raw, unaltered CSS, you have to fetch it yourself.

### Fetching the page styles manually

CSS rules can be added to a page with either `<style>` elements or `<link rel="stylesheet">` elements, so to get the raw, unaltered CSS you can do a `querySelectorAll()` on the document and manually get the `innerHTML` contents of any `<style>` tags or `fetch()` the URL resources of any `<link ref="stylesheet">` tags:

The following code defines a `getPageStyles` utility function that returns a promise that will resolve to the full CSS text:

```js
const getPageStyles = () => {
  // Query the document for any element that could have styles.
  var styleElements =
      [...**document.querySelectorAll('style, link[rel="stylesheet"]')**];

  // Fetch all styles and ensure the results are in document order.
  // Resolve with a single string of CSS text.
  return Promise.all(styleElements.map((el) => {
    if (el.href) {
      return **fetch(el.href).then((response) => response.text());**
    } else {
      return **el.innerHTML;**
    }
  })).then((stylesArray) => stylesArray.join('\n'));
}
```

If you open [demo #3](https://philipwalton.github.io/talks/2016-12-02/demos/3/) and paste the above code into the JavaScript console (which defines the function), you'll then be able to run the following code to get the full CSS text:

```js
getPageStyles().then((cssText) => {
  console.log(cssText);
});
```

### Parsing the fetched styles

Once you have the raw CSS text, you need to parse it.

You might thinking that since the browser already has a CSS parser you'd be able to call some function to parse the CSS. Unfortunately, that's not the case. And even if the browser did expose a `parseCSS()` function, it doesn't change the fact that the browser doesn't understand the `random` keyword, so if its `parseCSS()` function would likely not work anyway (hopefully future parse specs will allow for unknown keywords that otherwise comply with the existing grammar).

There are several good, open-source CSS parsers out there, and for the purposes of this demo, we're going to use [PostCSS](http://postcss.org/) (since it can be browserified and includes a plugin system that we'll take advantage of later).

If you run `postcss.parse()` on the following CSS text:

```css
.progress-bar {
  width: calc(random * 100%);
}
```

you'll get something like this:

```json
{
  "type": "root",
  "nodes": [
    {
      "type": "rule",
      "selector": ".progress-bar",
      "nodes": [
        {
          "type": "decl",
          "prop": "width",
          "value": "calc(random * 100%)"
        }
      ]
    }
  ]
}
```

This is what's known as an [abstract syntax tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (AST), and you can think of it like our own version of the CSSOM.

So now that we have a utility function to get the full CSS text, as well as a function to parse it, here's what our polyfill looks like so far:

```js
import postcss from 'postcss';
import getPageStyles from './get-page-styles';

getPageStyles()
  .then((css) => postcss.parse(css))
  .then((ast) => console.log(ast));
```

If you open [demo #4](https://philipwalton.github.io/talks/2016-12-02/demos/4/) and look at the JavaScript console, you'll see an object log containing the full PostCSS AST for all the styles on the page.

## Implementing the polyfill

At this point we've written a lot of code, but strangely none of it has had anything to do with the actual functionality of our polyfill. It's just been necessary boilerplate to work around the fact that we have to manually do a bunch of stuff the browser should be doing for us.

To actually implement the polyfill logic we have to:

- Modify the CSS AST, replacing occurrences of `random` with a random number.
- Stringify the modified AST back into CSS.
- Replace the existing page styles with the modified styles.

### Modifying the CSS AST

PostCSS comes with a nice plugin system with many helper functions for modifying a CSS AST. We can use those functions to replace occurrences of the `random` keyword with a random number:

```js
const randomKeywordPlugin = postcss.plugin('random-keyword', () => {
  return (css) => {
    css.walkRules((rule) => {
      rule.walkDecls((decl, i) => {
        if (decl.value.includes('random')) {
          decl.value = decl.value.replace('random', Math.random());
        }
      });
    });
  };
});
```

### Stringifying the AST back into CSS

Another nice thing about using PostCSS plugins is they already have built-in logic for stringify the AST back into CSS. All you have to do is create a PostCSS instance, pass it the plugin (or plugins) you want to use, and then run `process()`, which returns a promise that resolves with an object containing the stringified CSS:

```js
postcss([randomKeywordPlugin]).process(css).then((result) => {
  console.log(result.css);
});
```

### Replacing the page styles

We also have to write a utility function (similar to `getPageStyles()`) that updates the styles on the page with the new CSS:

```js
const replacePageStyles = (css) => {
  // Get a reference to all existing style elements.
  const existingStyles =
      [...document.querySelectorAll('style, link[rel="stylesheet"]')];

  // Create a new <style> tag with all the polyfilled styles.
  const polyfillStyles = document.createElement('style');
  polyfillStyles.innerHTML = css;
  document.head.appendChild(polyfillStyles);

  // Remove the old styles once the new styles have been added.
  existingStyles.forEach((el) => el.parentElement.removeChild(el));
};
```

The code above finds all `<style>` and `<link rel="stylesheet">` elements and removes them. It also creates a new `<style>` tag and sets its style contents to whatever CSS text is passed to the function.

### Putting it all together

Armed with our PostCSS plugin to modify the CSS AST and our two utility functions to fetch and update the page styles, our full polyfill code now looks like this:

```js
import postcss from 'postcss';
import getPageStyles from './get-page-styles';
import randomKeywordPlugin from './random-keyword-plugin';
import replacePageStyles from './replace-page-styles';

getPageStyles()
  .then((css) => postcss([randomKeywordPlugin]).process(css))
  .then((result) => replacePageStyles(result.css));
```

If you open [demo #5](https://philipwalton.github.io/talks/2016-12-02/demos/5/), you can see it in action. Refresh the page a few times to behold the full randomness!

&hellip;hmmmmmm, not quite what you were expecting, was it?

## What went wrong

While the plugin is technically working, it's applying the same random value to every element matching the selector.

This makes perfect sense when we think about what we've done&mdash;we've just rewritten a single property in a single rule.

The truth is all but the simplest CSS polyfills require more than just rewriting individual property values. Most of them require knowledge of the DOM as well as specific details (size, order, contents, etc.) of the individual matching elements.

This is why preprocessors and server-side solutions to this problem will never be sufficient alone. But it brings up an important question: *how do we update the polyfill to target individual elements?*

## Targeting individual, matching elements

In my experience there are three options for targeting individual DOM elements, and none of them are great.

### Option #1: inline styles

By far the most common option I see for how polyfill authors handle the issue of targeting individual elements is to use the CSS rule selector to find the matching elements on the page and apply inline styles directly to them.

Here's how we could update our PostCSS plugin to do just that:

```js
// ...

  rule.walkDecls((decl, i) => {
    if (decl.value.includes('random')) {
      const elements = **document.querySelectorAll(rule.selector)**;
      for (const element of elements) {
        **element.style[decl.prop]** =
            decl.value.replace('random', Math.random());
      }
    }
  });

// ...
```

[Demo #6](https://philipwalton.github.io/talks/2016-12-02/demos/5/), shows the following code in action.

At first it seems to work great, unfortunately, it's easy to break. Consider if we update the CSS to add another rule after our `.progress-bar` rule.

```css
.progress-bar {
  width: calc(random * 100%);
}

#some-container .progress-bar {
  width: auto;
}
```

The above codes states that all progress bar elements should have a random width except progress bar elements that are descendants of an element with the ID `#some-container`, in which case the width should *not* be random.

Of course this won't work, because we're applying inline styles directly to the element, which means those styles will be more specific than the styles defined on `#some-container .progress-bar`.

This means our polyfill breaks some fundamental assumptions we make when working with CSS (and personally, I find this unacceptable).

### Option #2: Use inline styles, but try to account for the gotchas of option #1

The second option accepts that lots of normal CSS use-cases will fail with the first option, so it tries to address those. Specifically, in option #2 we update the implementation to:

- Check the rest of the CSS for matching rules, and then only replace the random keyword with a random number and apply those declarations as inline styles if it's the last matching rule.
- Wait, that won't work, because we have to account for specificity, so we'll have to manually parse each selector to calculate it. Then we can sort the matching rules in specificity order from low to high, and only apply the declarations from the most specific selector.
- Oh and then there's `@media` rules, so we'll have to manually check for matches there as well.
- And speaking of at-rules, there's also `@supports`—can't forget about that.
- And lastly we'll have to account for property inheritance, so for each element we'll have to traverse up the DOM tree and inspect all its ancestors to get the full set of computed properties.
- Oh, sorry, one more thing: we'll also have to account for `!important`, which is calculated per-property instead of per-rule, so we'll have to maintain a separate mapping for that to figure out which declaration will ultimately win.

Yeah, if you couldn't tell, I've just describe the cascade, which is something we're supposed to be depending on the browser to do for us.

While it's definitely *possible* to re-implement the cascade in JavaScript, it would be a lot of work, and I'd rather just see what option #3 is.

### Option #3: Rewrite the CSS to target individual, matching elements while maintaining cascade order.

The third options&mdash;which I consider to be the best of the bad options&mdash;is to rewrite the CSS to convert rules containing a single selector targeting multiple DOM elements into multiple rules containing selectors that all match only a single DOM element.

That's probably not super clear, so consider the following CSS file, which is included on a page that contains three paragraph elements:

```css
* {
  box-sizing: border-box;
}
p {
  opacity: random;
}
.foo {
  opacity: initial;
}
```

If we were to add a unique data attribute to each paragraph in the DOM, we could rewrite the CSS as follows to target each paragraph element with its own, individual rule:

```css
* {
  box-sizing: border-box;
}
p**[data-pid="1"]** {
  opacity: .23421;
}
p**[data-pid="2"]** {
  opacity: .82305;
}
p**[data-pid="3"]** {
  opacity: .31178;
}
.foo {
  opacity: initial;
}
```

Of course, if you're paying attention, this still doesn't quite work because it alters the specificity of these selectors, which will likely affect the cascade order. *However*, we can ensure the proper cascade order is maintained by increasing *every other selector* on the page by the same specificity amount with some clever hackery:

```css
*​**:not(.z)** {
  box-sizing: border-box;
}
p[data-pid="1"] {
  opacity: .23421;
}
p[data-pid="2"] {
  opacity: .82305;
}
p[data-pid="3"] {
  opacity: .31178;
}
.foo**:not(.z)** {
  opacity: initial;
}
```

The changes above apply the `:not()` functional, pseudo-class selector and pass it the name of a class that's not in the DOM (which means if you use the class `.z`, you'd have to pick a different name). And since `:not()` will always match an element that doesn't exist, it can be used to increase the specificity of a selector without changing what it matches.

[Demo #7](https://philipwalton.github.io/talks/2016-12-02/demos/5/), shows the result of implementing this strategy, and you can refer to the [demo source code](https://github.com/philipwalton/talks/blob/b0a2b9a3de509dd39368516e7e304a4159b41b08/2016-12-02/demos/src/random-keyword-plugin.js
) to see the full set of changes to the `random-keyword` plugin.

The best part about option #3 is it continues to let the browser handle the cascade, which the browser is already good at. This means you can use media queries, `!important`, custom properties, `@support` rules, or any CSS feature, and it will still just work.

## Downsides

It might seem like with option #3 I've solved all of the problems with CSS polyfills, but that couldn't be farther from the truth. There are still a lot of remaining issues, some of which can be resolved (with a lot of extra work), and some of which cannot be resolved.

### Unresolved issues

For one thing, I've intentionally skipped over a few places CSS might live on the page outside of querying the DOM for `<style>` and `<link rel="stylesheet">` tags:

- Inline styles
- Shadow DOM

We *could* update our polyfill to account for these cases, but it would be way more work than I'd want to discuss in a blog post.

We also haven't even considered the possibility of what happens when the DOM changes. After all, we're rewriting our CSS based on the contents of the DOM, which means we'll have to re-rewrite it any time the DOM changes.

### Unavoidable problems

And in addition to the problems I've just described (which are hard, but doable), there are also problems that just can't be avoided:

- It requires *a ton* of extra code.
- It doesn't work with cross-origin (non-CORS) stylesheets.
- It performs horribly if/when changes are needed (e.g. DOM changes, scroll/resize handlers, etc.)

Our `random` keyword polyfill is a rather simple case, but I'm sure you can easily imagine a polyfill for something like `position: sticky`, in which all the logic I've described here would have to be re-run every time the user scrolled, which would absolutely *horrible* for performance.

#### Possibilities for improvement

One solution I didn't address in my talk (due to time constraints) that would potentially alleviate the first two bullets above is to do the parsing and fetching of the CSS server-side in a build step.

And instead of loading a CSS file containing styles, you'd load a JavaScript file containing an AST and the first thing it would do is stringify itself and add the styles to the page. You could even include a `<noscript>` tag which references the original CSS file in the event the user had disabled JavaScript.

For example, instead of this:

```html
<link ref="stylesheet" href="styles.css">
```

you'd have this:

```html
<script src="styles.css.js"></script>
<noscript><link ref="stylesheet" href="styles.css"></noscript>
```

As I mentioned, this solves the problem of having to include a full CSS parser in your JavaScript bundle, and it also allows you to parse the CSS ahead of time, but it doesn't solve all performance issues.

No matter what you try, you'll always have to rewrite the CSS whenever a change is needed.

## Understanding the performance implications

In order to understand why the performance of CSS polyfills is so bad, you really have to understand the browser rendering pipeline&mdash;specifically the steps in the pipeline that you as a developer have access to change.

<figure>
  <img
    src="../../assets/images/browser-rendering-pipeline.svg"
    alt="JavaScript access to the browser rendering pipeline">
  <figcaption>
    JavaScript access to the browser rendering pipeline
  </figcaption>
</figure>

As you can see, the only real point of entry is the DOM, which our polyfill made use of through querying for elements matching the CSS selector as well as through updating the CSS text of the `<style>` tag.

But given the current state of JavaScript access to the browser's rendering pipeline, this is the path our polyfill is forced to take.

<figure>
  <img
    src="../../assets/images/browser-rendering-pipeline-polyfill.svg"
    alt="Polyfill entry points to the browser rendering pipeline">
  <figcaption>
    Polyfill entry points to the browser rendering pipeline
  </figcaption>
</figure>

As you can see, JavaScript is not able to intervene in the initial rendering pipeline after the DOM is constructed, which means any changes our polyfill makes will force the entire rendering process to start over.

This means its impossible for CSS polyfills to perform at 60 fps since all updates force a subsequent render and thus a subsequent frame.

## Wrapping up

The point I hope you take away from the article is that polyfilling CSS is particularly hard because of all the work we as developers need to do to work around limitations of styling and layout on the web today.

Here's a list of things our polyfill had to do manually&mdash;things the browser is already doing, but that we as developers can't access:

- Fetching the CSS
- Parsing the CSS
- Creating the CSSOM
- Handling the cascade
- Invalidating styles
- Revalidating styles

And this is exactly why I'm excited about [Houdini](https://www.smashingmagazine.com/2016/03/houdini-maybe-the-most-exciting-development-in-css-youve-never-heard-of/). Without Houdini APIs, developers will be forced to resort to hacks and workarounds that come at the cost of performance and usability.

And that means CSS polyfills will necessarily be either

- Too big
- Too slow
- Too incorrect

Unfornately, we can't have all three. We have to choose.

Without low-level styling primitives, innovation will move at the pace of the slowest-adopting browser.

Developers complain about the pace of innovation in the JavaScript community. But you never hear about that in CSS. And part of that is due to the limitations I've described in this article

I think we need to change that. I think we need to [#makecssfatigueathing](https://twitter.com/hashtag/makecssfatigueathing).





