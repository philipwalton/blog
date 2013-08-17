---
layout: post
title: Decoupling Your HTML, CSS, and JavaScript
date: 2013-08-17 12:39:09
tags:
- HTML
- CSS
- JavaScript
---

Any non-trivial site or application on the Web today will contain a large amount of HTML, CSS, and JavaScript. As the use of the Internet evolves and our dependence on it increases, having a plan for organizing and maintaining your front-end code is an absolute must.

In today's large Web companies, an increasing number of people are touching an increasingly large percentage of the front-end code. As a result, most organizations struggle to keep their code modular. Changes to one part of the application often inadvertently break unrelated parts downstream.

Preventing unintended consequences is not an easy problem to solve, especially since HTML, CSS, and JavaScript are, by their nature, co-dependent.

To make matters worse, traditional computer science principles like the separation of concerns, which have long been a part of server-side development, rarely get discussed when it comes to front-end code.

In this article I'll talk about how I've learned to decouple my HTML, CSS, and JavaScript. From my experience and the experience of people I know, the best ways to accomplish this are far from obvious and often counter-intuitive.

## The Goal

There will always be some coupling between HTML, CSS, and JavaScript. For better or for worse, these technologies were built to interact with each other. As an example, a fly-in transition might be defined with a class selector in a stylesheet, but it is often triggered by user interaction, applied via JavaScript, and initiated by adding the class to the HTML.

Since some coupling in your front-end code is inevitable. Your goal shouldn't be to simply eliminate coupling altogether. Instead, it should be to minimize the coupling that makes certain code parts unnecessarily dependent on others.

A back-end developer should be able to change the markup in an HTML template without worrying about accidentally breaking a CSS rule or some JavaScript functionality. As today's Web teams grow in size and specialization, this goal is more important than ever.

## Anti-Patterns

It's not always obvious when front-end code is tightly coupled. And this is compounded by the fact that what may seem like loose coupling from one perspective is actually tight coupling from another.

The following are all anti-patterns I've either seen repeatedly or done myself. In each, I try to explain why the coupling is bad and how it can be avoided.

### Overly Complex Selectors

CSS Zen Garden showed the world that you can completely change the look of an entire website without changing the markup at all. It was the poster child of the semantic Web movement, and one of its main tenants was to avoid the use of presentational classes.

At first glance, CSS Zen Garden may seem like a great example of decoupling. After all, its entire point was to separate the style from the markup. The problem, however, is that to do this you usually need selectors in your stylesheet that look like this:

{% highlightjs css %}
#sidebar section:first-child h3 + p { }
{% endhighlightjs css %}

In CSS Zen Garden, the HTML is almost entirely decoupled from the CSS, but the CSS is extremely coupled to the HTML and requires an intimate knowledge of its markup structure.

This may not seem bad if the person maintaining the CSS also maintains the HTML, but as soon as you add a few more people to the mix, it can quickly get out of hand. If a developer comes along and adds a `<div>` before the first `<section>`, the above rule won't work, and the developer will likely not know.

CSS Zen Garden is a great idea as long as the markup of your site is rarely changing. However, that's usually not the case in today's Web apps.

Instead of long, complex CSS selectors, it's best to (whenever possible) style all your visual components with one or more classes on the root element of the component itself. For example, if you have submenus in your sidebar, just add the class `submenu` to each of the submenu elements. Don't do something like `ul.sidebar > li > ul`.

This approach ends up requiring more classes in the HTML, but it lowers the coupling between it and this CSS making the code much more reusable and maintainable in the long run. It also makes your markup self-documenting. If there are no classes in the HTML, a developer who is unfamiliar with the CSS has no idea how her markup changes will affect things. On the other hand, if there are classes in the HTML it is very obvious what styles are being applied.

### Classes With More Than One Responsibility

Sometimes a class is used for both styling purposes and as a JavaScript hook. While this may seem like a savings (since it requires one fewer class in the markup) it actually couples the presentation of the element to its functionality.

{% highlightjs xml %}
<button class="add-item">Add to Cart</button>
{% endhighlightjs %}

The above example shows an "Add to Cart" button styled with the `add-item` class.

If a developer wants to add a click event listener to this element, it can be quite tempting to hook into the class that's already there. I mean, if there's already one there, why add another?

But imagine that there are many of these buttons throughout the site that all look the same and all invoke the same JavaScript functionality. Then imagine the marketing team wants a particular one of these buttons to look different than the rest of them. Perhaps it needs to be a lot bigger with a more eye-catching color.

This is a problem because the JavaScript code that is listening for the click event is expecting the class `add-item` to be used, but your new button now cannot use that class (or it must unset everything it declared and reset the new styles). You may even have some testing code that is also expecting the `add-item` class to be present, so you'll have yet another place where code needs to be updated.

Even worse still is if your "Add to Cart" functionality is used by more than just this application. If the code has been abstracted to a separate module then what should have been a simple style change can now potentially introduce bugs in a completely different project.

It's perfectly acceptable (actually encouraged) to use classes as JavaScript hooks, but if you're going to do so, do it in a way that avoids coupling between style classes and behavior classes.

My personal recommendation is to use a prefix for all JavaScript hooks. I use `js-*`. That way, when a developer sees such a class in the HTML source, she'll know exactly where to look to discover its purpose.

The "Add to Cart" example above would then be rewritten as:

{% highlightjs xml %}
<button class="js-add-to-cart add-item">Add to Cart</button>
{% endhighlightjs %}

Now if one particular "Add to Cart" button needs to look different, you can simply change the style class and leave the behavior class alone.

{% highlightjs xml %}
<button class="js-add-to-cart add-item-special">Add to Cart</button>
{% endhighlightjs %}

### JavaScript That Knows Too Much About Styling

Similar to how JavaScript may use classes to find elements in the DOM, it also  often adds or removes classes to change the style of elements. But this can be a problem if those classes aren't identifiably different from the classes that appear on page load.

When JavaScript code knows too much about component styling it becomes very easy for a CSS developer to make changes to a stylesheet and not realize he's breaking critical functionality.

This is not to say that JavaScript shouldn't alter the look or style of a visual components, but if it does it should do so through an agreed-upon interface. It should use classes that are identifiably different from classes that express default styling.

The appearance of a page will often change as a result of user interaction. For example a pop-up may appear or disappear and an accordion section may expand or collapse. Such changes are usually made via JavaScript, and they're often done by adding or removing a class.

If JavaScript is altering the appearance of the page with classes, it's helpful to be aware of this when looking at the class selector in the CSS file. Having a convention for state specific classes gives someone looking at a CSS rule a sense of where and how it's used.

Similar to `js-*` prefixed classes, I recommend using the prefix `is-*` to define class selectors that alter the state of a visual component. An example CSS rule might look like this:

{% highlightjs css %}
.pop-up.is-visible { }
{% endhighlightjs %}

Notice that the state class is chained to the component class; this is important. Since state rules describe the state of a component, they should not appear on their own.

In addition, by using a prefix like `is-*` we can write tests to ensure that this convention is followed. One way to test these types of rules is using [CSSLint](http://csslint.net) and [HTML Inspector](http://philipwalton.com/articles/introducing-html-inspector/).

### JavaScript "Selectors"

jQuery made it extremely easy for users to find elements in the DOM via a language they were already familiar with &mdash; CSS selectors. While this is very powerful, it comes with the same problem that CSS selectors already have.

JavaScript “selectors" should not rely too heavily on the DOM structure. Such selectors are significantly slower and require far too intimate a knowledge of the HTML.

As with the first example, a developer working on an HTML template should be able to make basic changes to the markup without fear of it breaking essential functionality. If there is functionality that can be broken, it should be apparent in the markup.

I've already mentioned that `js-*` prefixed classes should be used as JavaScript hooks. In addition to disambiguating styling classes from functional classes, they also express intention in the markup. When someone editing the HTML sees a `js-*` prefixed class, they'll know it's used for something. If the JavaScript code is instead depending on a particular markup structure to query for elements, it won't be apparent in the markup that anything functional is happening.

Instead of traversing the DOM with long, complex selectors, stick to single class selectors or IDs.

Consider the following code:

{% highlightjs javascript %}
var saveBtn = document.querySelector("#modal div:last-child > button:last-child")
{% endhighlightjs %}

The above code saves you from having to add a class to the HTML, but it also makes your code very susceptible to markup changes. If the designers suddenly decide to put the save button on the left and the cancel button on the right, your code will no longer work.

A much better approach (using the prefix method mentioned above) would be to just use a class.

{% highlightjs javascript %}
var saveBtn = document.querySelector(".js-save-btn")
{% endhighlightjs %}

## Classes Are Your Contract

Almost every type of coupling between HTML, CSS, and JavaScript can be lessened with an appropriate use of classes and a predictable class naming convention.

Many other languages use events to decouple code. For example, instead of object A calling a method on object B, it simply emits a particular event in a given circumstance, and object B can subscribe to that event. This way, object B doesn't need to know anything about object A's interface, it simply needs to know what event to listen for.

Classes can actually be used in a very similar way. Instead of a CSS file defining a complex selector (which is inherently not reusable and requires an intimate knowledge of the HTML structure), it can simply define the look of a visual component via a single class. The HTML may then choose to use that class or not use it. The CSS doesn't need to care.

Likewise, JavaScript doesn't need complex DOM traversal functions that also require an intimate knowledge of the HTML structure, they can simply listen for events occurring on elements with a specific set of agreed-upon class names.

Classes should be the glue that connects your HTML, CSS, and JavaScript together.

## The Future

The [WHATWG](http://www.whatwg.org/) is currently working on the [Web Components](http://www.w3.org/TR/2013/WD-components-intro-20130606/) specification, which will allow developers to bundle HTML, CSS, and JavaScript together as individual components or modules that are encapsulated from the rest of the page.

When that spec if implemented in browsers, a lot of the suggestions I've given in this article will become less critical (since it will be more obvious what code is meant to work with what); however, it's still important to understand these broader principles and why they're needed.

Even if these practices become less important in the era of Web Components, the theory still applies. Practices that work for large teams and big applications will still work for small modules written by individual developers. The reverse is not necessarily the case.

## Conclusion

The mark of maintainable HTML, CSS, and JavaScript is when individual developers can easily and confidently edit parts of the code base without those changes inadvertently affecting other, unrelated parts.

One of the best ways to prevent unintended consequences is to connect these three technologies together with a predictable set of thoughtfully named classes that express their intention and reflect their chosen purpose to any developer who encounters them.

To avoid the above anti-patterns, keep the following principles in mind:

* Avoid complex CSS selectors in your stylesheets and JavaScript files.
* Style components based on what they are, not where they are.
* Don't use the same class for both style and behavior.
* Differentiate state styles from default styles.

Using classes this way will often require a lot of classes being present in the HTML, but the gains in predictability and maintainability are well worth it. After all, adding classes to HTML is quite easy and something that a developer of any skill level can do. To quote [Nicolas Gallagher](http://nicolasgallagher.com/about-html-semantics-front-end-architecture/):

> When you choose to author HTML and CSS in a way that seeks to reduce the amount of time you spend writing and editing CSS, it involves accepting that you must instead spend more time changing HTML classes on elements if you want to change their styles. This turns out to be fairly practical, both for front-end and back-end developers &mdash; anyone can rearrange pre-built "lego blocks"; it turns out that no one can perform CSS-alchemy.
