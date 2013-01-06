---
layout: post
title: "Demystifying Z-Index"
date: 2012-12-22 11:28
tags:
- CSS
---

The problem with z-index is that almost nobody understand how it really works. It's not complicated (quite the opposite), but it if you've never taken the time to read its specification, there are almost certainly crucial aspects about z-index that you're completely unware of.

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

<div class="box">
  <pre class="codepen" data-height="280" data-type="result" data-href="ksBaI" data-user="philipwalton"><code></code></pre>
</div>

Here's the challenge: Can you make the red element go behind the blue and green elements without altering the markup or changing the z-index of any element?

## The solution

The solution is to add an opacity value other than one to the parent of the red div. If it doesn't make sense why that works, keep reading. If you already knew that, please send me your resume!

{% highlightjs %}
div:first-child {
  opacity: .99;
}
{% endhighlightjs %}

Here's a live demonstration the previous example with the opacity rule added so you can see that it does in fact force the red box behind the others.

<div class="box">
  <pre class="codepen" data-height="280" data-type="result" data-href="dfCtb" data-user="philipwalton" data-safe="true"><code></code></pre>
</div>

The above example is meant to be confusing. If you're surprised that opacity would have any affect on which elements were stacked in front of which, welcome to the club. I was similiarly shocked when I first stumbled upon this issue.

Z-index seems so simple: elements with a higher z-index are stacked in front of ones with a lower z-index, right? But this is the problem. It appears so simple, so most developers don't take the time to read the rules.

Hopefully this article will make things more clear.

## Stacking Order

Every element in an HTML document is either in front of or behind every other element in the document. This is known as the stacking order. The rules to deterine this order are pretty clearly defined in the spec, but as I've already stated, they're not fully understood by most developers.

When there's no z-index involved, the rules are very simple: Basically, the stacking order is the same as the order of appearance in the HTML, with child element always being in front of their parents and positioned elements always being in front of non-positioned elements.

When you add z-index into the mix, things get a little trickier. At first it's natural to assume elements with higher z-indexes are in front of elements with lower z-indexes, and any element with a z-index is in front of any elemenet without a z-index, but it's not that simple, and for good reason.

If it were solely up to the z-index value, what would happen if an element had a z-index of 10, and its child element had a z-index of 9 or no z-index at all. It wouldn't make sense for a child element to be able to appear behind its parent. There must be additional factors other than z-index value that determine stacking order.

## Stacking Contexts

When you set a high z-index on an element you expect it to move to the front of the stacking order, and you expect all of it's children to move with it. And this is exactly what happens.

Groups of elements with a common parent that move forward or backward together in the stacking order make up what is known as a stacking context.

A full understanding of stacking contexts is key to really grasping how z-index and the stacking order work. Stacking contexts confine their children to a particular place in the stacking order. This means that if an element is in a stacking context at the back of the document, even a z-index value of a billion won't bring it to the front. And this can be really confusing if you don't understand what's going on.

The first step in knowing how to deal with stacking contexts is understanding what causes them for form. A new stacking context is formed whenever an element has a position value other than `static` and a z-index value other than `auto`. It can also be formed when an elements has an opacity value less than `1`.

The first way is relatively intuitave. Even someone who's never heard the term stacking context expects z-index to work this way. The second way is much less intuative and is rarely mentioned outside of the w3c specification.

The position, z-index, and opacity properties can be set on any element including child elements of elements that already have these properties. That means stacking contexts are nestable and can be contained inside of other stacking contexts.

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

Within the same stacking context, the stacking order of elements is determined almost exactly the same way it is determined when no z-indexes are involved. We already know that positioned elements appear in front of non-positioned elements. Z-indexes simply determine the place in the stacking order that they appear with higher z-indexes appearing in front of lower ones. And as soon as a z-index is assigned on an element, a new stacking context is formed, and all of the child elements of that new context are determined in the same way (and so on and so forth).

## Calculating an Element's Position in the Stacking Order

With a firm understanding of when new stacking contexts are formed as well as an understanding of the stacking order within a stacking context, calucating the global stacking order of an element is simple (though sometimes time consuming for pages with a large number of elements).

The global stacking order of an element can be represented by a dot-delimited string similar to a version number. The dots delimit different stacking contexts and the numbers represent the order of an element within that particular context.

A stacking order position of "5.12.3" would mean an element is stacked third from the bottom in the stacking contexts it's currently in. That stacking context is ordered twelveth from the bottom of its current stacking context, and that context is ordered fifth from the bottom in the global stacking context.

To find the position in the stacking order of any element in a document, simply determine the element's stacking order within its current stacking context. Then travel recursively up the DOM tree deterining the order of each stacking context in its parent context until you arrive at the root element. The process is simple, but for a large document, it's probably not worth doing it by hand.

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