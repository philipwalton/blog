<!--
{
  "layout": "article",
  "title": "Web Components and the Future of Modular CSS",
  "date": "2014-10-31T22:01:36-07:00",
  "draft": true,
  "tags": [
    "CSS",
    "HTML",
    "JavaScript"
  ]
}
-->

<!--
I. Problems with CSS
  A. It's not the properties
    1. vertical centering
    2. equal height columns
    3. browser inconsistencies
    3. tricks, hack, unintuitive property combinations, etc.
  B. It's the selectors
    1. Scoping styles
    2. Specificity conflicts
    3. Non-deterministic matching
    4. Dependency management
    5. Removing unused code
  C. All of these problem stem from the lack of a real "module" system in CSS
II. Modular CSS today
  A. BEM, SMACSS, OOCSS (and a million new ones the creep up almost daily)
    1. Principles
      a. single classes (consistent specificity)
      b. decouple layout from theme (structure from skin)
      c. decouple content form container
  B. Abstraction layer
    1. Selectors
      a. code reuse through comma-separated selectors
      b. #sidebar, #footer, .item, .callout { ... }
    2. HTML + CSS
      a. CSS defines small, modular class-based rules
      b. The HTML templates contain many, many classes
    3. Preprocessor + Selectors
      a. A preprocessor defines modular styles via @mixin or @extend
      b. Those modular styles are assigned to complex selectors
      c. The HTML remains free of most
  C. Downsides
    1. All of these strategies work to varying degrees, but at the end of the day they are brittle because the selectors are still global.
    2. These systems are not interoperable as the conventions typically only work when *all* the code is following the convention.
      a. Conventions are great for your own code, but they typically fall apart if you're using any third party code.
      b. Conformance

III. How could CSS be better?
  A. Style scoping
  B. Abstracting implementation details
III. Real CSS Modules
  A. Shadow DOM
    1. Two-way style boundary
    2. The abstraction lives in a style tag inside the shadow root
  B. Context
    1. Selector context is hard to manage and comes with specificity problems, element context is more reusable, easier to reason about, easier to establish intent, and makes dependencies are clearer
IV. Examples
  A. Classes vs Components
    1. Inheritance
    2. Composition
  B. Building a complex component from simple components.
  C. Building a layout from layout primitives.
V. Conclusion
-->

Developers who are new to CSS often complain that things that should be simple are unnecessarily complex, unintuitive, or hacky. Why do I have to use `border-color: transparent` to make a triangle? Why doesn't `vertical-align: center` ever work when I want it to? Why do I have to use JavaScript to make equal-height columns?

Sure these are annoyances, and yes being skilled at CSS does require an encyclopedic knowledge of hacks and tricks, but is this really why CSS is hard?
The solutions to these problems can be easily Googled, and most of them have been solved by some of the newer features of CSS.

To put it bluntly, these are not, nor have they ever been, the truly hard problems in CSS.

In fact, the real hard problems in CSS have nothing to do with visual design at all. They have to do with code design, maintainability, and organization. If you've ever had to work in an existing CSS codebase, you'll be all too familiar with this situation:

* You can't write the rules you want because the existing rules trump them.
* You can't change the existing rules because refactoring would take too long and risk breaking too many things.
* Your hand is forced, so you end up writing rules you know are bad.
* Now the problem is worse than when you started.

Every company I've ever worked for has dealt with this. Bad CSS can cripple development, prevent teams from updating designs they know have usability issues, and even block the shipping of new features.

CSS should never be a bottleneck, yet so many times it is. And it's not because of vertical-centering woes or equal-height column hacks. If fact, it's not because of any property or value declaration.

*CSS is hard because its selectors are global.*

As with any language, global variables become increasingly hard to manage as your codebase scales. Yet unlike many other languages, CSS doesn't have a module system or a way to scope rules to a particular context without increasing specificity and thus preventing reuse.

The rest of this article will discuss how modular CSS is used today to deal with the shortcomings of CSS, and it will explore how the Web Components will make writing truly modular CSS a reality in the future.

## Modular CSS today

Generally speaking, the purpose of modular programming is to break a large problem down into smaller pieces that are easier to reason about. Modules should be self-contained and interchangeable, allowing you to affect one part of the system without fear of unintended consequences.

In CSS, it could be said that a selector is a module's interface and a declaration (the properties and values) its implementation. This conceptually works, and seems to be how the creators of CSS intended it to manifest; however, in practice CSS modules are more complicated than a single selector.

In practice, modules in CSS correspond to individual parts of a design or interface. A button group, a volume slider, a dropdown menu. These are all conceptually modules in the world of CSS, and *all* of them require more than one selector to style.

As such, modules aren't so much about selectors as they are about the relationships between selectors. A modules is a group of selectors and UI is a group of modules. In theory, the implementation of any single module should be able to be swapped out for another module with an identical interface, and the system (the UI) should still work.

The problem (as I already alluded to), is that modules are typically comprised of more than one selector, which means they're also comprised of more than one DOM element. To swap out a module's implementation for another requires not only changing the CSS but changing the HTML as well.

This means there's coupling. And this, inherently, is the problem.

### The abstraction layer

When CSS was first introduced, it *was* the abstraction layer. CSS allowed us to remove `<font>` tags and `align` attributes from our markup, define reusable collections of styles, and target elements to apply those styles to via selectors.

While there's absolutely nothing wrong this this approach, it doesn't scale well on sites that have many developers all writing styles at the same time. As already mentioned, selectors are global and globals don't normally scale well.

As web applications grew in complexity and web development teams grew in size, it became apparent that allowing anyone to write whatever selectors they wanted just doesn't work. At all. The abstraction layer needed to go somewhere else.

### Preprocessors

CSS preprocessors seemed like an obvious solution to reduce tedium and abstract away complexity. Instead of defining styles as classes you can define them as mixins or abstract rules (placeholders in Sass) that can be extended. For example:

```scss
%expandable { ... }
%roundedBox { ... }
%standardSpacing { ... }

#sidebar .widget {
  @extend %expandable;
  @extend %roundedBox;
  @extend %standardSpacing;
}
```

This approach allows makes code reuse easier and decouples styles from selectors, but it doesn't solve the problem of specificity, nor does it eliminate unpredictability.

If you're writing selectors that depend on a particular DOM structure, you're going to have the same problems, with or without a preprocessor. Ultimately, any attempt to keep the abstraction layer in the CSS is going to fail.

### Methodologies

Conventions and best-practices arose around the idea that the the most predictable selector is the one that contains just a single class, which is applied directly to the element you want to style. Applying a single class to every element requires a lot more classes in your HTML, but it also makes your code much easier to reason about, and far more predictable. When you want to change how something looks, you just change that class selector's declaration, and you can be sure it will only affect the elements that use that class.

By contrast, when you write selectors that expect a particular HTML structure, changing the selector or the HTML structure, evening in seemingly harmless ways, will always run the risk of breaking things.

To deal with this, methodologies like BEM, SMACSS, and OOCSS have emerged and (for the most part) are extremely effective. It turns out that despite the need for a lot of repetition in the HTML, maintaining and abstracting HTML into templates and partials is far easier than managing global selector spaghetti. In other words, the abstraction is shared between the HTML and the CSS.

### Downsides

Each of the examples above tries to be modular to an extent but they all hit up against the same walls&mdash;the limitations of CSS.

The problem is the abstraction has to go somewhere. Either it goes in the selector and you have the issue of a conflicting global namespace, or you develop a disciplined convention to manage the global namespace and the abstraction goes in your HTML templates.

But as with any convention, it only works if you write all the code yourself, or if all of your third-party code abides by the same rules. Unfortunately, that's a pretty hard ask. This is particularly problematic if you use an sort of conformance tooling to enforce your conventions, as the use of third-party components will almost certainly throw errors.

All of this boils down to interoperability. If the point of modularity is the ability to swap out one implementation for another, your HTML and CSS need to be structured in a way that can make that happen. A selector-based approach makes this essentially impossible, since module authors can't predict your markup structure, and putting classes in the HTML makes this tedious.

In truth, modular CSS today isn't really modular at all. All talk of modularity if just nominal. This isn't to diminish the value of these methodologies and conventions; it's just to point out that there's plenty more to be desired.

## How CSS could be better

I've spent much of my profession career talking about and trying to make it easier for me and my teams to deal with the problems and shortcomings of CSS. If you asked me to make a wish list of what I'd add or change about CSS to make it better, I probably would have said the following two things:

* Add two-way style encapsulation and scoping.
* Implement a real abstraction layer so presentational elements don't need to be in the markup.

### Two-way scoping

CSS is desperately missing the ability to scope styles, both from within and from without. The scoping we have today is selector based. For example `#sidebar .widget` scopes the widget styles to just the sidebar, but it doesn't prevent other styles on the page from styling the widget element itself (or its children). This type of scoping also comes at a price. When you add a container element to a selector you make it less reusable (what if you want to use those same styles somewhere else on the page?) and you make it more specific (now rules with simple selectors may no longer override on these elements).

What is really needed is the ability to create a reusable CSS rule (or set of rules) and declare that it only apply to a particular DOM subtree without having to change the selector. In addition, we need to be able to declare that a particular DOM subtree is shielded from outside styles.

The following example illustrates how a lack of style encapsulation can be a problem. Consider the following markup and accompanying CSS:

```html
<div class="Widget">
  <h3 class="Widget-title">Widget Title</h3>
  <p class="Widget-content">...</p>
</div>
```

```css
/* Widget module styles */
.Widget-title {
  color: red;
  font-size: 1.25em;
  line-height: 1;
}

/* Somewhere else in the bundled CSS... */
h3 {
  border-bottom: 1px solid lightgray;
  font: 1.5em/1.5 sans-serif;
}
```

As you can see, the widget is setting the `font-size` and `line-height` explicitly on its title, but it's not specifying a border. This means the border style applied to the global `h3` type selector will also be applied to the widget's title.

CSS does not have a way to prevent this from happening.

### Presentational abstractions

One of the original goals of CSS was to separate presentation from content. Unfortunately, CSS was never powerful or expressive enough to truly style content without extra, presentational markup like wrappers and containers.

For true separation of presentation and content, you'd need the ability to abstract these presentational elements away for reuse just like you can abstract away single-element styles today.

Since most UI components require more than one DOM element to construct, and today there is no simple way, with just HTML and CSS, to define the DOM structure that a module consists of.

Consider a basic alert message with an icon and an "x" button in the top right corner to dismiss the message. The DOM structure may look something like this:

```html
<aside class="Alert">
  <span class="Alert-icon"></span>
  <div class="Alert-body">...</div>
  <span class="Alert-dismiss"></span>
</aside>
```

If you decided you wanted to change some of the class names, or the order of the elements in this alert widget, you'd have to update every occurrence of this alert in your templates.

From a content perspective, the only thing that is important is the message inside the alert. Semantically speaking, all that's needed is this:

```html
<my-alert>...</my-alert>
```

And maybe if you support multiple types of alerts, you can have an optional type attribute:

```html
<my-alert type="info">...</my-alert>
```

The wrapper element in the alert body, the close button, and the alert icon. These are all just implementation details. Implementation details that should be interchangeable for another style of alert should you desire.

If we're really separating content from presentation, we need a way to define not only our presentational styles, but our presentational markup as well.

## Real CSS Modules

Fortunately, I'm not the only one who's made a wish list for CSS. Web Components, specifically shadow DOM, elegantly addresses both of the features I said above were missing from CSS.

As a disclaimer, the rest of this article assumes you know a little bit about Web Components, Shadow DOM, and how to implement this stuff on your own. If you don't, I'd recommend familiarizing yourself first.

### Shadow DOM

Shadow DOM is a subtree of DOM nodes that you can create on any HTML element. The shadow subtree is ultimately rendered onto the page with the main DOM tree, but unlike the main DOM tree, shadow nodes can only be modified or styled from within.

In short, shadow nodes are private, and they finally give us the ability to create components with a priavte and public API. A public API for the content and a private API for the presentation and impementation details.
