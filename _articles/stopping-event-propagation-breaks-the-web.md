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

In the bad old days of JavaScript, it was common for both developers and library authors to modify the prototypes of built in object. At first this wasn't a big deal, but as sites started using more and more third party JavaScript, it became a nightmare. When two libraries both define `Object.prototype.someMethod` to work in incompatable ways, it leads to some pretty nasty bugs.

In this article I'm going to argue that preventing events from propagating up the DOM is an equally bad practice. In both cases you're altering global variables; you're changing the expected behavior in a way that other code can't possibly predict or defend against.

This problem is maginifed by the fact that event delegation is rapidly becoming the norm. More and more libraries are just listening to events registered on the document, and every time you stop an event from propagating up the DOM, you run the risk of breaking something.

And trust me, bugs that result from events not firing when you expect are some of the hardest to track down.

**Note:** If you don't much about DOM events and how they propagate, this article probably won't make much sense to you. I'd recommend reading up on them before continuing.

- [Wikipedia: DOM Events](http://en.wikipedia.org/wiki/DOM_events)
- [Quirksmode: JavaScript Event Order](http://www.quirksmode.org/js/events_order.html)
- [W3C: DOM Event Flow](http://www.w3.org/TR/DOM-Level-3-Events/#event-flow)

## What Can Go Wrong?

I'm sure some of the people reading this article will simply take my word for it, but in case you need more convincing, let me give you a real-life example.

Consider [Bootstap](https://github.com/twbs/bootstrap) and [Ruby on Rails](). Bootstrap is the most popular front-end framework on Github, and Rails is the most popular back-end framework. Rails ships with a JavaScript library called [jquery-ujs](https://github.com/rails/jquery-ujs), and, at the time of this writing, both jquery-ujs and Bootstrap stop event propagation in some of their event handlers.

The following example doesn't load run any custom JavaScript whatsoever, it simply loads Bootstrap and jquery-ujs on the page and lets them do their thing.

The example includes two Bootstrap dropdown menus, a plain old link, and a Rails-style `data-remote` link.

Normally, when you open a Bootstrap dropdown menu, clicking anywhere else on the page will close it. But if you open the dropdown and then click on the link called "Remove Link", you'll see that nothing happens.

<div class="CodepenContainer">
  <div class="codepen" data-height="250" data-slug-hash="KzHjc" data-default-tab="result"></div>
</div>

This happens because `data-remote` links stop event propagation, which prevents Boostrap's normal dropdown closing code from running. Thus, the bug.

Now, both Bootstrap and jquery-ujs are extremely well tested libraries, and, by themselves, they work great. The point I'm trying to make is not that these libraires are bad; I'm simply showing that when you change the default paradigm, you run the risk of breaking code that depends on that paradigm.

## Why Do People Stop Event Propagation?

If stopping event propagation is so bad, then why do so many people do it?

### The Internet Told Me To

If you've done any web programming, chances are you've had to solve the issue



chances are at some point you've had to solved one of the classic web problems: how do you detect when a users has clicked outside of an element? This problem usually comes about because you've created some sort of pop-up or dialog that a user can interact with. And if the user clicks outside of the pop-up or dialog, you want to hide it.

You probably thought to yourself: *surely this is a problem someone else has already solved, let me Google it and see*. Open Googling this problem you probably found the following question on Stack Overflow: [How to detect a click outside an element?](http://stackoverflow.com/questions/152975/how-to-detect-a-click-outside-an-element)

If you were judging these answers base solely on their simplicity and number of up-votes, there's a clear winner. Unfortunately, sometimes the most popular advice is really bad advice.

###  Performance

Back in the days of IE6 and other terribly slow browsers, a complicated DOM could really slow down your site. And since events travel through all of the DOM nodes, the more DOM there is the slower everying goes.

Peter Paul Koch of Quirksmode.org recommended this practice in an old article on JavaScript events:

> &hellip; usually you want to turn all capturing and bubbling off to keep functions from interfering with each other. Besides, if your document structure is very complex (lots of nested tables and such) you may save system resources by turning off bubbling. The browser has to go through every single ancestor element of the event target to see if it has an event handler. Even if none are found, the search still takes time.

With today's modern browsers, however, there is essentially no noticeable performance gain by stopping event propagation. Unless you absolutely know what you are doing and very strictly control all the code on your pages, I do not recommend doing this.

### Return false

Perhaps the most common reason people stop event propagation is by accident. Whenever you return false form an event handler you stop propagation and prevent the browsers default behavior from happening.

Returning false is basically the same as:

```javascript
event.preventDefault();
event.stopPropagation();
```

I'd recommend never returning false from any event handler.

**Note:** If you use CoffeeScript (which automatically returns the last expression) make sure you don't end your event handlers with anything the evaluates to `false`.
