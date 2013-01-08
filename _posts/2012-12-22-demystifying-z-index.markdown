---
layout: post
title: "Demystifying Z-Index"
date: 2012-12-22 11:28
tags:
- CSS
---

The problem with z-index is that almost nobody understand how it really works. It's not complicated (quite the opposite), but it if you've never taken the time to read its specification, there are almost certainly crucial aspects about z-index that you're completely unaware of.

Don't believe me? Well, see if you can solve this problem:

## The Problem

In the following HTML you have three divs that each contain a single paragraph element. Each paragraph is absolutely positioned near the top left of the document, and they're overlapping so you can see which paragraph is stacked in front of which. Right now, the first paragraph (the red one) has a z-index of 1, so it's stacked on top.

Here's the HTML and (simplified) CSS as well as a visual example:

{% highlightjs %}
<div>
  <p class="one">One</p>
</div>
<div>
  <p class="two">Two<p>
</div>
<div>
  <p class="three">Three</p>
</div>
{% endhighlightjs %}

{% highlightjs %}
.one, .two, .three {
  position: absolute;
}
.one {
  background: red;
  z-index: 1;
}
.two {
  background: green;
}
.three {
  background: blue;
}
{% endhighlightjs %}

<div class="codepen-wrapper">
  <pre class="codepen" data-height="280" data-type="result" data-href="ksBaI" data-user="philipwalton"><code></code></pre>
</div>

Here's the challenge: Can you make the red element go behind the blue and green elements without altering the markup or changing the z-index of any element?

To see if you can figure it out, click the *edit on Codepen* link and play around with it for a big. If you've succeeded, it should look like the example below.

**Spoiler alert:** don't click the CSS tab for the example below or it will give away the answer.

<div class="codepen-wrapper">
  <pre class="codepen" data-height="280" data-type="result" data-href="dfCtb" data-user="philipwalton" data-safe="true"><code></code></pre>
</div>

## The Solution

The solution is to add an opacity value less than one to the parent of the red div.

{% highlightjs %}
div:first-child {
  opacity: .99;
}
{% endhighlightjs %}

If you're scratching your head right now in shock and disbelief that opacity would have any affect on which elements were stacked in front of which, welcome to the club. I was similarly shocked when I first stumbled upon this issue.

If you already knew the answer without looking, congratulations. Send me your resume! If you're still a little bit confused, keep reading. Hopefully this article will make things more clear.

## Stacking Order

Z-index seems so simple: elements with a higher z-index are stacked in front of ones with a lower z-index, right?

This is the problem with z-index. It appears so simple, so most developers don't take the time to read the rules.

Every element in an HTML document is either in front of or behind every other element in the document. This is known as the stacking order. The rules to determine this order are pretty clearly defined in the spec, but as I've already stated, they're not fully understood by most developers.

When there's no z-index involved, the rules are very simple: basically, the stacking order is the same as the order of appearance in the HTML, with child element always being in front of their parents and positioned elements always being in front of non-positioned elements.

When you add z-index into the mix, things get a little trickier. At first it's natural to assume elements with higher z-indexes are in front of elements with lower z-indexes, and any element with a z-index is in front of any element without a z-index, but it's not that simple, and for good reason.

If it were solely up to the z-index value, what would happen if an element had a z-index of 10, and its child element had a z-index of 9 or no z-index at all. You'd end up having to specify a z-index on every single element otherwise parents would end up visually in front of their children and mass chaos would ensue.

There must be factors other than z-index that determine stacking order.

## Stacking Contexts

When you set a high z-index on an element you expect it to move to the front of the stacking order. You also likely expect that element's children to move with it. Fortunately, this is what happens.

Groups of elements with a common parent that move forward or backward together in the stacking order make up what is known as a stacking context.

A full understanding of stacking contexts is key to really grasping how z-index and the stacking order work. Stacking contexts confine their children to a particular place in the stacking order. This means that if an element is in a stacking context at the back of the document, even a z-index value of a billion won't bring it to the front. And this can be really confusing if you don't understand what's going on.

The first step in knowing how to deal with stacking contexts is understanding what causes them for form. A new stacking context is formed whenever an element has a position value other than `static` and a z-index value other than `auto`. It can also be formed when an elements has an opacity value less than `1`.

The first way is relatively intuitive. Even someone who's never heard the term stacking context expects z-index to work this way. The second way is much less intuitive and is rarely mentioned outside of the w3c specification documents.

The properties that can form new stacking contexts (position, z-index, and opacity) may be set on any element including child elements of elements that already have these properties. That means stacking contexts are nestable and can be contained inside of other stacking contexts.

In fact, all stacking contexts are contained within one main stacking context formed by the `<html>` element.

To summarize, there are three ways new stacking contexts are formed:

*   When an element has a position value other than `static` and a z-index value other than `auto`
*   When an elements has an opacity value less than `1`
*   When an element is the root element of a document (the `<html>` element)

## Points of Confusion

Stacking contexts contain all of their children at the same place in the stacking order. But to those who don't know what stacking contexts are, it can appear as if it's actually the HTML elements themselves that are containing their children. Consider the following HTML:

{% highlightjs %}
<!-- A single stacking context -->
<div>
  <section>
    **<h1>...</h1>**
    <p>...</p>
    <ul>
      <li></li>
      <li>
        <p>
          **<a>...</a>**
        </p>
      </li>
    </ul>
  </section>
  **<article>...</article>**
</div>
{% endhighlightjs %}

Even though each of the highlighted elements above are nested at a different level in the DOM tree, they're all members of the same stacking context. That means the rules that determine their stacking order apply equally to all of them. If you assign a z-index of 1 to the `<a>` tag it will appear visually in front of the `<article>` tag even though it is a great-great-great-grandchild of the root `<div>` and the `<article>` tag is only a child of the `<div>`. The fact that the `<a>` tag is nested deep in the HTML tree structure is only important if one of its ancestors forms a stacking context.

## Calculating an Element's Position in the Stacking Order

### Stacking Order Within the Same Stacking Context



We already discussed the stacking order of elements when the z-index property isn't used. Here are the rules that determine the order (from back to front):

1.  Non-positioned element (ordered by appearance in the HTML)
2.  Positioned elements (ordered by appearance in the HTML)

When you add z-index into the mix, it's not much more complicated. Basically setting a z-index value either puts the element behind all other elements (with negative values) or in front of all other elements (with positive values).

Here are the rules to determine stacking order within a single stacking context (from back to front):

1.  Positioned elements with a negative z-index value (ordered by z-index value)
2.  Non-positioned elements (ordered by appearance in the HTML)
3.  Positioned elements with a z-index of `auto`, `0`, or no z-index value (ordered by appearance in the HTML)
4.  Positioned elements with a positive z-index value (ordered by z-index)

**Note:** positioned elements with negative z-indexes are ordered first within a stacking context, which means they appear behind all other elements. Because of this, it becomes possible for an element to appear behind its own parent, which is normally not possible. This will only work if the element's parent is in the same stacking context and is not the root element of that stacking context.

### Global Stacking Order

With a firm understanding of when new stacking contexts are formed as well as an understanding of the stacking order within a stacking context, calculating the global stacking order of an element is simple (though sometimes time consuming for pages with a large number of elements).

The global stacking order of an element can be represented by a dot-delimited string similar to a version number. The dots delimit different stacking contexts and the numbers represent the order of an element within that particular context.

A stacking order position of `5.12.3` would mean an element is stacked third from the bottom of its nearest parent stacking context (the one it's currently in). That stacking context is ordered twelveth from the bottom of its nearest parent stacking context, and that context is ordered fifth from the bottom of the global stacking context.

To find the position in the stacking order of any element in a document, simply determine the element's stacking order within its current stacking context. Then travel recursively up the DOM tree determining the order of each stacking context in its parent context until you arrive at the root element. The process is simple, but for a large document, it's probably not worth doing it by hand.

The follow is an example of some CSS and associated HTML where I've indicated the stacking order of each element with an HTML comment:

{% highlightjs %}
section {
  position: absolute;
}
article, nav {
  opacity: .9;
}
h1 {
  position: relative;
  z-index: 1;
}
{% endhighlightjs %}

{% highlightjs %}
<body>
  <section><!-- 3 -->
    <article><!-- 3.1 -->
      <header><!-- 3.1.1 -->
        <h1><!-- 3.1.4 -->
          <a><!-- 3.1.4.1 --></a>
        </h1>
      </header>
      <p><!-- 3.1.2 --></p>
      <p><!-- 3.1.3 --></p>
    </article>
  </section>
  <aside><!-- 1 -->
    <nav><!-- 2 -->
      <a><!-- 2.1 --></a>
    </nav>
  </aside>
</body>
{% endhighlightjs %}

## Wrapping Up

Getting back to the original problem, I've recreated the HTML structure adding comments within each tag indicating its stacking order. This order is assuming the original CSS.

{% highlightjs %}
<div><!-- 1 -->
  <p class="one"><!-- 6 --></p>
</div>
<div><!-- 2 -->
  <p class="two"><!-- 4 --><p>
</div>
<div><!-- 3 -->
  <p class="three"><!-- 5 --></p>
</div>
{% endhighlightjs %}


When we add the opacity rule to the first div, the stacking order changes like so:

{% highlightjs %}
<div><!-- 1 -->
  <p class="one"><!-- 1.1 --></p>
</div>
<div><!-- 2 -->
  <p class="two"><!-- 4 --><p>
</div>
<div><!-- 3 -->
  <p class="three"><!-- 5 --></p>
</div>
{% endhighlightjs %}

Hopefully it's now more clear why adding opacity to the first div in the example above causes the red box to appear behind the other boxes. Previously, the example contained only two stacking contexts, the root one and the one formed on `p.three` because it was given a position value and a z-index. When we added opacity to the parent element of `p.three` we formed a new stacking context and, as a result, the z-index value on `p.three` only applied within that new context. Because the first div (the one we applied opacity to) and its sibling elements do not have position or z-index values set, their stacking order is determined by their source order in the HTML, which means the first div, and all the elements contained within its stacking context, are rendered behind the second div.

<script async src="http://codepen.io/assets/embed/ei.js"></script>