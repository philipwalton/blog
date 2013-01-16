---
layout: post
title: "Native Object Oriented CSS: A Proposal"
date: 2013-01-13
tags:
- CSS
- OOCSS
- Sass
- JavaScript
---

In CSS we code the same visual components over and over again &mdash; often within the same project. It's embarrassing how many separate times in my career I've coded a two-column layout, or tabbed navigation, or a dropdown menu, or a popup, or an icon next to some text (and the list goes on).

To deal with this problem [Nicole Sullivan](http://stubbornella.org) created the [Object Oriented CSS](https://github.com/stubbornella/oocss/wiki) (OOCSS) project. She suggests we find the patterns we use over and over again and define them once in CSS as a class selector. Then we can use that class in the HTML each time we encounter that visual pattern.

OOCSS has been around for a while, and it's widely accepted as a sound approach to building websites. Yet, it always seems to be under attack. Most developers who don't like OOCSS oppose the shear number of classes that must go in the HTML. To them it's unmanageable.

If you've read anything I've written about OOCSS, you probably know where I stand on this issue, but where I stand isn't important. Instead I want to acknowledge that both sides of the debate have valid concerns, and hopefully we can find a way to address those concerns instead of just taking sides.

What if CSS had object oriented functionality built in? What if there were a way to create a rich hierarchy of inherited CSS components that didn't require listing each class in the HTML every single time?

There have already been [attempts to do](http://ianstormtaylor.com/oocss-plus-sass-is-the-best-way-to-css/) this with preprocessors, but I think we need to think bigger. Preprocessors can't solve all the problems, and CSS should definitely be able to do this on its own.

Luckily with the recent speed of browser development, my wish might actually be possible.

## Where Preprocessors Fall Short

The most commonly proposed solution to the OOCSS debate is Sass's `@extend` feature. With `@extend` you define a simple selector and then within another selector you declare that you're extending it. Here's an example:

{% highlightjs %}
.button {
  background-color: gray;
  border: thin solid black;
}
.button-primary {
  **@extend .button;**
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

In classical, object oriented programming, to say one class extends another implies that the extending class inherits all of the properties and methods of that class.

If you look at the compiled CSS, you see that Sass tries to accomplish this by adding `.button-primary` to the `.button` definition. In fact, Sass will look through the entire stylesheet and everywhere `.button` is mentioned, it will append `.button-primary` to the selector so it gets those properties as well.

In traditional OOCSS you put your base classes directly in the HTML, but with `@extend` you don't have to. Sass makes sure that `.button-primary` gets all of the properties defined on `.button` so including the class `button` in the markup is unnecessary.

Hurray! Everyone's happy, right?

While this is a very powerful tool and a great time saver, it's not the answer. There are several ways this solution falls short.

### You Lose the Inheritance Chain

When you don't put classes in the markup, you have no way of knowing what a particular class or element *is*. In traditional OOP, you can inspect an object to determine what class or classes it inherits from, but that's not possible here.

Returning to the `.button` example, suppose you define several subclasses of `.button` and use `@extend` for all of them. Then you start to implement a feature and you need to temporarily disable all buttons on the page for whatever reason. Without the base class in the markup, it's impossible.

{% highlightjs %}
// This won't work!
document.querySelectorAll(".button")
{% endhighlightjs %}

Any native class inheritance in CSS must allow for dynamic inspection of the inheritance chain. Obviously a CSS preprocessor can't solve this problem.

### It Can't Account for Specificity

Sass does its best to make all occurrences of a base class include the extending selector, but it's not magic. It can't account for developer error. Ultimately Sass produces raw CSS, so the rules that govern CSS also apply to Sass.

Consider what happens when a selector tries to extend a selector with a higher [specificity](http://www.w3.org/TR/CSS21/cascade.html#specificity):

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

The above code tries to turn all links into buttons but with a background color of `blue`. However, this won't work. The selector `.button` has a higher specificity than the selector `a` and even though Sass will properly append `a` to all `.button` declarations, the normal CSS cascade will prevent this from working like you'd expect.

Any native inheritance in CSS must account for specificity.

### It Can't Account for Source Order

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

Source order also matters in CSS, so if you `@extend` components before you define them, you'll end up overriding yourself. The cascade strikes again!

Any native inheritance in CSS must account for source order.

### It Doesn't Work Inside Media Queries

"Why doesn't `@extend` work inside of media queries?" is probably the most common complaint I hear about Sass's `@extend` feature.

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

The `.button` selector above is defined to look a certain way when the page is wider than `10em`. At the same time, `.button-primary` is defined to look a certain way when the page is narrower than `20em`. If `.button-primary` is expected to inherit the properties of `.button`, it should only do so when the page is between 10 and 20 ems wide. In order for Sass to implement this, it would have to parse the two media queries and create a brand new one that combined the two cases. Sometimes this is possible, but sometimes it's not. And even when it would be theoretically possible it would be extremely complicated and error prone.

### It Doesn't Handle Descendants or Nested Elements Well

Consider again the `.button` class. This time we want to extend it when it's inside modal dialogs to be a nice glossy button. To do so we use [Modernizr](http://modernizr.com) to feature detect box shadow support. The selector looks like this:

{% highlightjs %}
.button { }
.boxshadow .modal .button-fancy {
  @extend .button;
  /* more styles here */
}
{% endhighlightjs %}

Then, later in the stylesheet we decide that we want to make `.button` instances look different when they're in the footer, so we add this line:

{% highlightjs %}
#footer .button { }
{% endhighlightjs %}

Now Sass is very confused. Since there are any number of ways all of this could occur, it must include selector combinations for all of them. To the developer it's obvious that the Modernizr class `.boxshadow` should always be first in the selector sequence; it's also obvious that a button that's inside a modal dialog will never also be in the footer, but Sass can't know these things. It must account for all the possibilities:

{% highlightjs %}
#footer .boxshadow .modal .button-fancy,
.boxshadow #footer .modal .button-fancy,
.boxshadow .modal #footer .button-fancy { }
{% endhighlightjs %}

And this is just two selectors. Obviously things become quite a bit more complicated as the numbers get higher.

The same is true when the class you extend can be nested inside itself.
In OOCSS the classic example of this is the media object which can be nested multiple levels deep without breaking.

Nestable components aren't an uncommon requirement in CSS, but when you try to `@extend` components that you're also nesting in selectors, you get some pretty ugly generated CSS. Consider the following:

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

A native solution to class inheritance wouldn't have this problem because it wouldn't have to generate CSS selectors at compile time. The browser would do the matching at runtime.

## The Proposal

CSS should have its own way to define class inheritance. It should be simple and declarative, and since it's just CSS, it would be natively supported by the browser and therefore accessible to JavaScript APIs.

Any native solution should meet a couple of minimum requirements, and I think the above list of `@extend`'s shortcomings is a good place to start.

* It should expose the inheritance chain to JavaScript APIs
* It should not be affected by specificity or source order
* It should work no matter where it's defined (including media queries)
* It should easily handle descendants, nested elements, and other complex selectors
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

### Using Abstract Class Selectors

Since an abstract class selector would be just another simple selector, it could be used in any way a simple selector can be used today. You could apply pseudo classes to it, have it nested inside other selectors, or put it in media queries.

All of the following would be valid uses of the abstract class selector:

{% highlightjs %}
%foo { }
%foo %bar { }
%baz:first-of-type { }
#sidebar %foo { }
a:not(%button) { }
@media (max-width: 30em) {
  %foo { }
}
{% endhighlightjs %}

### The Inheritence Chain

How you write the markup would remain unchanged. You'd never put an abstract class on an HTML element (nor would it have to) because JavaScript APIs could leveredge the abstract class selector. Here's an example:

{% highlightjs %}
<button class="button">Click Me</button>
<a href="#" class="button-primary">No, Click Me</a>
{% endhighlightjs %}

These elements could be targeted via JavaScript like so:

{% highlightjs %}
// Matches all button instances
document.querySelectorAll("%button");
{% endhighlightjs %}

There could also be additional methods added to the DOM API to make determining inheritance easier. Here are a few suggestions, but I'd anticipate many more:

{% highlightjs %}
// we currently get the class list this way
element.classList;

// we could get the inheritance chain this way
element.baseClassList;

// And we could detect type like so
element.matchesSelector("%base-class");
{% endhighlightjs %}

### The Specificity Value of an Abstract Class Selector

The abstract class selector would have a specificity less than a [class selector](http://www.w3.org/TR/selectors/#class-html) but greater than a [type selector](http://www.w3.org/TR/selectors/#type-selectors). This would allow for all normally defined class selectors to override all abstract class selectors, which solves both the source order and specificity issues at the same time.

All other rules of specificity would apply normally. And you could use `!important` to override a property value in a class selector the same way a class selector can currently override a property definition in an [id selector](http://www.w3.org/TR/selectors/#id-selectors).

### Multiple Levels of Inheritance

Abstract class selectors should be able to extend other abstract class selectors as well. This could allow for a very rich component hierarchy:

{% highlightjs %}
@extend %widget < %base-widget;
@extend .my-widget < %widget;
{% endhighlightjs %}

For `@extend` declarations, the object on the left can be either a class selector or an abstract class selector, but the object on the right must be an abstract class selector. Non-abstract classes should never be able to extend other non-abstract classes or we'd end up with the same problems we already have with specificity and source order in Sass.

## A Simple Example: Building a Grid

To demonstrate how abstract class selectors could be used in a real project, consider a grid system. Grid systems are quite useful but often come under fire for the presentational nature of the class names. With the help of abstract class selectors, this problem can be solved.

Here is the CSS for the skeleton grid system:

{% highlightjs %}
/* define a clearfix abstract class */
%clearfix {
  /* clearfix implementation */
}

/* grid rows extend clearfix so their cells are contained */
@extend %grid-row < %clearfix;
%grid-row {
  margin-left: 2em; /* contain leftmost gutter */
}

/* base grid-cell abstract class */
%grid-cell {
  float: left;
  margin-left: 2em; /* gutter */
}

@extend %grid-cell-1-2 < %grid-cell;
%grid-cell-1-2 {
  width: calc(50% - 2em);
}

@extend %grid-cell-1-3 < %grid-cell;
%grid-cell-1-3 {
  width: calc(33.333% - 2em);
}

@extend %grid-cell-1-4 < %grid-cell;
%grid-cell-1-4 {
  width: calc(25% - 2em);
}
{% endhighlightjs %}

Now that we have our abstract grid system, we can extend from it to build a basic site layout. Let's build a site with a header, footer, and content area with three columns. The left and right columns are 25% and the center column is 50%.

{% highlightjs %}
<header>...</header>
<div class="main">
  <nav class="menu">...</nav>
  <article class="content">...</article>
  <aside class="promotional">...</aside>
</div>
<footer>...</footer>
{% endhighlightjs %}

We could easily use our abstract grid to layout the above markup by just extending a few of the abstract classes.

{% highlightjs %}
@extend .main < %grid-row;
@extend .menu < %grid-col-1-4;
@extend .content < %grid-col-1-2;
@extend .promotional < %grid-col-1-4;

.menu {
  /* menu styles */
}
.content {
  /* content styles */
}
.promotional {
  /* promotional styles */
}
{% endhighlightjs %}

Finally, if we want our grid system to be responsive, we can use a media query to make each cell full width when the screen is smaller than `30em`. Notice that we're only modifying the abstract class selectors in this media query, which the `.menu`, `.content`, and `.promotional` class selectors will automatically inherit.

{% highlightjs %}
@media (max-width: 30em) {
  %grid-row {
    margin-left: 0;
  }
  %grid-cell {
    float: none;
    width: auto;
    margin-left: 0;
  }
}
{% endhighlightjs %}

And if we wanted to make the columns sortable via a jQuery plugin, we could easily target them:

{% highlightjs %}
// select all elements that inherit from %grid-cell
$("%grid-cell").sortable();
{% endhighlightjs %}

## Summary

Hopefully this article has helped show just how useful native support for class inheritance in CSS would be.

Obviously this is just my opinion and one possible implementation. I'm very interested in the feedback of others who have also struggled with solving this issue.
