I recently received an email from a reader of my blog that, for whatever reason, really got me thinking. Here's what it said:

> Hi Philip, is it okay to ask how you become a great front-end engineer?<br>
> Any advice?

I have to admit, I was surprised to even be asked this question since I've never really thought of myself as a "great" front-end engineer. In fact, the first few years I worked in this industry, I honestly don't think I was qualified for any of the jobs I had. I only applied for them because I didn't realize how little I knew, and I only got them because the people interviewing me didn't know what questions to ask.

That being said, I ended up doing very well in each of these roles and became a valued member of the team. When I eventually left (for the next challenge I was also not qualified for) I was usually tasked with hiring my replacement. Looking back now on how I approached these interviews, I'm struck by how much emphasis I placed on knowledge&mdash;despite lacking in that area when I started. My current self probably wouldn't have hired my former self, even though I knew from personal experience that success was possible.

The longer I work on the web, the more I realize that what separates the good people from the really good people isn't what they know; it's how they think. Obviously knowledge is important&mdash;critical in some cases&mdash;but in a field that changes so quickly, how you go about acquiring that knowledge is always going to be more important (at least in the long term) than what you know at any given time. And perhaps most important of all: how you use that knowledge to solve everyday problems.

There are plenty of articles out there that talk about the languages, frameworks, and tools you need to know to get a job. I wanted to take a different approach. In this article I'm going to talk about the mindset of a front-end engineer, and hopefully give a more lasting answer to the question: *how do you become great?*

## Don't just solve problems, figure out what's really going on

Too many people who write CSS and JavaScript tinker until they find something that works, and then they just move on. I know this happens because I see it all the time during code reviews.

I'll frequently ask someone: "Why did you add `float: left` here?" or "is this `overflow: hidden` really necessary?", and they'll respond: "I don't know, but if I remove it, it doesn't work".

The same is true of JavaScript. I'll see a `setTimeout` being used to prevent a race-condition, or someone stopping event propagation with no regard for [how it will affect](http://css-tricks.com/dangers-stopping-event-propagation/) other event handlers on the page.

I get that there are times when you need something that works, and you need it now. But if you never take the time to understand the root of your problem, you'll find yourself in the same situation over and over again.

Taking the time to figure out *why* your hack works may seem costly now, but I promise it'll save you time in the future. Having a fuller understanding of the systems you're working within will mean less guess-and-check work going forward.

## Learn to anticipate future changes to the browser landscape

One of the main differences between front and back-end code is back-end code generally runs in an environment that's under your control. The front end, by contrast, is completely outside of your control. The platform or device your users have could completely change at any moment, and your code needs to be able to handle that gracefully.

I remember reading through the source code of a popular JavaScript framework back in 2011 and seeing the following line (changed for simplicity):

```js
var isIE6 = !isIE7 && !isIE8 && !isIE9;
```

In this case IE6 was the catchall for IE versions, presumably to handle versions of IE older than 6. But at soon as IE10 came out, large portions of our application completely broke.

I understand that in the real world feature detection doesn't work 100% of the time, and sometimes you have to depend on buggy behavior or whitelist browsers whose feature detects erroneously return false positives (or negatives), but any time you do this it's absolutely critical that you anticipate the almost-certain future where these bugs no longer exist.

For many of us, the code we write today will outlive our tenure at our current job. Some of the code I wrote more than 8 years ago is still running on large, production websites today, a thought that is both satisfying and terrifying.

## Read the specs

There will always be browser bugs, but when two browsers render the same code differently, people will often assume, without checking for themselves, that the so-called "good" browser is right and the "bad" browser is wrong. But this isn't always the case, and when you're wrong about this assumption, whatever workaround you choose will almost certainly break in the future.

A timely example of this is the default minimum size of flex items. According to the [spec](http://www.w3.org/TR/css-flexbox/#min-size-auto), the initial `min-width` and `min-height` value for flex items is `auto` (rather than `0`), which means by default they shouldn't shrink to smaller than the minimum size of their content. For the past 8 months, Firefox was the only browser to implement this correctly.<sup>[[1]](#footnote-1)</sup>

If you encountered this cross-browser incompatibility and noticed that your site rendered the same in Chrome, IE, Opera, and Safari, but looked different in Firefox, you'd probably assume Firefox had it wrong. In fact, I've witnessed this happen a lot. Many of the issues reported on my [Flexbugs](https://github.com/philipwalton/flexbugs) project were actually due to this incompatibility, and the workarounds proposed, if implemented, would have failed two weeks ago when Chrome 44 came out. Instead of these workarounds following the spec, they were unknowingly penalizing good behavior.<sup>[[2]](#footnote-2)</sup>

When two or more browsers render the same code differently, you should take the time to figure out which one of them is correct and write your code with that in mind. Your workarounds will be far more future-proof as a result.

In addition, so-called "great" front-end engineers are often the people on the forefront of change, adopting new technologies before they're mainstream and even contributing to the development of those technologies. If you cultivate your ability to look at a spec and imagine how a technology will work before you can play with it in a browser, you'll be part of a select group who is able to talk about and influence the development of that spec.

## Read other people's code

Reading other people's code, for fun, is probably not your idea of a fun Saturday night, but it's without a doubt one of the best ways to become a better developer.

Solving problems on your own is a great way to learn, but if that's all you ever do, you'll plateau pretty quickly. Reading other people's code opens your mind to new ways of doing things. And the ability to read and understand code that you didn't write is essential to working on a team or contributing to open source projects.

I actually think one of the biggest mistakes companies make when hiring new engineers is they only ask them to write code&mdash;new code, from scratch. I've never been on an interview where I was asked to read some existing code, find the problems with it, and then fix those problems. It's really too bad because most of your time as an engineer is spent adding to or changing an existing codebase. Rarely are you building something new from scratch.

## Work with people smarter than you

I get the impression that there are a lot more front-end developers who want to freelance (or otherwise work full-time by themselves) than there are back-end developers with the same goal. Perhaps it's because front-end people tend to be self-taught and back-end people tend to come from academia.

The problem with being both self-taught and also working for yourself is you generally don't get the benefit of learning from people smarter than you. You don't have anyone to bounce ideas off of or review your code.

I strongly recommend, for at least the beginning part of your career, that you work on a team, specifically a team of people who are smarter and more experienced than you.

If you do end up working for yourself at some point in your career, make a point of becoming (or staying) involved in open source. Actively contributing to open-source projects gives you many of the same benefits of working on a team, sometimes even more.

## Reinvent the wheel

Reinventing the wheel is bad for business, but it's great for learning. You may be tempted to grab that typeahead widget or event delegation library from npm, but imagine how much more you'd learn by trying to build those things yourself.

I'm sure some people reading this article are strongly objecting right about now. Don't get me wrong. I'm not saying you should never use third-party code. Using well-tested libraries that have the advantage of years of test cases and bug reports is almost always the smart thing to do.

But in this article I'm talking about how to go from good to great. Most of the people I consider great in this industry are the creators or maintainers of very popular libraries that I use all the time.

You could probably have a successful career without ever building your own JavaScript library, but you'll probably also never work close enough to the metal to really get your hands dirty.

A common question people ask in this industry is: *what should I build next?*
If you're asking this question, instead of trying to learn a new tool or create some new app, why not try recreating one of your favorite JavaScript libraries or CSS frameworks. The nice thing about doing this is if you ever get stuck, the source code of the existing library will have all the answers for you.

## Write about what you learn

Last but certainly not least, you should write about what you learn. There are so many good reasons to do this, but perhaps the best reason is it forces you to understand the topic better. If you can't explain how something works, there's a decent chance you don't really understand it yourself. And oftentimes you don't realize you don't understand it until you try writing it down.

In my experience, writing, giving talks, and creating demos has been one of the best ways to force myself to dive in and fully understand something, inside and out. Even if no one ever reads what you write, the process of doing it is more than worth it.

<aside class="Footnotes">
  <h1 class="Footnotes-title">Footnotes:</h1>
  <ol class="Footnotes-items">
    <li id="footnote-1">Firefox implemented the spec change in <a href="https://en.wikipedia.org/wiki/Firefox_release_history">version 34</a> on December 1, 2014. Chrome implemented it in <a href="https://en.wikipedia.org/wiki/Google_Chrome_release_history">version 44</a> on July 21, 2015, which means Opera will get it shortly. Edge shipped with this implemented on July 29, 2015. A Safari implementation appears to be <a href="https://bugs.webkit.org/show_bug.cgi?id=136754">in progress</a>.</li>
    <li id="footnote-2">You can refer to <a href="https://github.com/philipwalton/flexbugs#1-minimum-content-sizing-of-flex-items-not-honored">Flexbug #1</a> for a future-friendly, cross-browser workaround to this issue.</li>
  </ol>
</aside>
