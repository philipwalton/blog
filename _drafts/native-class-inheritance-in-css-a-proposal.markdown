---
layout: post
title: "Native Class Inheritence in CSS: a Proposal"
date: 2013-01-08 22:21
tags:
- CSS
- JavaScript
---

CSS could be better. It could be more feature rich. The recent rise in popularity of CSS preprocessors has pushed spec writers into places they'd been previously reluctant to go (CSS variables anyone?).

CSS preprocessors do a good job of filling in the feature gaps, but there are plenty of things they can't do.

Consider the `@extend` directive introduced by Sass. It's basic usage is illustrated below.

{% highlightjs %}
/* The original Sass */
.button {
  border: thin solid black;
  background-color: #ccc;
}
.button-primary {
  **@extend .button;**
  background-color: blue;
}
{% endhighlightjs %}

Which produces the following CSS:

{% highlightjs %}
/* The compiled CSS */
.button, .button-primary {
  border: thin solid black;
  background-color: gray;
}
.button-primary {
  background-color: blue;
}
{% endhighlightjs %}


## The Problem with `@extend`

### It can't account for specificity

Consider what happens when a less specific selector tries to extend and override a more specific selector

{% highlightjs %}
.button {
  border: 1px solid black;
  background-color: gray;
}
a {
  @extend .button;
  background-color: blue;
}
{% endhighlightjs %}

### It can't account for source order

{% highlightjs %}
.button-extended {
  @extend .button;
  background-color: blue
}
.button {
  border: 1px solid black;
  background-color: gray;
}
{% endhighlightjs %}

### It can't be used inside media querries

I've heard a lot of complaints about this one. "Why doesn't `@extend` work inside of media querries?" The answer is that it can't account for all possible situations. Consider the following example:

{% highlightjs %}
@media (min-width: 10em) {
  .button {
    background-color: gray;
    border: thin solid black;
  }
}

@media (max-width: 20em) {
  .button-primary {
    @extend .button;
    background-color: blue;
  }
}
{% endhighlightjs %}

The `.button` selector above is defined to look a certain way when the page is wider than `10em`. At the same time, `.button-primary` is defined to look a certain way when the page is narrower than `20em`. If `.button-primary` is expect to inherit the properties of `.button`, it should only do so when the page is between 10 and 20 ems wide. In order for Sass to implement this, it would have to parse the media querries and create a brand new media query that combines the two cases. This would be extremely difficult to implement and probably impossible in some situations.

### It doesn't handle nested elements well

{% highlightjs %}
.button {
  background-color: gray;
  border: thin solid black;
}
.button .button .button {
  color: red;
}
#submit {
  @extend .button;
  background-color: blue;
}
{% endhighlightjs %}

{% highlightjs %}
.button, #submit {
  background-color: gray;
  border: thin solid black;
}
.button .button .button, #submit .button .button, .button #submit .button, #submit #submit .button, .button .button #submit, #submit .button #submit, .button #submit #submit, #submit #submit #submit {
  color: red;
}
#submit {
  background-color: blue;
}
{% endhighlightjs %}

## The Proposal

I prose the addition of two new features. The `@template { }` directive, and the `%template` selector.

{% highlightjs %}
// Here you define base styles for the template
@template abstract-widget {
  display: inline-block;
  vertical-align: top;
}
{% endhighlightjs %}

{% highlightjs %}
// You can implement that template like so:
.widget {
  template: abstract-widget;
}
.component {
  template: abstract-widget;
}

// And you can use the new selector to target all instances of a template
.supports-flexbox %abstract-template {
  display: flex;
}
{% endhighlightjs %}

```
@extend button-primary < button
@extend button-actdion < button

%button .button-icon {

}

document.querySelectorAll("%button")