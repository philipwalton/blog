All analytics tools I know of track pageviews in a way that -- to put it bluntly -- just doesn't work for a growing number of websites today and is completely incompatible with the direction the web is heading.

For the most part, these tools assume (by default) that each pageview corresponds to a full page load, and that each page load runs some analytics tracking code, and sends a pageview to a back-end server. Anything that deviates from this model requires extra work on the part of the site developer -- work most developers don't have the time or expertise to do.

The reality is the web has changed a lot in the last 10-15 years, and more and more websites don't fit this traditional model. Our analytics tools haven't kept up.

## The problem

To give you a specific example, consider [mail.google.com](https://mail.google.com) (Gmail). Most people who use Gmail in their browser keep it open in a background and switch to it every once in a while to see if they have any new messages. When they do, they click on the message to read it.

The vast majority of Gmail users almost never reload the page, which raises a few important questions from an analytics point of view:

* If a user loads Gmail once, and then uses it hundreds of times over the next few days without reloading, should that really only be considered one pageview?
* If a user clicks the Google logo to refresh the content (or via pull to refresh in the mobile version of the app), should that be considered a pageview? Is that usage functionally different from refreshing the page to load new content?
* What about when the user loads a new message, should that be considered a new pageview?
* If two users visit Gmail the exact same number of times per day, but one of them loads the site anew every time and the other leaves it open in a background tab, should those two usage patterns result in dramatically different pageview counts?

While these questions are mostly specific to a single type of application (Gmail), they bring up a much larger, more interesting question:

*Is it possible to design an analytics tool that works the same with any type of site, regardless of how it's implemented?*

In other words, imagine you install analytics on a traditional content site. A few months later you update that site to be a [single page application](https://en.wikipedia.org/wiki/Single-page_application) (SPA) without changing your analytics code. Then, a few months after that, you update your site to be a [progressive web app](https://developers.google.com/web/progressive-web-apps/) (PWA) that reloads content in the background and works offline (again, without updating your analytics code). If the number of visitors you get to your site and the way they use it remains roughly the same, wouldn't you expect your analytics data to remain the same as well? And if it didn't, wouldn't you consider that a failure on the part of your analytics provider?

## The solution

I think there is a solution, and the solution I propose takes a cue from the metric name itself: *Pageviews*.

Instead of tracking how many times a page was loaded, track how many times it was *viewed*. We can do this with the [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), which has actually been around for quite some time and is [well supported](http://caniuse.com/#feat=pagevisibility) in all browsers, both on desktop and mobile.

As it turns out, tracking how often the page was *viewed* rather than how often it was *loaded* elegantly handles a surprising number of cases that fail using the current model:

* When users leave an app in a background tab and switch to it hours or days later without reloading
* When users leave a tab open as a reference and switch to it often for quick access to the content (again, without reloading the page).
* When users open a page in a background tab and then forget about it (never actually viewing the content).

The Page Visibility API consists of both the [`document.visibilityState`](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState) property as well as the [`visibilitychange`](https://developer.mozilla.org/en-US/docs/Web/Events/visibilitychange) event. With these two pieces you can ensure that pageviews are never sent unless the page's `visibilityState` is `visible`, and you can also send pageviews in cases where a user returns to your site after it's been in a background tab for a while, by listening for `visibilitychange` events where the page's `visibilityState` goes from `hidden` to `visible` after the page has already loaded. This solves the problem of how to track pageviews on apps that never need to be reloaded.

The second part to the solution is the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History), which (now that it's [supported in all browsers](http://caniuse.com/#feat=history)) is the de facto way developers build SPAs. As a result, analytics tools can listen for changes to the URL and send pageviews whenever that happens. This allows SPAs to be tracked exactly the same way traditional sites are tracked.

## Technical details

The basic idea for tracking pageviews with the Page Visibility and History APIs is as follows (and these steps can be applied to any website, regardless of whether it's a traditional content site, SPA, or PWA):

1. When the page loads, send a pageview if the visibility state is visible.
2. If the visibility state is not visible wait for the visibility state to change to visible and send the pageview at that point
3. If the visibility state changes from hidden to visible and enough time has passed since the previous interaction by this user, send a pageview.
4. If the URL changes (just the [pathname](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/pathname) or [search](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/search) part, not the [hash](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/hash) part since that's used for anchor links) send a pageview.

<div class="Info">

**Note:** if you use [autotrack](https://github.com/googleanalytics/autotrack) (specifically the [pageVisibilityTracker](https://github.com/googleanalytics/autotrack/blob/master/docs/plugins/page-visibility-tracker.md) and [urlChangeTracker](https://github.com/googleanalytics/autotrack/blob/master/docs/plugins/url-change-tracker.md) plugins), you don't have to worry about implementing this logic yourself. These plugins handle all of this for you automatically (with configuration options to customize the behavior).

</div>

The third step above is the most important one, and it's also the most ambiguous. The question is: *How long is "enough time" since the previous user interaction?*

On the one hand, you wouldn't want to track every visibility state change as a new pageview since it's common for users to frequently switch between tabs (and in fact some apps work best when used in multiple tabs at the same time and expect a lot of tab switching).

On the other hand, you want to capture the fact that a user is *returning* to your site or application after not using it for a while (i.e. a separate usage instance rather than a single, continuous usage instance).

Luckily, all analytics tools already define a way to differentiate between distinct usage instances, they're called [sessions](https://support.google.com/analytics/answer/2731565).

A session is a group of interactions that take place within a given time frame, and a session ends when some predetermined timeout period has passed. For example, by default, in Google Analytics, a sessions ends when there's 30 minutes of inactivity. Most analytics tools give users a way to customize the session timeout amount if they want.

So getting back to the third step in the list above, my proposal is that if a user's session has timed out and the page's visibility state changes from hidden to visible, a new pageview should be sent. Visibility state changes that occur in the middle of a session should not be considered distinct pageviews (though they can still be tracked as events if that information is relevant to you).

### Handling false positives

When I was initially creating the pageVisibilityTracker plugin for autotrack I did a lot of thorough testing of various Page Visibility API tracking implementations, and it became clear that heuristics are necessary to avoid false positives.

For example, it's quite common for users to use the keyboard to quickly switch through a bunch of open tabs, which ends up meaning lots of sites have their visibility state transition from hidden to visible only to have it immediately transition back to hidden after a second or two.

In my testing, a substantial portion of pageviews that resulted from a visibility state change to visible after a session timeout were followed by a subsequent visibility state change back to hidden within a few seconds of the original change. In more than 99% of the new sessions that contained only this pageview, the change back to hidden happened within five seconds of the change to visible.

This makes sense as I know from my own usage patterns that it's quite common to accidentally switch to a tab only to immediately leave, to switch to a tab only because it's on my way to another tab that I'm actually trying to switch to, or to switch to a tab only to immediately close it. In all of these cases, it doesn't make sense to initiate another pageview (which will also initiate a new session), and adding a five second timeout prevents more than 99% of these false positives.

<div class="Info">

**Note:** autotrack's [pageVisibilityTracker](https://github.com/googleanalytics/autotrack/blob/master/docs/plugins/page-visibility-tracker.md) plugin lets you customize this timeout in the event you have good reason to make it longer or shorter.

</div>

### Pageviews versus page loads

In some cases you may be interested in knowing how often your pages are loaded but not viewed, or just distinguishing between a pageview that's the result of a visibility state change or dynamically fetching content in an SPA and a pageview from the initial page load.

While you could create a custom dimension to annotate this (something I usually do), this problem makes it clear that what we really need is two separate metrics: *Pageviews* and *Page Loads.*

Lucky, we don't have to wait for analytics tools to catch up, as we can do this today with [custom metrics](https://support.google.com/analytics/answer/2709828) (at least that's what they're called in Google Analytics), and in fact the pageVisibilityTracker plugin already comes with an option to track these metrics separately.

By decoupling pageviews from page loads we can fully embrace the intention behind the *Pageviews* metric: measuring how many times users *viewed* your page.

### Impact to sessions counts

Some readers might be wondering why all this matters. Who cares if you only track the initial page load? As long as you're tracking the relevant user interactions after the initial page load, why does it matter if you call it a pageview or not?

Again, while this may seem like a reasonable question, if you understand the data model most analytics tools use, you'll realize it breaks down rather quickly.

Most analytics tools assume that every session contains at least one pageview, and that pageview is used to determine dimensions like *Landing Page* and metrics like *Exits.* If you only track a pageview for the initial page load and then all subsequent sessions just contain events, most of your session reports will be messed up.

If a page was loaded in a background tab, and you're tracking page loads separately from pageviews (as described above), then I think it's acceptable to have a session without a pageviews (just a page load). But if the session contains user interaction events, then it doesn't make sense for those events to not be associated with a pageview since you can't interact with a page you haven't viewed (i.e. a page in a background tab).

## Wrapping up

Hopefully this post has convinced you of the need to rethink how we track pageviews, and if you happen to work on an analytics tool, I hope you can help me make this proposal a reality.

If you use Google Analytics, you can already take advantage of these ideas today by using [autotrack](https://github.com/googleanalytics/autotrack) (which I strongly recommend if you're building an SPA or PWA). And to see an example of how to implement autotrack with all of these techniques, see my [analyticsjs-boilerplate](https://github.com/philipwalton/analyticsjs-boilerplate) repo.

The bottom line is analytics tools are supposed to measure how users interact with your site, they're not supposed to measure implementation details that don't affect the user experience. If a non-UX change can dramatically impact what data is captured by analytics, something is broken.
