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

### Preprocessor variables aren't interoperable

This is a relatively obvious downside, but I mention it because I think it's important. If you're building a site with PostCSS and you want to use a third-party component that's only themeable via Sass, you're kinda stuck.

It's not possible (or at least not easy) to share preprocessor variables across different toolset or with third-party stylesheets hosted on a CDN.

Native CSS custom properties will work with any CSS preprocessor or plain CSS file. The reverse is not usually true.

## How custom properties are different

I mentioned above that CSS variables aren't actually variables in the traditional sense, they're custom properties, which makes them quite a bit more powerful.

But what does that mean?

To answer the question, I think it's helpful to examine how normal properties work in CSS, specifically the inheritable properties.

Think about what happens when you set `color: gray` or `font-size: .875em` on the `<body>` element. All descendants of `<body>`, who don't specificy their own colors or font sizes, inherit those values.

Since custom properties are just regular, inheritable propeties, all of these concepts apply to them as well. And all the mechanisms you can use to define or override regular properties in CSS apply to custom properties as well.

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

The same thing happens to custom properties; *their values are live!* Any time you define a custom property in a media query or state class, as soon as that declaration matches or stops matching, the custom property value automatically updates throughout the site.

### Using custom properties

Here's a basic example of how custom properties work. In the following code, the custom property `--table-stripe-color` is defined on the `<table>` element, and then odd table rows reference that property in their background color declaration:

```css
table {
  --table-stripe-color: lightgray;
}
tr:nth-child(odd) {
  background: var(--table-stripe-color);
}
```

An important distinction to note is that the `tr:nth-child(odd)` elements aren't actually looking up the value of `--table-stripe-color` on the `<table>` element, they don't actually know or care where the property was defined. *They're looking up the property on themselves*.

To make that last point more clear, since all `<tr>` elements are children of `<table>` elements, and since custom properties inherit from parent to child, the `<tr>` gets the value of `--table-stripe-color: lightgray` through property inheritance *not* through variable reference.

Continuing with the table example, suppose we decided that we didn't want rows in the table head to be stripped. Since the `<thead>` element is child of `<table>` and a parent of `<tr>` elements in the table's head, we can prevent those `<tr>` elements from being striped by redefining the `--table-stripe-color` to it's initial value. .

```css
table {
  --table-stripe-color: lightgray;
}
thead {
  --table-stripe-color: initial;
}
tr:nth-child(odd) {
  background: var(--table-stripe-color);
}
```

When the `<tr>` elements lookup their property value for `--table-stripe-color`, they'll find `initial` instead of `lightgray`.

### Default values

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

Though these two examples may seem to be doing the same thing, they're subtly different. In the second example, a user could unset the property for all links in the sidebar with the following rule:

```css
.sidebar {
  --link-color: unset;
}
```

Such a rule in the first example would still produce orange links because the default is defined on `<a>` elements rather than on `:root`.
