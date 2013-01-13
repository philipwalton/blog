---
layout: post
title: "Native Object Oriented CSS: A Proposal"
date: 2013-01-13
tags:
- CSS
- JavaScript
---

The idea of object oriented CSS has been around for a while. It's widely excepted as a good approach to building CSS for large scale websites, yet it seems to be under constant attack from those who claim it dirties up the HTML (citation needed). Most developers who don't like OOCSS prefer their markup to be extremely "clean". To them more classes in the HTML is harder to maintain than their CSS.

If you've read anything else I've written you probably know where I stand on this issue, but where I stand is not the focus of this article. Instead I want to acknowledge that both sides of the debate have valid concerns and if a solution can be found that address all of them, that of course would be the ideal.

The problem is that with the current state of CSS, a holy grail solution just doesn't exist.

Some claim that Sass and other CSS preprocessors have solved this issue, but that's simply not true. Preprocessors certainly help fill in some of the gaps and do a great job illuminating where the needs are, but there are things they can't do.

## Where Preprocessors Fall Short

The most commonly proposed solution to the OOCSS debate is Sass's `@extend` directive. With `@extend` you define a simple selector and then within another selector you declare that you're extending the simple selector. Here's an example:

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

If you look at the compiled CSS, you see that Sass tries to accomplish this by add `.button-primary` to the `.button` definition. In fact, Sass will look through the entire stylesheet and everywhere `.button` is mentioned, it will append `.button-primary` to the selector so it gets those properties as well.

Normally in OOCSS you put your base classes in the HTML itself, but with `@extend` you don't have to. It makes sure that `.button-primary` gets all of the properties defined on `.button` so adding `.button` in unnecessary

Hurray, everyone's happy, right?

### You Lose the Inheritance Chain

When you don't put classes in the markup, you have no way of knowing what a particular class or element "is". In traditional OOP, you can inspect an object to determine what class or classes it inherits from, but that's not possible here.

Returning to the `.button` example, suppose you define several subclasses of `.button` and use `@extend` for all of them. Then you start to implement a feature and you need to temporarily disable all buttons on the page for whatever reason. Without the base classes in the markup, it's not possible.

{% highlightjs %}
// This won't work!
document.querySelectorAll(".button")
{% endhighlightjs %}

Any native class inheritance in CSS must allow for inspection of the inheritance chain. Obviously a CSS processor can't solve this problem.

### It can't account for specificity

Sass does its best to make all occurrences of a base class include the extending selector, but its not magic and it can't account for user error. Ultimately Sass produces raw CSS, so the rules that govern CSS also apply to Sass.

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

The above code tries turn all links into buttons, but with a different background color. However, this won't work. The selector `.button` has a higher specificity than the selector `a` and even though Sass will probably append `a` to all `.button` declarations, normal CSS rule will prevent this `@extend` form working.

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

Source order matters in CSS, so if you `@extend` components before you define them, you'll end up overriding yourself.

Any native inheritance in CSS must account for source order.

### It can't be used inside media querries

I've heard a lot of complaints about this one. "Why doesn't `@extend` work inside of media queries?" The answer is pretty simple. Sass couldn't possibly account for all possible situations. Consider the following example:

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

The `.button` selector above is defined to look a certain way when the page is wider than `10em`. At the same time, `.button-primary` is defined to look a certain way when the page is narrower than `20em`. If `.button-primary` is expect to inherit the properties of `.button`, it should only do so when the page is between 10 and 20 ems wide. In order for Sass to implement this, it would have to parse the media queries and create a brand new media query that combines the two cases. This would be extremely difficult to implement and probably impossible in some situations.

### It Doesn't Handle Descendants or Nested Elements Well

Consider again the `.button` class. This time we want to extend it in alert and confirm modals to be a nice glossy button, and we also need to do a check to make sure the browser supports box shadow. Our final selector looks like this:

{% highlightjs %}
.button { }
.boxshadow .modal .button-fancy {
  @extend .button;
  // more styles here
}
{% endhighlightjs %}

Then, later in the stylehsheet we decide that we want to make `.button` look different in the footer, so we add this line:

{% highlightjs %}
#footer .button { }
{% endhighlightjs %}

Now Sass is very confused. Because there are any of ways all of this could occur, it must include selector combinations for all of them. To the developer it's obvious that the Modernizr class `.boxshadow` will always be first, and that a button that's in a modal dialog will also never be in the footer, but Sass can't know that. I must account for all the possibilities:

{% highlightjs %}
#footer .boxshadow .modal .button-fancy,
.boxshadow #footer .modal .button-fancy,
.boxshadow .modal #footer .button-fancy { }
{% endhighlightjs %}

And this is just two selectors. Obviously this becomes quite a bit more complicated as the numbers get higher.

The same is true when the class you extend from can be nested inside of itself. The media object is the classic example of this from OOCSS. One of the media object's main features is the ability to be nested multiples levels deep inside of itself without breaking.

Nestable components aren't an uncommon requirement in CSS, but when you try to `@extend` components you're also nesting in selectors you get some pretty ugly generated CSS. Consider the following:

{% highlightjs %}
/* The Sass */
.media {
  background-color: gray;
  border: thin solid black;
}
.media .media .media {
  /* some styles */
}
#submit {
  @extend .media;
  background-color: blue;
}
{% endhighlightjs %}

{% highlightjs %}
/* The CSS */
.media, #submit {
  background-color: gray;
  border: thin solid black;
}
.media .media .media,
#submit .media .media,
.media #submit .media,
#submit #submit .media,
.media .media #submit,
#submit .media #submit,
.media #submit #submit,
#submit #submit #submit {
  /* some styles */
}
#submit {
  background-color: blue;
}
{% endhighlightjs %}

Again, the problem is that Sass must account for every possible combination these elements might occur in the HTML.

A native solution to class inheritance wouldn't have this problem because it wouldn't have to spit on CSS selectors. It would be up to the browser to determine when the selectors matched.

## The Proposal

CSS should have it's own way to declare class inheritance. My proposal introduces a new kind of selector as well as a new `@` rule.

The new selector would be the base class selector and it would be a class name prepended with a percent sign `%` similar to Sass's placeholder syntax. The base class selector would match any element that extends from it. The new `@` rule would be used to declare the inheritance. Here is an example:

{% highlightjs %}
%button {
  background-color: gray;
  border: thin solid black;
}

@extend .button < %button;
@extend .button-primary < %button;
{% endhighlightjs %}

This code defines how any class that extends from button would look. It then declares that the classes selectors `.button` and `.button-primary` both inherit from `%button`.

The markup would be unchanged. It would look like this:

{% highlightjs %}
<button class="button">Click Me</button>
<a href="#" class="button-primary">No, Click Me</a>
{% endhighlightjs %}

The difference is since the base class selector is natively recognized by the browser, it could be targeted with JavaScript:

{% highlightjs %}
// Matches all button instances
document.querySelectorAll("%button");
{% endhighlightjs %}

### Multiple Levels of Inheritance

Base class selectors should be able to extend other base class selectors as well. This could allow for a very rich component hierarchy:

{% highlightjs %}
@extend %widget < %base-widget;
@extend .my-widget < %widget;
{% endhighlightjs %}

For `@extend` declarations, the object on the left can be either a class selector or a base class selector, but the object on the right must be a base class selector. Classes should be able to extend other classes or we'd have the same problems with already have with specificity and source order in Sass.

### Complex Selectors

With native support, we wouldn't have to work about more complex selectors. Currently Sass has to preemptively anticipate all possible scenarios, but with native support the browser would only have to match the instances it find. This is far easier to manage.

Imagine how confused Sass would get with the following selector:

{% highlightjs %}
.flexbox %widget %widget-body:nth-of-type(2n) {
  /* crazy styles go here... */
}
{% endhighlightjs %}

### Specificity

The base class selector would have a specificity less than a class selector but greater than a type selector. This would allow for all normally defined class selectors to override all base class selectors, which solves both the source order and specificity issues at the same time.

### The inheritance Chain

I've already suggested that the selector be available to JavaScript query strings. There should additional method added to the DOM API to make determining inheritance easier. Here are a few suggestions:

{% highlightjs %}
// we currently get the class list this way
element.classList;

// we could get the inheritance chain one of the following ways
element.baseClassList
element.matchesSelector("%base-class")
{% endhighlightjs %}