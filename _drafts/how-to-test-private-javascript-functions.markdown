---
layout: post
title: How to Unit Test 'Private' JavaScript Functions
tags:
- JavaScript
---

JavaScript closures provide an excellent way to keep variables and properties out of the global scope. And this is particularly important in JavaScript because all scripts run in the global scope, so it's quite easy to inadvertently pick the same variable name used by some other library.

The problem, however, is that when functions are hidden inside a closure, they become impossible to test outside of that scope.

Here's an example:

{% highlightjs javascript %}
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
{% endhighlightjs %}

The immediately invoked function expression returns an object that exposes the `bar` function globally, but the `foo` function remains inaccessible to any code not inside the immediately invoked function's scope.

In other words, writing a unit test for `bar` is easy, but writing a unit test for `foo` is impossible. So what can you do? How can you test `foo`?

If you search Stack Overflow for an answer to this question, you'll basically find the following two answers repeated over and over again:

1. Don't test private functions (since they're implementation details)
2. If you must test them, make them public

While these answers may be valid and good advice in some situations, they certainly didn't sit well with me, nor do I think they're true for most situations. Based on my own experience writing JavaScript, I've encountered numerous instances where I wanted to keep a function hidden from the public API but still want it tested.

I believe any real solution to this problem shouldn't require developers to compromise their coding patterns or API designs.

Here is the solution I use today.

## My Solution

Given the nature of JavaScript scoping, we know it's impossible to access local variables from outside of a function closure without a reference to those variables. So any possible solution must do one of two things:

1. Put the test code itself inside the closure
2. Add code inside the closure that stores references to the local variables on existing objects in the outer scope.

Option one is not really a good solution because you usually want to keep all of your test code together in the same place. Mixing your tests with the production code would make it significantly harder to maintain and organize.

Option two, however, defeats the whole purpose of encapsulating the code in the first place.

But what if there were a way to use option two conditionally? What if we could write code inside a closure that gives our tests access to the private variables and function, but then remove that code when we deploy to production?

If you're using a build system, you can do exactly that.

### Different Builds for Testing and Production

Consider the above myModule example with the following code additions (highlighted)

{% highlightjs javascript %}
var myModule = (function() {

  function foo() {
    // private function `foo` inside closure
    return "foo"
  }

  return {
    **/* test-code */**
    **foo: foo,**
    **/* end-test-code */**
    bar: function() {
      // public function `bar` returned from closure
      return "bar"
    }
  }
}())
{% endhighlightjs %}

As you can see, the above changes exposes the `foo` function on the module, but do so in a way that can be easily identified and stripped out later.

The strategy here is to write you code exactly how you'd like it to appear when released, then add on whatever bridge code you need to expose the parts you want to test. The added-on code can be as messy or hacky as you need because it'll get striped out later.

### An Example Implementation

If you're already using a build system (which I highly recommend), adding an extra step to strip out test-only code blocks is relatively easy. Below is an example of how you could implement this using [GruntJS](http://gruntjs.com/).

First, add your project specific data to the `initConfig` object:

{% highlightjs javascript %}
grunt.initConfig({
  // ... other config data above ...
  "strip-test-code": {
    options: {
      // a RexExp to match your code block's start and end comments
      pattern: /[\t ]*\/\* test-code \*\/[\s\S]*?\/\* end-test-code \*\/[\t ]*\n?/
    },
    dist: {
      // a list of files you want to strip code from
      files: "dist/*.js"
    }
  }
})
{% endhighlightjs %}

Next, register a custom task:

{% highlightjs %}
grunt.registerMultiTask(
  "strip-test-code",
  "Removes test-only code blocks.",
  function() {
    // get an array of files to check
    var files = grunt.file.expand(this.data.files)
      , pattern = this.options().pattern
    // loop through each file
    files.forEach(function(file) {
      var contents = grunt.file.read(file)
      if (pattern.test(contents)) {
        // do the replacement
        contents = contents.replace(pattern, "")
        grunt.file.write(file, contents)
        // Print a success message.
        grunt.log.writeln("Removed test code from " + file)
      }
    }
  )
})
{% endhighlightjs %}

Finally, add your new task to the deploy step (making sure not to add it to the testing step):

{% highlightjs javascript %}
grunt.registerTask("test", ["concat", "jshint", "jasmine"])
grunt.registerTask("deploy", ["concat", **"strip-test-code"**, "jshint", "uglify"])
{% endhighlightjs %}

Now, when you test your code those test-only blocks will be in the source like you want, but they'll be stripped out when you deploy to production.

That means you can still maintain 100% test coverage without sacrificing your code structure or design.

It's the best of both worlds.