---
layout: post
title: "Native Object Oriented CSS: A Proposal"
date: 2013-01-13
tags:
- CSS
- JavaScript
---

The idea of object oriented CSS has been around for a while. Although it's widely accepted as a sound approach to architecting CSS for large scale websites, it seems to be under constant attack. Most developers who don't like OOCSS oppose the shear number of classes that must go in the HTML; they prefer their markup to be as "clean" and minimal as possible.

If you've read anything else I've written you probably know where I stand on this issue, but where I stand isn't the focus of this article. Instead I want to acknowledge that both sides of the debate have valid concerns, and don't think we should stop looking until we have a solution that appeases everyone. Unfortunately, given the current state of HTML and CSS, I don't think such a solution exsits.

Some claim that Sass and other CSS preprocessors are the answer. While I love Sass and use it on every project, I don't think it solves the problem. Preprocessors help fill in some of the gaps and do a great job illuminating where the needs are, but there are things preprocessors just simply can not do.

## Where Preprocessors Fall Short

The most commonly proposed solution to the OOCSS debate is Sass's `@extend` feature. With `@extend` you define a simple selector and then within another selector you extend it. Here's an example:

{% highlightjs %}
.button {
  background-color: gray;
  border: thin solid black;
}
.button-primary {
  @extend .button;
  background-color: blue;
}
{% endhighlightjs %}

This is compiled into the following CSS:

{% highlightjs %}
.button, .button-primary {
  background-color: gray;
  border: thin solid black;
}
.button-primary {
  background-color: blue;
}
{% endhighlightjs %}

In classical, object oriented programming, to say one classes extends another implies that the extending class inherits all of the properties and methods of that class.

If you look at the compiled CSS, you see that Sass tries to accomplish this by adding `.button-primary` to the `.button` definition. In fact, Sass will look through the entire stylesheet and everywhere `.button` is mentioned, it will append `.button-primary` to the selector so it gets those properties as well.

In traditional OOCSS you put your base classeses directly in the HTML, but with `@extend` you don't have to. Sass makes sure that `.button-primary` gets all of the properties defined on `.button` so including the class `button` in the markup is unnecessary.

Hurray, everyone's happy, right?

While this is a very powerful tool and a great time saver, it's not the answer. There are several ways this solution falls short.

### You Lose the Inheritance Chain

When you don't put classes in the markup, you have no way of knowing what a particular class or element "is". In traditional OOP, you can inspect an object to determine what class or classes it inherits from, but that's not possible here.

Returning to the `.button` example, suppose you define several subclasses of `.button` and use `@extend` for all of them. Then you start to implement a feature and you need to temporarily disable all buttons on the page for whatever reason. Without the base classes in the markup, it's not possible.

{% highlightjs %}
// This won't work!
document.querySelectorAll(".button")
{% endhighlightjs %}

Any native class inheritance in CSS must allow for inspection of the inheritance chain. Obviously a CSS processor can't solve this problem.

### It can't account for specificity

Sass does its best to make all occurrences of a base class include the extending selector, but it's not magic. It can't account for developer error. Ultimately Sass produces raw CSS, so the rules that govern CSS also apply to Sass.

Consider what happens when a less specific selector tries to extend and override a more specific selector

{% highlightjs %}
/* The Sass */
.button {
  border: thin solid black;
  background-color: gray;
}
a {
  @extend .button;
  background-color: blue;
}
{% endhighlightjs %}

{% highlightjs %}
/* The CSS */
.button, a {
  border: thin solid black;
  background-color: gray;
}
a {
  background-color: blue;
}
{% endhighlightjs %}

The above code tries turn all links into buttons but with a background color of `blue`. However, this won't work. The selector `.button` has a higher specificity than the selector `a` and even though Sass will properly append `a` to all `.button` declarations, normal CSS rules will prevent this `@extend` form working like you'd expect.

Any native inheritance in CSS must account for specificity.

### It can't account for source order

Similar to the example above, the following code is valid Sass, but it won't work as expected:

{% highlightjs %}
/* The Sass */
.button-extended {
  @extend .button;
  background-color: blue
}
.button {
  border: 1px solid black;
  background-color: gray;
}
{% endhighlightjs %}

{% highlightjs %}
/* The CSS */
.button-extended {
  background-color: blue;
}
.button, .button-extended {
  border: 1px solid black;
  background-color: gray;
}
{% endhighlightjs %}

Source order also matters in CSS, so if you `@extend` components before you define them, you'll end up overriding yourself.

Any native inheritance in CSS must account for source order.

### It can't be used inside media querries

"Why doesn't `@extend` work inside of media queries?" This is probably the most common complaint I hear about Sass's `@extend` feature.

The answer is pretty simple. It would be far too complicated to account for all possible situations. Consider the following example:

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

The `.button` selector above is defined to look a certain way when the page is wider than `10em`. At the same time, `.button-primary` is defined to look a certain way when the page is narrower than `20em`. If `.button-primary` is expect to inherit the properties of `.button`, it should only do so when the page is between 10 and 20 ems wide. In order for Sass to implement this, it would have to parse the media queries and create a brand new media query that combines the two cases. This would be extremely difficult to implement and it's one of the most straight-forward cases. Other more complicated mixings of media queries would be nearly impossible.

### It Doesn't Handle Descendants or Nested Elements Well

Consider again the `.button` class. This time we want to extend it when it's inside modal dialogs to be a nice glossy button, and we also need to do a check to make sure the browser supports box shadow. The selector looks like this:

{% highlightjs %}
.button { }
.boxshadow .modal .button-fancy {
  @extend .button;
  /* more styles here */
}
{% endhighlightjs %}

Then, later in the stylehsheet we decide that we want to make `.button` instances look different when they're in the footer, so we add this line:

{% highlightjs %}
#footer .button { }
{% endhighlightjs %}

Now Sass is very confused. Since there are any number of ways all of this could occur, it must include selector combinations for all of them. To the developer it's obvious that the Modernizr class `.boxshadow` should always be first in the selector sequence; it's also obvious that a button that's inside a modal dialog will also never be in the footer at the same time, but Sass can't know these things. It must account for all the possibilities:

{% highlightjs %}
#footer .boxshadow .modal .button-fancy,
.boxshadow #footer .modal .button-fancy,
.boxshadow .modal #footer .button-fancy { }
{% endhighlightjs %}

And this is just two selectors. Obviously things becomes quite a bit more complicated as the numbers get higher.

The same is true when the class you extend from can be nested inside itself.
In OOCSS the classic exmaple of this is the media object which can be nested multiple levels deep without breaking.

Nestable components aren't an uncommon requirement in CSS, but when you try to `@extend` components you're also nesting in selectors you get some pretty ugly generated CSS. Consider the following:

{% highlightjs %}
/* The Sass */
.media {
  /* media styles */
}
.media .media .media {
  /* styles when nested */
}
#submit {
  @extend .media;
  /* #submit styles */
}
{% endhighlightjs %}

{% highlightjs %}
/* The CSS */
.media, #submit {
  /* media styles */
}
.media .media .media,
#submit .media .media,
.media #submit .media,
#submit #submit .media,
.media .media #submit,
#submit .media #submit,
.media #submit #submit,
#submit #submit #submit {
  /* styles when nested */
}
#submit {
  /* #submit styles */
}
{% endhighlightjs %}

Again, the problem is that Sass must account for every possible combination these elements might occur in the HTML.

A native solution to class inheritance wouldn't have this problem because it wouldn't have to generate CSS selectors. It would be up to the browser to determine when the selectors matched.

## The Proposal

CSS should have it's own way to declare class inheritance. It should be simple and declarative, like CSS, and since it's just CSS, it would be natively supported by the browser and therefore accessible to JavaScript APIs.

Any native solution should meet a couple of minimum requirements, and I think the above list of `@extend`'s shortcomings is a good start.

* It should expose the inheritance chain to JavaScript APIs
* It should not be affected by specificity or source order
* It should work no matter where it's defined (including media queries)
* It should easily handle complex selectors
* It should allow for multiple levels of inheritance

My proposal for native OOCSS introduces two new features: a new kind of simple selector and a new `@` rule.

The new simple selector would be called the "abstract class selector". It would be a class name prepended with a percent sign (`%`) similar to Sass's placeholder syntax. The abstract class selector would match any element that inherits or extends from it. The new `@` rule would be used to declare the inheritance. Here is an example:

{% highlightjs %}
%button {
  background-color: gray;
  border: thin solid black;
}
.button-primary {
  background-color: blue;
}

@extend .button < %button;
@extend .button-primary < %button;
{% endhighlightjs %}

This code defines how any class that extends from button would look. It then declares that the class selectors `.button` and `.button-primary` both inherit from `%button`.

### The Inheritence Chain

How you write the markup would be unchanged. You'd never put an abstract class on an HTML element (nor would it have to) because JavaScript APIs could leveredge the abstract class selector. Here's an example:

{% highlightjs %}
<button class="button">Click Me</button>
<a href="#" class="button-primary">No, Click Me</a>
{% endhighlightjs %}

These elements could be targeted via JavaScript like so:

{% highlightjs %}
// Matches all button instances
document.querySelectorAll("%button");
{% endhighlightjs %}

There should also be additional methods added to the DOM API to make determining inheritance easier. Here are a few suggestions:

{% highlightjs %}
// we currently get the class list this way
element.classList;

// we could get the inheritance chain one of the following ways
element.baseClassList
element.matchesSelector("%base-class")
{% endhighlightjs %}

### Specificity and Source Order

The abstract class selector would have a specificity less than a class selector but greater than a type selector. This would allow for all normally defined class selectors to override all abstract class selectors, which solves both the source order and specificity issues at the same time.

### Complex Selectors

With native support, we wouldn't have to work about more complex selectors. Currently Sass has to preemptively anticipate all possible scenarios, but with native support the browser would only have to match the instances it finds. This is far easier to manage.

Imagine how confused Sass would get with the following selector:

{% highlightjs %}
.flexbox %widget %widget-body:nth-of-type(2n) {
  /* crazy styles go here... */
}
{% endhighlightjs %}

### Multiple Levels of Inheritance

Abstract class selectors should be able to extend other abstract class selectors as well. This could allow for a very rich component hierarchy:

{% highlightjs %}
@extend %widget < %base-widget;
@extend .my-widget < %widget;
{% endhighlightjs %}

For `@extend` declarations, the object on the left can be either a class selector or an abstract class selector, but the object on the right must be an abstract class selector. Non-abstract classes should never be able to extend other non-abstract classes or we'd end up with the same problems we already have with specificity and source order in Sass.
