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

If you've ever built a website for a client or even for yourself, at some point you've probably wanted to include some third party service. Whether it be social sharing buttons, Disqus comments, Google Analytics, YouTube Videos, they all come with nice little copy-and-paste snippets that make it super easy to integrate into your site.

If you haven't already figured it out from the title, I think you should stop doing that.

If you're reading my blog, chances are you're a developer of some sort, and as a developer you should be capable of understanding how code works. One size fits all solution as great for people who don't know how to code, but you're not one of those people.

So stop copying and pasting social snippets. Seriously. There are so many reasons why it's bad, and no good reasons (other than laziness) to do it.

Instead, you should look at the code, figure out what it's doing, and more often than not, you can get the exact same behavior for a fraction of the price.

The vast majority of social snippets out there are all doing the same thing. They add an HTML element and some JavaScript code that asynchronously downloads a script form their site in order to transform the element in the snippet into whatever they want.

Let's take a look at the tweet button as an example:

```xml
<a href="https://twitter.com/share" class="twitter-share-button" data-lang="en">Tweet</a>
<script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>
```

This is the [officially recommend](https://dev.twitter.com/docs/tweet-button) tween button share code from Twitter's develop website. It's all minified so it might be intimidating, but if you give it a chance, I'm sure you can figure out what it's doing.

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

There. That's not so bad. There's an immediately invoked function expression that is passed the `document`, the string "script", and the string "twitter-wjs". If I replace those variables, I can make it even easier to read.

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

Now let's take a look at another snippet. This time from Disqus:

```xml
<div id="disqus_thread"></div>
<script type="text/javascript">
/* * * CONFIGURATION VARIABLES: EDIT BEFORE PASTING INTO YOUR WEBPAGE * * */
var disqus_shortname = ''; // required: replace example with your forum shortname

/* * * DON'T EDIT BELOW THIS LINE * * */
(function() {
var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
(document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
})();
</script>
<noscript>Please enable JavaScript to view the <a href="http://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>
<a href="http://disqus.com" class="dsq-brlink">comments powered by <span class="logo-disqus">Disqus</span></a>

```

Now let's format the main part of the script to make it a bit easier to read:

```javascript
var dsq = document.createElement('script');
dsq.type = 'text/javascript';
dsq.async = true;
dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
(document.getElementsByTagName('head')[0]
  || document.getElementsByTagName('body')[0]).appendChild(dsq);
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





