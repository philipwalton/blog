<!--
{
  "layout": "article",
  "title": "Measuring Your Site's Responsive Breakpoint Usage",
  "date": "2014-12-18T09:37:36-08:00",
  "tags": [
    "JavaScript",
    "CSS"
  ]
}
-->

We all know that mobile is a big deal, and the number of people accessing the web from mobile devices is increasing, rapidly, every year. You may have seen headlines or read statistics that cites facts like: *now XX percentage of Facebook's traffic comes from mobile devices&hellip;*

It can be easy to hear statistics like that and assume you need to ramp up your mobile strategy, but we all (hopefully) know that what's true of Facebook's users isn't necessarily true of your own.

Now, I'm not saying you shouldn't build a mobile friendly site (in fact, you probably should), I'm simply saying you shouldn't build one just because you read a headline about some site's usage statics on mobile.

The only way to optimize for the needs of your users is to measure what they're actually doing.

## Measurement tools

Most web analytics tools will, without any special configuration, tell you if a user is viewing your site from a mobile device. They'll also typically tell you the user's browser and platform.

While this data can be useful for some things, from a responsive design perspective, it's not particularly helpful.

If your site is built responsively and its layout changes based on matching predefined media queries (i.e. breakpoints), that information can be *far* more valuable than what device a user happens to have. If your site's design changes dramatically at a particular viewport size, and you need to measure the success or usability of that layout, simply knowing the user's device is, quite frankly, not good enough. You need to know what breakpoint they're at.

Fortunately, many analytics tools (like Google Analytics) allow you to send custom data to track just this sort of information.

*Note: the rest of this article explains how to measure breakpoint usage in Google Analytics, but the concepts will likely apply to other analytics tools.*

## Custom dimensions and metrics

In Google Analytics, a metric is a countable interaction that can be measured. For example, common metrics are things like users (the number of visitors who came to your site) and pageviews (the number of pages those users visited). Metrics are always a number.

Dimensions are how you subdivide your metrics into relavent categories. For example, if users is the metric, the sex of the user, the browser they're using, or the country they're browsing from, these are also examples of dimensions.

For pretty much any metric you care about (users, sessions, pageviews, etc.) it's valuable to know what breakpoint was active at the time. In other words, the breakpoint is the dimensions you want to track.

Google Analytics doesn't have a built-in dimensions called breakpoint, but it does allow you to [create your own custom dimensions](https://support.google.com/analytics/answer/2709829). Once you've created the custom dimensions, you can use it just like you'd use any other dimensions. I'll show you how with code below.

## Tracking breakpoints with Google Analytics

Google Analytics uses the [analytics.js](https://developers.google.com/analytics/devguides/collection/analyticsjs/) library to send data to the Google Analytics back-end. If you've used analytics.js before, you're probably used to seeing code that looks like this:

```js
ga('create', 'UA-XXXX-Y', 'auto');
ga('send', 'pageview');
```

While this article isn't meant to be a tutorial on analytics.js, I do think it's important to understand the basics of what's going on, especially as you start implementing breaking tracking yourself.

The above code does two things. First it creates a tracker object, and then it sends a pageview hit to Google Analytics. The important thing to understand is that when you create a new tracker object in analytics.js, it collects a bunch of important information about the user and the browsing context, e.g. the page title, the URL in the address bar, the screen and window size, etc. These are, in effect, your dimensions.

The second thing the code does is send a pageview hit to Google Analytics. Now, this isn't clear from looking at the code itself, but if you inspect the HTTP request in the network tab of your web inspector, you'll see that all the information the tracker object collected about the user and the browsing context is sent as well. This means that if we want to track breakpoint information, we're goign to need to figure out what breakpoint is currently active and store that information on the current tracker before sending the pageview hit to Google Analytics.

To figure out what breakpoint is active, you can use the [`matchMedia`](https://developer.mozilla.org/en-US/docs/Web/API/Window.matchMedia) method:

```js
if (window.matchMedia('(min-width: 400px)'').matches) {
  // This breakpoint is active.
}
else {
  // This breakpoint is NOT active.
}
```

The `matchMedia` method returns a `MediaQueryList` object and that object has a `matches` property. Note that this object is "live" in the sense that the `matches` property will automatically update when you change your window size or device orientation. This means that you only need to instantiate one `MediaQueryList` object per breakpoint.

### Defining breakpoints as dimensions

Depending on how you write your media queries, there may be more than one matching at a time. If you use a mobile-first approach (as this site does) where your default styles have no `@media` rules and then larger screen widths add additional rules, you'll have situations where all of your media queries match at the same time.

This is fine for CSS, but from an analytics perspective dimensions are typically exclusive rather than inclusive. You wouldn't want to have a situation where you were on both on the `/about` page at the same time as you were on the `/contact` page; similiarly, you want to define your analytics breakpoints in such a way that only one matches at a time.

At the time of this writing, this site [defines the following breakpoints](https://github.com/philipwalton/blog/blob/03452d29533cbc85fe863b5917f43cf1638a8236/_styles/base/custom-media.css):

```text
sm : (min-width: 420px)
md : (min-width: 570px)
lg : (min-width: 800px)
xl : (min-width: 1000px)
```

As you can see, these are inclusive. When my viewport is wider than 1,000 pixels, all of these media queries will match.

To make these exclusive, I have to [translate them](https://github.com/philipwalton/blog/blob/03452d29533cbc85fe863b5917f43cf1638a8236/_scripts/analytics.js#L7-L13) as follows:

```text
xs : (max-width: 419px)
sm : (min-width: 420px) and (max-width: 569px)
md : (min-width: 570px) and (max-width: 799px)
lg : (min-width: 800px) and (max-width: 999px)
xl : (min-width: 1000px)
```

Note that I'm not saying you need to rewrite you CSS. I'm simply saying that the JavaScript logic you use to determine the curretly active breakpoint needs to only match one of these at a time.

### Matching media

To figure out which breakpoint is matching in JavaScript, you just loop through your breakpoints, create a `MediaQueryList` instance for each breakpoint, and check its `matches` property.

Given the following breakpoint object:

```js
var breakpoints = {
  xs: '(max-width: 419px)',
  sm: '(min-width: 420px) and (max-width: 569px)',
  md: '(min-width: 570px) and (max-width: 799px)',
  lg: '(min-width: 800px) and (max-width: 999px)',
  xl: '(min-width: 1000px)'
};
```

Here's how you can find the active breakpoint:

```js
Object.keys(breakpoints).forEach(function(breakpoint) {
  var mql = window.matchMedia(breakpoints[breakpoint]);
  if (mql.matches) {
    // The breakpoint matches, so let analytics.js know!
  }
});
```

### Tracking the matching breakpoint

Once you know which breakpoint is matching, you need to update your tracker object. To update the tracker object in analytics.js, you invoke the `set` method and pass in either a key and a value or an object of key/value pairs.

```js
ga('set', 'key', 'value');
```

Since we're using custom dimensions, the key is going to be `dimensionN` where `N` is the index corresponding to this particular custom dimension. (Note: the index corresponds to the order you created them in Google Analytics. If this is the first custom dimensions you've ever create, it will be `dimension1`).

The above code now becomes:

```js
Object.keys(breakpoints).forEach(function(breakpoint) {
  var mql = window.matchMedia(breakpoints[breakpoint]);
  if (mql.matches) {
    **ga('set', 'dimensionN', breakpoint);**
  }
});
```

## Tracking breakpoint changes

In addition to knowing what breakpoint is active for a particular metric, it may also be useful to know how frequenly your users change breakpoints.

To track breakpoint changes in Google Analytics you can use [event tracking](https://developers.google.com/analytics/devguides/collection/analyticsjs/events). Events usually have a category, action, and label. In the context of breakpoint tracking, the category could be "breakpoint" (or "media", or "custom-media"), the action could be "change", and the label would be the name that you've given the breakpoint (e.g. "sm", "md", "lg", etc.).

Sending an event hit that tracks a breakpoint change might look like this:

```js
ga('send', 'event', 'breakpoint', 'change', 'sm');
```

Note that this event records the breakpoint after the change and doesn't record what the breakpoint was before to the change. This is probably fine for most use-cases (it's what I do). If you wants to record both, you could alter how you notate the action and the label.

### Detecting media changes

`MediaQueryList` objects, in addition to having a `matches` property, may also register listeners to detect changes. To register a callback on a `MediaQueryList` object, use the `addListener` method:

```js
var mql = window.matchMedia('(min-width: 400px)');
mql.addListener(function() {
  if (mql.matches) {
    // This breakpoint didn't match before, but now it does.
  }
  else {
    // This breakpoint now matches.
  }
});
```

Since our previous code already created a `MediaQueryList` object for each breakpoint, we can easily add our listeners to that existing code.

```js
Object.keys(breakpoints).forEach(function(breakpoint) {
  var mql = window.matchMedia(breakpoints[breakpoint]);

  // Set the initial breakpoint on page load.
  if (mql.matches) {
    ga('set', 'dimensionN', breakpoint);
  }

  // Update the breakpoint as the matched media changes, and send an event.
  mql.addListener(function() {
    if (mql.matches) {
      ga('set', 'dimensionN', breakpoint);
      ga('send', 'event', 'breakpoint', 'change', breakpoint);
    }
  });
});

```

Since a browser window can be resized very quickly and the matched media can change a lot in a short period of time, it's probably not wise to send a hit on every single change. Instead, you can rate-limit your function calls to ensure you only send a hit onces the changes have settled.

If you're already using a library like [lodash](https://lodash.com/docs#debounce) you can use its debounce function, or you can pretty easily write your own.

The following changes apply a debounce of one second to the change listener. In plain English, the hit will be aborted if another change is detected at any point within the next second:

```js
// Create a timeout reference in an external scope.
**var timeout;**

Object.keys(breakpoints).forEach(function(breakpoint) {
  var mql = window.matchMedia(breakpoints[breakpoint]);

  // Set the initial breakpoint on page load.
  if (mql.matches) {
    ga('set', 'dimensionN', breakpoint);
  }

  // Update the breakpoint as the matched media changes, and send an event.
  mql.addListener(function() {
    if (mql.matches) {
      **clearTimeout(timeout);**
      **timeout = setTimeout(function() {**
        ga('set', 'dimension1', breakpoint);
        ga('send', 'event', 'breakpoint', 'change', breakpoint);
      **}, 1000);**
    }
  });
});
```

Even if you don't care about knowing when breakpoints change, it's still critical to update the tracker when they do. Since all hits you send to Google Analytics contain the information stored on the current tracker, if the active breakpoint has changed and you haven't updated it, you'll be sending bad information with any future hits. If you're only tracking pageview that may not matter, but if you're doing any sort of event, social, or exception tracking, or if you're building a single page application, it's essential that you update the tracker with any new information.

## Wrapping up

If your site is built using responsive design, measuring and understanding how your users are interacting with your site at the various breakpoints critical to making informated design decisions in the future.

Services like Google Analytics make it easy to track custom datatypes, specific to your site's needs.








