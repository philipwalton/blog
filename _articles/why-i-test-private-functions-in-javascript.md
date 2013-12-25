<!--
{
  "layout": "article",
  "title": "Why I Test Private Functions In JavaScript",
  "date": "2013-07-17",
  "tags": [
    "JavaScript"
  ]
}
-->

Last week I published an article on this blog entitled [How to Unit Test Private Functions in JavaScript](/articles/how-to-unit-test-private-functions-in-javascript/). The article was well received and even mentioned in a few popular newsletters (most notably [JavaScript Weekly](http://javascriptweekly.com/archive/138.html)). Still, a decent amount of the feedback I received in the comments and on Twitter strongly disagreed with my approach. The most common criticism was: unit testing private functions is unnecessary and a mark of bad design.

Admittedly, that article focused too much on the "how" of the technique and not enough on the "why".

In this article I'll try to respond to some of that criticism and go a little deeper into the rationale behind my decisions.

## What I'm Not Saying

When you don't explain your reasons, it's easy for readers to make incorrect assumptions. I definitely didn't explain my rationale nearly enough in the last article, so I suppose I'm mostly to blame.

To help clarify what I *am* saying, I think it would be helpful to start by pointing out what I *am not* saying:

* I'm not saying you should *always* test your private functions.
* I'm not saying you should test *all* of your private functions.
* I'm not saying people who don’t test private functions are doing it wrong.

It's fine if people disagree with me. In fact, I welcome the debate and enjoy hearing counter arguments, especially from developers with a lot more experience. At the end of the day, it's up to each individual to weigh the arguments and make up their own mind.

I just want to make sure we're arguing about the same thing.

## Defining the Terminology: What Does Private Mean In JavaScript?

The title of my previous article used the term "private functions", but if you look at the language used by most of the commenters who disagreed with my approach, they almost all said "private methods".

I'm not pointing this out to be nit-picky or overly technical. I honestly think this fact helps illuminate a disconnect. Perhaps a carryover of general computer science principles applied too liberally to JavaScript.

To avoid confusion, I probably should have titled the article: "How to Test JavaScript Code That's Inside a Closure". After all, that's really what I was talking about.

### JavaScript does not have private methods

Wikipedia defines a <a href="http://en.wikipedia.org/wiki/Method_(computer_programming)">method</a> in computer science as:

> Methods define the behavior to be exhibited by instances of the associated class at program run time. Methods have the special property that at runtime, they have access to data stored in an instance of the class (or class instance or class object or object) they are associated with and are thereby able to control the state of the instance.

By this definition, a method in JavaScript is a function found on the object's prototype chain that can use the `this` context to change or report the state of the instance. But any code with access to an instance variable also has access to that instance's constructor and thus the constructor's prototype.

That means any "methods" on an object must be public to the current scope.

### In JavaScript, Private Simply Means Inaccessible to the Current Scope

Private variables and functions in JavaScript aren't just used to modify or report the state of an instance. They do much more. They could be a helper function, a constructor function; even an entire class or module.

In other words, "private" in JavaScript doesn't necessarily mean "implementation detail". Private simply means the code is not accessible in the current scope.

## Why Do Developers Make Code Private in JavaScript?

Since JavaScript usually runs in the browser and shares the same global scope as all other JavaScript code on the page, most developers wrap their entire library in a closure and only expose the parts they need to.

This is probably the most common reason JavaScript developers make their code private.

In addition, since browser libraries are under tremendous pressure to keep their file size small and their dependency count low, it's quite common for library authors to roll their own implementations of already solved problems.

Most back-end languages have a standard way of including modules, and there is usually little to no performance cost incurred by including a large module and only using a small portion of it. But this is definitely not the case in the browser. Until there is more standardization and consensus around client-side modules and module dependencies, and until more front-end libraries transition from large monolithic frameworks to smaller, single-purpose modules, most browser library authors will continue to operate in this manner.

For example, I'm not going to make Underscore.js a dependency of my library if all I need is `_.debounce()`. I'll just write my own debounce function. And if I write it myself, I'm probably going to want to test it. However, I'm probably not going to want to expose it globally. I mean, why would I expose it when it's just a simple implementation only meant for my particular use case?

Similarly, if my library requires doing only a few basic DOM operations, I'm not going to require all of jQuery, I'll probably just write the needed functions myself. I might even combine them into their own DOM module that perhaps has its own private functions inside the module closure. I may choose not to test the private functions in the module, but I'll definitely want to test the module itself, regardless of whether I choose to expose it globally.

Hopefully the day will come when we have an elegant solution to library dependency management in the browser, but until that day is here, I'm going to continue to write my own simple implementations rather than force my users to add hundreds of kilobytes to their JavaScript footprint.

In any case, my decision as to whether or not to test these implementations should have no bearing on my decision as to whether or not to expose them globally.

## What is the Purpose of Testing?

From [one of the comments](http://philipwalton.com/articles/how-to-unit-test-private-functions-in-javascript/#comment-957687744) on my previous post:

> Unit tests are supposed to test the interfaces to an object without any concern for their implementation.

I fully agree with this statement. And if you're doing traditional TDD, you'll typically write your unit tests first, before you decide how you'll implement a feature. So for true TDD, it's really not possible to test your implementation details since they're undecided at the time you write your tests.

However, this isn't the only reason I test my code. In addition to testing the public API, unit tests are also very useful for catching regression caused by future code changes.

For example, if a test fails and you're only testing functions in the public API, it may be difficult to find out what's causing the failure. If you only have a few private functions it's probably not a big deal, but if you have several self-contained private modules and numerous helper functions, a failing test might not give you any indication as to where exactly the failure is occurring, and it might take a while to track down.

Again, keep in mind that I'm not just talking about private "methods" within a particular module. I'm talking about any code that you've chosen to keep hidden in a closure and you're testing implicitly through the public API, be it functions, modules, classes &mdash; whatever. The more code you keep hidden and don't test explicitly, the harder it is to track down errors when a test fails.

At some point it makes a lot more sense to just test that behavior explicitly.

## A Real-Life Example

My [HTML Inspector](https://github.com/philipwalton/html-inspector) tool illustrates a lot of the points I've made in this post. In fact, it's what prompted me to try to figure out ways to test private code in the first place.

HTML Inspector exposes a single object called `HTMLInspector` in the global scope. The `HTMLInspector` object contains a few public functions, but internally there are a number of modules that I've chosen to keep hidden. Here are the three main hidden modules:

- **Listener**: which implements a basic observable pattern and contains the methods `on`, `off`, and `trigger`.
- **Reporter**: stores the errors reported by the rules and contains the methods `warn` and `getWarnings`.
- **Callbacks**: similar to jQuery's callbacks and contains the methods `add`, `remove`, and `fire`.

Each of these modules is my own implementation of objects I've seen in other libraries. I could have merely used the versions in those libraries, but it was quite easy to implement them myself, and doing so greatly reduces the barrier to entry for my users.

I could have also exposed these modules publicly by adding them to the global `HTMLInspector` object (and originally that's what I did), but in the end I concluded it made much more sense to keep them hidden. After all, there's no real use-case for users of the library to access them directly.

Still, I definitely wanted to test each of the public methods listed above, despite the fact that the modules themselves were private.

To help understand the structure of the library, here's a simplified representation. The "include module" comments represent individual JavaScript files that are inserted at that particular place in the code during a build step:

```javascript
(function(root, document) {

  // include module Listener
  // include module Reporter
  // include module Callbacks

  root.HTMLInspector = {
    somePublicMethod: function() {
      // makes calls to the included modules
    },
    someOtherPublicMethod: function() {
      // makes calls to the included modules
    }
  }
}(this, document))
```

As you can see, the above library includes three self-contained modules, each with their own set of methods. But each of those modules is inside the closure and thus hidden from the global scope.

### Private or Public

If you were writing tests for HTML Inspector, you'd have to make a choice:

- Keep the modules private, don't test them at all, and hope the tests written for the public API provide enough coverage.
- Expose the modules publicly by storing them on the `HTMLInspector` object and test their individual functions that way.

Many people argue that if your code is private it doesn't need to be tested, and if it's so complex that it warrants testing, then it should be made public. But to be honest, that logic seems rather circular to me.

The modules either warrant testing or they don't. And they either should be private or they shouldn't. The two issues are orthogonal.

The decision to make functionality public or private should be purely about program design, encapsulation, and a separation of concerns.

Sometimes, due to language constraints, code *must* be public in order to be tested, but I consider that an entirely different question. Sacrificing API design for testing because of language constraints should be seen as a necessary evil, not as a best-practice.

And taking advantage of tools to mitigate language constraints should be seen as liberating, not as proof of a code smell.

### Not Testing Private Code Doesn't Necessarily Mean Writing Fewer Tests

The HTML Inspector example above has three modules, and each module contains a few functions &mdash; eight in total.

If you were unit testing the module functions directly, you'd likely only need eight tests.

However, if you were testing the module functions indirectly through the public API, you may very well need a lot more tests depending on the complexity of those modules and the sheer number of combinations with which their functions may call each other. In addition, those tests may require a lot more setup and tear down just to get to a state where you could even write your assertions.

In short, if testing just the public API ends up making the tests longer, more complex, and harder to debug regressions, it's no longer a better option.

## Wrapping Up

In JavaScript, developers often hide a lot more than just "methods". Modules, classes, and even entire programs can all be private. In fact, it's not uncommon to see a library that doesn't expose a single global variable.

Due to the nature of the browser environment, code is kept private for a variety of reasons. It's not always simply because that code is an implementation detail.

As a final thought, I understand (and largely agree with) the aversion to testing private methods and the general desire to avoid over-testing. However, I think it's worth putting the whole issue into perspective. Obviously over-testing is something that *is* possible, but in the end it does very little harm. At worst, it may waste some time, but I'd far rather err on the side of over-testing than under-testing.
