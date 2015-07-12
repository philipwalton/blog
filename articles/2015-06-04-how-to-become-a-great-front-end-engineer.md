---
template: article.html
title: "How to Become a Great Front-End Engineer"
date: 2015-06-04T18:09:12-07:00
---

I recently received an email from a reader of my blog that, for whatever reason, really got me thinking. Here's what it said:

> Hi Philip, is it okay to ask how you become a great front-end engineer?<br>
> Any advice?

First of all, I was surprised to even be asked this question since I've never really thought of myself as a "great" front-end engineer. In fact, the first four jobs I had in this industry I was completely unqualified for. I only got them because the people interviewing me didn't know better, and I was good at pretending.

That being said, I ended up doing very well in each of these roles and became a valued member of the team. By the time I eventually left (for the next challenge I was also unqualified for) and was tasked with helping to hire my replacement, I would reflect with slight amusement at the ironic fact that I probably wouldn't have hired my former self. I don't think I would have been able to pass the interviews I was giving.

As I started thinking about this question more and more, I began to realize how lucky I've been. Much of my success is a result of being thrust into situations I had no business being in&mdash;yet still expected to perform. But I don't think it's entirely about being stretched or working hard. Over time I've learned some very important lessons that I'd like to share. Some of these are specific to front-end development, and some are just generally good practices.

I've read a lot of posts over the years discussing what makes a good front-end engineer. They almost entirely focus on what someone needs to know&mdash;frameworks, tools, etc.&mdash;so I wanted to take a different approach.

If my experience is any indication, then what you know is not always as important as how you think. In this article I'm going to give my opinion on the mindset that makes a front-end engineer great.

## Don't just solve problems, figure out what's really going on

Too many people who write CSS and JavaScript tinker until they find something that works, then they just move on. This sometimes gets the job done, but it doesn't increase your knowledge or improve your craft.

In CSS you see this a lot with the excessive use of floats. Floating an element will stop its margins from collapsing and it will clearfix its floated children. If you don't understand how these things works, but you discover that adding `float: left` fixes your immediate problem. It's probably tempting to just leave it and move on.

In JavaScript you see this with the excessive use of function binding, or adding a `setTimeout` call for no reason other than that, without it, your code doesn't work.

Taking the time to understand *why* your hack works may take more time at the moment, but I can promise you it'll save you time later in your career. Having a fuller understanding of the systems your working within will mean less guess-and-check work in the future.

## Learn to anticipate future changes to the platform

The main difference between front-end and back-end code is back-end code generally runs on a platform that is completely under your control. The front-end, by contrast, is completely outside of your control. The user's platform or device could completely change at any moment, and your code needs to be able to handle it gracefully.

I remember reading the source code of a popular JavaScript library in 2011 and seeing the following (changed for simplicity):

```js
var isIE6 = !isIE7 && !isIE8 && !isIE9;
```

In this case IE6 was the catchall for IE version, presumably to make things like IE 5.5 work, but at soon as IE10 came out, large portions of our application were completely broken.

I understand that in the real world feature detection doesn't work 100% of the time, and sometimes you have to depend on buggy behavior or whitelist browsers whose feature detects erroneously return false positives (or negatives), but any time you do this it's absolutely critical that you anticipate the almost-certain future where these bugs no longer exists.

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