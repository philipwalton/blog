<!--
{
  "layout": "article",
  "title": "Stop Copying Social Code Snippets",
  "date": "2014-04-20T16:17:32-07:00",
  "tags": [
    "JavaScript",
    "HTML"
  ]
}
-->

If you're a web developer, chances are, at some point, you've had to add a social widget to one of your page. Actually, probably more than one. And chances are you didn't want to put too much thought into it, so you just copied some code from the Internet and called it a day. Done and done.

I mean, the Web is filled with code that has been blindly copied from one source to another. Tweet buttons, Like buttons, Disqus comments, Google Analytics, all of these come with nice, neat, prepackaged code snippets.

In case you haven't figured it out from the title (and my tone), I think using these snippets is a bad idea.

If you're a professional web developer, these snippets are not for you. They're for your friends and relatives, your uncle's restaurant business or your sister's baby blog, but they're not for you.

One size fits all solutions can never been optimized for all cases, and they frequently come with baggage you don't want or need.

If you care about performance, reusability, and clean code, then you should make an effort to avoid this temptation. Rise to the challenge, as a professional, and take the two seconds it requires to figure out what the code is doing. Maybe you don't actually need it, or maybe you can do it better.

## The Myths of Social Widgets

Now, you might be thinking to yourself: "but this code was written by a super genius at [insert big company name here] and its been tested on millions and millions of websites; I don't want to mess with that."

The first part of this sentiment is absolutely not true. The people who wrote these snippets are just like you and me, and the complexity of the code is so minimal that the intelligence of the author is irrelevant. In any case, the source is right there, so you can learn from their genius.

The second part of this sentiment (the testing part) may be a legitimate concern in general, but I don't think it really applies to social widget code. These snippets are only a couple of lines at most, and usually, either they work or they don't. If you don't see any JavaScript errors in the console, and the widgets actually load in the browsers you're targeting, that's pretty much all the testing you need.

Note that this doesn't actually require additional testing on your part since you should be checking that these widgets work in your target browsers anyway. There's always the possibility that something you're doing is conflicting with the recommended snippets, so regardless of what you do, you still have to test that it works.

## The Anatomy of a Social Code Snippet

Almost every social snippet out there does the same two things:

1. It adds a placeholder element to the HTML.
2. It loads a script from their site that adds some stuff to the placeholder.

That's it. Don't believe me? Well, let's look at a few examples.

*(If you do believe me and just want to skip to my recommendations, go to the section entitled [What To Do Instead
](#what-to-do-instead).)*

### Twitter

Here is the code that [developers.twitter.com](https://dev.twitter.com/docs/tweet-button) recommends you use to get a tweet button on your site.

```xml
<a href="http://example.com" class="twitter-share-button" data-lang="en">Tweet</a>
<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>
```

Don't let the fact that it's all minified and obfuscated intimidate you. This is very basic code that I'm confident you can understand.

The HTML part is pretty straight forward. It's just a plain old link with the class `twitter-share-button`. This is the placeholder element that I mentioned above.

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
2. It then checks to see if the document already has an element with the ID "twitter-wjs". If it does, nothing happens. If it doesn't, it goes into the if conditional.
3. It creates a new script element, assigns it to the `js` variable, and sets the ID to "twitter-wjs" and the `src` attribute to "https://platform.twitter.com/widgets.js".
4. Finally, it inserts the script element into the DOM immediately before the first script element.

This is actually very uncomplicated code. All it's doing is downloading an external script and running it on your page.

It does a single check to make sure the script hasn't already been downloaded, which is important because so many people blindly paste this code multiple times onto the same page, and obviously the same script file doesn't need to be downloaded more than once.

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

Facebook's code is a little less obfuscated, so this snippet is a bit easier to read. Can you see how similar it is? They even use the exact same variable names: `d`, `s`, and `id`, `js`, and `fjs`.

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

The Disqus snippet is slightly different because it requires you to assign your Disqus username to the variable `disqus_shortname` and then it downloads a script from that subdomain. But there are also difference in how it loads the external script:

- It adds the `type` attribute "text/javascript" to the script element.
- It adds the `async` attribute.
- It appends the newly created script element to the `<head>` (or to the `<body>` if `<head>` can't be found) rather that inserting it before the first script element.

You might be asking yourself. Are these differences important? Disqus is a big name company, surely they're doing things differently for a reason, right?

To answer this question bluntly: no, these differences are not important.

First of all, it's totally unnecessary to set a script's `type` attribute to "text/javascript" if you're using an html5 doctype (which you probably are). Secondly, it's unnecessary to check for the presence of the `<head>` element since all browsers automatically add that when creating the DOM (even if it's not present in the source). Finally, the `async` attribute is added to the script to prevent it from blocking during download; however, any script that is dynamically added to the DOM is evaluated as async by default.

I'm going to give Disqus the benefit of the doubt and assume that they had a good reason for writing the code they did. Perhaps they had some big enterprise client with really old, invalid HTML, parsing errors, and no doctype, and this was the solution they needed to get it working for them. I don't know, but the point is these differences don't apply to you, so there's no reason to carry someone else's baggage.

This also helps disprove the first myth about social snippets. Just because some big name company is doing it a certain way, doesn't mean that's a best-practice.

### Google Analytics

Google Analytics is a little bit more complicated than the other social snippets. In addition to downloading an external script, it also creates a function on the page that the external script needs to interact with.

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

While this code is definitely more involved than the other snippets, and changing it will increase the risk of things breaking. I'd still recommend you don't blindly paste it into your website.

The Google Analytics developer documentation has an [unminified and commented version of this script](https://developers.google.com/analytics/devguides/collection/analyticsjs/advanced#snippetReference), and I highly suggest looking at that to see what's actually going on.

To spoil the mystery, unless you're doing something custom, my version below will work just fine:

```javascript
ga = function() {
  ga.q.push(arguments);
};
ga.q = [['create', 'UA-XXXX-Y', 'auto'], ['send', 'pageview']];
ga.l = 1 * new Date();
```

This updated snippet creates a `ga` function that, when invoked, pushes the arguments passed onto its `q` property. It then initializes the `q` property with your tracker data and stores the current time on the `l` property.

This new code does the exact same thing as the original snippet, but it's vastly simplified since it doesn't try to support all possible custom use cases.

All you have to do is load the external script yourself, and everything should work as normal.

## What To Do Instead

While using asynchronous script loading is certainly better than a bunch of blocking scripts littered throughout the page, its no magic bullet. Asynchronous scripts don't block rendering, but they do delay page loads.

If you add a script element to the DOM before the window's `load` event fires, that event will be delayed until the newly added script is downloaded, parsed, and run. If you're adding multiple scripts (most people are), the `load` event could be delayed a long time.

Now, you might be thinking to yourself. Who cares about `load`? Isn't `DOMContentLoaded` the event I should really be worried about? Isn't that what we learned from jQuery?

`DOMContentLoaded` is the event that fires once the document has been fully parsed and is able to be traversed by scripts. If you're waiting to do some DOM manipulation, then yes, this is the event you should care about.

But the window's `load` event is just as important, arguably more so, and for a few reasons:

- Google search ranking algorithms take page load times into account, and those page load times are based on the `load` event.
- If the URL has a hash fragment, browsers will not scroll down to that location until after the `load` event fires. This can significantly affect how snappy your page feels.
- Browser plugins commonly listen for the `load` event, so any plugins your visitors have could make your pages seem slower than they really are.

I'm sure there are many more reasons to care about the `load` event, but this list is convincing enough for me.

Given all of this, you have two choices for how to implement your social widgets. And your decision should depend solely on how essential these widgets are to your user experience:

- If they're essential, they shouldn't be asychronously loaded at all.
- If they're non-essential (which is usually the case), you should wait until after the `load` event to download and intialize them.

### Waiting Until After Page Load

Since none of the snippets we've look at thus far wait for the `load` event, we'll have to implement our own script loader. This is easy as we've already seen many examples for how to do it. Here's a basic implementation:

```javascript
var getScript = (function(firstScript) {
  return function(src) {
    var script = document.createElement('script');
    script.src = src;
    firstScript.parentNode.insertBefore(script, firstScript);
  }
}(document.getElementsByTagName('script')[0]));
```

The above code caches a reference to the first script on the page (to avoid multiple DOM lookups), then it returns a function that adds your new script element right before the first script.

Once you have a script loading function, just use it in the `window.onload` callback.

```javascript
window.onload = function() {
  getScript('//www.google-analytics.com/analytics.js');
  getScript('//philipwalton.disqus.com/embed.js');
  getScript('https://platform.twitter.com/widgets.js');
  getScript('//connect.facebook.net/en_US/all.js');
};
```

If you're using a library like jQuery, then you don't even need to write the script loading code at all. jQuery can do that for you. (As can many other libraries, so check your dependencies before reinventing the wheel.)

```javascript
$(window).on('load', function() {
  $.getScript('//www.google-analytics.com/analytics.js');
  $.getScript('//philipwalton.disqus.com/embed.js');
  $.getScript('https://platform.twitter.com/widgets.js');
  $.getScript('//connect.facebook.net/en_US/all.js');
});
```

It's important to note that some of these social snippets (like Google Analytics) still require initialization, so don't forget about those parts.

### Bundling the External Scripts With Your Main JavaScript File

If one or more of these third party widgets are critical to your user experience, then you should be loading them immediately, not asynchronously.

To do this you'll need to add a step to your build process that downloads these external dependencies, bundles them with your other scripts, and produces a single, minified JavaScript file that is loaded immediately preceding the closing `</body>` tag.

In many ways, downloading and serving these social scripts yourself is safer and more resilient than loading them on the fly from a domain you don't control. In fact, you could even take this approach if you're loading these scripts after the `load` event. Bundling them together reduces the total number of requests and it allows you to control exactly what code (and what version of that code) is being run.

On the other hand, if your users have those social scripts cached (as many do) bundling them will negate that performance benefit. You'll have to weigh the pros and cons of each approach for yourself.

## Conclusion

I know that copying and pasting social code is dead simple. And I know that trying to figure out what each snippet is doing (and then optimizing it for your specific needs) will take time. But I hope this article gives you the courage and the motivation to try. At the very least, if you're going to use someone's pre-packaged code, you should have a good reason.

In addition, I hope that more companies will follow the example set by Google Analytics and post an unminified, commented version on their snippets on their developer sites. There's no reason to force users into the lowest common denominator. Give your non-savvy users the simplest option, but don't assume your more technical users aren't capable of customizing the code to fit their needs.

## Additional Resources

- [Deep dive into the murky waters of script loading](http://www.html5rocks.com/en/tutorials/speed/script-loading/)
- [WHATWG Scripting Spec](http://www.whatwg.org/specs/web-apps/current-work/multipage/scripting-1.html)
