<!--
{
  "layout": "article",
  "title": "Stopping Event Propagation Breaks the Web",
  "date": "2014-04-29T21:02:45-07:00",
  "draft": true,
  "codepen": true,
  "tags": [
    "JavaScript",
    "HTML"
  ]
}
-->

* Intro
* A Classic Problem
  * The Trouble with Events
* What Can Go Wrong?
* Why Do People Stop Event Propagation?
  * Return False
  * Performance
* What to do Instead
  * Is It Ever Okay to Stop Event Propagation?
  * Prevent Default
* Conclusion

Imagine you have a leaky shower in your bathroom that desperately needs fixing. You search online to see if you can figure out how to do it yourself, and the top rated advice suggests you to seal off the pipe that leads to the shower. "I could do that!" you think to yourself. So you get out your tools, seal the pipe, and voilà! The leak has stopped.

Sounds crazy, right? I mean, there's the obvious problem that now you can't use your shower at all, but that's probably not the only issue. Maybe that pipe, after going to the shower, continued on to the kitchen or the laundry room. This "solution" has likely created more problems than it solved.

This story might seem a bit unrealistic, but the truth is we developers do stuff like this all the time. We solve a problem using a trick we don't fully understand without considering its larger consequences.

Perhaps no problem exemplifies this more than the widespread misuse of stopping event propagation.

## A "Classic" Problem

If you're a web developer, at some point in your career you've probably had to build a popup or dialog that dismissed itself when the user clicked somewhere else on the page. If you searched online for how to do this, chances are you came across this Stack Overflow question: [How to detect a click outside an element?](http://stackoverflow.com/questions/152975/how-to-detect-a-click-outside-an-element).

Here's what the highest voted answer recommends:

```javascript
$('html').click(function() {
  // Hide the menus if visible.
});

$('#menucontainer').click(function(event){
  event.stopPropagation();
});
```

This answer can be summarized as follows: If a click event propagates to the `<html>` element, hide the menu. If the click originated inside `#menucontainer`, stop the event so it never reaches `<html>`, thus only clicks outside of `#menucontainer` will close it.

This code is simple, elegant, and clever all at the same time. Yet, unfortutely, it's absolutely horrible advice. It's basically the equivalent of turning off the water in my leaky shower story. This solution completely ignores the possibility that any other code on the page might needs to know about that click.

But it's the Interent, and it's the most upvoted answer, so this is what a lot of people do.

### The Problem with Events

Like a lot of things in JavaScript, DOM events are global. And as most people know, global variables make for messy, coupled code.

Modifying the state or the behavior of a global variable might not seem like a big deal, but as the use of third-party frameworks increases, altering browser-defined behavior can lead to some disastrous bugs. Bugs that are impossible to defend against and a nightmare to track down.

When you stop an event from propagating up to the document, you're changing the rules of the game in a way that libraries authors can't predict. This problem is magnified by the increasing popularity of [event delegation](http://www.nczonline.net/blog/2009/06/30/event-delegation-in-javascript/). Every time you stop an event from propagating through the DOM, you're potentially creating a bug in some other code on the page.

## What Can Go Wrong?

You might be thinking to yourself: who even writes code like this anymore? I use Bootstrap (or some other UI library) to do all this stuff so I can just stop reading, right?

Well, no. Unfortunately stopping event propagation is not just something recommended by bad Stack Overflow answers; it's also found in some of the most popular libraries in use today.

To prove this, let me show you how easy it is to create a `stopPropagation` related bug by using [Bootstrap](http://getbootstrap.com/) in a [Rails](http://rubyonrails.org/) app.

Rails ships with a JavaScript library called [jquery-ujs](https://github.com/rails/jquery-ujs) that allows developers to declaratively add remote ajax calls to links via the `data-remote` attribtue.

In the following example, if you open the dropdown and click on the "Remote Link" nothing happens. If you click anywhere else on the page (including the regular link), the dropdown closes as you'd expect.

<div class="CodepenContainer">
  <div class="codepen" data-height="250" data-slug-hash="KzHjc" data-default-tab="result"></div>
</div>

This bug happens because the Bootstrap code responsible for closing the dropdown menu is listening for click events on the document. But since jquery-ujs stops event propagation in its `date-remote` link handlers, the Bootstap dropdown closing code never runs for those clicks.

The worst part about this bug is that there's absolutely nothing Bootstrap can do to prevent it from happening. If you're writing code that deals with the DOM, you're always at the mercy of whatever other code is running on the page. Such is the nature of global variables.

I'm not trying to pick on jquery-ujs, I just happen to know this problem exists because I [encountered it myself](https://github.com/rails/jquery-ujs/issues/327) and had to work around it. In truth, tons of other libraries, including Bootstrap, stop event propagation. It's a big problem.

## Why Do People Stop Event Propagation?

I already showed that there's a lot of bad advice on the Internet recommending the use of `stopPropagation`, but this isn't the only reason developers do this.

I'd wager a bet that a very large percentage of the time, developer stop event propagation without even realizing it.

### Return false

In the olden days of inline event handlers you'd frequently see stuff like this in people's code:

```xml
<a href="#" onclick="return false">Link</a>
```

Return false here is used to prevent the browser from attempting to find an empty hash fragment on the page. But `return false` is actually doing more than just preventing this default behavior, it's also stopping the propagation of that event.

Returning false is basically the same as:

```javascript
event.preventDefault();
event.stopPropagation();
```

I'd recommend never returning false from any event handler. It's always better to be explicit with your intentions.

**Note:** If you use CoffeeScript (which automatically returns the last expression) make sure you don't end your event handlers with anything the evaluates to `false`.

###  Performance

Back in the days of IE6 and other terribly slow browsers, a complicated DOM could really slow down your site. And since events travel through the entire DOM, the more nodes you have, the slower everything is.

Peter Paul Koch of [Quirksmode.org](http://www.quirksmode.org/js/events_order.html) recommended this practice in an old article on JavaScript events:

> if your document structure is very complex (lots of nested tables and such) you may save system resources by turning off bubbling. The browser has to go through every single ancestor element of the event target to see if it has an event handler. Even if none are found, the search still takes time.

With today's modern browsers, however, there is essentially no noticeable performance gain from stopping event propagation. Unless you absolutely know what you are doing and very strictly control all the code on your pages, I do not recommend this approach.

## What To Do Instead

As a general rule, stopping event propagatin should never be the solution to a programming problem. It should only be used when you want to make it as if the event never happened.

In the "How to detect a click outside of an element?" example above, the purpose of calling `stopPropagation` isn't to get rid of the click event altogether, it's to avoid running the code that will hide the menu in one particular situation.

In addition to this being a bad idea because it alters global behavior, it's a bad idea because it places the menu hiding logic in two different and unrelated places, making it less maintainable.

A much better solution is to have a single event handler whose logic is fully ensapsulated and whose responsiblity is determining whether the menu should be hidden for a particular event.

As it turns out, the better option ends up being less code:

```javascript
$(document).on('click', function(event) {
  if (!$(event.target).closest('#menucontainer').length) {
    // Hide the menu.
  }
})
```

The above code listens for clicks on the document and checks to see if the event target is `#menucontainer` or has `#menucontainer` as a parent. If it doesn't, then you hide the menu.

I'm sure some readers will notice that the above solution requires a bit more DOM traversal than the original. Hopefully I've convinced you that this is neglidgable, especially for something as infrequent as a click event.

I'd trade a few microseconds of DOM lookup for a few hours of debugging any day.

### Prevent Default

Frequently people use `stopPropagation` or `return false` when all they really want to do is prevent the browsers default behavior from happening.

Let's say you have a link on your site that users can click on the share the page on Twitter. The actual link points to a URL on twitter.com but instead of going there you want to run some JavaScript code that opens a popup instead.

In order to prevent the browser from actually navigation to twitter.com, you need to tell it to `preventDefault`.

Imagine you also have some code on your site that uses Google Analytics to track link clicks to external domains. Maybe it looks like this:

```javascript
$(document).on('click', 'a', function() {
  if (this.hostname != 'css-tricks.com') {
    ga('send', 'event', 'Outbound Link', this.href);
  }
})
```

If you want to exclude link clicks like the Twitter button that don't actually take you away from the current page, it might be tempting to stop those events from propagating. But a much better approach is to inspect the event to see if `preventDefault` has been called.

You know if the event target was a link and `preventDefault` was invoked, the browser wouldn't actually navigate to the URL, so instead of stopping event propagation, you can just inspect the event object.

```javascript
$(document).on('click', 'a', function() {
  // Ignore this event if preventDefault has been called.
  if (event.defaultPrevented) return;

  if (this.hostname != 'css-tricks.com') {
    ga('send', 'event', 'Outbound Link', this.href);
  }
})
```

By doing it this way you correctly track only the link clicks you want without breaking other functionality on the page (e.g. an open Bootstrap dropdown).

In my experience, a large portion of the code I see using `stopPropagation` could easily be rewritten to check `event.defaultPrevented` instead. The next time you're faced with this dilemma, think about what you're really trying to accomplish.

## Conclusion

Pretty much everything I've said so far could be summed up with a few simple rules of thumb. Treat events as global variables. Don't alter them unless you really want them to be altered globally, for all other code on the site. Event handler logic should be limited in scope and should not depend on other event handlers to work.

And if it's helpful, remember the Bootstrap dropdown example. This can be particularly help when writing event handlers for click events. If you're ever tempted to call `stopPropagation` in an event handler, just ask yourself: *if there were an open dropdown on this page, would stopping event propagation be a problem?*

If the answer is "yes", and it frequently is, you should find another way.

## When Stopping Event Propagation is Okay

I said above that stopping event propagation should never be the solution to a programming problem. What I meant by that is stopping event propagation should never be used as a convient way to avoid some extra work

The only reason to ever stop event propagation is if you want to make it like the event never happened. Since events are global occurrences, stopping event propagation for any other reason is irresponsible.

When would you want to make it like an event never happened? Well, this is rare, but one possible example could be when you've displayed a modal dialog on your page and set focus on the dialog's "OK" button. If the user tries to click outside of the dialog at other links on the page or tries to use the tab key to remove focus from the dialog, it's sometimes best to completely block those events. If you want to make it impossible to interact with the page while the dialog is present, it might make sense to completely stop those events from propagating.

This is very different from the click outside example mentioned earlier. In that case, stopping the event from propagating was for the sole purpose of preventing the execution of some code. It was a hack rather than a feature.