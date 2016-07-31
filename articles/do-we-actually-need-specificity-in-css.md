Okay, before I start, I want to get one thing out of the way upfront. This article is *not* a rant about how much I hate specificity. If you want to read an article like that, I'm sure you can find dozens elsewhere online.

What I want to do is pose an actual, honest question to the web development community and hopefully get people thinking.

To restate the question in a way that gets more at the heart of the issue: *If we lived in a world where specificity was never added to the cascade, would things be better or worse?*

Now, I'm sure some people are thinking: *Who cares? Specificity exists, and we're stuck with it. So what's the point of bringing this up?*

To anyone thinking that, I'm happy to inform you that you're wrong :-)

In this article I'm going to show that it *is possible* to prevent specificity from affecting the cascade&mdash;meaning this question isn't purely theoretical. If it turns out to be true that specificity does more harm than good, there's something we can actually do about it today.

## A little background

For anyone who's a little rusty on how the cascade works, for normal CSS rules, the cascade takes three things into consideration: source order, specificity, and importance.

Source order makes a lot of sense. It's natural and intuitive to think that if rule Y comes after rule X, and both rules apply to the same element, rule Y's declarations should "win".

Importance also makes a lot of sense. There are always going to be cases where you need to override something, and it's good to have the option to do so. Importance is also the only way to override inline styles, so it's actually quite necessary in some cases.

But I think specificity is different.

Specificity isn't intuitive, and&mdash;especially for new developers&mdash;the results can often seem like a *gotcha* rather than the intended behavior. I'm also not sure there's an equivalent in other systems or languages.

For example, what if specificity were a thing in JavaScript. Imagine how much more unpredictable your code would be if the following test passed.

```js
window.document.foo = 'bar';
document.foo = 'qux';

assert(window.document.foo == 'bar'); // true, WTF?
```

It would be crazy and completely unmanageable if the `window.document.foo = 'bar'` assignment above (which comes first) trumped the `document.foo = 'qux'` assignment (which comes second) just because the reference was "more specific". Yet that's essentially what happens in CSS.

## But specificity is useful, right?

I'm sure there are thousands, probably even millions of websites out there that depend on specificity to make their styles work. If browsers started ignoring specificity tomorrow, all of those sites would break.

I'm not suggesting that specificity isn't being used; clearly it is. What I *am* suggesting is that perhaps it's not useful enough to make it worth the unpredictability and the confusion that comes with it.

I believe specificity is useful in the same way global variables can be useful. And just as most people consider reliance on global variables to be an anti-pattern, maybe it's the same with specificity.

Moreover, I can't think of a single time in my life when I've written a CSS rule that I wanted to override another CSS rule (using specificity) where I didn't *also* put the more specific rule later in the source order.

To make that last statement more clear, I've never done something like in the example below, where the more-specific footer links are defined *before* the less-specific default links:

```css
.footer a {
  color: white;
  text-decoration: none;
}

a {
  color: blue;
  text-decoration: underline;
}
```

If I want rule Y to override rule X, I put it later in the source order. Period. Which means any time I have a specificity conflict, it's always an accident.

So that got me thinking, if I already expect rules later in the source order to always override rules earlier in the source order, what if I could make that happen regardless of the specificity of those rules?

Essentially, what if I could prevent myself (and other people on my team) from accidentally breaking away from the paradigm that we all agree makes the most sense.

## What if specificity didn't exist?

Let's imagine a world in which specificity doesn't exist in CSS. In that world the cascade would be determined by source order and importance alone. So if rule X and Y both match a particular element, and rule Y comes after rule X in the source, rule Y will always win, regardless of the specificity of rule X. The only way for properties in rule X's declaration to trump properties in rule Y's declaration would be to use importance.

Would that be a better world? Would that lead to more predictable, maintainable, and scalable code?

### A real-life example

Many people use "state" or "utility" classes in their CSS. An example of this is the class `is-hidden`, which (obviously) is used to hide an element.

Since state classes can be generically applied to any element, they're usually defined as a single class selector, which makes their specificity pretty low. However, conceptually they're an override-type class. By that I mean you wouldn't add the class `is-hidden` to an element if you really wanted it to be visible.

If specificity didn't exist, you could ensure state classes trumped other classes by simply including them last in the source order. But as it is today, you have to use `!important` to solve the problem.

For what it's worth, adding `!important` in these situations is actually recommended when using [SMACSS state classes](https://smacss.com/book/type-state#tips) and [SUIT utility classes](https://github.com/suitcss/utils-display/blob/0.4.2/lib/display.css). It would be nice if our best practices didn't have to resort to the nuclear option for everyday styling needs.

## Removing specificity from the cascade

This is where things get pretty interesting. While it's not possible to simply instruct the browser to ignore specificity altogether, it *is* possible to prevent specificity from affecting the cascade for a particular CSS file or set of CSS files.

How? The answer is to make specificity and source order the same.

Imagine a stylesheet in which all rules were ordered from least specific to most specific. In such a stylesheet, since the specificity of the rules also corresponds to the source order or the rules, specificity is effectively taken out of the equation.

Of course, most people don't write their CSS this way, and expecting or asking them to do so would be unreasonable.

But what if a transpiler could modify your CSS, after you write it, to ensure all your selectors were in ascending-specificity order? And more importantly, what if it could do this without affecting what elements those selectors matched?

Thanks to some awesome quirks about how CSS selectors work, you can!

Consider the following CSS rules, currently in descending-specificity order (above each rule, I've listed the specificity using `[idCount].[classCount].[typeCount]` notation):

```css
/* 0.2.5 */
main.content aside.sidebar ul li a { }

/* 0.1.3 */
aside.sidebar ul a { }

/* 0.1.1 */
.sidebar a { }
```

These selectors can be rewritten to be in ascending-specificity order *without affecting the elements they'll match*. I've highlighted the additions below:

```css
/* 0.2.5 */
main.content aside.sidebar ul li a { }

/* 0.3.3 */
**:root:root** aside.sidebar ul a { }

/* 0.4.1 */
**:root:root:root** .sidebar a { }
```

This works because all HTML documents have a root element (the `<html>` element), so adding the `:root` pseudo-class to the beginning of a selector won't change what elements it can match.

And since pseudo-classes can be chained, i.e. `:root:root:root` will still match the `<html>` element, you can arbitrarily add specificity to any selector to make it more specific than the previous selector.

### Handling ID specificity

ID selectors are more specific than pseudo-class selectors, and therefore no amount of prepending `:root` to a selector will trump an ID.

However, the ID selector `#content` and the attribute selector `[id="content"]` will match exactly the same element, so if you replace all ID selectors with attribute selectors, the technique described above will still work.

For example, the following rules:

```css
/* 1.1.5 */
main#content aside.sidebar ul li a { }

/* 0.1.3 */
aside.sidebar ul a { }

/* 0.1.1 */
.sidebar a { }
```

Will get transpiled to:

```css
/* 0.2.5 */
main**[id="content"]** aside.sidebar ul li a { }

/* 0.3.3 */
**:root:root** aside.sidebar ul a { }

/* 0.4.1 */
**:root:root:root** .sidebar a { }
```

### Handling selectors that may already refer to the root element

With most selectors, it's not possible to tell by looking at them whether they may be intending to match the `<html>` element. For example, if a site is using [Modernizr](https://modernizr.com/), you'll probably see selectors that look like this:

```css
.columns {
  display: flex;
}

.no-flexbox .columns {
  display: table;
}
```

To account for the possibility that either of these selectors might intend to match the `<html>` element, you'd have to include both possibilities and rewrite them as follows:

```css
**:root**.columns,
**:root** .columns {
  display: flex;
}

**:root**.no-flexbox .columns,
**:root** .no-flexbox .columns {
  display: table;
}
```

Alternatively, you could avoid this problem entirely by establishing a convention that none of your selectors are allowed to match the `<html>` element, and that `<body>` is the highest they can go.

### The full rewriting algorithm

I'm not aware of any transpiler that currently does what I've outlined in this article. If you were interested in trying to write one, I'd recommend doing so as a [PostCSS](https://github.com/postcss/postcss) plugin. Since so many build steps already include [Autoprefixer](https://github.com/postcss/autoprefixer) (which is a PostCSS plugin), adding this would have almost no impact on your build time or complexity.

Here's the basic algorithm you'd need to follow:

1. Iterate through each selector in your stylesheets.
2. For each selector:
    1. If the selector contains any ID selectors, replace them with ID attribute selectors, otherwise do nothing.
    2. Calculate the specificity of the current selector (with any IDs replaced).
    3. If the current selector is the first selector, do nothing. Otherwise, compare its specificity to the specificity of the previous selector.
    5. If the previous selector is less specific than the current selector, do nothing. Otherwise, rewrite the current selector so its specificity is greater than or equal to the specificity of the previous selector.
        1. If the current selector begins with the `:root` selector or a type selector other than `html`, rewrite the selector with `:root` prepended as an ancestor. Otherwise rewrite the selector so the first part is listed both chained to `:root` and as a descendant of `:root`.
3. Once all selectors have been rewritten, output the final styles. They will now be in ascending-specificity order.

### Potential downsides

While the approach I've outlined above can definitely work, it does come with a few downsides. For one thing, it will increase the file size of your CSS. This probably won't be a big deal if you already keep your specificity low and write your rules in mostly ascending-specificity order. And, since it's only adding the word "root" a bunch of times, it should gzip very well, so my guess is the difference will be negligible.

The other thing to be aware of is potential problems with referencing external styles. If you include *bootstrap.css* from a CDN and then use this technique on your other styles, there's potential for weirdness since one set of selectors will be rewritten and the other set will not.

And you won't necessarily be able to just include *bootstrap.css* in your build because it may or may not currently depend on specificity to work correctly.

## Final thoughts

Before I conclude, I want to restate what I said in the intro. This is a question, not a prescription. I haven't tried this technique in the wild, as I haven't fully made up my mind about it.

I suspect it would vastly simplify things, but it also might uncover how much we truly depend on specificity.

If there's a large team out there constantly fighting specificity battles, it would be interesting to hear if something like this helps. If you do try it, feel free to [let me know](/about/#contact) your findings. Or better yet, write a follow-up article and I'll link to it.

<div class="Callout">

**Update:** *(November 3, 2015)*

[Lea Verou](https://twitter.com/LeaVerou) pointed out to me [on Twitter](https://twitter.com/LeaVerou/status/661617150243672064) that you could use the `:not()` pseudo-class as an alternative to using `:root` for arbitrarily increasing selector specificity.

The advantage of using `:not()` is you can apply it to any element (including `<html>`), so you wouldn't have to split selectors. You could also use it to add type or ID-level specificity, e.g. `:not(z)` or `:not(#z)`, so you wouldn't always have to increase by classes.

The downside of using `:not()` is you must be careful to pick a selector that's guaranteed to not match the element, otherwise it won't work.

</div>

<div class="Callout">

**Update:** *(November 14, 2015)*

[David Khourshid](https://twitter.com/davidkpiano/) wrote a response to this article entitled [The Simplicity of Specificity](http://codepen.io/davidkpiano/post/the-simplicity-of-specificity) where he argues that CSS should not be compared to an imperative language, and things would be better if we wrote rules that were source order-independent. While it's probably no surprise that I disagree with this position, I encourage you to read it if you want an alternative perspective.

</div>
