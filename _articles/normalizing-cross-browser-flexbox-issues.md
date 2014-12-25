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

<!--
A. Introduction (explaining the problem)
B. Case Study: sticky footer
   1. Min-height
      a. IE's max-height
   2. Height
      a. min-content inconsistencies
B. What are the inconsistencies?
   1. IE min-height bug
   2. min-content spec changes
      a. How do browsers calculate the height of a flex-item when there is not enough available space?
         i. Flex-basis >> height/width >> ???
        ii. Some browsers use the natural size of the content, and some don't.
   3. IE flex-basis bug
C. Dealing with the inconsistencies
   1. Using height instead of min-height
   2. Using `flex-shrink:1`
   3. Using 0% instead of 0
      a. Using `%` instead of `px` because most minifiers don't seem to strip %
D. Conclusion
   1. Almost every cross-browser issue can be easily worked-around
-->

In September of 2013, while testing the [sticky footer demo](http://philipwalton.github.io/solved-by-flexbox/demos/sticky-footer/) on my [Solved by Flexbox](http://philipwalton.github.io/solved-by-flexbox/) site, I discovered an Internet Explorer bug. The bug prevented you from being able to use `max-height` on flexbox containers in the vertical direction. The flex children would just render as if no height were specified.

At first this really bothered me. Prior to flexbox, a sticky footer layout in pure CSS wasn't possible unless you knew the height of the header and footer. If either of those were unknown, the layout wouldn't work.

After coming to terms with the issue, I realized it wasn't actually that big of a deal. My solution was actually perfect example of progressive enhancement at its best. If you were using a browsers that didn't support flexbox (or had bugs), you could still see all the content, you just wouldn't see a footer stuck to the bottom of the page. No big deal.

I've since come to discover that a cross-browser sticky footer layout using flexbox was always possible, I just wasn't looking hard enough.

## There's more than one way to stick a footer

The traditional sticky footer layout includes a header, footer, and content area, each of unknown height. If the content area is sparse, the footer sticks to the bottom of the screen. If the content area is verbose and overflows the bottom of the the screen, the footer scrolls with the content as normal.

Here's the bare-bones markup needed for a sticky footer layout:


```html
<body>
  <header>…</header>
  <main>…</main>
  <footer>…</footer>
</body>
```

And this is the CSS required to make the footer stick using flexbox:

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

The first thing to notice is that in the `body` declaration I used the property `min-height`. This makes sense because a sticky footer layout needs to be *at least* as tall as the viewport. However, as I already mentioned, there's a `min-height` bug in IE 10 and 11, so this isn't going to work.

### Learning from the past

If you've been around for a while, you may remember that Internet Explorer 6 never supported the min/max height or width properties; however, it treated `height:100%` the same way other browsers treated `min-height:100%`, so all the original sticky footer solutions would recommend putting `height:100%` in a conditional style for IE6, and then everything would work.

Knowing this, I immediately wondered if the same technique would work in IE 10 and 11, and turns out it *does* work! Unfortunately, it didn't work in Chrome, so I immediately wrote it off. I didn't want my demos to have to include a bunch of IE hacks, and since the content was still completely usable in IE, I stopped looking for a better solution.

What I didn't realize at the time was this was actually a Chrome bug, not an IE one.

### Why height works too

In CSS, you typically choose to use `min-height` over `height` to protect yourself from the dreaded overflow. When there's too much content, an explicit `height` will mean there's either going to be clipping, overlapping, or a scroll bar. And in many situations, these are all undesirable.

However, when we're dealing with the body element, a scroll bar is no big deal. It's actually what we want. So if we define an explicit height of `100%` on the body and there's too much content, the end result is the same.

This did work in older sticky footer solutions because not only did the body need to declare a height, but the content element inside it (`<main>` in my example) needed to also declare a height. This is what caused the problem. If the body's computed height is the height of the viewport, then the content area's computed height would be the same. The layout engine would then render the footer directly below that, and the overflowing content would overlap with the footer.

This doesn't happen in the flexbox case because no height is declared on the content element. Instead, it's simply told to flex to fill the empty space.

So then the question becomes: *why doesn't this work in Chrome?*

### Minimum sizing

When the contents of flex items inside a flex container are larger than the containers main size, those items will shrink based on the values of their `flex-shrink` property.

Since the version of the spec dated September 18, 2012, flex items (by default) items were not supposed to shrink below their minimum content size:

> By default, flex items won’t shrink below their minimum content size (the length of the longest word or fixed-size element). To change this, set the min-width or min-height property.

Chrome, however, seems to [ignore this instruction](http://lists.w3.org/Archives/Public/www-style/2014Dec/0249.html) and allow flex items to shrink to a main size of zero. In the context of a sticky footer layout where there is more content than can fit on the screen, the header, footer, and content elements all squish in an undesirable way.








### Spec ambiguity

The answer to this question has to do with a previous ambiguity in the spec around the value of `auto` for `flex-basis`. A value of `auto` could mean one of two things:

1. Fall back to whatever value is specified by the element's width/height.
2. Automatically calculate the size based on the element's content.

To illustrate the confusion more clearly, consider the following CSS rule:

```css
.item {
  flex-basis: auto;
  height: 100px;
}
```

What should the element's height be? 100 pixels or automatically sized based on the content?

Another


## IE Bugs

Prior to IE 10s release, the [spec at that time](http://www.w3.org/TR/2012/WD-css3-flexbox-20120322/#flexibility) stated that a flexbox item's preferred size required a unit when using the `flex` shorthand:

>  If the &lt;preferred-size&gt; is ‘0’, it must be specified with a unit (like ‘0px’) to avoid ambiguity; unitless zero will either be interpreted as as one of the flexibilities, or is a syntax error.


## A cross-browser flexbox sticky footer solution

The CSS solution I showed above will work in any full spec-compliant browser, and I stand by it as still being the simplest and most intuitive solution. But as I've shown, there are a lot of bugs in the wild, so it's necessary to make concessions.

The following CSS address the issues I've brought up and works in all current browsers that support at least some version of flexbox (with proper vendor prefixes):

```css
/**
 * 1. Avoid the IE10-11 `min-height` bug.
 * 2. Explicitely set `flex-shrink` to 0 so the computed
 *    main-size is never less than the element's min-content.
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
