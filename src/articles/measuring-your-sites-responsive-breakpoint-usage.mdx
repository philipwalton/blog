Most web analytics tools will give you a lot of information about your users' devices. These insights can be extremely useful for measuring trends and are particularly important if you have a separate mobile and desktop site or a different design for Android and iOS. But if you've built your site responsively, device information just doesn't tell the whole story.

Responsive design aims to divorce itself from device or platform-specific factors. Instead, it adapts to device-agnostic properties like screen size, pixel density, and device orientation.

If your site is built on device-less principles, but its usage is measured against device-only metrics, you're going to get a mismatch&mdash;potentially a big one.

## The device problem

To illustrate this problem, consider the iPhone. The range of iPhone screen sizes can go from 320 pixels on an iPhone 5s in portrait mode to 960 pixels on an iPhone 6 plus in landscape mode. That's a *huge* range. In fact, on this site that range covers four out of the five total breakpoints.

If you want to glean any useful information about the effectiveness of a design at a particular breakpoint, you can't do that with device data alone. In short, sites built responsively should be measuring breakpoint usage *in addition* to device usage.

If our design methodologies aim to be device-agnostic, why are so many of our analytics tools so device-focused? The answer, of course, is that these tools do not know how you've built your site, the media queries you care about, or what you've chosen to call them.

Fortunately, tools like Google Analytics allow you to send custom dimensions and metrics to track exactly this type of user-specific data.

*Note: the rest of this article explains how to measure breakpoint usage in Google Analytics, but the concepts and code samples should apply to other platforms as well.*

## Custom dimensions and metrics

In Google Analytics, a metric is an interaction that can be counted or quantified. Common metrics are things like users (the number of visitors who came to your site), sessions (the number of visits those visitors made), and pageviews (the number of pages those visitors viewed). Since metrics are quantifiable, they are always a numeric datatype.

Dimensions are how you subdivide your metrics into relevant categories. For example if your metric is pageviews, you may want to subdivide that by page path or page title. Similarly, if your metric is users you  may want to subdivide that by the user's browser or geographic location. Dimensions are typically strings, but they may be other datatypes like numbers or dates.

Given this, it's hopefully clear that you'd want to track responsive breakpoints as a custom dimension. If your site had 1,000 pageviews on Tuesday, you may be curious to know how many of those pages were displayed at the smallest breakpoint verses the larger ones. For pretty much any metric you care about (users, sessions, pageviews, etc.), it's valuable to know what responsive breakpoint was active at that time of the interaction.

If you've never created a custom dimension in Google Analytics, you can follow [these instructions](https://support.google.com/analytics/answer/2709829) from the Google Analytics Help Center. I chose to name my custom dimension "breakpoint" (you can choose whatever name you like), and since knowing the active breakpoint is useful for pretty much any interaction, I selected the scope "hit".

Once you've created the custom dimension, you can use it just like you'd use any other dimension.

## Tracking breakpoints with Google Analytics

Google Analytics uses the [analytics.js](https://developers.google.com/analytics/devguides/collection/analyticsjs/) library to send data to the Google Analytics back-end. If you've used analytics.js, you've probably seen this code before:

```js
ga('create', 'UA-XXXX-Y', 'auto');
ga('send', 'pageview');
```

While this article isn't meant to be a tutorial on analytics.js, I do think it's important to understand the basics of what's going on. Especially as you start implementing more advanced features.

The above code does two things. First it creates a tracker object, and then it sends a pageview hit to Google Analytics. The important thing to understand is that when you create a new tracker object in analytics.js, the tracker, upon instantiation, collects a bunch of important information about the current browsing context, e.g. the page title, the URL in the address bar, the screen and window size, etc. These are, in effect, your dimensions.

The second thing the code does is send a pageview hit to Google Analytics. Whenever you send a hit to Google Analytics, it sends all of the context data currently stored on the tracker along with that hit. This means that if you want to track breakpoint information, you'll need to figure out what breakpoint is currently active and store that information on the tracker prior to sending any hits to Google Analytics.

To figure out what breakpoint is active, you can use the [`matchMedia`](https://developer.mozilla.org/en-US/docs/Web/API/Window.matchMedia) method:

```js
var mql = window.matchMedia('(min-width: 400px)');

if (mql.matches) {
  // The viewport width is greater than or equal to 400px.
}
else {
  // The viewport width is less than 400px.
}
```

The `matchMedia` method returns a `MediaQueryList` object, which has a `matches` property. Note that this object is "live" meaning the `matches` property will automatically update when you change your window size or device orientation. This means that you only need to instantiate one `MediaQueryList` object per breakpoint.

### Defining breakpoints as dimensions

Depending on how you write your media queries, there may be more than one matching at a time. If you use a mobile-first approach (as this site does), your base styles use no `@media` rules and apply to all viewport sizes. Larger viewport sizes then apply additional rules as needed. At very large screen sizes, all of your size-based media queries will match at the same time.

This is fine for CSS, but from an analytics perspective, a dimension can only have a single value. Obviously you wouldn't want to have a pageview associated with both the `/about` page and the `/contact` page simultaneously. Similarly, you must write your code so that only one breakpoint dimension matches at a time.<sup>[[1]](#footnote-1)</sup>

At the time of this writing, this site [defines the following breakpoints](https://github.com/philipwalton/blog/blob/03452d29533cbc85fe863b5917f43cf1638a8236/_styles/base/custom-media.css) in CSS:

```
sm : (min-width: 420px)
md : (min-width: 570px)
lg : (min-width: 800px)
xl : (min-width: 1000px)
```

There are two things worth noting here. First, when the viewport width is smaller than 420 pixels, no media queries will match. Second, when the viewport is wider than 1,000 pixels, all of these media queries will match.

In order to only report one matching breakpoint at a time, I needed to tweak their definitions slightly in my JavaScript code. I [rewrote them](https://github.com/philipwalton/blog/blob/03452d29533cbc85fe863b5917f43cf1638a8236/_scripts/analytics.js#L7-L13) as follows:

```js
var breakpoints = {
  xs: '(max-width: 419px)',
  sm: '(min-width: 420px) and (max-width: 569px)',
  md: '(min-width: 570px) and (max-width: 799px)',
  lg: '(min-width: 800px) and (max-width: 999px)',
  xl: '(min-width: 1000px)'
};
```

As you can see I added an "xs" breakpoint to cover the extremely small widths, and I added `max-width` logic to the middle breakpoints to make them exclusive.

### Matching media

To figure out which breakpoint is currently matching, you just iterate over the items in your `breakpoints` object, create a `MediaQueryList` instance for each one, and check its `matches` property.

Given the breakpoint object shown above, here's how you can find the active breakpoint:

```js
Object.keys(breakpoints).forEach(function(breakpoint) {
  var mql = window.matchMedia(breakpoints[breakpoint]);
  if (mql.matches) {
    // This breakpoint matches.
  }
});
```

### Tracking the matching breakpoint

Once you know which breakpoint is matching, you need to update the tracker object. To update the tracker object in analytics.js, you call the `set` method and pass in a key and a value (or an object of key/value pairs).

```js
ga('set', 'key', 'value');
```

Since we're using a custom dimension, the key is going to be `'dimensionN'` where "N" is the index Google Analytics assigned to this particular custom dimension at creation time. (If this is the first custom dimension you've created for this Google Analytics [property](https://support.google.com/analytics/answer/2649554), it will be `'dimension1'`)

The above code now becomes (changes highlighted):

```js
Object.keys(breakpoints).forEach(function(breakpoint) {
  var mql = window.matchMedia(breakpoints[breakpoint]);
  if (mql.matches) {
    **ga('set', 'dimensionN', breakpoint);**
  }
});
```

### Detecting breakpoint changes

In addition to knowing what breakpoint is active at pageload, it's also important to know when the active breakpoint changes. If you don't update the tracker object as the active breakpoint changes, all subsequent hits will be associated with the wrong breakpoint. (Subsequent hits could be things like events, exceptions, social hits, or dynamically loaded pageviews in a single-page app).

To detect when a `MediaQueryList` object's `matches` property changes, you can register a listener on it via the `addListener` method:

```js
var mql = window.matchMedia('(min-width: 400px)');

mql.addListener(function() {
  if (mql.matches) {
    // The viewport width is now greater than or equal to 400 pixels.
  }
  else {
    // The viewport width is now less than 400 pixels.
  }
});
```

### Updating the tracker when the active breakpoint changes

To update the active breakpoint stored on the tracker object, you can add listeners to each `MediaQueryList` object already created. You'll need to make sure and check that its `matches` property is `true` since listener callbacks are invoked when a media query matches as well as when it no longer matches.

```js
Object.keys(breakpoints).forEach(function(breakpoint) {
  var mql = window.matchMedia(breakpoints[breakpoint]);

  // Set the initial breakpoint on page load.
  if (mql.matches) {
    ga('set', 'dimensionN', breakpoint);
  }

  // Update the breakpoint as the matched media changes.
  mql.addListener(function() {
    if (mql.matches) {
      ga('set', 'dimensionN', breakpoint);
    }
  });
});

```

### Tracking breakpoint changes

In addition to updating the tracker, it may also be interesting to learn how frequently your users change breakpoints mid-session. The conventional wisdom suggests that only developer-types resize their browser window, but aren't you curious to know for sure?

You can track breakpoint changes in Google Analytics using [event tracking](https://developers.google.com/analytics/devguides/collection/analyticsjs/events). Events usually have a category, action, and label. On this site I chose the category "breakpoint", the action "change", and the label as whatever the current breakpoint is (e.g. "sm", "md", "lg", etc.).

Sending an event hit that tracks a breakpoint change might look like this:

```js
ga('send', 'event', 'breakpoint', 'change', 'sm');
```

You can add this event tracking code to your existing breakpoint change listeners. Make sure you update the tracker object with the new breakpoint before you send the event, otherwise the event will be associated with the previous breakpoint.

```js
Object.keys(breakpoints).forEach(function(breakpoint) {
  var mql = window.matchMedia(breakpoints[breakpoint]);

  // Set the initial breakpoint on page load.
  if (mql.matches) {
    ga('set', 'dimensionN', breakpoint);
  }

  // Update the breakpoint as the matched media changes.
  mql.addListener(function() {
    if (mql.matches) {
      ga('set', 'dimensionN', breakpoint);
      **ga('send', 'event', 'breakpoint', 'change', breakpoint);**
    }
  });
});

```

### Debouncing rapid changes

If a browser window is resized from small to large (or vise versa) very quickly, you'll likely report several "change" events that aren't "real" and can negatively affect your data quality. To avoid this, you'll probably want to rate-limit your function calls to ensure you only send a change event after all changes have settled.

This rate-limiting can be done by adding a debounce of one second to the change listener function. In plain English that means a hit will only be sent if another change isn't detected within the next second. This is implemented using a simple `setTimeout`:

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
        ga('set', 'dimensionN', breakpoint);
        ga('send', 'event', 'breakpoint', 'change', breakpoint);
      **}, 1000);**
    }
  });
});
```

## Reporting breakpoint usage

I don't want to spend too much time talking about how to view your breakpoint data in Google Analytics, but since this article deals with custom dimensions, and reporting on custom dimensions is a slightly advanced topic, I think it warrants at least a mention.

To view the custom dimension data you've collected in Google Analytics you'll need to create a [custom report](https://support.google.com/analytics/answer/1033013?hl=en&ref_topic=1012046). You can create a custom report following [these instructions](https://support.google.com/analytics/answer/1151300?hl=en&ref_topic=1012046). When asked, select a report type of either "Explorer" or "Flat Table". The metric you choose is up to you (pageviews is probably a good start), and the dimension will be whatever you named your custom dimension.

If you want to create a custom report showing breakpoint change events, use the metric "Total Events", the dimension "Event Label", and add two filters so the "Event Category" is "breakpoint" and the "Event Action" is "change".

Alternatively you can query the Google Analytics Core Reporting API to get the same data. The following two reports use the [Query Explorer](https://ga-dev-tools.appspot.com/query-explorer/) to access the API (these assume your custom dimension has an index of 1):

- [Pageviews (by breakpoint)](https://ga-dev-tools.appspot.com/query-explorer/?start-date=30daysAgo&end-date=yesterday&metrics=ga%3Asessions&dimensions=ga%3Adimension1&sort=-ga%3Asessions)
- [Breakpoint change events (by breakpoint)](https://ga-dev-tools.appspot.com/query-explorer/?start-date=30daysAgo&end-date=yesterday&metrics=ga%3AtotalEvents&dimensions=ga%3AeventLabel&filters=ga%3AeventCategory%3D%3DBreakpoint%2Cga%3AeventAction%3D%3Dchange)

## Wrapping up

If your site is built using responsive design, measuring and understanding how your users are interacting with your site at the various breakpoints is critical to making informed design decisions in the future.

And implementing breakpoint tracking with services like Google Analytics is fairly straightforward. Here is the final code to implement breakpoint tracking that combines all the techniques described in this article:

```js
var timeout;
var breakpoints = {
  xs: '(max-width: 419px)',
  sm: '(min-width: 420px) and (max-width: 569px)',
  md: '(min-width: 570px) and (max-width: 799px)',
  lg: '(min-width: 800px) and (max-width: 999px)',
  xl: '(min-width: 1000px)'
};

Object.keys(breakpoints).forEach(function(breakpoint) {
  var mql = window.matchMedia(breakpoints[breakpoint]);

  // Set the initial breakpoint on page load.
  if (mql.matches) {
    ga('set', 'dimensionN', breakpoint);
  }

  // Update the breakpoint as the matched media changes, and send an event.
  mql.addListener(function() {
    if (mql.matches) {
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        ga('set', 'dimensionN', breakpoint);
        ga('send', 'event', 'breakpoint', 'change', breakpoint);
      }, 1000);
    }
  });
});
```

Feel free to use this code on your site, but don't forget to change the breakpoints to whatever you're using. If you'd like to see what my implementation looks like (it's almost exactly the same), you can find the code on [Github](https://github.com/philipwalton/blog/blob/03452d29533cbc85fe863b5917f43cf1638a8236/_scripts/analytics.js#L7-L42).

<aside class="Footnotes">
  <h1 class="Footnotes-title">Footnotes:</h1>
  <ol class="Footnotes-items">
    <li id="footnote-1">There may be situations where you want to track more than one matching media query at the same time. A good example of this would be tracking screen width <em>and</em> device pixel density. In such cases it's best to track these with two separate dimensions. Within a single dimension, only one value can apply at a time.</li>
  </ol>
</aside>
