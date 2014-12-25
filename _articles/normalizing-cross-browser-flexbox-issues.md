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

After coming to terms with the issue, I realized it wasn't actually that big of a deal. My solution was actually perfect example of progressive enhancement at its best. If you were using a browsers that didn't support flexbox (or had bugs), you could still see all the content, you just wouldnt' see a footer stuck to the bottom of the page. No big deal.

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

In CSS, you typcially choose to use `min-height` over `height` to protect yourself from the dreaded overflow. When there's too much content, an explicit `height` will mean there's either going to be clipping, overlapping, or a scroll bar. And in many situations, these are all undesirable.

However, when we're dealing with the body element, a scroll bar is no big deal. It's actually what we want. So if we define an explicit height of `100%` on the body and there's too much content, the end result is the same.

This did work in older sticky footer solutions becuase not only did the body need to declare a height, but the content element inside it (`<main>` in my example) needed to also declare a height. This is what caused the problem. If the body's computed height is the height of the viewport, then the content area's computed height would be the same. The layout engine would then render the footer directly below that, and the overflowing content would overlap with the footer.

This doesn't happen in the flexbox case because no height is declared on the content element. Instead, it's simply told to flex to fill the empty space.

So then the question becomes: *why doesn't this work in Chrome?*

### Flex Shrink

The answer to this question has to do with a previous ambiquity in the spec around the process for calculating the

