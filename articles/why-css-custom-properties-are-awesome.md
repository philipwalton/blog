---
template: article.html
title: "Why CSS Custom Properties are Awesome"
date: 2015-11-03T17:28:56-08:00
---

A few days ago CSS Custom Properties, commonly known as CSS Variables, shipped in Chrome Canary. When Chrome team member [Addy Osmani](https://twitter.com/addyosmani) first announced the new feature on Twitter, he was met with a [surprising](https://twitter.com/kuizinas/status/661600615911526401) [amount](https://twitter.com/DanTup/status/661609987047866368) of [negativity](https://twitter.com/joshlangner/status/661608288707026944) (at least surprising to me).

From what I can tell, 99% of the negatively were variations of these two complaints:

* The syntax is "ugly" and "verbose".
* Sass already does this, so why should I care?

For what it's worth, I completely understand why people have this reaction. I mean, if you're used to doing this:

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

If CSS variables were *just* a way to reference stored values, and they didn't offer anything above and beyond what preprocessors already give us, there would be little reason for them to exist (and no reason to have the syntax they do).

But the reality is CSS variables can do *so much* more than that. In fact, I think it does them a disservice to call them variables at all. They're custom properties, which gives them an entirely different set of superpowers.

In this post I'm going to talk about some of the limitations of preprocessor variables and show how none of those limitations apply to custom properties I'll also demo some of the new design patterns that custom properties will enable: things like responsive, cascading properties and contextual styling via React-style, one-way data flow.


## The limitations of preprocessor variables

At their core, CSS preprocessors are essentially a templating language. They allow you to abstract common patterns and more easily reuse bits of code. But at the end of the day they spit out raw CSS, which means they're incapable of doing anything that CSS can't already do natively.

### Preprocessor variables aren't live

Preprocessors give the appearance of dynamic logic and magical power. Even if know you they ultimately just produce CSS, their limitations can often be surprising, especially to new developers.

Perhaps the most common example of this is the inability to redefine a variable inside a media query.

```scss
$gutter: 1em;

@media (min-width: 30em) {
  $gutter: 2em;
}

body {
  margin: $gutter;
}
```

If you compile the above code with Sass, you'll see that the media query block gets discarded altogether. While it's technically *possible* for a preprocessor to make conditional variable declarations work, doing so would be technically challenging and require enumerating all possible permutations&mdash;exponentially increasing the final file size of your CSS.

Since this doesn't work dynamically, the only option is to assign variations for all media sizes, and code out each version separately.

```scss
$font-size-sm: 1em;
$font-size-md: 1.5em;
$font-size-lg: 2em;
```

### Preprocessors variables don't cascade

Whenever you use variables, the question of scope inevitably comes into play. Should this variable be global? Should it be scoped to the file? Should it be scoped to the block? These are all questions I hear asked frequently by Sass developers.

As it turns out, there's another way to scope variables that ends up being even more power: scoping them to a DOM subtree.

Since preprocessors don't run in the browser and never see the markup, the can't do this.

If you're wondering why you'd want to scope a variable to a DOM subtree, consider the following example:


```css
.alert { background-color: lightyellow; }
.alert.info { background-color: lightblue; }
.alert.error { background-color: orangered; }

.alert button {
  border-color: darken(background-color, 25%);
}
```

The above code isn't valid CSS, but you get the idea. The button is trying to access the background color of the parent alert and use a slightly darker version of it for it's border.

The idea is that no matter what background color ends up being applied to the alert, the button can respond to it.

Since preprocessor variables aren't CSS declarations (property-value pairs), they don't cascade. More specifically, they don't inherit from parent element to child element.

## What are custom properties?

In order to fully understand what custom properties are, it's important to have a solid grasp on how CSS properties work in general.

There are two basic kinds of properties: those that inherit and those that don't. Inheritable properties are those where a child element will automatically assume the value of its parents. They're things like `color`, `font`, `direction`, and `text-align`. Inheritable properties allow you to put a `<span>` inside of a `<strong>` tag and have the text stay bold.

Non-inheritable properties are things like `margin` and `padding`. Properties that obviously shouldn't get passed on to their children by default.

Custom CSS properties are almost identical to regular, inheritable CSS properties. The main difference is their values can be reference using the `var()` function.

Here's a basic example of how custom properties work:


```css
.parent {
  --primary-color: red;
}
.child {
  border-color: var(--primary-color);
}
```

In the above code, the element `.child` will have a red border, even though it doesn't declare the `--primary-color` variable itself, because it inherits the `--primary-color` property from `.parent`.

If there were an element between `.parent` and `.child` that redefined `--primary-color` to `blue`, `.child` would have a blue border instead.

### Understanding the naming convention

Custom properties can be given just about any name you want, but in order to ensure the names developers pick never conflict with future properties defined by the CSS specification, there's a requirement that all custom properties begin with two hyphens (`--`).

Note that preprocessor variables are not actual CSS properties, so they don't have to worry about conflicts in the same way. On the other hand, they don't have nearly as much power.

## Why custom properties are more powerful than variables

Preprocessor variables are extremely limited in what they can do. Because they exist on the server side (rather than in the browser), their value is static and cannot be changed after the build step is run. The only real use they have is allowing developers to update a bunch of values in a single place, but again, this all happens prior to building the final files. After the build the CSS is completely static.

Since CSS custom properties in are the browser, they're live, meaning they can be changed at runtime and respond to user interaction.

But CSS custom properties aren't just Sass variables that can be modified at runtime. Since custom properties are actually real CSS properties they inherit and cascade like all CSS properties. This makes them extremely powerful and flexible. You can modify a custom property value in exactly the same way you can modify any CSS property:

- Through the cascade, by another CSS rule.
- Through media queries, making custom properties responsive.
- Through JavaScript, allowing virtually unlimited styling potential.

Perhaps the best way to explain each of these possibilities is with an a real-life example:

### The cascade

Sometimes you have a component that needs to look differently in different context. An example of this is link tags that look a certain way through the site, but look differently when they're in the footer.

Another example is a button that needs to look differently depending on whether it's on a light or dark background.

To accomplish this today, most developers either use a descendant selector or a modifier class.

```css
/* Using a descendant selector */
a {
  color: red;
  text-decoration: underline;
}

.footer a {
  color: white;
  text-decoration: none;
}
```

```css
/* Using modifier classes */
.Button {
  background-color: white;
  border: 1px solid;
  color: black;
}

.Button--inverted {
  background-color: transparent;
  color: white;
}
```

At first it might seem like using a descendant selector is a relatively straight-forward way of accomplishing your goal, but there are a few downsides to this pattern.

As I explain in my article on [CSS Architecture](http://philipwalton.com/articles/css-architecture/#modifying-components-based-on-who-their-parents-are), overriding components using descendant selectors leads to unpredictable code.

If you were just looking at the class definition for `.Button`, you'd have to idea that it might appear differently in a different context.

This pattern directly violates the open/closed principle of software development:

> Software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification.

On the other hand, if you use use custom properties to define the `.Button` class, you're opening up the class for extension, and you're making it clear to other developers looking at the definition that this button may look different depending the values of these custom properties.

```css
.Button {
  background-color: var(--btn-background-color, purple);
  border: 1px solid var(--btn-border-color, purple);
  color: var(--btn-color, white);
}
```

Reader of the above class definition can easily tell that the button can be styled differently in different contexts. If you used the above `.Button` inside `.Header` and it looked differently, you'd know exactly what properties to search for in your codebase.

In *header.css*, you might find something that looks like this:

```css
.Header {
  --btn-background-color: transparent;
  --btn-border-color: white;
  --btn-color: white;
}
```

Another advantage of this approach is `.Button` styles can be updated without requiring a selector that looks like `.Header .Button`, so specificity can remain consistent and low.

But what if a design requirement changes and now some of the buttons in the header need to look like regular buttons?

The great thing about using inheritable properties instead of descendant selectors is inheritable properties can easily be turned off in a particular context.

```css
.Header-promo {
  --btn-background-color: initial;
  --btn-border-color: initial;
  --btn-color: initial;
}
```

The above code prevents all the `--btn-*` properties from inheriting to any child elements of `.Header-promo`, and thus the default styles will apply.

Unsetting styles like this isn't possible if you use descendant selectors.

### Media queries

Probably the most compelling use-case for custom properties is the ability to automatically update the property values in response to the matched media.

Consider a site with a standard gutter variable that defines the default spacing between items in the layout as well as the default padding for all the various section on the page.

In many cases, you want the value of this gutter to be different depending on how big the browser window is. On large screens you want a lot of space between items&mdash;a lot of breathing room&mdash;but on smaller screens you can't afford that much space, so the gutter needs to be smaller.

To do this today, with preprocessors, you have to explicitly code all possible variations. Consider the following Sass code that defines a `sm`, `md`, and `lg` variation:


```css
$gutter-sm: 1em;
$gutter-md: 2em;
$gutter-lg: 3em;

/* Styles for small gutters */

body {
  padding: $gutter-sm;
}
header,
footer {
  background: #eee;
  padding: $gutter-sm;
}
main {
  margin: $gutter-sm auto;
}
section {
  padding: 0 $gutter-sm;
}

/* Styles for medium gutters */

@media (min-width: 30em) {
  body {
    padding: $gutter-md;
  }
  header,
  footer {
    background: #eee;
    padding: $gutter-md;
  }
  main {
    margin: $gutter-md auto;
  }
  section {
    padding: 0 $gutter-md;
  }
}

/* Styles for large gutters */

@media (min-width: 48em) {
  body {
    padding: $gutter-lg;
  }
  header,
  footer {
    background: #eee;
    padding: $gutter-lg;
  }
  main {
    margin: $gutter-lg auto;
  }
  section {
    padding: 0 $gutter-lg;
  }
}
```

To accomplish the exact same using custom properties, all you'd have to do is define the styles once referencing a custom `--gutter` property. Then, as the matched media changes, you just update the value of the `--gutter` custom property.

The following code does that same thing as the above with about one-third as much code:


```css
:root {
  --gutter: 1em;
}
@media (min-width: 30em) {
  --gutter: 2em;
}
@media (min-width: 48em) {
  --gutter: 3em;
}

body {
  padding: var(--gutter);
}
header,
footer {
  background: #eee;
  padding: var(--gutter);
}
main {
  margin: var(--gutter) auto;
}
section {
  padding: 0 var(--gutter);
}
```

Even with the extra verbosity of the custom property syntax, the amount of code needed to accomplish the same thing is substantially reduced. And this only takes into account three variations. The more variations you need, the more code this will save.

The following demo shows a basic site layout that automatically redefines the gutter value as the viewport width changes ([editor view](http://codepen.io/philipwalton/pen/epLWNO?editors=110), [full page view](http://codepen.io/philipwalton/full/epLWNO/)).
