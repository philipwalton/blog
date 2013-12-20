---
layout: post
title: Interviewing as a Front-End Engineer in San Francisco
date: 2013-11-28 17:14:43
---

A few months ago I started casually looking for front-end jobs in the San Francisco. I liked where I was, but I felt like I was outgrowing the tech scene in my town, which had very few talented front-enders. I wanted to get out of the small pond and see how I'd fare in a large city with some of the best developers in the world.

When I started looking I knew I wanted to work somewhere where I wouldn't be the expert, so I only applied to big name companies. I had several phone screens, many of which turned into in-person interviews, and by the time it was all over I'd had the pleasure of visiting the campuses of many of my favorite companies.

Now, before I continue I want to make a disclaimer. Parts of this article are going to be critical of some of these companies, so I think it would be best to leave their names out. After all, who they are is not relevant to my overriding point. The only thing I will say is that most of them are major players in the web industry. They're companies everyone's heard of, and I mention that not to brag, but to suggest that since they're the ones who set the bar where it is, my experience is probably pretty close to the norm.

## My Experience

Overall, my experience was quite good. Some of these places have a reputation for their excruciating interviews, but what I went through was not nearly as scary as the stories I'd heard. Everyone was nice, everyone was professional, and if I didn't know the answer to something, I never felt belittled. Most of the time it seemed like just a simple conversation about technology between two people discussing the best way to solve a problem.

That being said, there was one thing severely lacking. I was asked almost no front-end specific questions!

Now, I'm no interviewing expert. And I'm sure most hiring managers would disagree over how to best measure the effectiveness of a particular set of interview questions.

But one thing I'm sure everyone can agree upon is that the questions you ask should be questions that will be best answered by the most qualified candidates for the job.

To put that another way, if a talented computer science grad fresh out of college with little to no front-end experience can outshine a great front-end engineer in your interview, you're probably asking the wrong questions.

I mean, imagine I were hiring a chef for a hip new restaurant, and two people apply: a chef with years of experience and a KitchenAid sales representative. Then instead of asking these two candidates to actually cook something, I ask them technical questions about the appliances, heat specification, capacity, etc. Would anyone be surprised if I ended up hiring the sales persons for the job?

This basically sum up my criticism of the interviews. The overwhelming majority of questions asked where logical puzzles, generic coding challenges, and algorithm design &mdash; questions that are necessary but nowhere near sufficient.

## What Was Missing

I know people who do a lot of interviewing, and I hear the same thing over and over: I'd rather hire a smart person and teach them X than hire someone who knows everything there is to know about X but lacks creativity, logic, and reasoning.

I get that. The problem is that front-end development is a domain specific skill set.

A front-end engineer, at its most basic level, is someone who writes code that runs on the user's device (usually in a browser). Today that means someone who writes HTML, CSS, and JavaScript and knows the various APIs that clients expose. The difference between the general term "programmer" and specific term "font-end engineer" is simply the domain where one's knowledge exists. A superstar front-end engineer is probably also a superstar programmer, but the reverse is not necessarily the case (often not).

If you agree with what I've just said, you can understand my surprise at the absence of some of the following topics:

- I wasn't asked a single question about new HTML APIs, and many of the people interviewing me hadn't heard of some of the newer and more exciting APIs like Web Components.
- I was asked almost no questions about CSS. The questions I was asked were so simple, any web developer should know the answer (like the difference between inline and block).
-I was asked almost no questions about DOM or binding events to elements and nothing about the fact that older browsers implement these APIs differently.

Instead, I was asked a lot of questions like these:

- Write a function that takes two sorted lists of numbers and merges them into a single sorted list.
- Given an array of integers (positive or negative) find the sub-array with the largest sum.
- Determine if a given string is a palindrome.
- Given a large hash table whose keys are movie names and whose values are a list of actors in that movies, write a function to determine the [Bacon number](http://en.wikipedia.org/wiki/Six_Degrees_of_Kevin_Bacon) of a particular actor.

Again, I don't want to imply that there isn't value in asking these questions. Obviously these are all perfectly fine interview questions. The problem is each of them has nothing to do with front-end development. A typical computer science undergrad with absolutely no web development experience could easily pass an interview consisting of only these types of questions.

## What's Going On?

I'm sure part of the problem lies in the newness of the need for front-end only positions as well as term "front-end" itself. It's not a well defined term and could mean something very different depending on who was doing the talking. I'm willing to admit the possibility that what I consider a front-end engineer may be different than those who were posting the job; however, I suspect there's more to it than that.

Another likely causes is that the majority of interviewers (again, at least in my experience) were not themselves front-end engineers. They were senior engineers (usually early hires), hiring managers, VPs, founders. But they were usually not front-end engineers themselves. So they stuck to what they know, and they asked the same questions they always ask.

## My Suggestions

Given my recent experience, I want to make the following suggestions to anyone reading who might be interviewing a front-end engineer in the near future.

- Front-end candidates should be interviewed by at least one front-end team member. If you don't have a front-end team member, find someone you know and trust.
- Obviously topics like logic and algorithms are important, especially for some companies. But if you're interviewing for a front-end position, a substantial portion of the questions should focus on the front-end.
- If you really want to ask questions about logic and algorithms, figure out a way to do so that combines your question with their domain specific knowledge.

As an example of that last point, instead of asking about the complexity of merge sort, ask about the complexity of this jQuery expression:

```js
$("#nav a")
  .addClass("link")
  .attr("data-initialized", true)
  .on("click", soSomething)
```

A correct answer to that will demonstrate both an understanding of basic computer science principles as well as a deeper knowledge of what jQuery is doing behind the scenes.

Instead of asking someone a to write a function that adds two dates, have them build a simple calendar to go along with it.

And instead of quizzing them on CSS trivia, give them two paragraphs of text and see if they know all the possible ways to arrange them next to each other as columns.

Finally, instead of asking someone what they know (which is of limited value), ask how they stay current, and how they keep from falling behind. What are they doing to make sure they'll be better in a year than they are today?

## Conclusion

Interviewing is a tricky thing, and even some of the most innovative companies get it wrong sometimes. And interviewing for a front-end position can be even harder because of the ambiguity of the term and the range of expectations that come with it.

The impression I got from many of my interviewers is that many of these companies are only now realizing the importance of dedicated front-end people. Their front-end codebases are starting to get hard to manage and part of the problem is the people who manage them aren't well versed in front-end best-practices.

If you're looking to hire a front-end candidate, considering reexamining your interview process. If you're doing some of the things mentioned in this article, you very well may be missing out on great candidates.

If you're looking for a job as a front-end engineer, you couldn't be looking at a better time, but if my experience is any indicating, I'd recommend brushing up on some of your programming fundamentals. One resource I highly recommend is the [MIT Open Courseware](http://ocw.mit.edu/courses/electrical-engineering-and-computer-science/) lecture series.
