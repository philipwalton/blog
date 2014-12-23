<!--
{
  "layout": "article",
  "title": "Normalizing Cross-browser Flexbox Issues",
  "draft": true,
  "date": "2014-12-14T13:38:45-08:00",
  "tags": [
    "CSS"
  ]
}
-->

A little over a year ago when I was building my [Solved by Flexbox](http://philipwalton.github.io/solved-by-flexbox/) demo site, I discovered and reported an [Internet Explorer bug](https://connect.microsoft.com/IE/feedback/details/802625/min-height-and-flexbox-flex-direction-column-dont-work-together-in-ie-10-11-preview) that prevented my [sticky footer](http://philipwalton.github.io/solved-by-flexbox/demos/sticky-footer/) example from working properly. Since a sticky footer layout is a perfect candidate for progressive enhancement (i.e. the content is still accessible even if the footer isn't sticking) I didn't worry too much about it. The demo worked in all browsers except Internet Explorer 10 and 11, and I was okay with that.

Over the past year I've become more familiar with the nuances of the [flex layout algorithm](http://dev.w3.org/csswg/css-flexbox/#layout-algorithm) and the [flexibility](http://dev.w3.org/csswg/css-flexbox/#flexibility) properties, I've discovered that there is more than one way to stick a footer with flexbox.

The obvious (and arguably the cleanest) method is the one I originally used, but since that approach is currently plagued by bugs, and the alternative works in every browser that supports *any* version of flexbox, the choice is pretty clear.

The rest of this article will walk you through how to build a cross-browser sticky footer layout with flexbox. It will cover some of the strategies I've used to avoid implementation bugs as well as offer some tips to ensure the code you use is future-proof.

## There's more than one way to stick a footer

The traditional sticky footer layout includes a header, footer, and content area, each of unknown height. If the content area is sparse, the footer sticks to the bottom of the screen. If the content area is verbose and extends beyond the bottom of the the screen, the footer scrolls with the content as normal.

To put this another way, the content area needs to always be *at least* the height of the screen so that the footer is always at the bottom.

When using phrases like *at least* when referring to height, the obvious CSS property to reach for is `min-height`. And that's the property used in almost every sticky footer technique I've seen to date.

In general usage, the reason `min-height` is preferable to `height` is because you want the content to be able to grow if needed. When using just `height` you either get overflow or scrollbars, both of which are usually undesirable.

However, when we're talking about the main page layout, getting a vertical scroll bar when the content overflows the height of the viewport is exactly what we want! This approach was never possible with traditional block layouts because if you set `height:100%` on the main content area, and its content overflowed, the overflowing content would not push the footer down&mdash;it would overlap it.

### Enter, the flexibility properties

With flexbox, we have new flexibility properties (`flex-grow`, `flex-shrink`, and `flex-basis`) that work in conjuction with the traditional length properties.

Most people are familiar with `flex-grow` as it's used most often (it's often just writen as `flex` but I'll get to why that can be dangerous later). If you have an element that naturally takes up 100 pixels of space, and there's 200 pixels of extra space next to to, using `flex-grow:1` will actually change the length of the rendered element.

If you've used flexbox before, this is probably not new to you. What may be new, however, is using `flex-shrink:0` (it's default value is `1`) as a means of pushing subsequent down.

When you set an element's flex shrink factor




I originally tried to see if I could get it working just using `height` (since that was always the solution for IE6 which never supported `min-height`), and that did kind of work in IE, but it then broke the other browsers, and since conditional comments no longer work in the newer versions of IE,  I just moved on.

What I didn't realize was that just using `height` *does* work, I just had the wrong property combinations.

## What I didn't know about the flex shorthand

`flex:1` is deceptively simple. It sounds like it means that if there is extra room to grow inside this container, then do so. But is also means that if something needs to shrink inside this container, so that too.

`flex:1` is equivalent to the following:

```css
flex-grow: 1;
flex-shrink: 1;
flex-basis: 0%;
```

In other words, the reason I couldn't get the sticky footer example to work with `height:100vh` is because I was unknowingly telling my content area to shrink when there wasn't enough room. If I changed the content area's `flex` value to `1 0 0%` or `1 0 auto`, everything just worked fine.

Setting an explicit height on elements in CSS is usually a bad idea because of overflow issues and unintentional scroll bars, but in this case we're overflowing the body, so getting a scroll bar to appear is exactly what we want.


3 IE Problems:

1) min-height issue (bug, no real workaround)
2) Unless flex-basis with flex shorthand: `flex: 1 0 0` is broken
3) The default flex value for IE appears to be `none` instead of `initial` so shinking doesn't happen.




https://github.com/Modernizr/Modernizr/issues/1301#issuecomment-46339336



