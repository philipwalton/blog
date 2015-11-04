---
template: article.html
title: "Why CSS Custom Properties are Awesome"
date: 2015-11-03T17:28:56-08:00
---

A few days ago CSS Custom Properties, commonly known as CSS Variables, shipped in Chrome Canary. When Addy Osmani (who works on the Chrome team) first announced the new feature on Twitter, he was met with a surprising amount of negativity (at least surprising to me).

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

And if CSS variables didn't offer anything above and beyond regular preprocessor variables, I would be right there with everyone, loudly complaining about the syntax.

But the reality is CSS variables can do *much, much* more than anything a preprocessor can do. In fact, it's not even fair to call them variables at all. They're custom properties. And I'm going to convince you why they're awesome.

