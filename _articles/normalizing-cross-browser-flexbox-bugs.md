<!--
{
  "layout": "article",
  "title": "Normalizing Cross-browser Flexbox Bugs",
  "draft": true,
  "date": "2014-12-24T11:23:39-08:00",
  "tags": [
    "CSS"
  ]
}
-->

Way back in September of 2013, while testing my [Solved by Flexbox](//philipwalton.github.io/solved-by-flexbox/) project, I discovered a [bug]() in Internet Explorer 10 and 11 that was preventing my sticky footer from actually *sticking* to the bottom of the page. I spent some time trying to work around the issue, but all my attempts failed.

At first I was really annoyed. Before flexbox, it was impossible to build a sticky footer layout using just CSS unless you knew the exact height of both the header *and* the footer. Flexbox changed this&mdash;finally we had CSS solutions for today's modern, responsive layouts.

After my initial disappointment, I eventually concluded that this honestly wasn't that big of a deal, and I released the project even with the buggy behavior. I mean, from a progressive enhancement standpoint, my solution was still pretty good. It worked in Chrome, Firefox, Opera, and Safari, and while it wasn't perfect in Internet Explorer, it wasn't completely broken either. The content was still accessible, and it would only render incorrectly on pages with minimal content. On longer pages, it looked just like every other browser.

A few weeks ago I received a [pull request](https://github.com/philipwalton/solved-by-flexbox/pull/36) on Github that fixed the sticky footer issue with an IE-only `@media` rule. This got me thinking about the problem again, and I was determined to find a solution that didn't require any browser-specific hacks.

As it turns out, there was a solution, and it was possible all along! I just wasn't looking hard enough.

In this article, I'll explain the solution, walk you through how I got there, and talk about the browser bugs I discovered along the way. I'll also make some recommendations for how to write more cross-browser-compatible flexbox code in the future.

## So what are the bugs?

The [flexbox specification](http://dev.w3.org/csswg/css-flexbox/) is not yet finalized, so there's naturally going to be some lag between the latest drafts and browser implementations. This article is not meant to point fingers at any parties for being behind; instead, it's meant to help front-end developers do what we do best&mdash;manage browser inconsistencies.

The following is a list of bugs I've encountered while writing real flexbox code on real websites. While there are almost certainly other bugs I'm not aware of, these hopefully cover the majority of usage:

* IE 10-11 ignore the `min-height` property on flex containers.
* All browsers (except Firefox and IE 12) fail to honor the default minimum content sizing of flex items.
* IE 10-11 doesn't allow unitless `flex-basis` values in the `flex` shorthand.

### The min-height bug

In Internet Explorer 10 and 11, the `min-height` property does not work to size a flex container. This was a problem for my sticky footer demo since sticky footer layouts traditionally require a `min-height` declaration of `100%` (or `100vh`) to ensure that the content area is *at least* as tall as the browser window.

Since min-height wasn't going to work, I needed to find another way.

### Minimum content sizing of flex items

When flex items are too big to fit inside their container, those items are instructed (by the flex layout algorithm) to shrink, proportionally, according to their `flex-shink` property. But contrary to what most browsers allow, they're *not* supposed to shrink indefinitely. They must always be at least as big as their minimum height or width properties declare, and if no minimum height or width properties are set, their minimum size should be the default minimum size of their content.

According to the [flexbox specification](http://www.w3.org/TR/css-flexbox/#flex-common):

> By default, flex items won’t shrink below their minimum content size (the length of the longest word or fixed-size element). To change this, set the min-width or min-height property.

Most browsers currently [ignore this instruction](http://lists.w3.org/Archives/Public/www-style/2014Dec/0249.html) and allow flex items to shrink to zero. As a result, you get content overlapping.

### Unitless flex-basis

Prior to the release of IE 10, the [flexbox spec at the time](http://www.w3.org/TR/2012/WD-css3-flexbox-20120322/#flexibility) stated that a flexbox item's preferred size required a unit when using the `flex` shorthand:

>  If the &lt;preferred-size&gt; is ‘0’, it must be specified with a unit (like ‘0px’) to avoid ambiguity; unitless zero will either be interpreted as as one of the flexibilities, or is a syntax error.

This is no longer true in the spec, but IE 10-11 still treat it as true. If you use the declaration `flex: 1 0 0` in one of these browsers, it will be an error and the entire rule (including all the flexibility properties) will be ignored.

## Finding an alternative sticky footer solution

I choose the sticky footer layout as the main example for this article because I encountered each and every one of these bugs while trying to find a cross-browser solution to it. But before I go into too many specifics, let's make sure we're all on the same page.

Here is the markup I'm using for my sticky footer layout:

```html
<body class="Site">
  <header class="Site-header">…</header>
  <main class="Site-content">…</main>
  <footer class="Site-footer">…</footer>
</body>
```

And here's the CSS that will make the footer stick in any spec-compliant browser:

```css
.Site {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.Site-content {
  flex: 1;
}
```

Now, as I've already mentioned, this CSS *should* work, but due to the existing bugs and the fact that not all browsers are fully spec-compliant, it does not.

If you're an experienced front-end developer, you know that any solution to a cross-browser problem not only needs to work today, but it needs to continue to work long after you finish a project.

*A solution that depends on buggy behavior is no solution at all.*

Based on everything I've said so far, here are my personal requirements for any acceptable alternative solution to the sticky footer layout problem. It must:

* work in all browsers<sup>[[1]](#footnote-1)</sup>
* continue to work as browsers fix broken behavior
* not rely on any browser-specific hack

### Using height instead of min-height

If you've been around for a while, you may remember that Internet Explorer 6 never supported the `min-height` (or width) property; however, it did treat `height:100%` the same way other browsers treated `min-height:100%`, so all the original sticky footer solutions would recommend setting `height:100%` in an IE 6-only stylesheet.

Knowing this, using `height:100vh` instead of `min-height:100vh` was one of the first workarounds I tried. It actually did work in IE, but it didn't work in Chrome, so I immediately wrote it off.

As it turns out, I should have read the spec closer instead of simply assuming Chrome was right and IE was wrong.

In CSS, you typically choose to use `min-height` over `height` to protect yourself from the dreaded overflow. When there's too much content, an explicit `height` will mean there's either going to be clipping, overlapping, or a scroll bar. And in many situations, those are all bad. However, when we're dealing with the body element (as you are in a sticky footer layout), a scroll bar is no big deal. It's actually what you want. So if you define an explicit height of `100vh` on the body and there's too much content, the end result should be the same.

So then the question is: *why didn't this work in Chrome?*

### Minimum sizing bugs

Previously, I mentioned that many browsers mistakenly allow flex items to shrink to less than their default minimum content size, resulting in content overlap. This is why swapping `min-height` for `height` didn't work when I tested it in Chrome.

What should happen is the header, footer, and content elements should all shrink to their default minimum content size (but not less). If these elements (combined) have more content than can fit on the screen, the body element should overflow with a scroll bar like it usually does. The header, footer, and content elements should all render normally, one on top of the other, with no overlap.

What was happening instead is Chrome was allowing the header, footer, and content elements to shrink to smaller than their default minimum content sizes. As a result, instead of the overflow happening on the body element, it was happening on the header, footer, and content elements themselves. And since the default overflow value of those elements is `visible`, their content was overlapping with each other. The footer was fixed to the bottom of the page, and the page content was overflowing below it.

Luckily, there's an easy solution to this problem.

The flexbox spec defines an initial `flex-shrink` value of `1` but says items should not shrink below their default minimum content size. You can get pretty much this exact same behavior by using a `flex-shrink` value of `0` instead of the default `1`.<sup>[[2]](#footnote-1)</sup> If your element is already being sized based on its children, and it hasn't set a `width`, `height`, or `flex-basis` value, then setting `flex-shrink:0` will render it the same way&mdash;but it will avoid this bug.

### Avoiding unitless flex-basis

The unitless `flex-basis` bug is by far the easiest of the three to work around, but it's arguably the hardest one to track down when encountered in the wild.

My original solution to the sticky footer problem applied a declaration of `flex:1` to the main content element. Since a `flex` value of `1` is shorthand for `1 1 0px`,<sup>[[3]](#footnote-2)</sup> and since I knew I didn't want any shrinkage going on, I decided to use `1 0 0px` instead.

This worked just fine until I tested it in IE.

The problem ended up being a combination of this IE bug and my CSS minifier: the minifier was converting `1 0 0px` to `1 0 0` (which has a unitless `flex-basis` value), so IE 10-11 ignored this declaration entirely.

Once I finally discovered the root of the problem, the fix was trivial. Either set an explicit `flex-basis` value or use `0%` in the `flex` shorthand. Note, using `0%` is better than `0px` since most minifiers won't touch percentage values for other reasons.

## Putting it all together

The following is a quick summary of the bugs discussed in this article and their respective solutions:

* `min-height` does not work on flex containers in IE 10-11. Use `height` instead if possible.
* Most browsers do not honor the default min-content size of flex items. Set `flex-shrink` to `0` (instead of the default `1`) to avoid unwanted shrinkage.
* Do not use unitless `flex-basis` values in the `flex` shorthand because IE 10-11 will error. Also use `0%` instead of `0px` since minifiers will often convert `0px` to `0` (which is unitless and will have the same problem).

With all these bug and workarounds in mind, here is the final, alternative solution I came up with. It may not be as clean or intuitive as the way I originally promoted, but it does meet all of my requirements for an alternative solution:

* It works in all browsers.
* it's spec compliant, so it should continue to work as bugs are fixed.
* It does not use any browser-specific hacks.

I've added comments to the CSS to clarify which parts are workarounds:

```css
/**
 * 1. Avoid the IE 10-11 `min-height` bug.
 * 2. Set `flex-shrink` to `0` to prevent these items from shrinking to
 *    smaller than their content's default minimum size.
 */
.Site {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 1 */
}
.Site-header,
.Site-footer {
  flex: none; /* 2 */
}
.Site-content {
  flex: 1 0 auto; /* 2 */
}
```

Too see this new solution in action, check out the updated Solved by Flexbox [sticky footer demo](http://philipwalton.github.io/solved-by-flexbox/demos/sticky-footer/).


<aside class="Footnotes">
  <h1 class="Footnotes-title">Footnotes:</h1>
  <ol class="Footnotes-items">
    <li id="footnote-1">When I say "all browsers" I mean all browsers that implement a version of the flexbox specification dated [March 2012](http://www.w3.org/TR/2012/WD-css3-flexbox-20120322/) or newer. In other words, it should work in all [browsers that claim to support modern flexbox](http://caniuse.com/#feat=flexbox) .</li>
    <li id="footnote-2">Using `flex-basis:0` solves the vast majority of problems associated with this bug, but not all of them. If you want your flex-items to shrink *and* you want them to not shrink past the default content size, this solution will not work.</li>
    <li id="footnote-3">The [March 2014](http://www.w3.org/TR/2014/WD-css-flexbox-1-20140325/) update to the flexbox spec changed the meaning of the `flex:1` shorthand from `1 1 0px` to `1 1 0%`.</li>
  </ol>
</aside>


