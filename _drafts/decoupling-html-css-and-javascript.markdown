---
layout: post
title: Decoupling Your HTML, CSS, and JavaScript
date: 2013-08-11 02:30:00
tags:
- HTML
- CSS
- JavaScript
---

Any non-trivial Web site or application on the Web today will contain a large amount of HTML, CSS, and JavaScript. As the use of the Internet evolves and our dependence on it increases, having a plan for organizing your front-end code is a must.

Server-side development has long employed traditional computer science principles and best-practices, but in the front-end, too often code just gets added on as an afterthought.

Some of the reason for this is historical as HTML, CSS, and JavaScript were not originally designed with the challenges of today's webapps in mind. Luckily, most of the applications developers want to build can actually be done with HTML, CSS, and JavaScript. The problem isn't usually whether it can be done. The problem is how to do it in a way that is predictable and maintainable.

In my experience, one of the biggest challenges facing engineering teams today is how to write front-end code that is modular and decoupled from unrelated parts of the code base.

In today's large Web companies, an increasing number of people are touching and increasing percentage of the front-end code. Preventing unintended consequences is not an easy problem to solve, especially since HTML, CSS, and JavaScript are, by their nature, interdependent.

## The Goal

There is always going to be some coupling between HTML, CSS, and JavaScript. For better or for worse, these technologies were built to interact with each other. As an example, a fly-in transition might be defined with a class selector in a stylesheet, but it is often triggered by user interaction, applied via JavaScript, and initiated by adding the class to the HTML.

Since some coupling in your front-end code will always be required. Your goal shouldn't be to simply eliminate coupling altogether. Instead, it should be to minimize the coupling that makes your parts code unnecessarily dependent on other parts.

In general, the reason to decouple code is so developers can freely change one part without worrying that it will affect unrelated parts of the application.

As todays Web teams are growing in size and specialization, it's more important than over to allow developers to do their part without fear of breaking someone else's code.

## Anti-Patterns

It's not always obvious when front-end code is tightly coupled. And this is compounded by the fact that what may seem like loose coupling from one perspective is actually quite tight from another.

The following are all anti-patterns I've either seen repeatedly or done myself. In each I try to explain why the coupling is bad and how I try to avoid such traps.

### Overly complex selectors

CSS Zen Garden showed the world that you can completely change the look of an entire website without changing the markup at all. It was the poster child of the semantic Web movement, and one of its main tenants was to avoid the use of presentational classes.

At first glance, CSS Zen Garden may seem like a great example of decoupling. After all, it's entire point was to separate the style from the presentation. The problem, however, is that to do this you usually need selectors in your stylesheet that look like this:

{% highlightjs css %}
#sidebar section:first-child h3 + p { }
{% endhighlightjs css %}

The HTML is almost entirely decoupled from the CSS, but the CSS is extremely to the HTML and requires an intimate knowledge of the markup structure.

This may not seem bad if the person maintaining the CSS also maintains the HTML, but as soon as you add a few more people to the mix, it can quickly get out of hand.

If a developer comes along and adds a `<div>` before the first section, the above rule won't work, and the developer will likely not know.

CSS Zen Garden is a great idea as long as the markup of your site is rarely changing. However, that's usually not the case in today's webapps.

#### Style Components Based on What They Are, Not Where They Are

Instead of long, complex CSS selectors, it's best to (whenever possible) style all your visual components with one or more classes on the root element of the component itself. For example, if you have submenus in your sidebar, just add the class `submenu` to each of the submenu elements. Don't do something like `ul.sidebar > li > ul`.

This approach ends up requiring more classes in the HTML, but it lowers the coupling between the CSS and HTML, which makes the code much more maintainable in the long run. It also allows the submenu component to be reused throughout your site and on different sites altogether.

### Classes With More Than One Responsibility

Sometimes a class is used for both styling purposes and as a JavaScript hook. While this may seem like a savings (it requires one fewer class in the markup) it couples the presentation of the element to its functionality.

{% highlightjs xml %}
<button class="add-item">Add to Cart</button>
{% endhighlightjs %}

The above example shows an "Add to Cart" button styled with the `add-time` class.

If a developer wants to add a click event listener to this element, it can be quite tempting to hook into the class that's already there. I mean, why add another class?

But imagine that there are many of these buttons throughout the site that all look the same and all invoke the same JavaScript functionality. Then imagine the marketing teams wants a particular one of these buttons to look different than the rest of them. Perhaps it needs to be a lot bigger and a different color.

This is a problem because the JavaScript code that is listening for the click event is expecting the class `add-item` to be used, but your new button now cannot use that class (or be forced to unset everything it declared). You may even have some testing code that is also expecting the `add-item` class to be present, so you'll have yet another place where code needs to be updated.

Even worse still is if your "Add to Cart" functionality is used by more than just this application. If the code has been abstracted to a separate module then what should have been a simple style change can now potentially introduce bugs in a completely separate project.

#### Don't Use Classes For Styling and Behavior

It's perfectly acceptable (actually encouraged) to use classes as JavaScript hooks, but if you're going to do so, do it in a way that avoids confusion between style classes and behavior classes.

My personal recommendation is to use a prefix for all JavaScript hooks. I use `js-*`. That way, when a developer sees such a class in the HTML source, she'll know exactly where to look to discover its purpose.

The "Add to Cart" example above would then be rewritten as:

{% highlightjs xml %}
<button class="js-add-item add-item">Add to Cart</button>
{% endhighlightjs %}

Now if one particular "Add to Cart" button needs to look different, you can change the class name without affecting the functionality.

### JavaScript That Knows Too Much About Styling

Similar to when JavaScript uses classes to find elements in the DOM, it also  often adds or removes classes to change the style of elements. But this can be a problem if those classes aren't identifiably different from the classes that appear on page load.

When JavaScript code knows too much about components styling, it can be scary for a CSS developer to make changes to a stylesheet without fear of breaking critical functionality.

This is not to say that JavaScript should not alter the look or style of a visual components, but when it does it should do so through an agreed-upon interface. It should use classes that are identifiably different from classes that express default styling.

#### Separate State Styling from Default Styling

The appearance of a page will often change as a result of user interaction. For example a pop-up may appear and disappear and an accordion section may expand and collapse. Such changes are usually made via JavaScript, and they're often done by adding or removing classes.

If JavaScript is altering the appearance of the page via a class, it's helpful to know that when looking at the class selector in the CSS file. As with `js-*` prefixed classes, having a convention for state specific classes gives someone looking at a CSS rule a sense of where and how this rule is used.

I recommend using the prefix `is-*` to define class selectors that alter the state of a visual component. An example CSS rule might look like this:

{% highlightjs css %}
.pop-up.is-visible { }
{% endhighlightjs %}

Notice that the state class is chained to the component class; this is important. Since state rules describe the state of a component, they should not appear on their own.

In addition, by using a prefix like `is-*` we can write tests to ensure that this is enforced. One way to test these types of rules is using CSSLint.

### JavaScript "selectors"

jQuery made it extremely easy for users to find elements in the DOM via a language they were already familiar with &mdash; CSS selectors. While this is very powerful, it comes with the same problem that CSS selectors already have.

JavaScript “selectors" should not rely too heavily on the DOM structure. Such selectors are significantly slower and require far too intimate a knowledge of the HTML structure.

As with the first example, a developer working on an HTML template should be able to make basic changes to the markup without fear of it breaking essential functionality. If there is functionality that can be broken, it should be obvious what that is.

I've already mentioned that `js-*` prefixed classes should be used as JavaScript hooks. In addition to disambiguating styling classes from functional classes, they also express intention in the markup. When someone editing the HTML sees a `js-*` prefixed class, they'll know it's used for something.

If the JavaScript code is instead depending on long, complex selectors, it's not at all clear in the markup that anything functional is happening.

#### Don't Use Complex Selectors for DOM Traversal

Instead of traversing the DOM with long, complex selectors, stick to single class selectors or IDs.

Consider the following code:

{% highlightjs javascript %}
var saveBtn = document.querySelector("#modal div:last-child > button:last-child")
{% endhighlightjs %}

The above code saves you from having to add a class to the HTML, but it also makes your code very susceptible to markup changes. If the designers suddenly decide to align the save button on the left and the cancel button on the right, your code will no longer work.

A much better approach, using the prefix method mentioned above, would be to just use a class.

{% highlightjs javascript %}
var saveBtn = document.querySelector(".js-save-btn")
{% endhighlightjs %}

## Classes Are Your Contract

Almost every coupling problem in HTML, CSS, and JavaScript can be mitigated with an appropriate use of classes and a predictable class naming convention.

Many other languages use events to decouple code. Instead of object A calling a method on object B, it simply emits particular event in a given circumstance, and object B can subscribe to that event. This way, object B doesn't need to know anything about object A's interface, it simply needs to know what event to listen for.

Classes can actually be used in a very similar way. Instead of a CSS file defining a complex selector (which is inherently unreusable and requires an intimate knowledge of the HTML structure), it can simply define the look of a visual component via a single class. The HTML may then choose to use that class or not use it. The CSS doesn't need to care.

Likewise, JavaScript doesn't need complex DOM traversal functions that also require an intimate knowledge of the HTML structure, they can simply listen for events occuring on elements with a specific set of agreed-upon class names.

## Some Considerations

HTML, CSS, and JavaScript are not created equal. Difference in language capabilities can play a role in how much coupling to avoid. For example, in JavaScript it is very easy to encapsulate functionality so it doesn't conflict with other code. In CSS, however, this is not not the case.

This means that more consideration must be given to the CSS when trying to decouple front-end code since the global nature of CSS is inherently harder to manage.

Another important consideration is type of developer working on a particular language. In my experience a large number of people will likely touch the HTML templates, but CSS is often maintained by a more specialized person who "owns" that code.

Because a lot of people are touching the markup who are probably not touching the CSS, it's extra important that your CSS rules are decoupled from the markup structure.

Intentionality in the markup is key. The more you can express the functionality of the HTML through the classes you add to its elements, the less likely developers are to accidentally make changes that break that functionality.

## Conclusion

The mark of maintainable HTML, CSS, and JavaScript is when individual developers can easily edit parts of the code base without those changes having unintended consequences in other, unrelated parts.

One of the best ways to prevent unintended consequences is to connect these three technologies together via a predictable set of thoughtfully named classed that express intentionality and reflect their chosen purpose to any developer who encounters them.

Using classes this way will often require a lot of classes being present in the HTML, but the gains in predictability and maintainability are well worth it. After all, adding classes to HTML is quite easy and something that a developer of any skill level can do.
