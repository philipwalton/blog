---
layout: post
title: Interviewing as a Front-End Engineer in San Francisco
date: 2013-11-28 17:14:43
---

A few months ago I started casually looking for front-end jobs in the San Francisco Bay Area. I liked my current job, but I felt like I was outgrowing the tech scene in Santa Barbara. I wanted to leave my small pond and see how I'd fare in a big one, with some of the best developers in the world.

When I started looking I knew I wanted to work at a place where I wouldn't be *the* expert, so I only applied to big name companies. I had several phone screens, many of which turned into in-person interviews, and by the time it was all over I'd been lucky enough to visit some of my favorite tech companies.

Now, before I continue I want to offer this disclaimer. Parts of this article are going to be a bit critical, so I think it would be best to not mention specific company names. After all, who they are is not relevant to my overriding point. The only thing I will say is that most of them are major players in the web industry. They're companies everyone's heard of, and I mention that not to brag, but to suggest that since they're the ones who set the bar where it is, the experiences I had were probably pretty close to the norm.

## My Experience

Overall, my experience was quite good. Some of these companies have a reputation for their excruciating interviews, but what I went through was not nearly as bad as the stories I'd heard. Everyone was nice, everyone was professional, and if I didn't know the answer to something, I never felt belittled. Most of the time it just seemed like a simple conversation about technology between two people discussing the best way to solve a problem.

That being said, there was one thing severely lacking: front-end specific questions!

I'm no interviewing expert. And I'm sure most hiring managers would disagree over how to best measure the effectiveness of any particular set of interview questions. But one thing I'm sure everyone can agree upon is that the questions you ask should be questions that will be best answered by the most qualified candidates for the job.

To put that another way, if a talented computer science grad, fresh out of college, with almost no front-end experience can outshine a great front-end engineer in your interview, you're probably asking the wrong questions.

This basically sums up my criticism. The overwhelming majority of my interview questions where logical puzzles, generic coding challenges, and algorithm design problems &mdash; things that are necessary but nowhere near sufficient.

## What Was Missing

I know several people who do a lot of interviewing, and I hear the same line from them over and over: I'd rather hire a smart person and teach them X then hire someone who knows everything about X but lacks creativity, logic, and reasoning.

I get that. The problem is that front-end development is a domain specific skill set. It's not just about mental ability, it's also about knowledge and experience.

Front-end engineers, at their most basic level, are developers who write code that runs on the user's browser. Today that means someone who writes HTML, CSS, and JavaScript and knows the various APIs that browsers expose. The difference between the general term "programmer" and specific term "front-end engineer" is simply the domain where one's knowledge exists. A superstar front-end engineer is probably also a superstar programmer, but the reverse is not necessarily the case (often not).

If you agree with what I've just said, then you can understand my surprise at the absence of some of the following topics from my interviews:

- I wasn't asked a single question about new HTML APIs, and many of the people interviewing me hadn't heard of some of the newer and more exciting technologies like Web Components.
- I wasn't asked a single question about the differences between various browsers and browser versions or how to target/deal with those differences.
- I wasn't asked a single question about the differences between desktop and mobile browsers, or discuss techniques for building webapps to run on both.
- I was asked just one CSS question, and it was "tell me the difference between inline and block", a question that even most non-front-end people know.
- I was asked only one or two questions about the DOM, DOM events, or event binding.

Instead, I was asked a lot of questions like these:

- Write a function that takes two sorted lists of numbers and merges them into a single sorted list.
- Given an array of integers (positive or negative) find the sub-array with the largest sum.
- Determine if a given string is a palindrome.
- Given a large hash table whose keys are movie names and whose values are a list of actors in those movies, write a function to determine the [Bacon number](http://en.wikipedia.org/wiki/Six_Degrees_of_Kevin_Bacon) of a particular actor.

Again, I don't want to imply that there isn't value in asking these questions. Obviously these are all perfectly fine interview questions. The problem is each of them has nothing to do with front-end development.

Like I mentioned earlier, a smart computer science undergrad with no web experience at all could easily pass an interview consisting of only these types of questions.

## So What's Going On?

I'm sure part of this problem lies in the newness of the need for front-end only positions as well as the term "front-end engineer" itself. It's not a well defined term and could mean something very different depending on who was using it. I'm willing to admit the possibility that what I consider a front-end engineer may be different than those who were posting the job, but I suspect there's more to it than that.

Another likely causes is that the majority of interviewers (again, at least in my experience) were not themselves front-end engineers. They were senior engineers (usually early hires), hiring managers, VPs, founders, etc, but they were usually not front-end engineers themselves. As a result, they stuck to what they know, and they asked the same questions they always ask.

## My Suggestions

Given my recent experience, I want to offer the following advice to anyone reading who might be interviewing a front-end engineer in the near future.

- Front-end candidates should be interviewed by at least one (preferably more) front-end team member. If you don't have a front-end team member, find someone you know and trust and ask them to do it.
- Obviously topics like logic and algorithms are important, especially for certain companies, but if you're interviewing for a front-end position, a substantial portion of the questions should focus on the front-end.
- If you really want to ask questions about logic and algorithms, figure out a way to do so that combines your questions with front-end specific knowledge.

To illustrate that last point, instead of asking about the complexity of merge sort, ask about the complexity of this jQuery expression:

{% highlightjs %}
$("#nav a")
  .addClass("link")
  .attr("data-initialized", true)
  .on("click", soSomething)
{% endhighlightjs %}

A correct answer to this will demonstrate both an understanding of basic computer science principles as well as a deeper knowledge of what jQuery is doing behind the scenes.

Instead of asking someone to write a function that adds two dates, have them build a simple calendar to go along with it.

Instead of quizzing them on CSS trivia, give them two paragraphs of text and see how many ways they can think of to arrange them side-by-side as columns. Then ask them to describe the pros and cons of each method.

Finally, good front-end engineers tend to be very self-motivated. Since most web technologies aren't taught in school, your average front-end engineer learned this stuff on their own. So instead of asking someone what they know (which is of limited value), ask them how they stay current, and how they keep from falling behind. What are they doing to make sure they'll be better in a year than they are today?

## Conclusion

Interviewing is a tricky thing, and even some of the most innovative companies get it wrong sometimes. And interviewing for a front-end position can be even harder because of the ambiguity of the term and the range of expectations that come with it.

The impression I got from many of my interviewers was that most of these companies have only recently begun to realize the importance of dedicated front-end people. Their front-end code bases are starting to get massive and really hard to manage. And part of the problem is the people who manage them aren't well versed in front-end best-practices.

If you're looking to hire a front-end candidate, consider reexamining your interview process. If you're doing some of the things mentioned in this article, you may very well be missing out on some great people.

If you're looking for a job as a front-end engineer, you couldn't be looking at a better time, but if my experience is any indication, I would suggest brushing up on some of your computer science fundamentals. One resource I highly recommend is the [MIT Open Courseware](http://ocw.mit.edu/courses/electrical-engineering-and-computer-science/) lecture series, specifically [Introduction to Algorithms](http://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-006-introduction-to-algorithms-fall-2011/).

Lastly, I hope this article isn't just seen as a rant by someone who didn't like his interview questions. That is certainly not my intent. My hope is that I can do my part in raising the bar for front-end work in our industry. And I believe one of the best ways to make that happen is to help companies hire the right people for those jobs.
