<!--
{
  "layout": "article",
  "title": "Stop Copying Third-Party Code Snippets",
  "date": "2014-04-17T20:07:32-07:00",
  "draft": true,
  "tags": [
    "JavaScript",
    "HTML"
  ]
}
-->

Introduction
The Anatomy of a Code Snippet
  Twitter
  Facebook
  Disqus
  Codepen
  Google Analytics
Why Code Snippets Are Bad
A Better Way

The Web is filled with code that has been blindly copied and pasted from one source to another. Perhaps the biggest offer in this regard is social widgets and plugins.

Tweet buttons, Like buttons, Disqus comments, Google Analtyics, Codepen Embeds, all of these have nice, neat, prepackaged code snippets just waiting to be blindly copied into unsuspecting HTML files.

As you can probably tell from my tone (and the title), I don't think it's a good idea to copy and paste these prepackaged, one-size-fits-all code snippets.





If you've ever built a website for a client or even for yourself, at some point you've probably wanted to include some third party service. Whether it be social sharing buttons, Disqus comments, Google Analytics, YouTube Videos, they all come with nice little copy-and-paste snippets that make it super easy to integrate into your site.

If you haven't already figured it out from the title, I think you should stop doing that.

If you're reading my blog, chances are you're a developer of some sort, and as a developer you should be capable of understanding how code works. One size fits all solution are great for people who don't know how to code, but you're not one of those people.

So stop copying and pasting social snippets. Seriously. There are so many reasons why it's bad, and no good reasons (other than laziness) to do it.

Instead, you should look at the code, figure out what it's doing, and more often than not, you can get the exact same behavior for a fraction of the price.

The vast majority of social snippets out there are all doing the same thing. They add an HTML element and some JavaScript code that asynchronously downloads a script form their site in order to transform the element in the snippet into whatever they want.

## The Anatomy of a Social Code Snippet

Pretty much every code snippet out there has a few key things in common. They have you add some sort of placeholder or container element, and they then asynchronously load a script from their site that interacts with this container element.

Twitter is a classic example:

### Twitter

Here is the code that [developers.twitter.com](https://dev.twitter.com/docs/tweet-button) recommends you use to get a tweet button on your site.

```xml
<a href="http://example.com" class="twitter-share-button" data-lang="en">Tweet</a>
<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>
```

It's all minified so it might be intimidating, but if you give it a chance, I'm sure you can figure out what it's doing.

The HTML element is pretty obvious. It's just a plain old link. Here's the JavaScript portion formatted a bit nicer.

```javascript
!function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (!d.getElementById(id)) {
    js = d.createElement(s);
    js.id = id;
    js.src = "https://platform.twitter.com/widgets.js";
    fjs.parentNode.insertBefore(js, fjs);
  }
}(document, "script", "twitter-wjs");
```

There. That's not so bad. There's an immediately invoked function expression that is passed the `document`, the string "script", and the string "twitter-wjs". If I replace those single-letter variables, I can make it even easier to read.

```javascript
var js, fjs = document.getElementsByTagName('script')[0];
if (!document.getElementById('twitter-wjs')) {
  js = document.createElement('script');
  js.id = 'twitter-wjs';
  js.src = 'https://platform.twitter.com/widgets.js';
  fjs.parentNode.insertBefore(js, fjs);
}
```

So let's walk through what this code is doing.

1. It declares the variables `js` and `fjs`, and assign `fjs` to the first script element on the page.
2. It then checks to see if the document already has an element with the id of "twitter-wjs". If it does, nothing happens, if it doesn't it goes into the if conditional.
3. I creates a new script element, assigns it to the `js` variable, and sets the id to "twitter-wjs" and the `src` attribute to 'https://platform.twitter.com/widgets.js'.
4. It inserts the script element into the DOM immediately before the first script element.

This is actually very uncomplicated code. All it's doing is downloading an external script and running it on your page. And if the script already exists on the page, it does nothing. It checks to see if the script already exists on the page because frequently people copy and paste this code and litter it throughout their website. The external script obviously only needs to be downloaded once, thus the ID check.

Now let's take a look at another snippet. This time from Facebook:

### Facebook


```xml
<div id="fb-root"></div>
<script>(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_US/all.js";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));</script>

<!-- then put the share button somewhere -->
<div class="fb-share-button" data-href="http://example.com" data-type="button_count"></div>
```

### Disqus

```xml
<div id="disqus_thread"></div>
<script type="text/javascript">
var disqus_shortname = ''; // required: replace example with your forum shortname
(function() {
var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
})();
</script>
<a href="http://disqus.com" class="dsq-brlink">comments powered by <span class="logo-disqus">Disqus</span></a>
```

Now let's format the main part of the script to make it a bit easier to read:

```javascript
var dsq = document.createElement('script');
dsq.type = 'text/javascript';
dsq.async = true;
dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
```

Once again, all it's really doing is creating a new script tag and adding it to the DOM. The main difference between this and the Twitter example is this script tag is specific to your Disqus username. The other difference is it adds the `async` attribute and adds it after the first script instead of before. But if you're at all familiar with front-end developement, you'll know that these are neglidable differences.

The point is that if you have both Twitter buttons and Disqus comments, now you have at least two bits of code whose main responsibility is to load a script file and add it to the DOM.

Now lets look at Google Analytics, formatted:

```javascript
(function(i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r;
  i[r] = i[r] || function() {
    (i[r].q = i[r].q || []).push(arguments)
  }, i[r].l = 1 * new Date();
  a = s.createElement(o),
  m = s.getElementsByTagName(o)[0];
  a.async = 1;
  a.src = g;
  m.parentNode.insertBefore(a, m)
})(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-XXXX-Y', 'auto');
ga('send', 'pageview');
```

If you want to know more about what's going on here, Google has made the [unminified and commmented](https://developers.google.com/analytics/devguides/collection/analyticsjs/advanced#snippetReference) version available, but the gist is that Google is creating a basic `ga()` function, it's calling create with the ID of your Google Analytics profile, and then it's tracking the current page. But it's also loading the analytics.js library code using pretty much the exact same method all the other snippets were using.

So this begs the question. If all these snippets are repeating the same logic, why don't I just do that myself to lower my code footprint and simplify everything. But perhaps more importantly, by doing this stuff yourself you can control exactly *when* these external scripts are being downloaded. And as I'll explain later, that is a much more important detail.

### CodePen

```xml
<p data-height="268" data-theme-id="0" data-slug-hash="nufrk" data-default-tab="result" class='codepen'>See the Pen <a href='http://codepen.io/philipwalton/pen/nufrk/'>JavaScript Truthiness Table</a> by Philip Walton (<a href='http://codepen.io/philipwalton'>@philipwalton</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//codepen.io/assets/embed/ei.js"></script>
```

Codepen takes a slightly different approach. Instead of giving you a JavaScript snippet that downloads a script, it just gives you a script tag with the `async` attribute set to avoid blocking.

This is okay, but if you have more than one Codepen sample on your page, and if you just blindly copy this code, you're going to end up unnecessarily downloading, processing, and executing this code several unnecessary times.

Now, if you took two seconds to read the snippet and understand what it's doing, you'd probably realize that you don't need to copy the script tag with each instance, but again, that's the point I'm trying to make. Read the snippets.

## Async Script Tags Are The Worst of Both Worlds

Either, as part of your build step, download these social scripts and bundle them into your single application script, or wait until the window has fully loaded and download them then.

Even though `async` script down't block rendering, they still delay the page from fully loading. And they still delay any code from running that's waiting for the page to fully load.

You've probably heard it said that Google takes page load times into account when determining page rank. Well, the load times they're using are `window.load`, so if your site's Google search rank is important to you, copying social snippets is a terrible idea.


