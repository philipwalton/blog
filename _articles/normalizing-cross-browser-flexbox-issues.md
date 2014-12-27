<!--
{
  "layout": "article",
  "title": "Normalizing Cross-browser Flexbox Issues",
  "draft": true,
  "date": "2014-12-24T11:23:39-08:00",
  "tags": [
    "CSS"
  ]
}
-->

Way back in September of 2013, while testing my [Solved by Flexbox](//philipwalton.github.io/solved-by-flexbox/) project, I discovered a [bug]() in Internet Explorer 10 and 11 that was preventing my sticky footer from actually *sticking* to the bottom of the screen.

At first I was really annoyed. Before flexbox, it was impossible to build sticky footer layout using just CSS unless you knew the exact height of both the header and footer. Flexbox changed this. Finally we had layout solutions for today's modern, responsive layouts.

After my initial disappointment, I eventually concluded that this really wasn't that big of a deal. I mean, from a progressive enhancement standpoint, my solution was still pretty good. It worked in Chrome, Firefox, Opera, and Safari, and while it wasn't perfect in Internet Explorer, it wasn't completely broken either. The content was still accessible, and it only rendered incorrectly on pages with small amounts of text. On longer pages, it looked like every other browser.

A few weeks ago I received a [pull request](https://github.com/philipwalton/solved-by-flexbox/pull/36) on Github that fixed the sticky footer issue with an IE-only `@media` hack. After the merging the pull request in, I started thinking about this issue all over again. I understood why my original version didn't work in IE, but why didn't the IE version work in other browsers?

Later that day I discovered that a cross-browser sticky footer layout with flexbox was always possible, I just wasn't looking hard enough. And as it turns out, Internet Explorer wasn't the only browser not playing nice.

In this article, I'll walk you through how to build a sticky footer layout using flexbox that works in all browsers<sup>[[1]](#footnote-1)</sup> and doesn't require any hacks. I'll talk about the bugs that were preventing my original code from working. And I'll make some recommendations for how you can write more cross-browser-friendly flexbox code in the future.

## So what are the bugs?

The flexbox specification is not yet finalized, so there's naturally going to be some lag between the newest drafts and browser implementations. This article is not meant to point fingers at any parties; instead, it's to help front-end developers do what we do best&mdash;deal with browser inconsistencies.

The following are all bugs I've encountered while building actual layouts for actual websites. While obviously not an exhaustive list, these are the main issue I've encountered, and their solutions are far from obvious:

* Internet Explorer 10 and 11 don't respect the `min-height` property on flex containers.
* Chrome and Safari don't respect the minimum content sizing of flex items.
* Internet Explorer doesn't allow unitless `flex-basis` values in the `flex` shorthand.

### The min-height bug

In Internet Explorer 10 and 11, you cannot set a `min-height` value on a flex container. This is the issue I discovered and reported while trying to build my sticky footer demo, as sticky footers traditionally require a `min-height` declaration off `100%` (or `100vh`) to ensure that the content area is *at least* as tall as the browser window.

In IE 10-11, a `min-height` declaration is ignored and treated as if no height were applied at all.

### Minimum content sizing of flex items

When flex items are too big to fit inside their container, those flex items are instructed (by the flex layout algorithm) to shrink, proportionally, according to their `flex-shink` property.

These items, however, are not supposed to shrink indefinitely. They must always be at least as big as their mininum height or width properties declare. And if no `min-height` or `min-width` property is set, their default minimum size is the size of their contents: According to the [flexbox specification](http://www.w3.org/TR/css-flexbox/#flex-common):

> By default, flex items won’t shrink below their minimum content size (the length of the longest word or fixed-size element). To change this, set the min-width or min-height property.

Chrome and Safari, however, seem to [ignore this instruction](http://lists.w3.org/Archives/Public/www-style/2014Dec/0249.html) and allow flex items to shrink to a height or width of zero. As a result, you get content overlapping.

### Unitless flex-basis

Prior to IE 10s release, the [spec at that time](http://www.w3.org/TR/2012/WD-css3-flexbox-20120322/#flexibility) stated that a flexbox item's preferred size required a unit when using the `flex` shorthand:

>  If the &lt;preferred-size&gt; is ‘0’, it must be specified with a unit (like ‘0px’) to avoid ambiguity; unitless zero will either be interpreted as as one of the flexibilities, or is a syntax error.

This is no longer true in the spec, but IE 10-11 still treat it as true. If you use the declaration `flex: 1 0 0` in one of these browsers, it'll be an error and the entire rule will be ignored.

## Finding a solution

The sticky footer layout makes a great case study for this article because all three of bug I mentioned above came into play while trying to make it work cross browser.

To make sure we're all on the same page, here's the markup I'm using for my sticky footer layout:

```html
<body>
  <header>…</header>
  <main>…</main>
  <footer>…</footer>
</body>
```

And here's the CSS that will make the footer stick in any spec-compliant browser:

```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
main {
  flex: 1;
}
```

Now, as I've already mentioned, this CSS *should* work, but due to the existing bugs and the fact that not all browsers are fully spec-compliant, it does not.

If you're an experience front-end developer, you know that any solution to a cross-browser problem not only needs to work today, it needs to continue to work after you moved on from the project. A solution that depends on buggy behavior is no solution at all.

To reiterate the requirements, any solution to the problem should:

* work in all current browsers, even those with bugs
* continue to work as browsers fix broken behavior
* not rely on any browser specific targeting

### Using height instead of min-height

If you've been around for a while, you may remember that Internet Explorer 6 never supported the min/max height or width properties; however, it treated `height:100%` the same way other browsers treated `min-height:100%`, so all the original sticky footer solutions would recommend setting `height:100%` in an IE-only stylesheet.

Knowing this, setting `height:100vh` instead of `min-height:100vh` was one of the first workarounds I tried. It actually did work in IE, but it didn't work in Chrome, so I immediately wrote it off.

Turns out I should have read the spec closer instead of simply assuming Chrome was right and IE was wrong.

In CSS, you typically choose to use `min-height` over `height` to protect yourself from the dreaded overflow. When there's too much content, an explicit `height` will mean there's either going to be clipping, overlapping, or a scroll bar. And in many situations, these are all undesirable. However, when we're dealing with the body element (as you are in a sticky footer layout), a scroll bar is no big deal. It's actually what you want. So if you define an explicit height of `100%` on the body and there's too much content, the end result is the same.

So then the question becomes: *why doesn't this work in Chrome?*

### Minimum sizing bugs

Earlier I described a bug in Chrome and Safari where flex items were allowed to shrink to smaller than their minimum content size, resulting in content overlap.

This is exactly what was going on in Chrome when I tried using `height:100vh` instead of `min-height:100vh` on the body element. In situations where there's more content than can fit on the screen, the browser should simply size the header, footer, and content area according to their default size, and let them overflow the body element, applying a vertical scroll bar since all UA stylesheets add a declaration of `overflow:auto` to the body.

What's happening instead is Chrome and Safari are allowing the header, footer, and content elements to shrink to fit inside of the viewport, but since those elements have a lot of content, the overflow is happening to *them* (rather than to body). Since those elements all use the default `overflow` value of `visible`, the overflowing content overlaps other content on the page.

Fortunately, there's an easy solution to this problem.

Chrome and Safari are trying to shrink the children of body because flex items have a default `flex-shrink` value of `1`. In situations where you *know* you don't want content to shrink, you can simply use a value of `0`, and all browsers will respect it.<sup>[[2]](#footnote-1)</sup>

### Avoiding unitless flex-basis

The unitless flex-basis bug is by far the easiest of the three to work around, but it's arguably the hardest one to track down.

My original solution to the sticky footer problem applied a declaration of `flex:1` to the `<main>` element. Since a `flex` shorthand value of `1` is shorthand for `1 1 0px`<sup>[[3]](#footnote-2)</sup>, and since I knew I didn't want any shrinking going on, I decided to use `1 0 0px` instead.

This worked just fine until I tested it in IE.

The problem ended up being a combination to two things: (1) My CSS minifier was converting `0px` to `0` and (2) the fact that IE 10-11 ignore unitless `flex-basis` values in `flex` shorthand.

Once I finally got to the root of the problem, the fix became trivial. Either set an explicit flex-basis, or use `1 0 0%` since most minifiers won't convert `0%` to `0`.

## Putting it all together

The following is a quick summary of the bugs I discussed in this article and their solutions:

* `min-height` does not work on flex containers in IE 10/11, use `height` instead if possible.
* Chrome/Safari do not honor the min-content size of flex items. Set `flex-shrink` to `0` to avoid unwanted shrinkage.
* Do not use unitless `flex-basis` values in the `flex` shorthand because IE 10/11 will error. Also avoid `0px` as minifiers will often convert that to `0` (which is unitless and will have the same problem).

With all these bug and workarounds in mind, the following an an alternative way to build a sticky footer. It may not be as clean or intuitive as the way I originally promoted, but it meets all of my original requirements for an alternative solution. It works in all current browsers, it is spec compliant so it should continue to work as bugs are fixed, and it does not use any specific browser-based hack.

So as is true of most things in CSS, there's more than one way to stick a footer:

```css
/**
 * 1. Avoid the IE 10/11 `min-height` bug.
 * 2. Explicitly set `flex-shrink` to `0` to prevent Chrome/Safari from
 *    letting these items shrink to smaller than their content's default size.
 */
body {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 1 */
}
header, footer {
  flex-shrink: 0; /* 2 */
}
main {
  flex: 1 0 auto; /* 2 */
}
```

Too see this solution in action, check out the updated Solved by Flexbox [sticky footer demo](http://philipwalton.github.io/solved-by-flexbox/demos/sticky-footer/).

<aside class="Footnotes">
  <h1 class="Footnotes-title">Footnotes:</h1>
  <ol class="Footnotes-items">
    <li id="footnote-1">When I say "works in all browsers" I mean that it works in [all browsers](http://caniuse.com/#feat=flexbox) that implement a version of flexbox specification from [March 2012](http://www.w3.org/TR/2012/WD-css3-flexbox-20120322/) or newer. </li>
    <li id="footnote-2">Using `flex-basis:0` solves the vast majority of problems associated with this bug, but not all of them. If you want your flex-items to shrink *and* you want them to not shrink past the default content size, this solution will not work.</li>
    <li id="footnote-3">The [March 25, 2014 update](http://www.w3.org/TR/2014/WD-css-flexbox-1-20140325/) to the flexbox spec changed the meaning of the `flex:1` shorthand from `1 1 0px` to `1 1 0%`.</li>
  </ol>
</aside>


