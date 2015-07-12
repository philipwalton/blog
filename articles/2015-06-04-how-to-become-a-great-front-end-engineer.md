---
template: article.html
title: "How to Become a Great Front-End Engineer"
date: 2015-06-04T18:09:12-07:00
---

I recently received an email from a reader of my blog that, for whatever reason, really got me thinking. Here's what it said:

> Hi Philip, is it okay to ask how you become a great front-end engineer?<br>
> Any advice?

First of all, I was surprised to even be asked this question since I've never really thought of myself as a "great" front-end engineer. In fact, the first four jobs I had in this industry were jobs I was completely unqualified for. I only got them because the people interviewing me didn't know better, and I was good at pretending.

That being said, I ended up doing very well in each of these roles and became a valued member of the team. By the time I eventually left (for the next challenge I was also unqualified for) and was tasked with helping to hire my replacement, I would reflect with slight amusement at the ironic fact that my
former self probably wouldn't be able to pass the interviews I was giving. I wouldn't have hired me.

As I started thinking about this question more and more, I began to realize how lucky I've been. Much of my success is a result of being thrust into situations I had no business in, yet still expected to perform. But I don't think it's entirely about being stretched or working hard. Over time I've learned some very important lessions that I'd like to share. Some of these are specific to front-end development, and some are just generally good practices.

I've read a lot of posts over the years discussing what a good front-end engineer should know&mdash;frameworks, tools, etc.&mdash;so I wanted to take a different approach. If my experience is any indication, then what you know is not nearly as important as how you think. In this article I'm going to give my opinion on the mindset that makes a front-end engineer great.

## Don't just solve problems, figure out what's really going on

Too many people who write CSS and JavaScript tinker until they find something that works, then they just move on. This sometimes gets the job done, but it doesn't increase your knowledge or improve your craft.

In CSS you see this a lot with the excessive use of floats. Floating an element will stop its margins from collapsing and it will clearfix its floated children. If you don't understand how these things works, but you discover that adding `float: left` fixes your immediately problem. It's probably tempting to just leave it and move on.

In JavaScript you see this with the excessive use of function binding, or adding a `setTimeout` call for no reason other than that, without it, your code doesn't work.

Taking the time to understand *why* your hack works may take more time at the moment, but I can promise you it'll save you time later in your career. Having a fuller understanding of the systems your working within will mean less guess-and-check work in the future.

## Learn to anticipate future changes to the platform

The main difference between front-end and back-end code is back-end code generally runs on a platform that is completely under your control. The front-end, by contrast, is completely outside of your control. The user's platform or device could completely change at any moment, and your code needs to be able to handle it gracefully.

I remember reading the source code of a popular JavaScript library in 2011 and seeing the following (changed for simplicity):

```js
var isIE6 = !isIE7 && !isIE8 && !isIE9;
```

In this case IE6 was the catchall for IE version, presumably to make things like IE 5.5 work, but at soon as IE10 came out, large portions of our application were completely broken.

I understand that in the real world feature detection doesn't work 100% of the time, and sometimes you have to depend on buggy behavior or whitelist browsers whose feature detects erroneously return false positives (or negatives), but any time you do this it's absolutely critical that you anticipate the almost-certain future where this bug no longer exists.

Most of the you're writing today will outlive your tenure at your current job. Some of the code I wrote more than 8 years ago is still running on websites today, a thought that is both satisfying and terrifying.

## Read other people's code

Reading other people's code, for fun, is probably not your idea of a fun Saturday night, but it's without a doubt one of the best ways to become a better developer.

Solving problems on your own is a great way to learn, but if that's all you ever do, you'll plateau pretty quickly. Reading other people's code opens your mind to knew ways of doing things. In addition, the ability to read and understand code you didn't write is essential to working on a team or contributing to open source projects.

## Read the specs

There will always be browser bugs, and when two browser render the same code differently, people too often assume that the so-called "good" browser is right and the "bad" browser is wrong. But this isn't always the case, and when you're wrong about this assumption, whatever workaround you choose will almost certainly break in the future.

If you take the time to understand what's supposed to happen and code with that in mind, your work will last much longer.

So-called "great" front-end engineers are often the people on the forefront of change, adopting new technologies before they're mainstream and even contributing to the development of these technologies. If you cultivate your ability to look at a spec and imagine how a technology will work before you can play with it in a browser, you'll be part of a select group who is able to talk about and influence the development of that spec.

## Work with people smarter than you

Freelancing is the dream for a lot of people, but it's an easy way to plateau your skills. Luckily we live in an age where "working with people" isn't limited to your day job. Get involved in open source projects that interest you to keep pushing yourself forward.

- Write about what you learn

    In my experience, the best way to learn something is to try to teach it to someone else. It forces you to really understand it in a way that simply using it never does.

- Reinvent the wheel

    Reinventing the wheel is bad for business, but it's great for learning. jQuery probably makes you far more productive that you were without it, but imagine how much more you'd learn trying to make your own version.

    Don't take this too far though, as well-established libraries have the advantage of years of bug reports that you're probably not aware of off the top of your head.

- Build things for fun

    Everyone I know who excels as a front-end engineer loves doing their job in the free time as well. This isn't so much a piece of advice as it is a warning sign. If you don't love what you do, there's probably zero chance of ever being great. And that probably applies to every profession, not just web development.
