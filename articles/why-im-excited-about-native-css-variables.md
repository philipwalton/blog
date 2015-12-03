---
template: article.html
title: "Why I'm Excited About Native CSS Variables"
date: 2015-11-03T17:28:56-08:00
---

Last month CSS variables&mdash;more accurately known as [CSS Custom Properties](https://drafts.csswg.org/css-variables/)&mdash;shipped in Chrome Canary behind the Experimental Web Platform Features flag.<sup>[[1]](#footnote-1)</sup>

When Chrome engineer [Addy Osmani](https://twitter.com/addyosmani) first tweeted about the release, he was met with a surprising amount of [negativity](https://twitter.com/joshlangner/status/661608288707026944), [hostility](https://twitter.com/kuizinas/status/661600615911526401), and [skepticism](https://twitter.com/DanTup/status/661609987047866368). At least, it was surprising to me, given how excited I am about this feature.

After a quick scan of the responses, it was clear that 99% of the complaints focused on these two things:

* The syntax is "ugly" and "verbose".
* Sass already has variables, so why should I care?

While I completely get the dislike of the syntax, it's important to understand it wasn't just arbitrarily chosen. Members of the CSS working group discussed syntax at length, and they [had to pick something](http://www.xanthir.com/blog/b4KT0) that was compatible with the grammar of CSS and wouldn't conflict with future additions to the language.

Secondly, in regards to preprocessor variables, this is where I think the biggest misunderstanding lies:

Native CSS variables weren't just an attempt to copy what CSS preprocessors could already do. In fact, if you read some of the [initial design discussions](https://www.google.com/#q=syntax+%22css-variables%22+site:lists.w3.org%2FArchives%2FPublic%2Fwww-style), you'll see that most of motivation for native CSS variables was to make it possible to do things you *can't* do with preprocessors!

CSS preprocessors are fantastic tools, but their variables are static and lexically scoped. Native CSS variables, on the other hand, are an entirely different kind of variable: they're dynamic, and they're DOM-scoped. In fact, I think it's confusing to call the variables at all because they're actually CSS properties, which means they can do things like inherit and cascade! This gives them an entirely different set of capabilities and allows them to solve an entirely different set of problems.

In this article I'm going to discuss some of the things you can do with CSS custom properties that you can't do with preprocessor variables. I'll also demo some of the new design patterns that custom properties will enable. Finally, I'll discuss why I think in the future we'll most likely use preprocessors variables and custom properties together, to leverage the best of both worlds.

<div class="Note">

**Note:** this article is *not* an introduction to CSS custom properties. If you've never heard of them or are unfamiliar with how they work, you should quickly [read up on them](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables) before continuing.

</div>

## The limitations of preprocessor variables

Before continuing, I want to stress that I do really like CSS preprocessors, and I use them on every project I work on. Preprocessors can do some pretty amazing things, and even if you know that they ultimately just spit out raw CSS, they can still feel magical at times.

That being said, like any tool, they have their limitations, and sometimes the appearance of dynamic power can make these limitations surprising, especially to new users.

### Preprocessor variables aren't live

Perhaps the most common example of a preprocessor limitation that surprises newcomers is the inability to define variables or use `@extend` inside a media query.

Since this article is about variables, I'll focus on the former:

```scss
$gutter: 1em;

@media (min-width: 30em) {
  $gutter: 2em;
}

.Container {
  padding: $gutter;
}
```

If you compile the above code with Sass, this is what you'll get:

```css
.Container {
  padding: 1em;
}
```

As you can see, the media query block simply gets discarded and the variable assignment ignored.

While it may be technically *possible* for a preprocessor to make conditional variable declarations work, doing so would be challenging and require enumerating all possible permutations&mdash;exponentially increasing the final size of your CSS.

Since it's not possible to change a variable based on the matching `@media` rule, the only option is to assign a unique variable per media query, and code out each version separately. More on this later.

### Preprocessor variables don't cascade

Whenever you use variables, the question of scope inevitably comes into play. Should this variable be global? Should it be scoped to the file/module? Should it be scoped to the block? These are all questions I hear asked frequently by Sass developers.

When you're writing HTML, it turns out there's another useful way to scope variables: to a DOM subtree. But since preprocessors don't run in the browser and never see the markup, they can't do this.

Consider a site that tries to add the class `user-setting-large-text` to the `<html>` element if a user has set their preference for a larger text size:

```scss
$font-size: 1em;

.user-setting-large-text {
  $font-size: 1.5em;
}

body {
  font-size: $font-size;
}
```

As in the media block example above, Sass ignores this variable assignment altogether:

```css
body {
  font-size: 1em;
}
```

### Preprocessor variables don't inherit

Though inheritance is technically part of the cascade, I want to call it out separately here because of how many times I've wanted to use this feature but couldn't.

Consider a situation where you have DOM elements that you want to style based on whatever colors happen to be applied to their parent element:


```scss
.alert { background-color: lightyellow; }
.alert.info { background-color: lightblue; }
.alert.error { background-color: orangered; }

.alert button {
  border-color: darken(background-color, 25%);
}
```

The above code isn't valid Sass (or CSS), but you should be able to understand what it's trying to accomplish.

The last declaration is trying to use Sass's `darken` function on the `background-color` property that the `<button>` element will inherit from its parent `.alert` element.

Now, this isn't going to work because Sass doesn't know about the DOM structure, but hopefully it's clear why the ability to do this type of thing would be useful.

The call out one particular use case: it would be incredibly handy to be able to run color functions on inherited DOM properties for accessibility reason. For example, to ensure text is always readable and sufficiently contrasts with the background color.

### Preprocessor variables aren't interoperable

This is a relatively obvious downside of preprocessors, but I mention it because I think it's important. If you're building a site with PostCSS and you want to use a third-party component that's only themeable via Sass, you're out of luck.

It's not possible (or at least not easy) to share preprocessor variables across different toolsets or with third-party stylesheets hosted on a CDN.

Native CSS custom properties will work with any CSS preprocessor or plain CSS file. The reverse is not usually true.

## How custom properties are different

As you've probably guessed, none of the limitations I listed above apply to CSS custom properties. But perhaps more important than *that* they don't apply is *why* they don't apply.

CSS custom properties are just like regular CSS properties, and they operate in exactly the same way (with the obvious exception that they don't style anything).

Like regular CSS properties, custom properties are dynamic. They can be modified at runtime, they can be updated inside a media query or by adding a new class to the DOM. They can be assigned inline (on an element) or in a regular CSS declaration with a selector. They can be updated or overridden using all the normal rules of the cascade, or by using JavaScript. And, perhaps most importantly, they're inheritable, so when they're applied to a DOM element, they also get passed to that element's children.

To put that more succinctly, preprocessor variables are lexically scoped and static after they're compiled. Custom properties are live, dynamic, and scoped to the DOM.

## Real-life examples

There are a lot of great examples I could have chosen to showcase the power of CSS custom properties, but in the interest of not letting this article get too long, I settled on just two.

I picked these examples because they're not just theoretical, they're actual challenges I've faced in the past. I can distinctly remember trying to make them work in Sass or PostCSS, and it just wasn't possible.

With custom properties, now it is.

### Responsive properties with media queries

Probably the most compelling use-case for custom properties is the ability to automatically update the property values in response to the matched media.

Consider a site with a standard gutter variable that defines the default spacing between items in the layout as well as the default padding for all the various sections on the page.

In many cases, you want the value of this gutter to be different depending on how big the browser window is. On large screens you want a lot of space between items (a lot of breathing room), but on smaller screens you can't afford that much space, so the gutters need to be smaller.

Since CSS preprocessors ultimately produce static files, the only way to do this today is to explicitly write out all possible variations. Consider the following Sass code that defines `$gutterSm`, `$gutterMd`, and `$gutterLg` variations:

```css
/* Declares three gutter values, one for each breakpoint */

$gutterSm: 1em;
$gutterMd: 2em;
$gutterLg: 3em;

/* Base styles for small screens, using $gutterSm. */

.Container {
  margin: 0 auto;
  max-width: 60em;
  padding: $gutterSm;
}
.Grid {
  display: flex;
  margin: -$gutterSm 0 0 -$gutterSm;
}
.Grid-cell {
  flex: 1;
  padding: $gutterSm 0 0 $gutterSm;
}

/* Override styles for medium screens, using $gutterMd. */

@media (min-width: 30em) {
  .Container {
    padding: $gutterMd;
  }
  .Grid {
    margin: -$gutterMd 0 0 -$gutterMd;
  }
  .Grid-cell {
    padding: $gutterMd 0 0 $gutterMd;
  }
}

/* Override styles for large screens, using $gutterLg. */

@media (min-width: 48em) {
  .Container {
    padding: $gutterLg;
  }
  .Grid {
    margin: -$gutterLg 0 0 -$gutterLg;
  }
  .Grid-cell {
    padding: $gutterLg 0 0 $gutterLg;
  }
}
```

To accomplish the exact same thing using custom properties, you just define your styles once, and you reference a single `--gutter` property. Then, as the matched media changes, you update the value of `--gutter` and everything responds accordingly.

```scss
/* Declares what `--gutter` is at each breakpoint */

:root { --gutter: 1.5em; }

@media (min-width: 30em) {
  :root { --gutter: 2em; }
}
@media (min-width: 48em) {
  :root { --gutter: 3em; }
}

/*
 * Styles only need to be defined once because
 * the custom property values automatically update.
 */

.Container {
  margin: 0 auto;
  max-width: 60em;
  padding: var(--gutter);
}
.Grid {
  --gutterNegative: calc(1 * var(--gutter));
  display: flex;
  margin-left: var(--gutterNegative);
  margin-top: var(--gutterNegative);
}
.Grid-cell {
  flex: 1;
  margin-left: var(--gutter);
  margin-top: var(--gutter);
}
```

Even with the extra verbosity of the custom property syntax, the amount of code needed to accomplish the same thing is substantially reduced. And this only takes into account three variations. The more variations you have, the more code this will save.

The following demo shows a basic site layout that automatically redefines the gutter value as the viewport width changes. Check it out in a browser that supports custom properties to see it in action!

<figure>
  <a href="http://codepen.io/philipwalton/pen/epLWNO/?editors=110">
    <img srcset="
      ../../assets/images/custom-properties-responsive-1400w.png 1400w,
      ../../assets/images/custom-responsive.png 700w"
      src="../../assets/images/custom-properties-responsive-properties.png"
      alt="Responsive Properties Demo">
  </a>
  <figcaption>
    View the demo on CodePen: <a href="http://codepen.io/philipwalton/pen/epLWNO/?editors=110">editor view</a> / <a href="http://codepen.io/philipwalton/full/epLWNO/">full page</a>
  </figcaption>
</figure>

### Contextual styling

Contextual styling (styling an element based on where it appears in the DOM) is a contentious topic in CSS. On the one hand, it's something most well-respected CSS developers warn against. But on the other hand, it's something thousands of people still do every day.

[Harry Roberts](https://twitter.com/csswizardry) recently wrote [this post](http://csswizardry.com/2015/06/contextual-styling-ui-components-nesting-and-implementation-detail/) with his thoughts on the matter:

> If you need to change the cosmetics of a UI component based on where it is placed, your design system is failing&hellip;Things should be designed to be ignorant; things should be designed so that we always just have "this component" and not "this component when inside&hellip;

While I do side with Harry on this (and most things), I think the fact that so many people take shortcuts in situation like this is perhaps indicative of a larger problem: that CSS is limited in its expressiveness, and most people aren't satisfied with any of the current "best practices".

The follow example shows how most people approach contextual styling in CSS, using the descendant combinator:

```css
/* Regular button styles. */
.Button { }

/* Button styles that are different when inside the header. */
.Header .Button { }
```

This approach has a lot of problems (which I explain in my article on [CSS Architecture](/articles/css-architecture/#modifying-components-based-on-who-their-parents-are)). One way to recognize this pattern as a code smell is it violates the [open/closed principle](https://en.wikipedia.org/wiki/Open/closed_principle) of software development; it modifies the implementation details of a closed component.

> Software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification.

But custom properties change the paradigm of defining components in an interesting way. With custom properties, we can, for the first time, write components that are actually open for extension. Here's an example:

```css
.Button {
  background: var(--Button-backgroundColor, #eee);
  border: 1px solid var(--Button-borderColor, #333);
  color: var(--Button-color, #333);
  /* ... */
}

.Header {
  --Button-backgroundColor: purple;
  --Button-borderColor: transparent;
  --Button-color: white;
}
```

The difference between this and the descendant combinator example is subtle but important.

When using descendant combinators we're declaring that buttons inside the header *will look this way*, and that way is different from how the button component defines itself. Such a declaration is dictatorial (to borrow Harry's word) and hard to undo in the case of an exception where a button in the header *doesn't* need to look this way.

With custom properties, on the other hand, the button component is still ignorant of its context and completely decoupled from the header component. Its declaration simply says: *I'm going to style myself based on these variables, whatever they happen to be in my current situation*. And the header component simply says: *I'm going to set these property values; it's up to my descendants to determine if and how to use them*.

The main difference is that the extension is opt-in by the button component, and it's easily undone in the case of an exception.

To make that last point more clear, imagine if a `.Promo` component were added to the header, and buttons inside the `.Promo` component needed to look like normal buttons, not header buttons.

If you were using descendant combinators, you'd have to write a bunch of styles for the header buttons and then *undo* those styles for the promo buttons; which is messy and error prone, and easily gets out of hand as the number of combinations increases:

```css
/* Regular button styles. */
.Button { }

/* Button styles that are different when inside the header. */
.Header .Button { }

/* Undo button styles in the header that are also in promo. */
.Header .Promo .Button { }
```

With custom properties, you can simply update the button properties to be whatever you want, or reset them to return to the default styling. And regardless of the number of exceptions, the way to alter the styles is always the same.

```css
.Promo {
  --Button-backgroundColor: initial;
  --Button-borderColor: initial;
  --Button-color: initial;
}
```

The following demo illustrates contextual styling of both links and buttons in the header of a site as well as the content area.

<figure>
  <a href="http://codepen.io/philipwalton/pen/KdxmWL/?editors=110">
    <img srcset="
      ../../assets/images/custom-properties-contextual-styling-1400w.png 1400w,
      ../../assets/images/custom-properties-contextual-styling.png 700w"
      src="../../assets/images/custom-properties-contextual-styling.png">
  </a>
  <figcaption>
    View the demo on CodePen: <a href="http://codepen.io/philipwalton/pen/KdxmWL/?editors=110">editor view</a> / <a href="http://codepen.io/philipwalton/full/KdxmWL/">full page</a>
  </figcaption>
</figure>

#### Learning from React

When I was first exploring the idea of contextual styling via custom properties, I was skeptical. Like I said, my inclination is to prefer context-agnostic components that define their own variations rather than adapting to arbitrary data inherited from their parent.

But one thing that helped sway my opinion was comparing custom properties in CSS to `props` in React components.

Arguably the most significant way React has changed web development is its championing of a single-directional (one-way) flow of data. In React, parent components pass data to child components via `props`, and child components define what `props` they're willing to accept and how they're going to use them.

This architectural model is almost exactly the same as inheritable custom properties in CSS.

Even though custom properties are a new, untested domain, I think the success of the React model gives me confidence that a complex system can be built on top of one-way property inheritance.

## Minimizing side effects

Unlike `props` in React, CSS custom properties all inherit by default. In some cases, this could lead to components being styled in ways they may not have intended. This can be avoided though, because it's possible to prevent custom properties from inheriting.

To completely prevent any properties from being inherited by a particular component you can set the `all` property to `initial`.

```css
.MyComponent {
  all: initial;
}
```

If you want only white-listed custom properties to inherit, you can use a combination of `all` and setting individual, allowed properties to inherit:

```css
.MyComponent {
  all: initial;

  /* Whitelists these individual custom properties */
  --color: inherit;
  --font: inherit;
}
```

Though not part of the specification yet, the `--` property has [been discussed](https://github.com/w3c/webcomponents/issues/300#issuecomment-144551648), which could be used to reset only custom properties, while allowing regular inheritable properties (e.g. `color`, `font-family`) to inherit as normal.

```css
.MyComponent {
  /* Resets only custom properties. */
  --: initial;

  /* Whitelists these individual custom properties */
  --color: inherit;
  --font: inherit;
}
```

### Managing global names

If you've been paying attention to how I name my custom properties, you've probably noticed that I prefix them with the class name of the component, e.g. `--Button-backgroundColor`.

Like most names in CSS, custom properties are global and there's always the possibility that they'll conflict with names being used by other developers on your team.

An easy way to avoid this problem is to stick to a naming convention, like I've done here.

For more complex projects, you'd probably want to consider something like [CSS Modules](https://github.com/css-modules/css-modules) which localifies all global names and has recently [expressed interest](https://github.com/css-modules/postcss-modules-values/issues/6#issuecomment-155526613) in supporting custom properties.

## Wrapping up

If you weren't familiar with custom properties in CSS before reading this article, I hope I've convinced you to give them a shot. And if you were one of the people skeptical of their necessity, I hope I've changed your mind.

Custom properties bring a new set of dynamic and powerful capabilities to CSS, and I'm sure many of their biggest strengths are yet to be uncovered.

Custom properties fill a gap that preprocessor variables simply can't. Despite that, preprocessor variables remain the easier-to-use and more elegant choice in many cases.

Because of this, I firmly believe that many sites will use a combination of both in the future. Custom properties for reactive theming and preprocessor variables for static templating.

I don't think it has to be an either-or situation. And pitting them against each other as competitors does a disservice to everyone.

<aside class="Footnotes">
  <h1 class="Footnotes-title">Footnotes:</h1>
  <ol class="Footnotes-items">
    <li id="footnote-1">You can enable the Experimental Web Platform Features flag in Chrome by navigating to the address <code>about:flags</code>, searching for "Experimental Web Platform Features", and clicking the "enable" button.</li>
  </ol>
</aside>
