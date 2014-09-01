<!--
{
  "layout": "article",
  "title": "How to Unit Test Private Functions in JavaScript",
  "date": "2013-07-08T23:28:18-07:00",
  "tags": [
    "JavaScript"
  ],
  "excerpt": "JavaScript's closures provide an excellent way to make variables and functions private, keeping them out of the global scope"
}
-->

<div class="Callout">
  <p><strong>Update:</strong> A lot of readers have commented or tweeted that I shouldn't be unit testing private functions in the first place. Admittedly, this article is a little light on the <em>why</em> and mainly focuses on the <em>how</em>.</p>

  <p>To explain some of my rationale, I wrote a follow-up article: <a href="/articles/why-i-test-private-functions-in-javascript/">Why I Test Private Functions In JavaScript</a></p>
</div>

JavaScript's closures provide an excellent way to make variables and functions private, keeping them out of the global scope. This is particularly important in the browser because all scripts share the same scope, and it's quite easy to inadvertently pick a variable or function name used by another library.

The problem, however, is that when functions are hidden inside a closure, it's very difficult to test them.

Here's an example:

```javascript
var myModule = (function() {

  function foo() {
    // private function `foo` inside closure
    return "foo"
  }

  return {
    bar: function() {
      // public function `bar` returned from closure
      return "bar"
    }
  }
}())
```

The immediately invoked function expression returns an object that exposes the `bar` function globally, but the `foo` function remains inaccessible to any code not appearing inside the immediately invoked function.

In other words, given the above code, writing a unit test for `bar` is easy, but writing a unit test for `foo` is impossible. So what can you do? How can you test `foo`?

If you search Stack Overflow for a solution to this problem, you'll basically find the following two suggestions repeated over and over again:

1. Don't test private functions (since they're implementation details)
2. If you must test them, make them public

Personally, I don't agree with these statements.

While they may apply to some contexts, they certainly don't make sense for every project. And from my own experience writing JavaScript, I've encountered numerous situations where I needed to test a function but still wanted it hidden from the public API.

I believe any real solution to this problem shouldn't require developers to compromise their design patterns for the sake of testing, nor should it require lesser test coverage just to produce a nicer API. We should be able to have it both ways.

Below is the solution I use that I think handles these issues quite nicely.

## My Solution

Given the nature of JavaScript scoping, we know it's impossible to access local variables from outside of a function closure without a reference to those variables. So any possible solution must do one of two things:

1. Put the test code itself inside the closure
2. Add code inside the closure that stores references to the local variables on existing objects in the outer scope.

Option one is not really a good solution because you usually want to keep all your test code together in the same place. Mixing your tests with the production code would make it significantly harder to maintain and organize.

On the other hand, option two kinda defeats the purpose of encapsulating the code in the first place.

But what if there were a way to use option two conditionally? What if we could write code inside a closure that gives our test code access to the private functions we care about, but then remove that code when we deploy to production?

If you're using a build system, you can do exactly that.

### Different Builds for Testing and Production

Consider the above myModule example with the following code additions (changes highlighted):

```javascript
var myModule = (function() {

  function foo() {
    // private function `foo` inside closure
    return "foo"
  }

  var api = {
    bar: function() {
      // public function `bar` returned from closure
      return "bar"
    }
  }

  **/* test-code */**
  **api._foo = foo**
  **/* end-test-code */**

  return api
}())
```

As you can see, the above changes expose the `foo` function on the module, but do so in a way that can be easily identified by the surrounding comments and stripped out later.

The strategy here is to write your code exactly how you'd like it to appear when released, then add on whatever bridge code you need to expose the parts you want to test.

### An Example Implementation

Assuming you're already using a build system (if you're not I highly recommend doing so), adding an extra step to strip out test-only code blocks is relatively easy. Below is an example of how you could implement this using [GruntJS](http://gruntjs.com/) and the [grunt-strip-code](https://github.com/philipwalton/grunt-strip-code) plugin.

First, make sure to add the task as a dependency to your project:

```bash
npm install grunt-strip-code --save-dev
```

Then enable it inside your Gruntfile:

```javascript
grunt.loadNpmTasks('grunt-strip-code');
```

Next, add your project specific data to the `initConfig` object:

```javascript
grunt.initConfig({
  strip_code: {
    options: {
      start_comment: "test-code",
      end_comment: "end-test-code",
    },
    your_target: {
      // a list of files you want to strip code from
      src: "dist/*.js"
    }
  }
})
```

Finally, add your new task to the deploy step (making sure not to add it to the testing step):

```javascript
grunt.registerTask("test", [
  "concat",
  "jshint",
  "jasmine"
])
grunt.registerTask("deploy", [
  "concat",
  **"strip-code"**,
  "jshint",
  "uglify"
])
```

Now, when you test your code, those test-only blocks will be in the source like you want, but they'll be stripped out when you deploy to production.

That means you can still maintain 100% test coverage without sacrificing your code structure or design.

It's the best of both worlds.

### A Word of Caution

There are a lot of pros to this approach, and I certainly favor it over exposing your private functions in an awkward way or not testing them at all, but there is a downside that you should be aware of.

Anytime you change your code between when it's tested and when it's deployed, you run the risk of missing something. If you weren't careful and part of your library depended on the code you removed, your library would break in production, and you might not know about it until long after it shipped.

Luckily, there are two relatively simple strategies to help prevent this. The easiest way is to assign your test only functions to an object namespace that is obviously not intended for normal use. For example:

```javascript
/* test-code */
**api.__testonly__.foo = foo**
/* end-test-code */
```

Using a namespace like `__testonly__` not only makes the intent obvious, it also makes it possible to add an additional step to the build process to make sure no `__testonly__` code appears in the final release.

Another strategy is to split your test suite into two phases. The first phase tests the private functions. The second phase strips the code and then tests the public functions. Here's an example of that:

```javascript
grunt.registerTask("test", [
  "concat",
  "jshint",
  **"jasmine:private"**,
  **"strip-code"**,
  "jshint",
  **"jasmine:public"**
])
```

Though not always possible (depending on your test setup), this is probably the safest method as it still tests the public API after stripping out the test-only code.

These two strategies may not be necessary if you're the only developer or working on a small team, but the more people you have contributing the more caution you'll need to take. Obviously it's up to you to determine the right approach for your situation.

## Conclusion

To summarize, due to the nature of JavaScript it's important to not expose too many variables and functions in the global namespace. Using function closures and the module pattern is a great way to hide functionality, but it also makes it harder to test that functionality.

Even though that code may be an implementation detail, merely testing the public API may not give you the peace of mind you need when making code changes in the future.

Testing your code is important, even if it takes a little bit of extra work. This article shows you how you can use a build system to test your private functions without compromising encapsulation and modularity.