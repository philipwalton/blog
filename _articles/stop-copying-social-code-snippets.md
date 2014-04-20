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


If you've ever built a website, chances are, at some point, you've had to put a social widget somewhere on one of your pages. And chances are you didn't want to put too much thought into it, so you just copied some code from the internet and called it a day. Done and done.

I mean, the Web is filled with code that has been blindly copied from one source to another. Tweet buttons, Like buttons, Disqus comments, Google Analytics, Codepen Embeds, all of these come with nice, neat, one size fits all code snippets.

In case you haven't figured it out from the title (and my tone), I think this is a bad idea.

If you're a professional web developer, these snippets are not for you. They're for your non-technical friends and relatives, but not for you.

Prepackaged solutions can never been optimized for all cases, and these snippets are no exception. If you care about performance, reusability, and DRY code, then you should make a promise to yourself to avoid this temptation and take the two seconds it requires to figure out what the code is actually doing and see if it can be optimized for your individual situation.

## Myths of Social Widgets

You might be thinking to yourself: "but this code was written by a super genius at [insert big company name here] and its been tested on millions and millions of websites; I don't want to mess with that."

The first part of this sentiment is absolutely not true. The people who wrote these snippets are just like you and me, and the complexity of the code is so minimal that the intelligence of the author is irrelevant.

The second part of this sentiment (the testing part) may be a legitimate concern in general, but I don't think it really applies to social widget initialization code. These snippets are only a couple of lines at most, and usually, either they work or they don't. If you don't see any JavaScript errors in the console, and the widgets actually work in the browsers you're targeting, that's pretty much all the testing you need.

Note that this doesn't actually require more testing on your part because you should be checking that these widgets work in your target browsers anyway. There's always the possibility that something you're doing is conflicting with the recommended snippets, so whether you're checking their code or your own, you're still doing the same amount of work.

## The Anatomy of a Social Code Snippet

Almost every social snippet out there does the same two things:

1. It adds a placeholder element to the HTML.
2. It loads a script from their site to initialize the widget inside the placeholder element.

That's it. Don't believe me? Well, let's look at a few of them to prove it.

*(If you do believe me and want to skip to ahead to my suggestions, go to the section entitled [What You Should Do Instead
](#what-you-should-do-instead).)*

### Twitter

Here is the code that [developers.twitter.com](https://dev.twitter.com/docs/tweet-button) recommends you use to get a tweet button on your site.

```xml
<a href="http://example.com" class="twitter-share-button" data-lang="en">Tweet</a>
<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>
```

Don't let the fact that it's all minified and obfuscated intimidate you. This is very basic code that I'm confident you can understand.

The HTML element is pretty obvious. It's just a plain old link with the class `twitter-share-button`.

The JavaScript portion is a bit more complex, so let me prettify the code a bit and replace the single letter variables so you can get a clearer picture of what's going on.

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

1. It declares the variables `js` and `fjs`, and assigns `fjs` to the first script element on the page.
2. It then checks to see if the document already has an element with the id of "twitter-wjs". If it does, nothing happens, if it doesn't it goes into the if conditional.
3. It creates a new script element, assigns it to the `js` variable, and sets the id to "twitter-wjs" and the `src` attribute to https://platform.twitter.com/widgets.js.
4. Finally, it inserts the script element into the DOM immediately before the first script element.

This is actually very uncomplicated code. All it's doing is downloading an external script and running it on your page.

It does a single to check to make sure the script hasn't already been downloaded, which is important because so many people copy this code multiple times onto the same page. Obviously the same script file doesn't need to be downloaded more than once.

Well, that was Twitter, now let's take a look at another snippet.

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

Facebook's code is a little less obfuscated, so this snippet is a bit easier to read. Can you see how similar it is? They even use the exact same short variable names `js`, `fjs`, `d`, `s`, and `id`.

Think about all the websites out there that have both this script and the twitter script multiple times on the exact same set of pages.

It's a complete waste of space.

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

The disqus code is slightly different because it requires you to assign your Disqus username to the variable `disqus_shortname` and then it downloads a script located on that subdomain.

The other differences are it:
- Adds the `type` attribute "text/javascript" to the script element
- Adds the `async` attribute
- Appends the newly created script element to the `<head>` (or to the `<body>` if `<head>` can't be found).

You might assume that the difference between this code snippet and the Twitter/Facebook version are important, but trust me, they're not.

First of all, it's totally unnecessary to add the "text/javascript" attribute if you're using an html5 doctype (which you probably are). Secondly, it's unnecessary to check for the presence of the `<head>` element since all browsers automatically add that when creating the DOM. Finally, the `async` attribute is added to the script to prevent it from blocking during download; however, this isn't necessary if it's added to a portion of the DOM that's already been parse.

I highlight these differences not to poke fun of Disqus, but instead to point out that just because a snippet was developed by a big company and used on millions of websites doesn't means its perfect in every way.

You control the code on your website, so there's no reason to include code written for the lowest common denominator.

### Google Analytics

Google Analytics is by far the most complicated of the social snippets because, in addition to downloading an external script, it creates a function on the page that the external script will need to invoke later on.

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

While this code is definitely more complicated, and changing it will increase the risk of things breaking. I'd still recommend you do just that.

The Google Analytics developer documentation has an [unminifed and commented version of this script](https://developers.google.com/analytics/devguides/collection/analyticsjs/advanced#snippetReference), and I highly suggest looking at that to see what's actually going on.

To spoil the mystery, if you download their external script elsewhere, and if you don't need to rename the `ga` function, the following code will work just fine:

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

This updated snippet creates a `ga` function that, when invoked, pushes the arguments passed onto its `q` property. It then initializes the `q` property as an empty array and stores the current time on the `l` property.

This new code does the exact same thing as the original snippet, but it's vastly simplified since it doesn't try to support all possible custom use cases.

## What You Should Do Instead

Adding an asynchronous script element to a page is okay from a performance perspective, but it's certainly not "optimized".

Performance experts have long said that the number one way to reduce page load times is to minimize the total number of requests. But they also recommend that your initial load only contain the minimum needed for your users to interact with your site.

Performance experts have long said that the number one way to reduce page load times is to minimize the total number of requests. But they also recommend that in your initial load you only bundle the bare minimum needed for your users to interact with your site.

To put that in the context of social widgets, the ideal way to load them depends on how mission critical they are.

Chances are, they're not mission critical, so you should probably wait until after the page is loaded to make those requests.

### Wait Until After Page Load

Asynchronous scripts have one advantage over regular script. They don't block rendering. But that's the only thing they do, they are not a magic performance bullet.

If an asynchronous script is added to the DOM before the window is fully loaded, it will delay the load event. The script must be downloaded, processed, and run before `load` can be fired. In other words, asynchronous scripts still slow down your pages.

Now, you might be saying to yourself. Who cares about `window.onload`. Isn't `DOMContentLoaded` the event I should really be worried about?

Well, yes and no. `DOMContentLoad` only matters if you have critical functionality waiting for that event, which isn't the case if you're loading your scripts in the footer. But there are a lot of things dependent on the `load` event that are outside of your control.

If the URL has a hash fragment, browsers will not scroll to it until after the page is fully loaded. Also, any browser extensions your users have installed may be waiting for the load event as well. In addition, Google has admitted to adding page load times into its ranking algorithms, and Google is using the `load` event, not `DOMContentLoaded`, so if your pagerank is a concern, you should wait until after `window.onload` to include any non-critical content.

### Bundle the External Scripts With Your Main JavaScript File

If one or more of these third party script are critical to your user experience, there's no reason to make a separate request for them.

Instead, as part of your build process, go out and fetch the scripts and include them into your main concatenated, minified, and gzipped script file.

As I said before, this is probably not necessary as social plugins are rarely mission critical, but in the event they are, you want your users to have them as soon as possible, with as few requests as possible.

## Loading Scripts Yourself

If you choose to take my advice and not copy and paste code snippets, you'll have to load those scripts yourself. This isn't hard. If you've been paying attention you've already seen several ways to do this.

I recommend writing a simple `getScript` function that can be reused for each of these social scripts.

Here's an example that is essentially just the Twitter code refactored:

```javascript
var getScript = function(firstScript) {
  return function(src) {
    var script = document.createElement('script');
    script.src = src;
    firstScript.parentNode.insertBefore(script, firstScript);
  }
}(document.getElementsByTagName('script')[0]));
```

The above codes caches a reference to the first script on the page (to avoid multiple DOM lookups), and then it returns a function that adds your new script element right before the first script. If you need something more bespoke, you can of course customize this to meet your needs.

If you use the above function, you can load all your social plugins after the window loads like so:

```javascript
window.onload = function() {
  getScript('//www.google-analytics.com/analytics.js');
  getScript('//philipwalton.disqus.com/embed.js');
  getScript('https://platform.twitter.com/widgets.js');
  getScript('//connect.facebook.net/en_US/all.js');
};
```

It's important to note that some of these social snippets (like Google Analytics) still required initialization, so don't forget those parts.

Finally, once all this code is written, it should be bundled together into a single resource and served minified and gzipped.

## Conclusion

I know that copying and pasting social code is a dead simple. And I know that trying to figure out what each snippet is doing (and then optimizing it for your specific needs) will take time. But I hope this article will give you the courage or the motivation to try.

In addition, I hope that more companies will follow the example set by Google Analytics and post an unminifed and commented version on their websites. There's no reason to force users into the lowest common denominator. Give your non-savvy users the simplest option, but don't assume your more technical users aren't capable of customizing the code for their own needs.
