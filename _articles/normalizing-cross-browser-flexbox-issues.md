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

Way back in September of 2013, while testing my [Solved by Flexbox](//philipwalton.github.io/solved-by-flexbox/) project, I discovered a [bug]() in Internet Explorer 10 and 11 that was preventing my sticky footer from actually *sticking* to the bottom of the screen.

At first I was really annoyed. Prior to flexbox, a sticky footer layout in pure CSS wasn't possible unless you knew the exact height of the header and footer at all times. With flexbox, we could finally have a real sticky footer solution for layouts with unknown (or variable) header and footer heights.

After my initial disappointment, I eventually concluded that this really wasn't that big of a deal. From a progressive enhancement perspective, my solution was still pretty good. It worked in Chrome, Firefox, Opera, and Safari, and while it wasn't perfect in Internet Explorer, it wasn't completely broken either. The content was still completely accessible, and it only didn't work on pages where there wasn't enough content to fill the screen (on longer pages where the footer didn't need to stick, IE worked just fine).

I've since discovered that a cross-browser sticky footer layout with flexbox was always possible, I just wasn't looking hard enough. And while making this great new discovery, I uncovered some other bugs along the way. And not just in IE!

In this article, I'll talk about the most common flexbox bugs, and I'll show you how to solve them so your flexbox-based designs will work the same in all browsers!

## So what are the bugs?

While I'm sure there are more than three flexbox bugs in existence, this list represent real issues I've encountered building real sites solving real design problems, so it's what's I've chosen to focus on:

While I know there are probably *way* more than three






* Internet Explorer 10 and 11 don't respect the `min-height` property on a flex container.
* Chrome and Safari don't respect the minimum content sizing of flex items.
* Internet Explorer doesn't allow a unitless `flex-basis` value when using the `flex` shorthand.

### The min-height bug

In Internet Explorer 10 and 11,

The bug prevented you from being able to use `max-height` on flexbox containers in the vertical direction. The flex children would just render as if no height were specified.






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

### Minimum sizing bugs

When the contents of a flex container are too big for it's declared size (`height:100vh` in the sticky footer case), the flex layout algorithm will attempt to shrink the flex items so they'll fit in their container.

Any item with a `flex-shrink` value greater than `0` is allowed to shrink (proportionally to the other items), but they're only allowed to shrink a certain amount. According to the [flexbox specification](http://www.w3.org/TR/css-flexbox/):

> By default, flex items won’t shrink below their minimum content size (the length of the longest word or fixed-size element). To change this, set the min-width or min-height property.

In other words, if the header, footer, and content area in the sticky footer example are too big to fit inside the body's declared height of `100vh`, they should still be at least as tall as their content's height.

Chrome and Safari, however, seem to [ignore this instruction](http://lists.w3.org/Archives/Public/www-style/2014Dec/0249.html) and allow flex items to shrink to smaller than their content's height. As a result, you get content overlapping.

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
