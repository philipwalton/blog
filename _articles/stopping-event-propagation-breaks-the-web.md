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

Imagine you have a leaky shower in your bathroom that desperately needs fixing. You search online to see if you can stop the leak yourself, and the top rated advice tells you to seal off the pipe that leads to the shower. So you get out your tools, seal the pipe, and sure enough it works!

Sounds crazy, right? Obviously the water in your bathroom needs to continue on, perhaps to the kitchen or the laundry room. Stopping it might fix one problem, but it will most likely create more down the road.

This story might seem a bit unrealistic, but the truth is we developers do stuff like this all the time. We solve a problem with a quick and dirty solution without thinking of its larger consequences.

One example of this I see far too often is developers unnecessarily stop event propagation.

## Event Propagation

Like a lot of things in JavaScript, DOM events are global. And as most people know, global variables make for messy, coupled code.

Modifying the state or the behavior of a global variable might not seem like a big deal, but as developers depend more and more on third-party libraries (i.e. code they didn't write), altering global state and changing the expected behavior can lead to some disasterous bugs. Bugs that are impossible to defend against and a nightmare to track down.

When you stop an event from propagating up to the document, you're changing the game in a way that libraries authors can't predict or defend against. This problem is maginifed by the fact that event delegation is rapidly becoming the norm. More and more people are just listening for events on the document, so every time you stop an event from propagating up the DOM, you're potentially breaking someone else's code (or your own).

## What Can Go Wrong?

I imagine most people who've read this far have encountered this problem themselves. But in case you haven't, let me show you how easy it is to create a `stopPropagation` bug using two of today's most popular frameworks: [Bootstap](http://getbootstrap.com/) and [Rails](http://rubyonrails.org/).

Bootstrap and Rails both come pre-packaged with JavaScript plugins. In the following example, Rails' [jquery-ujs](https://github.com/rails/jquery-ujs) library, which allows Rails to declaratively add remote ajax calls to links via the `data-remote` attribute, is preventing Bootstrap's dropdown menus from properly hiding.

See for yourself:

<div class="CodepenContainer">
  <div class="codepen" data-height="250" data-slug-hash="KzHjc" data-default-tab="result"></div>
</div>

The [JavaScript code](https://github.com/twbs/bootstrap/blob/v3.1.1/js/dropdown.js#L141-L142) that is responsible for closing the dropdown menu is listening for click events on the document. But since jquery-ujs stops event propagation, that code doesn't get run for those clicks.

The worst part about this bug is that there's absolutely nothing Bootstrap can do to prevent it from happening. If you're writing code that deals with the DOM, you're always at the mercy of the other code running on the page. Such is the nature of global variables.

I'm not trying to pick on jquery-ujs, I just happen to know this problem exists because I [encountered it myself](https://github.com/rails/jquery-ujs/issues/327) and had to work around it. In truth, tons of other libraries stop event propagation (including Bootstrap) and it's often recommend in the highest voted answers on Stack Overflow.

## But the Internet Told Me to Do It

The dropdown example I showed above is great because its a classic problem most web developers have faced at some point in their career. It's easy to control an element with you click on it, but how do you know when you don't click on an element?

To answer this question, most people turn to Google.

If you do a quick search for a solution to this problem, you'll probably find this Stack Overflow question: [How to detect a click outside an element?](http://stackoverflow.com/questions/152975/how-to-detect-a-click-outside-an-element).

I've reprinted the answer here for convenience:

```javascript
$('html').click(function() {
  // Hide the menus if visible.
});

$('#menucontainer').click(function(event){
  event.stopPropagation();
});
```

The above code basically says: If a click event propagates to the `<html>` element, hide the menu. If the click originated inside `#menucontainer`, stop the event so it never reaches `<html>`, thus only clicks outside of `#menucontainer` will close it.

This is really, really terrible advice. It completely ignores the possibility that any other code could be running on the site that needs to detect click events. Unfortunately, it's the most upvoted answer, so this is what a lot of people do.

###  Performance

Back in the days of IE6 and other terribly slow browsers, a complicated DOM could really slow down your site. And since events travel through all of the DOM nodes, the more DOM there is the slower everying goes.

Peter Paul Koch of Quirksmode.org recommended this practice in an old article on JavaScript events:

> usually you want to turn all capturing and bubbling off to keep functions from interfering with each other. Besides, if your document structure is very complex (lots of nested tables and such) you may save system resources by turning off bubbling. The browser has to go through every single ancestor element of the event target to see if it has an event handler. Even if none are found, the search still takes time.

With today's modern browsers, however, there is essentially no noticeable performance gain from stopping event propagation. Unless you absolutely know what you are doing and very strictly control all the code on your pages, I do not recommend this approach.

### Return false

Perhaps the most common reason people stop event propagation is by accident. Whenever you return false form an event handler you stop propagation and prevent the browsers default behavior from happening.

Returning false is basically the same as:

```javascript
event.preventDefault();
event.stopPropagation();
```

I'd recommend never returning false from any event handler.

**Note:** If you use CoffeeScript (which automatically returns the last expression) make sure you don't end your event handlers with anything the evaluates to `false`.

## What To Do Instead

As a general rule of thumb, you should never stop an event from propagating unless you actually do not want the event to occur. Most of the time, however, people stop events because they do not want the handlers registered for an event to occur. There's a big difference.

Never stop an event from propagating because you won't want to run a handler. Instead, that logic within that handler needs to be responsible for determining what actions need to be taken.

To put that another way (and to once again reference the click outside example above), if you want to determine if a click happened outside of an element, you should register an event handler on the document, and within that handler's logic, inspect the event's target and see if it is a child of the element in question.

Here's how you might do that using jQuery:

```javascript
$(document).on('click', function(event) {
  if ($(event.target).closest('#menu').length) {
    // This runs when the click was on or inside #menu
  } else {
    // This runs when the click was outside #menu
  }
})
```

This is simple enough to do without jQuery as well, but the implementation is not important. The point is that to keep your code decoupled and encapsulated, you shouldn't be altering the global state just for the sake of simplifying the logic of your event handler.

## Is It Ever Okay to Stop Event Propagation?

I mentioned above that you should never stop an event from propagating just because you don't want some event handler to run. The only time you should ever stop an event from propagating is if you want to make it like the event never happened in the first place.

An example of that could be a situation where you've displayed a modal dialog on the page and set focus on the "OK" button of the dialog. If you user tries to click outside of the dialog at other links on the page or tries to use the tab key to escape the dialog, it's probably best to completely block those events. If you want to make it impossible to interact with the page outside of the dialog, it's perfectly reasonable to stop those events fro propagating, but that is a very different situation from simply not wanting to logic to run.

To reiterate the rule, stopping propagation is OK to stop events, not to stop event handlers. Event handlers should be responsible for determining whether or not to run on their own.

## Prevent Default

Frequently an event handler will stop event propagation because it doesn't want a subsequent event handler to do something it shouldn't. Consider the following event handler that uses Google Analytics to track when your visitors click links to external domains:

```javascript
$(document).on('click', 'a', function() {
  if (this.hostname != 'css-tricks.com') {
    ga('send', 'event', 'Outbound Link', this.href);
  }
})
```

But perhaps you have a tweet button that gracefully degrades to an external link but actually performs as a button. Maybe you want to track that separately and don't want it considered as an external link.

Instead of using stop propagation on the tweet button to avoid the Google Analytics tracking, you should instead be checking for whether or not another handler called `preventDefault`.

In order for the tweet button handler to avoid following the link, it must have called `event.preventDefault`. In the Google Analytics handler you can check for that and only track links when default has not been prevented.

```javascript
$(document).on('click', 'a', function() {
  // Ignore this event if preventDefault has been called.
  if (event.defaultPrevented) return;

  if (this.hostname != 'css-tricks.com') {
    ga('send', 'event', 'Outbound Link', this.href);
  }
})
```

I see very little code written that uses the `event.defaultPrevented` check, but it's actually quite useful. Almost all cases that I see using `stopPropagation` could be rewritten to use `defaultPrevented` in another handler.

Be warned, though, that you shouldn't use `preventDefault` just to mark an event as "handled". You should only use `preventDefault` if you want to avoid invoking the browsers default behavior for the event.

## Conclusion

Pretty much everything I've said so far could be summed up with a few simple rules of thumb. Treat events as global variables. Don't alter them unless you really want them to be altered globally, for all other code on the site. Event handler logic should be limited in scope and should not depend on other event handlers to work.

When stated like this it seems rather obvious, but a surprising amount of code is not written with consideration for what other code may also be running on the page.
