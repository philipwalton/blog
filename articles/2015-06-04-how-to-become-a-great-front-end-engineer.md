---
template: article.html
title: "How to Become a Great Front-End Engineer"
date: 2015-06-04T18:09:12-07:00
---

I recently received an email from a reader of my blog that, for whatever reason, really got me thinking. Here's what it said:

> Hi Philip, is it okay to ask how you become a great front-end engineer?<br>
> Any advice?

First of all, I was surprised to even be asked this question since I've never really thought of myself as a "great" front-end engineer. In fact, the first few years I worked in this industry, I honestly don't think I was qualified for any of the jobs I had. I was only able to get them because the people interviewing me didn't really know what to ask, and I didn't realize just how little I knew.

That being said, I ended up doing very well in each of these roles and became a valued member of the team. When I eventually left (for the next challenge I was also not qualified for) I was usually tasked with hiring my replacement. Looking back on how I approached these interviews, I'm struck by how much emphasis I placed on knowledge&mdash;despite lacking in that area when I started. My current self probably wouldn't have hired my former self, even though I knew from personal experience that success was possible.

The longer I work on the web, the more I realize that what separates the good people from the really good people isn't what they know; it's how they think. Obviously knowledge is important&mdash;critical in some cases&mdash;but in a field that changes so quickly, how you go about acquiring that knowledge is always going to be more important (at least in the long term) than what you know at any given time. And perhaps most important of all is how you use that knowledge to solve everyday problems.

There are plenty of articles out there that talk about the languages, frameworks, and tools you need to know to get a job. I wanted to take a different approach. In this article I'm going to talk about the mindset of a front-end engineer, and hopefully give a more lasting answer to the question: *how do you become great?*

## Don't just solve problems, figure out what's really going on

Too many people who write CSS and JavaScript tinker until they find something that works, then they just move on. I know this happens because I see it all the time when doing code reviews.

I'll frequently ask someone: "Why did you add `float: left` here?" or "is this `position: relative` really necessary?", and they'll respond: "I don't know, but if I remove it, it doesn't work".

The same is true of JavaScript. I'll see a `setTimeout` that seems to serve no purpose, or someone using the `=>` function syntax because they're sick of dealing with bugs from `this` not being what they expect.

I get that there are times when you need something that works, and you need it now. But if you never take the time to understand the root of the problem, then you'll find yourself in this same situation over and over again.

Taking the time to figure out *why* your hack works may seem costly now, but I promise it'll save you time in the future. Having a fuller understanding of the systems you're working within will mean less guess-and-check work going forward.

## Learn to anticipate future changes to the platform

One of the main differences between front and back-end code is back-end code generally runs in an environment that is completely under your control. The front end, by contrast, is completely outside of your control. The user's platform or device could completely change at any moment, and your code needs to be able to handle it gracefully.

I remember reading the source code of a popular JavaScript framework back in 2011 and seeing the following line (changed for simplicity):

```js
var isIE6 = !isIE7 && !isIE8 && !isIE9;
```

In this case IE6 was the catchall for IE versions, presumably to make things like IE 5.5 work, but at soon as IE10 came out, large portions of our application were completely broken.

I understand that in the real world feature detection doesn't work 100% of the time, and sometimes you have to depend on buggy behavior or whitelist browsers whose feature detects erroneously return false positives (or negatives), but any time you do this it's absolutely critical that you anticipate the almost-certain future where these bugs no longer exist.

For many of us, most of the code we write will outlive our tenure at our current jobs. Some of the code I wrote more than 8 years ago is still running on websites today, a thought that is both satisfying and terrifying.

## Read other people's code

Reading other people's code, for fun, is probably not your idea of a fun Saturday night, but it's without a doubt one of the best ways to become a better developer.

Solving problems on your own is a great way to learn, but if that's all you ever do, you'll plateau pretty quickly. Reading other people's code opens your mind to knew ways of doing things. In addition, the ability to read and understand code you didn't write is essential to working on a team or contributing to open source projects.

## Read the specs

There will always be browser bugs, but when two browsers render the same code differently, people will often assume, without checking for themselves, that the so-called "good" browser is right and the "bad" browser is wrong. But this isn't always the case, and when you're wrong about this assumption, whatever workaround you choose will almost certainly break in the future.

If you take the time to understand what's supposed to happen and write your code with that in mind, your workaround will be far more future-proof.

In addition, so-called "great" front-end engineers are often the people on the forefront of change, adopting new technologies before they're mainstream and even contributing to the development of these technologies. If you cultivate your ability to look at a spec and imagine how a technology will work before you can play with it in a browser, you'll be part of a select group who is able to talk about and influence the development of that spec.

## Work with people smarter than you

I don't have any evidence to back this up, but my impression is there are a lot more front-end developers who aspire to freelance full time (or otherwise work by themselves) than there are back-end developers with the same goal.

Perhaps its because front-end developers tend to be self-taught and back-end developers tend to come from academia (again, a claim I have no evidence to back up, but it seems to be true).

The problem with being both self-taught and also working for yourself is you generally don't get the benefit learning from people smarter than you. You don't have anyone to bounce ideas off of or review your code.

I strongly recommend, for at least the beginning part of your career, that you work on a team, specifically a team of people who are smarter and more experienced than you.

And if you do end up working for yourself at some point in your career, make a point of becoming (or staying) involved in open source. Actively contributing to open-source projects gives you much of the benefits of working on a team, sometimes more.

## Reinvent the wheel

Reinventing the wheel is bad for business, but it's great for learning. jQuery probably makes you far more productive that you were without it, but imagine how much more you'd learn trying to make your own version.

Don't take this too far though, as well-established libraries have the advantage of years of bug reports and test cases you're completely unaware of.

If you want to work on something but don't have any idea what to build, why not try rebuilding an open-source library that already exists? And if at any point you get stuck, you've got the solution right there.

## Write about what you learn

Last but certainly not least, you should write about what you learn. There are so many good reasons to do this, but perhaps the best reason is it forces you understand the topic better. If you can't explain how something works then there's a decent chance you don't fully understand it. And often times you don't realize you don't fully understand it until you try to explain it to someone else.

In my experience, writing, giving talks, and creating demos has been one of the best ways to force myself to dive in and fully understand a subject, inside and out.

Even if no one ever reads what you write, the process of writing it down is more than worth it.
