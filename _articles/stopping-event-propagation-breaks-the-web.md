<!--
{
  "layout": "article",
  "title": "Stopping Event Propagation Breaks the Web",
  "date": "2014-04-29T21:02:45-07:00",
  "draft": true,
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

In case it's not clear what this code is doing, here's a quick rundown: If a click event propagates to the `<html>` element, hide the menus. If the click event originated from inside `#menucontainer`, stop that event so it will never reach `<html>`, thus only clicks outside of `#menucontainer` will hide the menus.

The above code is simple, elegant, and clever all at the same time. Yet, unfortunately, it's absolutely terrible advice.

This solution is roughly equivalent to fixing a leaky shower by turning off the water to the bathroom. It works, but it completely ignores the possibility that any other code on the page might need to know about that event.

Still, it's the most upvoted answer to this question, so people assume it's sound advice.

## What Can Go Wrong?

You might be thinking to yourself: who even writes code like this themselves anymore? I use a well-tested library like Bootstrap, so I don't need to worry, right?

Unfortunately, no. Stopping event propagation is not just something recommended by bad Stack Overflow answers; it's also found in some of the most popular libraries in use today.

To prove this, let me show you how easy it is to create a bug by using Bootstrap in a Ruby on Rails app. Rails ships with a JavaScript library called [jquery-ujs](https://github.com/rails/jquery-ujs) that allows developers to declaratively add remote AJAX calls to links via the `data-remote` attribute.

In the following example, if you open the dropdown and click anywhere else in the frame, the dropdown should close itself. However, if you open the dropdown and then click the "Remote Link", it doesn't work.

<p data-height="268" data-theme-id="1" data-slug-hash="KzHjc" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/philipwalton/pen/KzHjc/'>Stop Propagation Demo</a> by Philip Walton (<a href='http://codepen.io/philipwalton'>@philipwalton</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>

This bug happens because the Bootstrap code responsible for closing the dropdown menu is listening for click events on the document. But since jquery-ujs stops event propagation in its `data-remote` link handlers, those clicks never reach the document, and thus the Bootstrap code never runs.

The worst part about this bug is that there's absolutely nothing that Bootstrap (or any other library) can do to prevent it. If you're dealing with the DOM, you're always at the mercy of whatever other poorly-written code is running on the page.

### The Problem with Events

Like a lot of things in JavaScript, DOM events are global. And as most people know, global variables can lead to messy, coupled code.

Modifying a single, fleeting event might seem harmless at first, but it comes with risks. When you alter the behavior that other code expects and depends on, you're going to have bugs. It's just a matter of time.

And in my experience, these sorts of bugs are some of the hardest to track down.

## Why Do People Stop Event Propagation?

We know there's bad advice on the Internet promoting the unnecessary use of `stopPropagation`, but that isn't the only reason people do it.

Frequently, developers stop event propagation without even realizing it.

### Return false

There's a lot of confusion around what happens when you return `false` from an event handler. Consider the following three cases, each of which just returns `false`:

```xml
<!-- An inline event handler. -->
<a href="http://google.com" onclick="return false">Google</a>
```

```javascript
// A jQuery event handler.
$('a').on('click', function() {
  return false;
});
```

```javascript
// A native event handler.
var link = document.querySelector('a');

link.addEventListener('click', function() {
  return false;
});
```

These three examples all appear to do the same thing, but the results are actually quite different. Here's what actually happens in each of the above cases:

1. Returning `false` from an inline event handler prevents the browser from navigating to the link address, but it doesn't stop the event from propagating through the DOM.
2. Returning `false` from a jQuery event handler prevents the browser from navigating to the link address **and** it stops the event from propagating through the DOM.
3. Returning `false` from a regular DOM event handler does absolutely nothing.

When you expect something to happen and it doesn't, it's confusing, but you usually catch it right away. A much bigger problem is when you expect something to happen and it *does* but with unanticipated and unnoticed side-effects. That's where nightmare bugs come from.

In the jQuery example, it's not at all clear that returning `false` would behave any differently than the other two event handlers, but it does. [Under the hood](https://github.com/jquery/jquery/blob/2.1.1/src/event.js#L393-L396), it's actually invoking the following two statements:

```javascript
event.preventDefault();
event.stopPropagation();
```

Because of the confusion around `return false`, and the fact that it stops event propagation in jQuery handlers, I'd recommend never using it. It's much better to be explicit with your intention and call those event methods directly.

**Note:** If you use jQuery with CoffeeScript (which automatically returns the last expression in a function) make sure you don't end your event handlers with anything that evaluates to the Boolean `false` or you'll have the same problem.

###  Performance

Every so often you'll read some advice (usually written a while ago) that recommends stopping propagation for performance reasons.

Back in the days of IE6 and even older browsers, a complicated DOM could really slow down your site. And since events travel through the entire DOM, the more nodes you had, the slower everything got.

Peter Paul Koch of [quirksmode.org](http://www.quirksmode.org/js/events_order.html) recommended this practice in an old article on the subject:

> if your document structure is very complex (lots of nested tables and such) you may save system resources by turning off bubbling. The browser has to go through every single ancestor element of the event target to see if it has an event handler. Even if none are found, the search still takes time.

With today's modern browsers, however, any performace gains you get from stopping event propagation will likely go unnoticed by your users. It's a micro-optimization and certainly not your performance bottleneck.

I recommend not worrying about the fact that events propagation through your entire DOM. After all, it's part of the specification, and browsers have gotten very good at doing it.

## What To Do Instead

As a general rule, stopping event propagation should never be a solution to a problem. If you have several event handlers that sometimes interfere with each other, and you discover that stopping propagation in one of them makes everything work, that's not good. It might fix your problem, but it's probably creating another one you're not aware of.

`stopPropagation` should only ever be used intentionally. Perhaps you want to prevent a form submission or disallow focus to an area of the page. In these cases you're stopping propagation because you want to stop the event, not because you just don't want some handler to run.

In the "How to detect a click outside of an element?" example above, the purpose of calling `stopPropagation` isn't to get rid of the click event altogether, it's to avoid running some other code on the page.

In addition to this being a bad idea because it alters global behavior, it's a bad idea because it puts the menu hiding logic in two different and unrelated places, making it far more fragile than necessary.

A much better solution is to have a single event handler whose logic is fully encapsulated and whose sole responsibility is to determine whether or not the menu should be hidden for the given event.

As it turns out, this better option also ends up requiring less code:

```javascript
$(document).on('click', function(event) {
  if (!$(event.target).closest('#menucontainer').length) {
    // Hide the menus.
  }
});
```

The above handler listens for clicks on the document and checks to see if the event target is `#menucontainer` or has `#menucontainer` as a parent. If it doesn't, you know the click originated from outside of `#menucontainer`, and thus you can hide the menus if they're visible.

### Default Prevented?

About a year ago I start writing an event handling library to help deal with this problem. Instead of stopping event propagation, you would simply mark an event as "handled". This would allow event listeners registered farther up the DOM to inspect the event and, based on whether or not it had been "handled", determine if any further action was needed. The idea was that you could "stop event propagation" without actually stopping it.

As it turned out, I never ended up needing this library. In 100% of the cases I found myself checking to see if the event hand been "handled", I noticed that a previous handler had called `preventDefault`. And the DOM API already provides a way to inspect this: the `defaultPrevented` property.

Let me clarify this with an example. Imagine you're adding an event listener to the document that will use Google Analytics to track when users click on links to external domains. It might look something like this:

```javascript
$(document).on('click', 'a', function() {
  if (this.hostname != 'css-tricks.com') {
    ga('send', 'event', 'Outbound Link', this.href);
  }
});
```

The problem with this code is that not all link clicks take you to other pages. Sometimes JavaScript will intercept the click, call `preventDefault` and do something else. The `data-remote` links described above are a prime example of this. Another example is a Twitter share button that opens a popup instead of going to twitter.com

To avoid tracking these kinds of clicks, it might be tempting to stop event propagation, but inspecting the event for `defaultPrevented` is a much better way.

```javascript
$(document).on('click', 'a', function() {

  // Ignore this event if preventDefault has been called.
  if (event.defaultPrevented) return;

  if (this.hostname != 'css-tricks.com') {
    ga('send', 'event', 'Outbound Link', this.href);
  }
});
```

Since calling `preventDefault` in a link click handler will always prevent the browser from navigating to that link's address, you can be 100% confident that if `defaultPrevented` is true, the user did not go to that address. In other words, this technique is both more reliable that `stopPropagation`, and it won't have any side effects.

## Conclusion

Hopefully this article has helped you think about DOM events in a new light. They're not isolated pieces that can be modified without consequence. They're global, interconnected objects that often affect far more code than you initially realize.

To avoid bugs, it's almost always best to leave events alone and let them propagate as the browser intended.

If you're ever unsure about what to do, just ask yourself the following question: is it possible that some other code, either now or in the future, might want to know that this event happened? The answer is usually yes. Whether it be for something as trivial as a Bootstrap modal or as critical as event tracking analytics, having access to event objects is important. When in doubt, don't stop propagation.
