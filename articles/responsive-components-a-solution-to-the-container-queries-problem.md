Container queries is a [proposal](https://wicg.github.io/container-queries) that would allow web developers to style DOM elements based on the size of a containing element rather than the size of the browser viewport.

If you're a web developer, you've probably heard about container queries before. For about as long as we've had responsive web design, we've had developers asking for them (initially [element queries](https://ianstormtaylor.com/media-queries-are-a-hack/), then [changing to container queries](https://alistapart.com/article/container-queries-once-more-unto-the-breach)). In fact, container queries may well be the [most requested](https://adactio.com/journal/12585) CSS feature ever that we still don't have in browsers.

There are already [many](https://www.xanthir.com/b4PR0), [many](https://www.xanthir.com/b4VG0), [many](https://lists.w3.org/Archives/Public/public-respimg/2016Sep/0004.html) posts explaining exactly why container queries are hard to do in CSS and why browser makers have been hesitant to implement them. I don't want to rehash that discussion here.

Instead of narrowly focusing on the specific CSS feature proposal we call "container queries", I want to focus on the broader concept of building components that respond to their environment. And if you accept this larger framing, there are actually new web APIs that already let you achieve this.

That's right, we don't need to wait for container queries to start building responsive components. We can start building them now!

The strategy I'm going to propose in this article can be used today, and it's designed as an enhancement, so browsers that don't support the newer APIs or don't run JavaScript will work exactly as they currently do. It's also simple to implement (copy/paste-able), highly performant, and doesn't require any special build tools, libraries, or frameworks.

To see some examples of this strategy in action, I've built a [Responsive Components](https://philipwalton.github.io/responsive-components/) demo site. Each demo links to its CSS source code, so you can see how it works.

<figure>
  <video loop autoplay muted src="https://philipwalton.github.io/responsive-components/responsive-components-demo.mp4" type="video/mp4"></video>
  <figcaption>
    <a href="https://philipwalton.github.io/responsive-components/">Visit the demo site &#8594;</a>
  </figcaption>
</figure>

But before going too deep with the demos, you should read the rest of this post for an explanation of how the strategy works.

## The strategy

Most responsive design strategies or methodologies (this one will be no different) work according to these two core principles:

1. For each component, first define a set of generic, **base** styles that will apply no matter what environment the component is within.
2. Then define additions or **overrides** to those base styles that will apply at specific environment conditions.

The power of these principles is they work even if the browser doesn't support the features required to fulfill or enable specific environment conditions. And this includes cases where the feature requires JavaScript&mdash;users with JavaScript disabled will get the base styles, and those will work just fine.

In most cases the base styles defined in #1 above are styles that work on the smallest possible screen sizes (since small screens tend to be more restrictive than large screens), and they're not wrapped in any sort media query (so they apply everywhere).

Here's an example that defines base styles for `.MyComponent` and then override styles at two arbitrary breakpoints, `36em` and `48em`:

```css
.MyComponent {
  /* Base styles that work for any screen size */
}

@media (min-width: 36em) {
  .MyComponent {
    /* Overrides the above styles on screens larger than 36em */
  }
}

@media (min-width: 48em) {
  .MyComponent {
    /* Overrides the above styles on screens larger than 48em */
  }
}
```

Of course, these breakpoints use media queries, so they apply to the size of the browser viewport. What container query advocates want is the ability to do something like this (note, this is proposed syntax, not official syntax):

```css
.Container**:media(min-width: 36em)** > .MyComponent {
  /* Overrides that only apply for medium container sizes */
}
```

Unfortunately, the above syntax doesn't work in any browser today and probably won't anytime soon.

However, what *does work* today is something like this:

```css
.MyComponent {
  /* Base styles that work on any screen size */
}

**.MD** > .MyComponent {
  /* Overrides that apply for medium container sizes */
}

**.LG** > .MyComponent {
  /* Overrides that apply for large container sizes */
}
```

Of course, this code assumes the component containers have the correct classes added to them (in this example, `.MD` and `.LG`). But ignoring that detail for the moment, if you're a CSS developer who wants to build a responsive component, the second syntax probably still makes sense to you.

Whether you're writing your container query as an explicit length comparison query (the first syntax) or whether you're using named breakpoint classes (the second syntax), your styles are still declarative and functionally the same. As long as you can define your named breakpoints however you want, I don't see a clear benefit to one over the other.

And to clarify the rest of this article, let me define the named breakpoint classes I'm using with the following mapping (where `min-width` applies to the *container*, not the viewport):

<table>
  <tr>
    <th>Named breakpoint</th>
    <th>Container width</th>
  </tr>
  <tr>
    <td>SM</td>
    <td><code>min-width: 24em</code></td>
  </tr>
  <tr>
    <td>MD</td>
    <td><code>min-width: 36em</code></td>
  </tr>
  <tr>
    <td>LG</td>
    <td><code>min-width: 48em</code></td>
  </tr>
  <tr>
    <td>XL</td>
    <td><code>min-width: 60em</code></td>
  </tr>
</table>

Now all we have to do is ensure our container elements always have the right breakpoint classes on them, so the correct component selectors will match.

### Observing container resizes

For most of web development history, it's been possible to [observe changes to the window](https://developer.mozilla.org/en-US/docs/Web/Events/resize), but it's been hard or impossible (at least in a performant way) to observe size changes to individual DOM elements. This changed when Chrome 64 shipped [ResizeObserver](https://developers.google.com/web/updates/2016/10/resizeobserver).

`ResizeObserver`, following in the footsteps of similar APIs like [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) and [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), allows web developers to observe size changes to DOM elements in a highly-performant way.

Here's the code you need to make the CSS in the previous section work with `ResizeObserver`:

```js
// Only run if ResizeObserver is supported.
if ('ResizeObserver' in self) {
  // Create a single ResizeObserver instance to handle all
  // container elements. The instance is created with a callback,
  // which is invoked as soon as an element is observed as well
  // as any time that element's size changes.
  var ro = new ResizeObserver(function(entries) {
    // Default breakpoints that should apply to all observed
    // elements that don't define their own custom breakpoints.
    var defaultBreakpoints = {SM: 384, MD: 576, LG: 768, XL: 960};

    entries.forEach(function(entry) {
      // If breakpoints are defined on the observed element,
      // use them. Otherwise use the defaults.
      var breakpoints = entry.target.dataset.breakpoints ?
          JSON.parse(entry.target.dataset.breakpoints) :
          defaultBreakpoints;

      // Update the matching breakpoints on the observed element.
      Object.keys(breakpoints).forEach(function(breakpoint) {
        var minWidth = breakpoints[breakpoint];
        if (entry.contentRect.width >= minWidth) {
          entry.target.classList.add(breakpoint);
        } else {
          entry.target.classList.remove(breakpoint);
        }
      });
    });
  });

  // Find all elements with the `data-observe-resizes` attribute
  // and start observing them.
  var elements = document.querySelectorAll('[data-observe-resizes]');
  for (var element, i = 0; element = elements[i]; i++) {
    ro.observe(element);
  }
}
```

<aside class="Info">
  <strong>Note:</strong>
  this example uses ES5 syntax because (as I explain later) I recommend inlining this code directly in your HTML rather than including it in an external JavaScript file. Older syntax is used for wider browser support.
</aside>

This code creates a single `ResizeObserver` instance with a callback function. It then queries the DOM for elements with the `data-observe-resizes` attribute and starts observing them.  The callback function, which is invoked initially upon observation and then again after any change, checks the size of each element and adds (or removes) the corresponding breakpoint classes.

In other words, this code will turn a container element that's 600 pixels wide from this:

```html
<div data-observe-resizes>
  <div class="MyComponent">...</div>
</div>
```

Into this:

```html
<div **class="SM MD"** data-observe-resizes>
  <div class="MyComponent">...</div>
</div>
```

And these classes will automatically and instantly get updated anytime the container's size changes.

With this in place, now all the `.SM` and `.MD` selectors in the previous section will match (but not the `.LG` or `.XL` selectors), and that code will just work!


### Customizing your breakpoints

The code in the ResizeObserver callback above defines a set of default breakpoints, but it also lets you specify custom breakpoints on a per-component basis by passing JSON via the `data-breakpoints` attribute.

I recommend changing the code above to use whatever default breakpoint mappings make the most sense for your components, and then any component that needs its own set of specific breakpoints can define them inline:

```html
<div data-observe-resizes
     **data-breakpoints='{"BP1":400,"BP2":800,"BP3":1200}'**>
  <div class="MyComponent">...</div>
</div>
```

My Responsive Components site has an example of a component setting its own [custom breakpoints](https://philipwalton.github.io/responsive-components/#custom-breakpoints) alongside components using the default breakpoints.

### Handling dynamic DOM changes

The code example above only works for container elements that are already in the DOM.

For content-based sites this is usually fine, but for more complex sites whose DOM is constantly changing, you'll need to make sure you're observing all newly added container elements.

A one-size-fits-all solution to this problem is to expand the snippet above to include a MutationObserver that keeps track of all added DOM elements. This is [the approach I use](https://github.com/philipwalton/responsive-components/blob/cf93cc7/app/templates/_resize-observer.html#L47-L71) in the Responsive Components demo site, and it works well for small and medium-sized sites with limited DOM changes.

For larger sites with frequently-updating DOM, chances are you're already using something like [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) or a web framework with component lifecycle methods that track when elements are added and removed from the DOM. If that's the case, it's probably better to just hook into that mechanism. You probably even want to make a generic, reusable container component.

For example, a custom `<responsive-container>` element might look something like this:

```js
// Create a single observer for all <responsive-container> elements.
const ro = new ResizeObserver(...);

class ResponsiveContainer extends HTMLElement {
  // ...
  connectedCallback() {
    ro.observe(this);
  }
}

self.customElements.define('responsive-container', ResponsiveContainer);
```

<aside class="Info">
  <strong>Note:</strong>
  while it may be tempting to create a new ResizeObserver for every container element, it's actually much better to create a single ResizeObserver that observes many elements. To learn more, see <a href="https://groups.google.com/a/chromium.org/d/msg/blink-dev/z6ienONUb5A/F5-VcUZtBAAJ">Aleks Totic's findings on ResizeObserver performance</a> in the <a href="https://groups.google.com/a/chromium.org/forum/#!forum/blink-dev">blink-dev</a> mailing list.
</aside>

### Nested components

In my initial experimentation with this strategy, I didn't wrap each component with a container element. Instead, I used a single container element per distinct content area (header, sidebar, footer, etc), and in my CSS I used [descendant combinators](https://developer.mozilla.org/en-US/docs/Web/CSS/Descendant_selectors) instead of [child combinators](https://developer.mozilla.org/en-US/docs/Web/CSS/Child_selectors).

This resulted in simpler markup and CSS, but it quickly fell apart when I tried nesting components within other components (which many complex sites do). The problem is, with the descendant combinator approach, selectors would match multiple containers at the same time.

After building a few non-trivial demos, it became clear that a direct child/parent structure for each component and its container was far easier to manage and scale. Note that containers can still host more than one component, as long as every hosted component is a direct descendant.

### Advanced selectors and alternate approaches

The strategy I've outlined in this article takes an additive approach to styling component. In other words, you start with base styles and then add more styles on top. However, this isn't the only way to approach styling components. In some cases, you want to define styles that match exclusively and *only* apply at a particular breakpoint (i.e. instead of `(min-width: 48em)` you'd want something like `(min-width: 48em) and (max-width: 60em)`).

If this is your preferred approach, you'd need to tweak the ResizeObserver callback code slightly to only apply the class name of the currently-matching breakpoint. So if the component were at its "large" size, rather than setting the class name `SM MD LG`, you'd just set `LG`.

Then, in your CSS, you could write selectors like this:

```css
/* To match breakpoints exclusively */
.SM > .MyComponent { }
.MD > .MyComponent { }
.LG > .MyComponent { }

/* To match breakpoints additively  */
:matches(.SM) > .MyComponent { }
:matches(.SM, .MD) > .MyComponent { }
:matches(.SM, .MD, .LG) > .MyComponent { }
```

Note that when using my recommended strategy for additive matching, you can still match breakpoints exclusively via a selector like `.MD:not(.LG)`, though this is arguably less clear.

At the end of the day, you can pick whichever convention makes the most sense for you and works best for your situation.

<aside class="Info">
  <strong>Note:</strong>
  the <code>:matches()</code> selector isn't well supported in current browsers. However, you can use tools like <a href="https://www.npmjs.com/package/postcss-selector-matches">postcss-selector-matches</a> to transpile <code>:matches()</code> into something the works cross-browser.
</aside>

### Height-based breakpoints

So far all of my examples have focused on width-based breakpoints. This is because, in my experience, the overwhelming majority of responsive design implementations use width and nothing else (at least when it comes to viewport dimensions).

However, nothing in this strategy would prevent a component from responding to its container's height. ResizeObserver reports both width and height dimensions, so if you wanted to observe height changes you could define a separate set of breakpoint classes&mdash;perhaps with a `W-` prefix for width-based breakpoints and an `H-` prefix for height-based breakpoints.


## Browser support

While `ResizeObserver` is [currently only supported in Chrome](https://caniuse.com/#feat=resizeobserver), there's absolutely no reason you can't (or shouldn't) use it today. The strategy I've outlined here is intentionally designed to work just fine if the browser doesn't support ResizeObserver or even if JavaScript is disabled. In either of these cases, users will see your default styles, which should be more than sufficient to deliver a great user experience. In fact, they'll probably just be the same styles you're already serving today.

My recommended approach is to use media queries for your site's layout, and then this responsive components strategy for the specific components that need it (many won't).

If you really want to deliver a consistent UI across all browsers, you can load the [ResizeObserver polyfill](https://github.com/que-etc/resize-observer-polyfill), which has [great browser support](https://github.com/que-etc/resize-observer-polyfill#browser-support) (IE9+). However, make sure that you [only load the polyfill if the user actually needs it](https://philipwalton.com/articles/loading-polyfills-only-when-needed/).

Also consider that polyfills tend to run slower on mobile devices, and given that responsive components is primarily only something that matters at larger screen sizes, you probably don't need to load the polyfill if the user is on a device with a small screen size.

The Responsive Components demo site takes [this latter approach](https://github.com/philipwalton/responsive-components/blob/cf93cc7/app/templates/_resize-observer.html#L75-L83). It loads the polyfill, but only if the user's browser doesn't support `ResizeObserver` _and_ if the user's screen width is at least `48em`.

## Limitations and future improvements

Overall, I think the responsive components strategy I've outlined here is incredibly versatile and has very few downsides. I firmly believe that every site with content areas whose size may change independently of the viewport should implement a responsive components strategy rather than relying on just media queries (or a JavaScript-based solution that doesn't leverage ResizeObserver).

That being said, this strategy has a few limitations that I think are worth discussing.

### It's not pure CSS

One obvious downside of this solution is it requires more than just CSS to implement. In addition to defining your styles in CSS, you have to also annotate your containers in the HTML and coordinate both of those with JavaScript.

While I think we'd all agree a pure CSS solution is the ultimate goal, I hope we as a community are able prevent the perfect from becoming the enemy of the good.

In matters like this, I like to remind myself of this quote from the [W3C's HTML design principles](https://www.w3.org/TR/html-design-principles/):

> _In case of conflict, consider users over authors over implementors over specifiers over theoretical purity._

### Flash of un/incorrectly-styled content

In most cases it's a best practice to load all your JavaScript asynchronously, but in this case async loading can lead to your components initially rendering at the default breakpoint only to suddenly switch to a larger breakpoint once your JavaScript is loaded.

While this isn't the worst experience, it's something you wouldn't have to worry about with a pure-CSS solution. And since this strategy involves coordination with JavaScript, you have to also coordinate when your styles and breakpoints are applied in order to avoid this re-layout.

I've found the best way to handle this is to inline your container query code at the end of your HTML templates, so it runs as soon as possible. You should then add a class or attribute to your container elements once they're initialized and visible, so you know when it's safe to show them (and make sure you consider the case where JavaScript is disabled or errors when run). You can see an example of [how I do this](https://github.com/philipwalton/responsive-components/blob/cf93cc7/app/templates/_resize-observer.html#L22-L26) in the demo site.

### Units are based in pixels

Many (if not most) CSS developers prefer defining styles based on units with more contextual relevance (e.g. `em` based on font-size or `vh` based on the viewport height, etc.), whereas `ResizeObserver`, like most DOM APIs, returns all its values in pixels.

At the moment there's really no good way around this.

In the future, once browsers implement the [CSS Typed OM](https://drafts.css-houdini.org/css-typed-om/) (one of the new [CSS Houdini](https://www.smashingmagazine.com/2016/03/houdini-maybe-the-most-exciting-development-in-css-youve-never-heard-of/) specs), we'll be able to easily and cheaply convert between various CSS units for any element. But until then, the cost of doing the conversion would likely hurt performance enough to degrade the user experience.

## Conclusion

This article describes a strategy for using modern web technologies to build responsive components: DOM elements that can update their style and layout in response to changes in the size of their container.

While previous attempts to build responsive components were valuable in exploring this space, limitations in the platform meant these solutions were always either [too big, too slow, or both](https://philipwalton.com/articles/the-dark-side-of-polyfilling-css/).

Fortunately, we now have browser APIs that allow us to build efficient and performant solutions. The strategy outlined in this article:

* Will work, today, on any website
* Is easy to implement (copy/paste-able)
* Performs just as well as a CSS-based solution
* Doesn't require any specific libraries, frameworks, or build tools.
* Leverages progressive enhancement, so users on browser that lack the required APIs or have JavaScript disabled can still use the site.

While the strategy I outline in this post is production-ready, I see us as being still very much in the early stages of this space. As the web development community starts shifting its component design from viewport or device-oriented to container-oriented, I'm excited to see what possibilities and best practices emerge.

Hopefully one day we'll be able to turn those best practices into a first-class web API.
