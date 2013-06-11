---
layout: post
title: "Introducing HTML Inspector"
date: 2013-06-05 20:56:03
tags:
- HTML
- JavaScript
---

Web browsers are incredibly forgiving of the HTML you give them. Missing attributes, misspelled tags, illegal characters, it doesn't matter. They'll bend over backwards to make it work.

This leniency has led a lot of people to believe that proper HTML doesn't matter. At least not nearly as much as the rest of the development process.

But good HTML means so much more than just valid markup.

Good HTML is good because it provides meaning to your content and structure to your CSS. It interacts predictably with your APIs and conforms to your established conventions. It's easy to maintain and easy to scale as your application grows. In short, good HTML makes your life as developers easier, not harder.

[HTML Inspector](https://github.com/philipwalton/html-inspector) aims to help you and your team write the kind of markup you *want* to be writing. It's a code quality tool that is completely customizable, so you can take what you like and change what you don't. It's also extensible and pluggable, making it possible to write your own rules that enforce your chosen conventions.

In this article I'll try to answer some basic questions you may be asking: How does HTML Inspector work? Why should I use it? And how is it different than what's already out there?

If you want to learn more about [configuring HTML Inspector](https://github.com/philipwalton/html-inspector#configuring-html-inspector) or how to [write you own rules](https://github.com/philipwalton/html-inspector#writing-your-own-rules), please check out the [Github repo](http://philipwalton.github.io/html-inspector).

## How it Works?

HTML Inspector traverses the DOM and emits events as it goes. Developers can then write rules that listen for those events, test for certain conditions, and report errors when something unexpected is found.

The simplest way to see HTML Inspector in action is to download the source code and run it on one of your pages. HTML Inspector's only dependency is jQuery, so if you're not already loading that, you'll need to.

To add HTML Inspector to a page and run it with the default rules and configurations, simply add the following lines right before the closing `</body>` tag, and check out the warnings in the console:

{% highlightjs xml %}
<!-- Include jQuery if it's not already loaded -->
<script src="path/to/html-inspector.js"></script>
<script> HTMLInspector.inspect() </script>
{% endhighlightjs xml %}

Here's some sample output from a test I put together:

[![Sample HTML Inspector Output]({{ '/assets/images/html-inspector-console.png' | absolute }})]({{ '/assets/images/html-inspector-console.png' | absolute }})

If you disagree with any of the warnings you see or want to log the errors somewhere other than the console, remember that everything in HTML Inspector is customizable. You can choose what rules to run, what options they're run with, and how the errors are reported.

## How is HTML Inspector different than the W3C Validator?

Though they may seem similar, HTML Inpsector and the [W3C validator](http://validator.w3.org/) are actually completely different tools.

The W3C validator is uncompromisingly strict, and none of its warnings can be customized or surpressed. Maybe you're intentionally writing invalid markup, or maybe you only want the build to go red for particular errors. With the W3C validator, that's just not possible.

Moreover, the W3C validator cannot be extended. It allows for testing HTML against the specification an no more. If you want to enforce your conventions or markup style with a test, the W3C validator isn't for you.

Finally, the W3C validator parses static markup while HTML inspector runs on live DOM in the browser. The benefit of running on live DOM is you get to run your tests after the browser has parsed the HTML and after any JavaScript has altered it. This is particularly important these days as much of the HTML you encounter has been altered by jQuery plugins or client-side templating engines.

## Why Should I Use It?

The best reason to use HTML Inspector is that it can't hurt; it can only help.

Since HTML Inspector is only intended to run in development and test environments, it won't add weight to your production code. And it only reports the errors you want to know about, so it won't clutter your logs with unnecessary information.

Writing markup with a consistent style across a large team is not easy. And if your organization has many agreed-upon conventions, HTML Inspector rules will help interns and new hires learn those conventions and prevent them from debasing your codebase.

Finally, even if you're not interested in customizing HTML Inspector or writing your own rules, the built-in validations are a great sanity check and can help prevent common mistakes. They're also regularly updated to the latest published version of the HTML specification (currently [5.1](http://www.w3.org/TR/html51/)), so, if nothing else, using HTML Inspector will keep you apprised of newly deprecated elements or attributes.

## What Kinds of Custom Rules Should I Write?

The ability to write custom rules that plug into HTML Inspector is probably its most powerful feature. Unfortunately, custom rules requires a little work on your part in order to reap their benefit.

If you're not sure what kinds of custom rules to write, here's a list of suggestions to help get the ball rolling.

### Keeping Conventions

Most projects like to enforce certain naming conventions and keep them consistent throughout the site. If you have project-wide naming conventions for classes, IDs, or attributes, that's a perfect opportunity for a custom rule.

For example, perhaps you want all your class and attribute names to use dashes instead of underscores or camelCase. You could simply tell all your engineers about this convention, but as your team grows and new hires are on-boarded, surely someone is going to get it wrong. Wouldn't it be better if they received a warning when that code was checked in?

Another example is data attributes. To avoid conflicts with third party libraries, many teams require data attributes to be prefixed with a namespace. If such a convention exists, there should be a rule for it and an error when the convention is broken.

### HTML5 Element Usage

HTML5 elements are becoming more and more common in the wild, but a lot developers don't know or don't care about their semantic meaning or their proper usage. If you care, then you should write some rules to warn developers when they may be using HTML5 elements incorrectly.

An easy example of this is the HTML5 `<section>` element. The [spec warns](http://drafts.htmlwg.org/html/master/sections.html#the-section-element) that `<section>` is not simply a generic container; instead, it should only be used when its contents belong in the [document outline](http://drafts.htmlwg.org/html/master/sections.html#outline). A good test for proper usage of the `<section>` element is to check if the section contains a heading. If not, maybe it should simply be a `<div>`.

In other cases, HTML5 elements aren't used but perhaps should be. An example would be finding an unordered list of links not contained in a `<nav>` element, or a date or time value not contained in a `<time>` element.

These types of rules are somewhat subjective and probably wouldn't make sense to impose on the general public, but they're really good for individual teams that want to make better use of HTML5 semantics.

### CSS Testing

HTML Inspector runs in the browser, which means it has access to things like `window.getComputedStyle()`. This allows you to test that your component styles haven't been overridden by other, more specific, CSS rules.

For example, imagine you've defined a `button` class that's used to make all `<a>`, `<button>` and `<input>` elements containing the `button` class look the same. As part of `.button`'s style declaration you include `text-decoration: normal` to prevent text underlines when used on hyperlinks.

However, what if another developer comes along later and adds the following rule:

{% highlightjs css %}
a:link {
  text-decoration: underline;
}
{% endhighlightjs %}

Since `a:link` is more specific than `.button`, your hyperlinked buttons will now contain a text underline, and you may not discover it until it's too late.

You could use `!important` on your `.button` declaration to ensure it won't have an underline, but even that is not 100% foolproof. Besides, why be more specific than you have to when an HTML Inspector test can tell you when your components aren't being rendered as they should.

### Accessibility Testing

It's important to ensure that your website is accessible for people with disabilities. You can make your markup accessible by using proper ARIA and role attributes, but you can also do really basic things like making sure the text is legible to people who might not have a young designers eyesight. Things like using a large enough text size or a high enough [contrast ratio](http://www.w3.org/WAI/eval/preliminary.html#contrast) are simple to implement and easy to test for.

In fact, the Web Accessibility Initiative lays out a lot of [easy ways](http://www.w3.org/WAI/eval/preliminary.html) to make sure your site is accessible to people with disabilities. Many of these could be HTML Inspector rules.

## What's Next

HTML Inspector is new and has a lot of room to grow. The plan for the near future is to expand the ruleset and possibly even create a repository of user submitted rules. If certain rules grow in popularity, who knows, they may even lead to new best-practices.

My vision for HTML Inspector is to make it a reflection of the wider conventions of Web community. If you've created rules that work well for you or your team, please suggest them and contribute back so others can benefit.

If you want to get started using HTML Inspector, please see the [getting started](https://github.com/philipwalton/html-inspector#getting-started) guide or the [API documentation](#).