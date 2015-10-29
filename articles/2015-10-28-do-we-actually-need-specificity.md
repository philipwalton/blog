---
template: article.html
title: "Do We Actually Need Specificity In CSS?"
date: 2015-10-28T10:49:00-07:00
---

I know the title of this article probably sounds like I'm trying to stir the pot, but I'm honestly not. I'm asking this question because I've been thinking about it a lot lately, and I'm curious to know what other people think.

Let me give you a little context.

For normal CSS rules, the cascade takes three things into consideration when figuring out what declarations to apply to an element: source order, specificity, and importance.

Source order makes a lot of sense. It's natural and intuitive to think that if rule X comes after rule Y, and they apply to the same element, rule Y should override rule X.

Importance also makes a lot of sense. There are always going to be cases with one-off exceptions where you need to override something, and it's good to have the option to do so. There are also cases, usually with utility classes, where you can confidently say that: *if element X has this class then it must apply*. For example, in an `.is-hidden` rule, it makes sense to use `!important`.

But I think specificity is a little different.

Specificity isn't intuitive, and, especially for new developers, the results can almost seem like a *gotcha* rather than the intended behavior.

I'm also not sure there's an equivalent in other systems or languages. I mean, imagine if the following code worked in JavaScript:

```js
window.document.foo = 'bar';
document.foo = 'quz';

assert(window.document.foo == 'bar'); // true, WTF?
```

In the above code, should the `window.document.foo` assignment trump `document.foo` because the reference is more "specific"? I seems a little crazy, but that's kind of what happens in CSS.

## But specificity is useful, right?

I'm sure there are thousands, probably even millions of websites out there that depend on specificity to make their CSS work. I'm not suggesting that it can't be useful in some cases.

What I *am* suggesting is that perhaps it's not useful enough to make it worth the unpredictability and the confusion that comes with it.

Moreover, I can't think of a single time in my life where I've written a CSS rule that was more specific than another rule *and didn't also come after it in the source order*. To make that more clear, I've never done something like this:

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

I always write the more specific rule after the less specific rule because that's what makes intuitive sense to me.

## What if specificity didn't exist?

Ok, let's imagine a world in which specificity doesn't exist in CSS. In that world the cascade would be determined by source order and importance alone. In other words, if rule X and Y both match a particular element, and rule Y comes after rule X in the source, rule Y will always win. And of course individual property declarations in rule X can optionally trump rule Y using importance.

So the question is: *Would that be a better world? Would that lead to more predictable, maintainable, and scalable code?*

I think it would, but I'm curious to hear what other people think.

Let me offer one specific example of how I (and many other developers) fight against specificity in almost every project. The way I write CSS (and most people who follow BEM/SUIT/SMACSS conventions), I generally order my rules as follows:

1. Reset/normalize
2. Base/element styles
3. Component styles
4. Utilities/state styles

In my utility style declarations, I almost always use `!important` because if I'm using a utility class I want to be sure it applies, and overrides any existing component styles.

For example, I'd never add a class like `is-hidden` to an element if I didn't want it to be hidden.

This practice is recommended by Jonathan Snook when discussing [state classes](https://smacss.com/book/type-state#tips). You can also see it used in the [display utilities](https://github.com/suitcss/utils-display/blob/0.4.2/lib/display.css) of Nicolas Gallagher's SUIT CSS library.

If specificity didn't exist, simply putting these classes at the end of the CSS file would be all that's needed.

## Is removing specificity even possible?

This is where things get pretty interesting. While it's not possible to tell the browser to ignore specificity, it *is* possible to prevent specificity from affecting the cascade for a particular CSS file.

How? To answer that question, imagine a stylesheet in which all rules are ordered from least specific to most specific. In such a stylesheet, since the specificity of the rules also corresponds to the source order, it, for all intents and purposes, doesn't matter.

Of course, most people don't write their CSS this way, and expecting or asking them to would be unreasonable.

But what if a robot could modify your CSS, after you author it, and update the selectors for you, so they actually were in ascending-specificity order?

Imagine the following CSS rules, currently in descending-specificity order (above each rule, I've listed the specificity using `[idCount].[classCount].[typeCount]` notation):

```css
/* 0.2.5 */
main.content aside.sidebar ul li a { }

/* 0.1.3 */
aside.sidebar ul a { }

/* 0.1.1 */
.sidebar a { }
```

These selectors can be rewritten to be in ascending-specificity order *without affecting the elements they'll match*. I've highlighted the additions:

```css
/* 0.2.5 */
main.content aside.sidebar ul li a { }

/* 0.3.3 */
**:root:root** aside.sidebar ul a { }

/* 0.4.1 */
**:root:root:root** .sidebar a { }
```

Since all HTML documents always have a root element, prefixing a selector with `:root` will not change what elements the selector matches. And since `:root:root` will still match the root element, you can arbitrarily add specificity to any selector to transform an entire CSS file into ascending-specificity order without changing its functionality.

### Handling ID specificity

Many CSS developers no longer use IDs in their CSS files, but obviously a lot still do.

If your CSS file contains ID selectors, you could still use this technique, but it would require modifying the markup. You'd have to add an ID attribute to the `<html>` element, `id="root"` for example, and then your PostCSS plugin could add the ID selector `#root` to the beginning of selectors in the same way:


```css
/* 1.1.5 */
main#content aside.sidebar ul li a { }

/* 0.1.3 */
aside.sidebar ul a { }

/* 0.1.1 */
.sidebar a { }
```

Would become:

```css
/* 1.1.5 */
main#content aside.sidebar ul li a { }

/* 1.2.3 */
**#root:root** aside.sidebar ul a { }

/* 1.3.1 */
**#root:root:root** .sidebar a { }
```

### Handling selectors that already refer to the root element

It's a relatively common practice to use class selectors that are used to match the `<html>` element. Probably the most well-known example of this is the Modernizr library, which adds classes to the `<html>` element for feature detection.

Since the selector `:root .flexbox` won't match the element `<html class="flexbox">`, so the `:root` prefixing technique described above won't work. However, you can just as easily chain instead of prefixing, e.g. `:root.flexbox`.

In order to cover both possibilities, you'd have to apply the prefixing and chaining technique to all selectors that don't begin with type selector. For example, the selector `.flexbox .button` could be rewritten as follows:

```
.flexbox**:root** .button,
**:root** .flexbox .button { }
```

Alternatively (actually preferably) you'd could abide by the convention that you never add classes to the `<html>` element, which greatly simplify things.

### Other potential issues

The other obvious, potential issue with this technique is it has to be applied to *all* styles referenced on a page or it could have side effects because it increases the specificity of some selectors and not others. If you're referencing external assets on a CDN, this won't work. You'd have to download those assets and process them as well.

Another obvious downside is the file size is going to be larger, but since you're always just adding the word "root", it should gzip very well. I don't see file size being a major concern.

## What do you think?

Earlier this week I was speaking at CSSDevConf; while there I figured it'd be a great time to run this idea by some of the most respected people in the CSS community.

The general consensus seemed to be that specificity wasn't something anyone used as a tool or a technique to make their code better. Resorting to a dependence on specificity always felt like a hack&mdash;something they intended to refactor later.

At the same time, most of the people I talked to weren't really bothered by specificity. They write their code in a modular way and don't do a lot of contextual styling, so specificity conflicts rarely come up. For them, a solution like this would be unnecessary and just complicate things.

What do you think? Discuss amongst yourselves, and feel free to let me know your conclusions by email or on Twitter. Or better yet, write a follow-up article and I'll link to it.
