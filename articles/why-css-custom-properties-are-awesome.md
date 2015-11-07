---
template: article.html
title: "Why CSS Custom Properties are Awesome"
date: 2015-11-03T17:28:56-08:00
---

A few days ago CSS Custom Properties, commonly known as CSS Variables, shipped in Chrome Canary. When Chrome team member [Addy Osmani](https://twitter.com/addyosmani) first announced the new feature on Twitter, he was met with a surprising amount of negativity (at least surprising to me).

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

I get why you'd be disappointed.

And if CSS variables were *just* a way to reference commonly used values and they didn't offer anything above and beyond what preprocessors give us, I would be complaining about the syntax too.

But the reality is CSS variables can do *so much* more than anything a preprocessor can do. In fact, it's not even fair to call them variables at all. They're custom properties. And I'm going to try to convince you of their awesomeness.

## What are custom properties?

In order to fully understand what custom properties are, it's important to have a solid grasp on how CSS properties work in general.

There are two basic kinds of properties: those that inherit and those that don't. Inheritable properties are those where a child element will automatically assume the value of its parents. They're things like `color`, `font`, `direction`, and `text-align`. Inheritable properties allow you to put a `<span>` inside of a `<strong>` tag and have the text stay bold.

Non-inheritable properties are things like `margin` and `padding`. Properties that obviously shouldn't get passed on to their children by default.

Custom CSS properties are almost idential to regular, inheritable CSS properties. The main difference is their values can be reference using the `var()` function.

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
