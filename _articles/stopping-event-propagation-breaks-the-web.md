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

If you're a web developer, at some point in your career you've probably had to build a popup or dialog that dismissed itself after the user clicked anywhere else on the page. If you searched online to figure out the best way to do this, chances are you came across this Stack Overflow question: [How to detect a click outside an element?](http://stackoverflow.com/questions/152975/how-to-detect-a-click-outside-an-element).

Here's what the highest rated answer recommends:

```javascript
$('html').click(function() {
  // Hide the menus if visible.
});

$('#menucontainer').click(function(event){
  event.stopPropagation();
});
```

This answer can be summarized as follows: If a click event propagates to the `<html>` element, hide the menus. If the click event originated inside `#menucontainer`, stop the event so it will never reach `<html>`, thus only clicks outside of `#menucontainer` will cause the menus to be hidden.

The above code is simple, elegant, and clever all at the same time. Yet, unfortutely, it's absolutely horrible advice.

This solution is roughly equivalent to fixing a leaky shower by turning off the water to the bathroom. It completely ignores the possibility that any other code on the page might needs to know about that click event.

Still, it's the most upvoted answer to this question, so most people take it as sound advice.

## The Problem with Events

Like a lot of things in JavaScript, DOM events are global. And as most people know, global variables make for messy, coupled code.

Modifying a single, fleeting event might not seem like a big deal, but as the use of third-party frameworks increases, altering browser-defined behavior can lead to some disastrous bugs. Bugs that, from my experience, are a nightmare to track down.

When you stop an event from propagating through the DOM, you're changing expectations in a way that library authors can't possibliy predict or defend against. This problem is magnified by the increasing popularity of [event delegation](http://www.nczonline.net/blog/2009/06/30/event-delegation-in-javascript/). Every time you stop an event from bubbling up to the document, you're creating a potential bug in some other code on the page.

## What Can Go Wrong?

You might be thinking to yourself: who even writes code like this by hand anymore? I use a well-tested library like Bootstrap, so I can stop worrying, right?

Well, no. Unfortunately stopping event propagation is not just something recommended by bad Stack Overflow answers; it's also found in some of the most popular libraries in use today.

To prove this, let me show you how easy it is to create a bug by using Bootstrap in a Ruby on Rails app.

Rails ships with a JavaScript library called [jquery-ujs](https://github.com/rails/jquery-ujs) that allows developers to declaratively add remote ajax calls to links via the `data-remote` attribtue.

In the following example, if you open the dropdown and click anywhere else in the frame, the dropdown closes itself. However, if you open the dropdown and then click the "Remote Link", it doesn't work.

<div class="CodepenContainer">
  <div class="codepen" data-height="250" data-slug-hash="KzHjc" data-default-tab="result"></div>
</div>

This bug happens because the Bootstrap code responsible for closing the dropdown menu is listening for click events on the document. But since jquery-ujs stops event propagation in its `date-remote` link handlers, those clicks never reach the document, so the Bootstrap code never runs.

The worst part about this bug is that there's absolutely nothing the Bootstrap (or any other library) can do to prevent stuff like this from happening. If you're writing code that deals with the DOM, you're always at the mercy of whatever other poorly-written code is running on the page. Such is the nature of global variables.

As a quick disclaimer, I'm not trying to single out jquery-ujs, I just happen to know this problem exists because I [encountered it myself](https://github.com/rails/jquery-ujs/issues/327) and had to work around it. In truth, tons of other libraries, including Bootstrap, stop event propagation. It's a big problem, and it's all over the web.

## Why Do People Stop Event Propagation?

I already showed that there's some bad advice on the Internet promoting the use of `stopPropagation`, but that isn't the only reason people do it.

Frequently, developers stop event propagation without even realizing it.

### Return false

There's a lot of confusion about what happens when you return `false` from an event handler. Consider the following three cases that all appear to do the same thing:

```xml
<!-- Using an inline event handler. -->
<a href="http://google.com" onclick="return false">Google</a>
```

```javascript
// Using jQuery.
$('a').on('click', function() {
  return false;
})
```

```javascript
// Using plain ol' JavaScript.
var link = document.querySelector('a');
link.addEventListener('click', function() {
  return false;
})
```

They look like they should do the same thing, but the results are actually completely different. Here's what happens in each of these cases:

1. Returning `false` from an inline event handler prevents the browser from navigating to the link address, but it doesn't stop the event from propagating through the DOM.
2. Returning `false` from a jQuery event handler prevent the browser from navigating to the link address, and it also stops the event from propagating through the DOM.
3. Returning `false` from a regular DOM event handler does absolutely nothing.

If you're shaking your head in disbelief right now, you're not alone. These differences are incredibly confusing and annoying.

Fortunately, the methods `stopPropagation` and `preventDefault` actually do work the same in both jQuery and native DOM event handlers. The following function could be passed to either jQuery's `on()` method or the browsers native `addEventListener()` method and the result would be the same:

```javascript
function stop(event) {
  event.preventDefault();
  event.stopPropagation();
}
```

Because of the confusion around `return false`, I'd recommend never using it. Furthermore, since returning `false` from a jQuery event handler stops the event from propagating, doing so could easily lead to some of the problems described in this article.

**Note:** If you use jQuery with CoffeeScript (which automatically returns the last expression in a function) make sure you don't end your event handlers with anything the evaluates to the Boolean `false` or you'll have the same issue.

###  Performance

Back in the days of IE6 and other terribly slow browsers, a complicated DOM could really slow down your site. And since events travel through the entire DOM, the more nodes you have, the slower everything is.

Peter Paul Koch of [quirksmode.org](http://www.quirksmode.org/js/events_order.html) recommended this practice in an old article on the subject:

> if your document structure is very complex (lots of nested tables and such) you may save system resources by turning off bubbling. The browser has to go through every single ancestor element of the event target to see if it has an event handler. Even if none are found, the search still takes time.

With today's modern browsers, however, there is essentially no noticeable performance gain from stopping event propagation. Unless you absolutely know what you are doing and very strictly control all the code on your pages, I do not recommend this approach.

## What To Do Instead

As a general rule, stopping event propagatin should never be a solution to a difficult coding challenge. Instead, stopping propagation should only ever be used for one purpose: to make it as if the event never happened.

In the "How to detect a click outside of an element?" example above, the purpose of calling `stopPropagation` isn't to get rid of the click event altogether, it's to avoid running some code that will hide the menu in one particular situation.

In addition to this being a bad idea because it alters global behavior, it's also a bad idea because it puts the menu hiding code in two different and unrelated places, making it far more fragile than necessary.

A much better solution is to have a single event handler whose logic is fully ensapsulated and whose sole responsiblity is to determine whether or not the menu should be hidden for the given event.

As it turns out, the better option ends up requiring less code:

```javascript
$(document).on('click', function(event) {
  if (!$(event.target).closest('#menucontainer').length) {
    // Hide the menus.
  }
});
```

The above handler listens for clicks on the document and checks to see if the event target is `#menucontainer` or has `#menucontainer` as a parent. If it doesn't, you know the click originated from outside of `#menucontainer`, and you can hide the menus if they're visible.

I'm sure some readers will notice that this solution requires a bit more DOM traversal than the original. Though, hopefully, I've convinced you that the benefits of this approach far outweigh the costs of such a small performance hit. I will gladly trade a few microseconds of DOM lookup today if it lowers the likelihood of spending a few hours tracking down bugs in the future.

### Prevent Default

Developers frequently use `stopPropagation` or `return false` when what they really want to use is `preventDefault`.

Let's say you have a link on your site that users can click on the share the current page on Twitter. The actual link points to a URL on twitter.com but rather than going there you want to run some JavaScript that opens a classic Twitter share popup instead.

In order to prevent the browser from actually navigation to twitter.com, you need to tell it to `preventDefault`.

Imagine you also have some code on your site that uses Google Analytics to track link clicks to external domains. Maybe it looks like this:

```javascript
$(document).on('click', 'a', function() {
  if (this.hostname != 'css-tricks.com') {
    ga('send', 'event', 'Outbound Link', this.href);
  }
});
```

If you want to exclude link clicks (like the Twitter button) that don't actually navigate away from the current page, it might be tempting to stop those events from propagating. But a much better approach is to inspect the event to see if `preventDefault` has been called.

You know if the event target was a link and `preventDefault` was invoked, the browser wouldn't actually navigate to the URL, so instead of stopping event propagation, you can just inspect the event object.

```javascript
$(document).on('click', 'a', function() {

  // Ignore this event if preventDefault has been called.
  if (event.defaultPrevented) return;

  if (this.hostname != 'css-tricks.com') {
    ga('send', 'event', 'Outbound Link', this.href);
  }
});
```

By doing it this way you correctly track only the link clicks you want without breaking other functionality on the page (e.g. an open Bootstrap dropdown).

In my experience, a large portion of the code I see using `stopPropagation` could easily be rewritten to check `event.defaultPrevented` instead. The next time you're faced with this dilemma, think about what you're really trying to accomplish.

## Conclusion

Hopefully this article has helped you think about DOM events in a new light. They're not isolated pieces that can be modified without consequence. They're global and interconnected and often affect far more code than you realize.

To avoid bugs, it's almost always best to leave events alone and let them propagate as the browser intended.

If you're ever unsure about what do to, just ask yourself the following question: is it possible that some other code, either now or in the future, might want to know that this event happened? Whether it be as trivial as a Bootstrap modal or as critical event tracking analytics, if something might ever want to know about that event, it's better to leave it alone and find another solution.

Another solution is always possible.
