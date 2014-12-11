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

Developers who are new to CSS often complain about things that should be simple are unnecessarily complex, unintuitive, or hacky. Why do I have to use `border-color: transparent` to make a triangle? Why doesn't `vertical-align: center` ever work when I want it to? Why do I have to use JavaScript to make equal-height columns?

Sure these are annoyances, and yes being skilled at CSS does require an encyclopedic knowledge of hacks and tricks, but these issues have been almost entirely solved in newer versions of the specification.

To put it bluntly, these are not, nor have they ever been, the truly hard problems in CSS.

In fact, the real hard problems in CSS have nothing to do with visual design at all. They have to do with code design, maintainability, and organization. If you've ever had to work in an existing CSS codebase, you'll be far too familiar with this situation:

* You can't write the rules you want because the existing rules trump them.
* You can't change the existing rules because refactoring would take too long and risk breaking too many things.
* Your hand is forced, so you end up writing rules you know are bad.
* Now the problem is worse than when you started.

Every company I've ever worked for or with has experienced this problem. Bad CSS can cripple development, prevent teams from updating designs they know have usability issues, and even block the shipping of new features.

CSS should never be a bottleneck, yet so many times it is. And it's not because of vertical-centering woes or equal-height column hacks. If fact, it's not because of any property or value declaration.

CSS is hard because its selectors are global.

As with any language, global variables become increasingly hard to manage as your codebase scales. Yet unlike many other languages, CSS doesn't have a module system or a way to scope rules to a particular context without increasing specificity and preventing reuse.

The rest of this article will discuss how modular CSS is used today to deal with the shortcomings of CSS, and it will explore how the Web Components will make writing truly modular CSS a reality in the future.

## Modular CSS today


When developers talk about "modular" CSS today, they do so nominally. While the techniques typically proposed are incredibly valuable, they're just methodologies and conventions.


Generally speaking, the purpose of modular programming is to break a large problem down into smaller pieces that are easier to reason about. Modules should be self-contained and interchangeable, allowing you to affect one part of the system without fear of unintended consequences.

In CSS, it could be said that a selector is a module's interface and a declaration (i.e. properties and values) its implementation. This conceptually works, and seems to be how the creators of CSS intended it to manifest; however, in practice CSS modules are more complicated than a single selector.

In practice, modules in CSS correspond to individual parts of a design or interface. A button group, a volume slider, a dropdown menu. These are all conceptually modules in the world of CSS, and *all* of them require more than one selector to style.

As such, modules aren't so much about selectors as they are about the relationships between selectors. A modules is a group of selectors and UI is a group of modules. In theory, the implementation of any single module should be able to be swapped out for another module with an identical interface, and the system (the UI) should still work.

The problem (as I already alluded to), is that modules are typically comprised of more than one selector, which means they're also comprised of more than one DOM element. To swap out a module's implementation for another requires not only changing the CSS but changing the HTML as well.

This means there's coupling. And this, inherently, is the problem.

### Abstraction

When CSS was first introduced, it *was* the abstraction layer. CSS allowed us to remove `<font>` tags and `align` attributes from our markup, define reusable collections of styles, and target elements to apply those styles to via selectors.

While there's absolutely nothing wrong this this approach, it doesn't scale well on sites that have many developers all writing styles at the same time. As already mentioned, selectors are global and globals don't normally scale well.

### Methodologies

As web applications have grown in complexity and web development teams have grown in size, it became apparent that allowed anyone to write whatever selectors they wanted just doesn't work. At all.

Conventions and best-practices arose around the idea that the the most predictable selector is the one that contains just a single class, which is applied directly to the element you want to style. Applying a single class to every element requires a lot more classes in your HTML, but it also makes your code much easier to reason about, and far more predictable. When you want to change how something looks, you just change that class selector's declaration, and you can be sure it will only affect the elements that use that class.

By contrast, when you write selectors that expect a particular HTML structure, changing the selector or the HTML structure, evening in seemingly harmless ways, will always run the risk of breaking things.

To deal with this, methodologies like BEM, SMACSS, and OOCSS have emerged and (for the most part) are extremely effective. It turns out that despite the need for a lot of repetition in the HTML, maintaining and abstracting HTML into templates and partials is far easier than managing global selector spaghetti.

#### Preprocessors

Some people try to deal with the issue of excess classes in the HTML by letting a preprocessor do a lot of the heavy lifting. Instead of defining modular styles as classes, you define them as abstract placeholders (if using Sass), and compose them inside your rule declarations:

```css
%roundedBox { ... }
%verticallyCentered { ... }
%standardSpacing { ... }

.overlay .modal {
  @extend %roundedBox;
  @extend %verticallyCentered;
  @extend %standardSpacing;
}
```

This addresses the problem of classes in the HTML, but it comes at the expense of reintroducing the problem of global selectors.

Ultimately, any attempt to keep the abstraction layer in the CSS is going to run into the same problems.

### Downsides

Each of the examples above tries to be modular to an extent but they all hit up against the same walls&mdash;the limitations of CSS.

The problem is the abstraction has to go somewhere. Either it goes in the selector and you have the issue of a conflicting global namespace, or you develop a disciplined convention to manage the global namespace and the abstraction goes in your HTML templates.

Another problem is interoperability. If one of the main selling points of modularity is the ability to swap out one implementation for another, your HTML and CSS need to be structured in a way that can make that happen. A selector-based approach makes this essentially impossible, since module authors can't predict your markup structure, and putting classes in the HTML makes this tedious unless your templates are already being dynamically generated in such a way as to allow for this.

The bottom line is there is plenty of room for improvement.

## How CSS could be better

Here is a rough list of some of the truly hard problems in CSS:

* Scoping styles
* Specificity conflicts
* Non-deterministic matching
* Dependency management
* Removing unused code

CSS is desperately missing the ability to scope styles, both from within and from without. The scoping we have today is selector based, e.g. `#sidebar .widget` scopes the widget styles to just the sidebar, but it doesn't prevent other styles on the page from styling the widget element itself (or its children). This type of scoping also comes at a price. When you add a container element to a selector you make it less reusable (what if you want to use those same styles somewhere else on the page?) and you make it more specific (now rules with simple selectors may no longer override on these elements).

What is really needed is the ability to create a reusable CSS rule (or set of rules) and declare that it only apply to a particular DOM subtree without having to change the selector. The counterpoint to this is to be able to make that subtree independent from outside styles.

The second piece largely missing from CSS (and HTML by association) is a true abstraction layer for building modules. I've already mentioned that most modules require more than one DOM element to construct, and today there is no simple way, with just HTML and CSS, to define the DOM structure that a module consists of.

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
<alert>...</alert>
```

And maybe if you support multiple types of alerts, you can have an optional type attribute:

```html
<alert type="info">...</alert>
```

The wrapper element in the alert body, the close button, and the alert icon. These are all just implementation details. Implementation details that should be interchangeable for another style of alert should you desire.

If we're really separating content from presentation, we need a way to define not only our presentational styles, but our presentational markup as well.

Fortunately, the future is already here. With Web Components (specifically Shadow DOM) we get both of these things.

## Shadow DOM













<!--

***


I think the modular/object-oriented CSS movement has been one of the best things to come to front-end architecture in recent history. When building web applications, it's unfortunate that code, which has almost nothing to do with how an application functions, is so often the bottleneck in building new features.

This should not be the case, nor do I think it's an overstatement. In almost every company I've ever worked at, I can distinctly remember a situation where we wanted to change or improve something, but we didn't for fear that *any* change to the CSS would have potentially disastrous, unforeseen consequences.

Our selectors were paralyzing us.

### Methodologies

There is certainly no shortage of modular CSS methodologies to choose from today. The classics are BEM, SMACSS, and OOCSS, but it feels like a new one comes out every week. To simplify things, I'm going to lump them all into a single category, and my example are going to use BEM (specifically the SUIT flavor) because it's the most prescriptive.

Ultimately, all modular CSS methodologies have the same fundamental goals in common:

- **Prefer single class selectors:** single classes keep specificity low, consistent, and they will never match an element in the HTML that you haven't explicitly ask it to.
- **Avoid contextual styling:** do not style components based on where appear in the DOM. Doing so is inherently less reusable and makes usage of these components unpredictable.
- **Decouple layout from theme:** the way a component looks and the way it appears relative to the elements around it are two separate concerns. When you combine those concerns (e.g. adding margin or positioning properties to components) you make them less reusable.



### Downsides

The


1. All of these strategies work to varying degrees, but at the end of the day they are brittle because the selectors are still global.
2. These systems are not interoperable as the conventions typically only work when *all* the code is following the convention.

-->


