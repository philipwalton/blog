---
template: article.html
title: "Why CSS Custom Properties are Awesome"
date: 2015-11-03T17:28:56-08:00
---

A few days ago CSS Custom Properties&mdash;a.k.a. CSS Variables&mdash;shipped in Chrome Canary. When Chrome engineer [Addy Osmani](https://twitter.com/addyosmani) first tweeted about the release, he was met with a [surprising](https://twitter.com/kuizinas/status/661600615911526401) [amount](https://twitter.com/DanTup/status/661609987047866368) of [negativity](https://twitter.com/joshlangner/status/661608288707026944). At least, it was surprising to me, given how excited I am about this feature.

After a quick scan of the responses, it was clear that 99% of the negatively centered around these two complaints:

* The syntax is "ugly" and "verbose".
* Sass already does this, so why should I care?

For the record, I *do* understand why people have this reaction. I mean, if you're used to doing this:

```scss
$link-color: red;

a {
  color: $link-color;
}
```

and then you're told to do this:

```css
:root {
  --link-color: red;
}

a {
  color: var(--link-color);
}
```

I get why you'd be disappointed&mdash;and if that's all CSS variables did, I'd be disappointed too.

If CSS variables were *just* a way to reference stored values, and they didn't offer anything above and beyond what we can already do with preprocessors, there would be little reason for them to exist (and no reason to have the syntax they do).

But the reality is CSS variables can do *so much* more than that. In fact, I think it does them a disservice to call them variables at all. They're custom properties, which gives them an entirely different set of superpowers.

In this post I'm going to highlight some of the limitations of preprocessor variables and show how none of those limitations apply to custom properties I'll also demo some of the new design patterns that custom properties will enable: things like responsive, cascading properties and contextual styling via React-style, one-way data flow.

## The limitations of preprocessor variables

Preprocessors can do some pretty amazing things. Even if you know that they ultimately just spit out raw CSS, they call still feel magical at times.

That being said, they definitely have their limitations, and sometime the appearance of dynamic power can make these limitations surprising, especially to new users.

### Preprocessor variables aren't live

Perhaps the most common example of a preprocessor limitation that surprises new users is the inability to define variables or use `@extend` inside a media query.

Since this post is about variables, I'll focus on that one:

```scss
$gutter: 1em;

@media (min-width: 30em) {
  $gutter: 2em;
}

.Container {
  padding: $gutter;
}
```

If you compile the above code with Sass, you'll see that the media query block simply gets discarded, and the variable assignment ignored. While it's technically *possible* for a preprocessor to make conditional variable declarations work, doing so would be technically challenging and require enumerating all possible permutations&mdash;exponentially increasing the final size of your CSS.

Since it's not possible to change a variable based on the matching media query, the only option is to assign a unique variable per media query, and code out each version separately. More on this later.

### Preprocessors variables don't cascade

Whenever you use variables, the question of scope inevitably comes into play. Should this variable be global? Should it be scoped to the file? Should it be scoped to the block? These are all questions I hear asked frequently by Sass developers.

As it turns out, there's another way to scope variables that ends up being far more useful: scoping them to a DOM subtree. And since preprocessors don't run in the browser and never see the markup, they can't do this.

If you're wondering why you'd want to scope a variable to a DOM subtree, consider the following example:

```css
.alert { background-color: lightyellow; }
.alert.info { background-color: lightblue; }
.alert.error { background-color: orangered; }

.alert button {
  border-color: darken(background-color, 25%);
}
```

The above code isn't valid CSS, but you should be able to understand what it's trying to accomplish. The idea is that `<button>` elements should be able to adapt to the properties of their parent context. Regardless of what background color is applied to `.alert`, the button inside of it should be able to have a border color that matches.

There are tons of use cases for this type of feature, but perhaps the most compelling is to ensure text is always readable and sufficiently contracts with the background.

Since preprocessor variables aren't CSS declarations (property-value pairs), they don't cascade. And they don't inherit to child element.

### Preprocessor variables aren't interoperable

This is a relatively obvious downside of preprocessors, but I mention it because I think it's important. If you're building a site with PostCSS and you want to use a third-party component that's only themeable via Sass, you're out of luck.

It's not possible (or at least not easy) to share preprocessor variables across different toolset or with third-party stylesheets hosted on a CDN.

Native CSS custom properties will work with any CSS preprocessor or plain CSS file. The reverse is not usually true.

## How custom properties are different

I mentioned above that CSS variables aren't actually variables in the traditional sense, they're custom properties, which makes them quite a bit more powerful.

But what does that mean?

To answer that question, I think it's helpful to examine how normal CSS properties work, specifically the inheritable properties.

Think about what happens when you set `color: gray` or `font-size: .875em` on the `<body>` element. All descendants of `<body>`, who don't specify their own colors or font sizes, inherit those values.

Since custom properties are just regular, inheritable properties, all of these concepts apply to them as well. And all the mechanisms you can use to define or override regular properties apply to custom properties too.

To put that more technically: *custom properties cascade!*

Back to the `color` and `font-size` example, consider what happens when the following rule is added to the CSS:

```css
@media (min-width: 48em) {
  body {
    font-size: 1.25em;
  }
}
```

When the above media query matches, the `font-size` value becomes `1.25em` and all descendants of `<body>` will update accordingly. Since the new declaration didn't override the `color`, the original declaration still applies.

The same thing happens to custom properties; *their values are live!* Any time you define a custom property in a media query or class declaration, as soon as that declaration matches or stops matching, the custom property value automatically updates throughout the site.

## Using custom properties

Here's a basic example of how custom properties work. In the following code, the custom property `--tableStripeColor` is defined on the `<table>` element, and then odd table rows reference that property in their background color declaration:

```css
table {
  --tableStripeColor: lightgray;
}
tr:nth-child(odd) {
  background: var(--tableStripeColor);
}
```

An important distinction to note is that the `tr:nth-child(odd)` elements aren't actually looking up the value of `--tableStripeColor` on the `<table>` element, they don't actually know or care where the property was defined. They're looking up the property on themselves, and they find it one themselves because the value inherits from the `<table>` element to the `<tr>` element.

Now suppose we decide we don't want rows in the table head to be striped. Since the `<thead>` element is child of `<table>` and a parent of the rows we don't want to stripe, we can prevent those rows from getting the `--tableStripeColor` property by resetting it to its initial value.

```css
table {
  --tableStripeColor: lightgray;
}
thead {
  --tableStripeColor: initial;
}
tr:nth-child(odd) {
  background: var(--tableStripeColor);
}
```

### Setting defaults

The `var()` function takes an optional second argument that can be used as a fallback in the event that the custom property isn't defined. For example, the following declaration would allow third-party users to define a `--link-color` property, but if no such property were found, the links would be orange.

```css
a {
  color: var(--link-color, orange);
}
```

Another way to set default values is to define properties on the root element:

```css
:root {
  --link-color: orange;
}
a {
  color: var(--link-color);
}
```

Though these two examples may seem to be doing the same thing, they're subtly different. In the second example, a user could reset the property for all links in the sidebar with the following rule:

```css
.sidebar {
  --link-color: initial;
}
```

Such a rule in the first example would still produce orange links because the default is defined on `<a>` elements rather than on `:root`.

## Real-life examples

There are a lot of great examples I could have chosen to showcase the power of CSS custom properties, but in the interest of not letting this article get too long, I settled on just two.

I picked these examples because they're not just theoretical, they're actual challenges I've faced in the past. I can distinctly remember trying to make them work in Sass or PostCSS, and it just wasn't possible.

With custom properties, now it is.

### Responsive properties with media queries

Probably the most compelling use-case for custom properties is the ability to automatically update the property values in response to the matched media.

Consider a site with a standard gutter variable that defines the default spacing between items in the layout as well as the default padding for all the various section on the page.

In many cases, you want the value of this gutter to be different depending on how big the browser window is. On large screens you want a lot of space between items (a lot of breathing room) but on smaller screens you can't afford that much space, so the gutters need to be smaller.

Since CSS preprocessors ultimately produce static files, the only way to do this today is to explicitly write all possible variations. Consider the following Sass code that defines a `sm`, `md`, and `lg` variation:

```css
/* Declares three gutter values, one for each breakpoint */

$gutter-sm: 1em;
$gutter-md: 2em;
$gutter-lg: 3em;

/* Base styles for small screens, using $gutter-sm. */

.Container {
  margin: 0 auto;
  max-width: 60em;
  padding: $gutter-sm;
}
.Grid {
  display: flex;
  margin: -$gutter-sm 0 0 -$gutter-sm;
}
.Grid-cell {
  flex: 1;
  padding: $gutter-sm 0 0 $gutter-sm;
}

/* Override styles for medium screens, using $gutter-md. */

@media (min-width: 30em) {
  .Container {
    padding: $gutter-md;
  }
  .Grid {
    margin: -$gutter-md 0 0 -$gutter-md;
  }
  .Grid-cell {
    padding: $gutter-md 0 0 $gutter-md;
  }
}

/* Override styles for large screens, using $gutter-lg. */

@media (min-width: 30em) {
  .Container {
    padding: $gutter-lg;
  }
  .Grid {
    margin: -$gutter-lg 0 0 -$gutter-lg;
  }
  .Grid-cell {
    padding: $gutter-lg 0 0 $gutter-lg;
  }
}
```

To accomplish the exact same using custom properties, you just define your styles one and reference a single `--gutter` property. Then, as the matched media changes, you update the value of `--gutter` and everything responds accordingly.

```scss
/* Declares the `--gutter` value at each breakpoint */

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

Even with the extra verbosity of the custom property syntax, the amount of code needed to accomplish the same thing is substantially reduced. And this only takes into account three variations. The more variations you need, the more code this will save.

The following demo shows a basic site layout that automatically redefines the gutter value as the viewport width changes. Check it out in a browser that supports custom properties to see it in action!

View the demo on CodePen:

* [Editor view with code](http://codepen.io/philipwalton/pen/epLWNO) &#8594;
* [Full page demo](http://codepen.io/philipwalton/full/epLWNO/) &#8594;

### Contextual styling

Contextual styling (styling an element based on where it appears in the DOM) is a contentious topic in CSS. On the one hand, it's something most well-respected CSS developers warn against. But on the other hand, it's something thousands of people still do every day.

Harry Roberts recently wrote [this post](http://csswizardry.com/2015/06/contextual-styling-ui-components-nesting-and-implementation-detail/) with his thoughts on the matter:

> If you need to change the cosmetics of a UI component based on where it is placed, your design system is failing&hellip;Things should be designed to be ignorant; things should be designed so that we always just have "this component" and not "this component when inside&hellip;

While I do side with Harry on this (and most things), I think the fact that so many people take shortcuts in this situation is perhaps indicative of a larger problem: that CSS is limited in its expressiveness, and most people aren't satisfied with any of the current "best practices".

The follow example shows how most people approach contextual styling in CSS, using the descendant combinator:

```css
/* Regular button styles. */
.Button { }

/* Button styles that are different when inside the header. */
.Header .Button { }
```

This approach has a lot of problems, which I explain in my article on [CSS Architecture](/articles/css-architecture/#modifying-components-based-on-who-their-parents-are). One way to recognize this pattern as a code smell is it violates the [open/closed principle](https://en.wikipedia.org/wiki/Open/closed_principle) of software development; it modifies the implementation details of a closed component.

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

With custom properties, on the other hand, the button component is still ignorant of its context and completely decoupled from the header component. Its declaration simply says: I'm going to style myself based on these variables, whatever they happen to be in my current situation. And the header component simply says: I'm going to set these property values; it's up to the button to determine if and how to use them.

The main difference is that the extension is opt-in by the button component, and it's easily undone in the case of an exception.

To make that last point more clear, imagine if a `.Promo` component were added to the header, and button inside the `.Promo` component needed to look like normal buttons, not header buttons.

If you were using descendant combinators, you have to write a bunch of styles for the header buttons and then *undo* those styles for the promo buttons; which is messy, unnecessary, and error prone:

```css
/* Regular button styles. */
.Button { }

/* Button styles that are different when inside the header. */
.Header .Button { }

/* Undo button styles in the header that are also in promo. */
.Header .Promo .Button { }
```

With custom properties, you can simply update the button properties to be whatever you want, or reset them to return to the default styling.

```css
.Promo {
  --Button-backgroundColor: initial;
  --Button-borderColor: initial;
  --Button-color: initial;
}
```

The following demo illustrates contextual styling of both links and buttons in the header of a site as well as the content area.

View the demo on CodePen:

* [Editor view with code](http://codepen.io/philipwalton/pen/KdxmWL) &#8594;
* [Full page demo](http://codepen.io/philipwalton/full/KdxmWL/) &#8594;


#### Learning from React

When I was first exploring the idea of contextual styling via custom properties, I was skeptical. Like I said, my inclination is to prefer context-agnostic components that define their own variations rather than adapting to arbitrary data inherited from the parent.

But one thing that helped sway my opinion was comparing custom properties in CSS to `props` in React components.

Arguably the most significant way React has changed web development is its championing of a single-directional (one-way) flow of data. In React, parent components pass data to child components via `props`, and child components define what props they're willing to accept and how they're going to use them.

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

Though not part of the specification yet, the property `--` has [been discussed](https://github.com/w3c/webcomponents/issues/300#issuecomment-144551648), which could be used to reset only custom properties, while allowing regular inheritable properties (e.g. `color`, `font-family`) to inherit as normal.

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

If you've been paying attention to how I've been naming my custom properties, you've probably noticed that I've prefixed them with the class name of the component, e.g. `--Button-backgroundColor`.

Like most names in CSS, custom properties are global and there's always the possibility that they'll conflict with names being used by other developers on your team.

An easy way to avoid this problem is to stick to a naming convention, like I've done here.

For more complex projects, you'd probably want to consider something like [CSS Modules](https://github.com/css-modules/css-modules) which localifies all global names and has recently [expressed interest](https://github.com/css-modules/postcss-modules-values/issues/6#issuecomment-155526613) in supporting custom properties.

## Wrapping up

If you weren't familiar with custom properties in CSS before reading this article, I hope I've convinced you to give them a shot. And if you were one of the people skeptical of their necessity, I hope I've changed your mind.

Custom properties bring a new set of dynamic and powerful capabilities to CSS, and I'm sure many of their biggest strengths are yet to be uncovered.

Custom properties fill a gap that preprocessor variables simply can't. Despite that, preprocessor variables remain the easier-to-use and more elegant choice in many cases.

Because of this, I firmly believe that many sites will use a combination of both in the future. Custom properties for reactive theming and preprocessor variables for static templating.

I don't think it has to be an either-or situation. And pitting them against each other as competitors does a disservice to everyone.


