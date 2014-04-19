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


If you've ever built a content driven website, chances are at some point your client (or project manager or friend or whoever) asked you to put a social widget or button somewhere on the site.

Not wanting to put to much thought into this, you probably went to that services developer page and just copy and pasted the code into your templates.

Done and done.

The Web is filled with code that has been blindly copied from one source to another. Tweet buttons, Like buttons, Disqus comments, Google Analtyics, Codepen Embeds, all of these have nice, neat, prepackaged code snippets served in nice, one size fits all packages.

In case you haven't figured it out from the title (and my tone), I think you should stop doing that.

If you're a profession web developer, these snippets are not for you. They're for your non-technical friends and relatives, but not for you.

One size fits all solutions can never been optimized for all cases, and these snippets are no exception. If you care about performace, reusibility, and DRY code, then you should make a promise to yourself to stop this behavior and take the two seconds it requires to figure out what the code is actually doing and see if it can be optimized for this particular context.

## Myths of Social Widgets

You might be thinking to yourself: "This code was written by a super genius at [insert big company name here] and its been tested on millions of websites; I don't want to mess with that."

The first part of this sentiment is absolutely not true. The people who wrote these snippets are just like you and me, and the complexity of the code is so minimal that the intelligence of the author is irrelevant.

The second part of this sentiment (the testing part) may be a legitimate concern in general, but I don't think it really applies to social widget initialization code. These snippets are only a couple of lines at most, and usually, either they work or they don't. If you don't see any JavaScript errors in the console, and the widget loads like you'd expect in a few different browsers, that's pretty much all the testing you need.

But I want to point out that even if you copied and pasted the code verbatim, you would still need to test and make sure it works in all the browsers you support. There's always the possibility that something you're doing is conflicting with these snippets, so initializing them yourself shouldn't require extra testing on your part.

## The Anatomy of a Social Code Snippet

Almost every social snippet out there does the same two things:

1. It adds a placeholder element to the HTML.
2. It loads a script from their site to initialize the widget inside the placeholder element.

That's it. Don't believe me? Well, let's look at a few of them to prove it.

### Twitter

Here is the code that [developers.twitter.com](https://dev.twitter.com/docs/tweet-button) recommends you use to get a tweet button on your site.

```xml
<a href="http://example.com" class="twitter-share-button" data-lang="en">Tweet</a>
<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>
```

Don't let the fact that it's all minified and obfuscated intimidate you. This is very basic JavaScript that I'm confident you can understand.

The HTML element is pretty obvious. It's just a plain old link with the class `twitter-share-button`. The JavaScript portion is a bit more complex, but let's see how it looks formatted a bit nicer.

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

Let's walk through what this code is doing.

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

Facebook doesn't remove the line break, so this snippet is a bit easier to read as is. But do you see how similiar it is? They even use the exact same short variable names `js`, `fjs`, `d`, `s`, and `id`.

Think about all the website out there that have this script loading code repeated many, many times on the same page.

It only needs to be there once, and if you're using a library like jQuery, that logic is already there, so you don't even need it at all.

### Disqus

```xml
<div id="disqus_thread"></div>
<script type="text/javascript">
var disqus_shortname = ''; // required: replace example with your forum shortname
(function() {
var dsq = document.createElement('script');
dsq.type = 'text/javascript';
dsq.async = true;
dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
</script>
```

Are you starting to see a pattern here?

The disqus code is slightly different because it requires you to assign your Disqus username to the variable `disqus_shortname` and then it downloads a script located at that subdomain.

The other differences are it:
- Adds type attribute "text/javascript" to the script element
- Adds the "async" attribute
- Appends the newly created script element to either the `<head>` or `<body>` or `<head>` can't be found.

If you think for one second that the smart people at Disqus knew what they were doing and these difference are mission critical, you should probably think again.

First of all, it's totally unnecessary to add the "text/javascript" attribute if you're using an html5 doctype, which you probably are. Secondly is there really a need to check and make sure the `<head>` is there? Really? Finally, the "async" attribute is added to the script to prevent it from blocking during download, but this won't happen if the script is being added to a part of the DOM that has already been parsed. In other words, if Disqus just used the same method Facebook and Twitter used, they could greatly simplify this code.

I bring this up to show you that just because a snippet was developed by a big name company and is used in millions of websites does not mean it's perfect. There's certainly nothing wrong with what Disqus is doing, my point is that you could do it slightly differently on your site and it will still work.

### Google Analytics

Google Analytics is by far the most complicated of the social snippets because, in addition to downloaded an external script, it creates a function on the page that the external script will expect to be there.

Here's the Google Analytics snippet, formatted so it's a bit easier to read:

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

While this code is definitely more complicated, and changing it will increase the risk of things breaking. I'd still suggest you change it.

The Google Analytics developer documentation has an [unminifed and commented version of this script](https://developers.google.com/analytics/devguides/collection/analyticsjs/advanced#snippetReference), and I highly suggest looking at that to see what's going on.

To spoil the mystery, the following code is all you really need (assuming you don't want to rename the `ga` function, and assuming you're going to download the script yourself):

```javascript
// Initialize the `ga` function and its properties.
ga = function() {
  ga.q.push(arguments);
};
ga.q = [];
ga.l = 1 * new Date();

// Create your tracker as usual.
ga('create', 'UA-XXXX-Y', 'auto');
ga('send', 'pageview');
```

The above code creates a `qa` function that, when invoked, pushes the arguments passed onto a `q` property. We then initialize the `q` property to be an empty array, and finally we store the current time on the `l` property.

This is exactly the same thing the original snippet is doing, but it's vastly simplified because we're not trying to support all these custom use cases.

Even if you wanted to rename the `ga` function, the above code makes it a lot easier to understand how it's all working.

### CodePen

```xml
<div data-height="268" data-slug-hash="nufrk" data-default-tab="result" class='codepen'></div>
<script async src="//codepen.io/assets/embed/ei.js"></script>
```

Codepen takes a slightly different approach. Instead of giving you a JavaScript snippet that downloads a script, it just gives you a script tag with the `async` attribute set to avoid blocking.

This is okay, but if you have more than one Codepen sample on your page, and if you just blindly copy this code, you're going to end up unnecessarily downloading, processing, and executing this code several times.

Now, if you took two seconds to read the snippet and understand what it's doing, you'd probably realize that you don't need to copy the script tag with each instance, but again, that's the point I'm trying to make.

If you take the time to read and understand the snippets, you'll be able to remove the unnecessary parts.

## What You Should Do Instead

Adding an asynchronous script element to a page is okay from a performance perspective, but it's certainly not an optimization.

Performance experts have long said the number one way to reduce page loads it to minimize the total number of requests. But they also recommend to only load what is truly needed to interact with your site.

So, the first step is to determine if these social widgets are absolutely critical to your users as soon as the page loads. Chances are they're not. Sharing buttons and comments are pretty much never mission critical, and if they take a few seconds to load after the initial page load, that is just fine.

### Wait Until After Page Load

Asynchronous scripts have one advantage of regular script. They don't block rendering. But that's the only thing they do, they are not a magic performance bullet.

In an asynchronous script is added to the DOM before the window's "onload" event if fired, the downloading, processing, and running of that script will all happen before "onload" is fired. In other words, asynchronous scripts will still slow down your page loads.

Now, you might be saying to yourself. Who cares about `window.onload`. Isn't `DOMContentLoaded` the event I should really be worried about?

Well, yes and no. `DOMContentLoad` only matters if you have critical functionality waiting on that event, which isn't the case if you're loading your scripts in the footer. But there are a lot of things dependent on the `load` event that are outside of your control.

If the URL has a hash fragment, browsers will not scroll to it until after the page is fully loaded. Also, any browser extensions your users have install may be waiting for the load event as well. In addition, Google has admitted to adding page load times into its ranking algorithms, and Google is using the `load` event, not `DOMContentLoaded`, so if your pagerank is a concern, you would wait until after `window.onload` to load any non-critical content.

### Bundle the External Scripts With Your Main JavaScript File

If one or more of these third party script are critical to your user experience, there's no reason to make a separate request for them.

Instead, as part of your build process, go out and fetch the scripts and include them into your main concatenated, minified, and gzipped script file.

As I said before, this is probably not necessary as social plugins are rarely mission critical, but in the event they are, you want to get them to you users at the same time as they can all your other JavaScript.

## Loading Scripts Yourself

If you choose to take my advice and not copy and paste code snippets, you'll have to load those scripts yourself. This isn't hard. If you've been paying attention you've already seen several ways to do this.

I recommend writing a simple `getScript` function that can be reused for each of these social scripts.

Here's an example that is essentially just the Twitter code:

```javascript
var getScript = function(firstScript) {
  return function(src) {
    var script = document.createElement('script');
    script.src = src;
    firstScript.parentNode.insertBefore(script, firstScript);
  }
}(d.getElementsByTagName('script')[0]));
```

The above codes caches a reference to the first script in a closure (to avoid multiple DOM lookups), and then return a function that adds a script right before it with the specified source attribute. If you need something more bespoke, you can of course customize this to meet your needs.

Then, instead of having unnecessary snippets littered throughout your page, you have something like this:

```javascript
window.onload = function() {
  getScript('//www.google-analytics.com/analytics.js');
  getScript('//codepen.io/assets/embed/ei.js');
  getScript('//philipwalton.disqus.com/embed.js');
  getScript('https://platform.twitter.com/widgets.js');
  getScript('//connect.facebook.net/en_US/all.js');
};
```

Now you're loading all of your scripts after `window.onload` which will make your pages feel much faster, and external services like Google pagespeed will consider them much faster as well.

Also, this code, as well as any other initialization code (like the Google Analytics code that's still needed), can be bundled altogether into a single, minifed and gzipped resource. If you put all this loading code into a closure so all these variables are local, you'll get an extra minification bonus.

## Conclusion
