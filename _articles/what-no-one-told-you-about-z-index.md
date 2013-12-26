<!--
{
  "layout": "article",
  "title": "What No One Told You About Z-Index",
  "date": "2012-12-22",
  "tags": [
    "CSS"
  ]
}
-->

The problem with z-index is that very few people understand how it really works. It's not complicated, but it if you've never taken the time to read its specification, there are almost certainly crucial aspects that you're completely unaware of.

Don't believe me? Well, see if you can solve this problem:

## The Problem

In the following HTML you have three `<div>` elements, and each `<div>` contains a single `<span>` element. Each `<span>` is given a background color &mdash; red, green, and blue respectively. Each `<span>` is also positioned absolutely near the top left of the document, slightly overlapping the other `<span>` elements so you can see which ones are stacked in front of which. The first `<span>` has a z-index value of `1`, while the other two do not have any z-index set.

Here's what the HTML and basic CSS look like. I've also included a visual demo (via [Codepen](http://codepen.io)) with the full CSS below:

```xml
<div>
  <span class="red">Red</span>
</div>
<div>
  <span class="green">Green</span>
</div>
<div>
  <span class="blue">Blue</span>
</div>
```

```css
.red, .green, .blue {
  position: absolute;
}
.red {
  background: red;
  z-index: 1;
}
.green {
  background: green;
}
.blue {
  background: blue;
}
```

<div class="codepen-wrapper">
  <pre class="codepen" data-height="240" data-type="result" data-href="ksBaI" data-user="philipwalton"><code></code></pre>
</div>

**Here's the challenge:** try to see if you can make the red `<span>` element stack behind the blue and green `<span>` elements without breaking any of the following rules:

* Do not alter the HTML markup in any way.
* Do not add/change the z-index property of any element.
* Do not add/change the position property of any element.

To see if you can figure it out, click the *edit on Codepen* link above and play around with it for a bit. If you've succeeded, it should look like the example below.

*Warning: Don't click on the CSS tab of the example below or it will give away the answer.*

<div class="codepen-wrapper">
  <pre class="codepen" data-height="240" data-type="result" data-href="dfCtb" data-user="philipwalton" data-safe="true"><code></code></pre>
</div>

## The Solution

The solution is to add an opacity value less than `1` to the first `<div>` (the parent of the red `<span>`). Here is the CSS that was added to the Codepen above:

```css
div:first-child {
  opacity: .99;
}
```

If you're scratching your head right now in shock and disbelief that opacity would have any effect on which elements are stacked in front of which, welcome to the club. I was similarly shocked when I first stumbled upon this issue.

Hopefully the rest of this article will make things a little more clear.

## Stacking Order

Z-index seems so simple: elements with a higher z-index are stacked in front of elements with a lower z-index, right? Well, actually, no. This is part of the problem with z-index. It appears so simple, so most developers don't take the time to read the rules.

Every element in an HTML document can be either in front of or behind every other element in the document. This is known as the stacking order. The rules to determine this order are pretty clearly defined in the spec, but as I've already stated, they're not fully understood by most developers.

When the z-index and position properties aren't involved, the rules are pretty simple: basically, the stacking order is the same as the order of appearance in the HTML. (OK, it's actually a [little more complicated](http://www.w3.org/TR/CSS2/zindex.html) than that, but as long as you're not using negative margins to overlap inline elements, you probably won't encounter the edge cases.)

When you introduce the position property into the mix, any positioned elements (and their children) are displayed in front of any non-positioned elements. (To say an element is "positioned" means that it has a position value other than `static`, e.g., `relative`, `absolute`, etc.)

Finally, when z-index is involved, things get a little trickier. At first it's natural to assume elements with higher z-index values are in front of elements with lower z-index values, and any element with a z-index is in front of any element without a z-index, but it's not that simple. First of all, z-index only works on positioned elements. If you try to set a z-index on an element with no position specified, it will do nothing. Secondly, z-index values can create stacking contexts, and now suddenly what seemed simple just got a lot more complicated.

## Stacking Contexts

Groups of elements with a common parent that move forward or backward together in the stacking order make up what is known as a stacking context. A full understanding of stacking contexts is key to really grasping how z-index and the stacking order work.

Every stacking context has a single HTML element as its root element. When a new stacking context is formed on an element, that stacking context confines all of its child elements to a particular place in the stacking order. That means that if an element is contained in a stacking context at the bottom of the stacking order, there is no way to get it to appear in front of another element in a different stacking context that is higher in the stacking order, even with a z-index of a billion!

New stacking contexts can be formed on an element in one of three ways:

* When an element is the root element of a document (the `<html>` element)
* When an element has a position value other than `static` and a z-index value other than `auto`
* When an element has an opacity value less than `1`

The first and second ways to form stacking context make a lot of sense and are generally understood by Web developers (even if they don't know what they're called).

The third way (opacity) is almost never mentioned outside of w3c specification documents.

<p class="callout">
  <strong>Update:</strong> In addition to opacity, several newer CSS properties also create stacking contexts. These include: <a href="http://www.w3.org/TR/css3-transforms/">transforms</a>, <a href="http://www.w3.org/TR/filter-effects/">filters</a>, <a href="http://www.w3.org/TR/css3-regions/">css-regions</a>, <a href="http://www.w3.org/TR/css3-page/">paged media</a>, and possibly others. As a general rule, it seems that if a CSS property requires rendering in an offscreen context, it must create a new stacking context.
</p>

## Determining an Element's Position in the Stacking Order

Actually determining the global stacking order for all elements on a page (including borders, backgrounds, text nodes, etc.) is extremely complicated and far beyond the scope of this article (again, I refer you to [the spec](http://www.w3.org/TR/CSS2/zindex.html)).

But for most intents and purposes, a basic understanding of the order can go a long way and help keep CSS development predictable. So let's start by breaking the order down into individual stacking contexts.

### Stacking Order Within the Same Stacking Context

Here are the basic rules to determine stacking order within a single stacking context (from back to front):

1. The stacking context's root element
2. Positioned elements (and their children) with negative z-index values (higher values are stacked in front of lower values; elements with the same value are stacked according to appearance in the HTML)
3. Non-positioned elements (ordered by appearance in the HTML)
4. Positioned elements (and their children) with a z-index value of `auto` (ordered by appearance in the HTML)
5. Positioned elements (and their children) with positive z-index values (higher values are stacked in front of lower values; elements with the same value are stacked according to appearance in the HTML)

**Note:** positioned elements with negative z-indexes are ordered first within a stacking context, which means they appear behind all other elements. Because of this, it becomes possible for an element to appear behind its own parent, which is normally not possible. This will only work if the element's parent is in the same stacking context and is not the root element of that stacking context. A great example of this is Nicolas Gallagher's [CSS drop-shadows without images](http://nicolasgallagher.com/css-drop-shadows-without-images/demo/).

### Global Stacking Order

With a firm understanding of how/when new stacking contexts are formed as well as a grasp of the stacking order within a stacking context, figuring out where a particular element will appear in the global stacking order isn't so bad.

The key to avoid getting tripped up is being able to spot when new stacking contexts are formed. If you're setting a z-index of a billion on an element and it's not moving forward in the stacking order, take a look up its ancestor tree and see if any of its parents form stacking contexts. If they do, your z-index of a billion isn't going to do you any good.

## Wrapping Up

Getting back to the original problem, I've recreated the HTML structure adding comments within each tag indicating its place in the stacking order. This order is assuming the original CSS.

```xml
<div><!-- 1 -->
  <span class="red"><!-- 6 --></span>
</div>
<div><!-- 2 -->
  <span class="green"><!-- 4 --><span>
</div>
<div><!-- 3 -->
  <span class="blue"><!-- 5 --></span>
</div>
```

When we add the opacity rule to the first `<div>`, the stacking order changes like so:

```xml
<div><!-- 1 -->
  <span class="red"><!-- 1.1 --></span>
</div>
<div><!-- 2 -->
  <span class="green"><!-- 4 --><span>
</div>
<div><!-- 3 -->
  <span class="blue"><!-- 5 --></span>
</div>
```

`span.red` used to be `6` but it's changed to `1.1`. I've used dot notation to show that a new stacking context was formed and `span.red` is now the first element within that new context.

Hopefully it's now a little more clear why the red box moved behind the other boxes. The original example contained only two stacking contexts, the root one and the one formed on `span.red`. When we added opacity to the parent element of `span.red` we formed a third stacking context and, as a result, the z-index value on `span.red` only applied within that new context. Because the first `<div>` (the one we applied opacity to) and its sibling elements do not have position or z-index values set, their stacking order is determined by their source order in the HTML, which means the first `<div>`, and all the elements contained within its stacking context, are rendered behind the second and third `<div>` elements.

## Additional Resources

* [Elaborate description of Stacking Contexts](http://www.w3.org/TR/CSS2/zindex.html)
* [The stacking context](https://developer.mozilla.org/en-US/docs/CSS/Understanding_z-index/The_stacking_context)
* [The Z-Index CSS Property: A Comprehensive Look](http://coding.smashingmagazine.com/2009/09/15/the-z-index-css-property-a-comprehensive-look/)

<script async src="http://codepen.io/assets/embed/ei.js"></script>