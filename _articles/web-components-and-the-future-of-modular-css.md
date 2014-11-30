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

Developers love to complain about CSS.

The tricks, the hacks, the unintuitive property combinations required to get seemingly simple things to work cross browser. For many, CSS is a necessary evil, and a replacement can't come soon enough.

While a small number of these complaints are valid, the vast majority of them no longer apply. Common complaints like vertical centering and equal-height columns have been solved for years and work in all modern browsers. These are not the hard problems of CSS.

If you're a front-end engineer or have ever been involved in making architectural front-end decisions, you know that CSS is actually much harder than its critics commonly claim.

Here is a rough list of some of the truly hard problems in CSS:

- Scoping styles
- Specificity conflicts
- Non-deterministic matching
- Dependency management
- Removing unused code

If you look at this list, you may notice that all of these items have one thing in common: they all deal with CSS selectors.

The common critique of CSS almost always attack its properties, but if you work on a large team with a lot of people touching the code, then you know the real challenge in CSS is dealing with selectors.

Selectors are global, and like all globals in other languages, they become increasingly hard to manage as your codebase scales. But unlike globals in other languages, CSS doesn't have a module system or a way of creating scope to. You can't break down the global beast into its smaller pieces in a way that makes them easy to manage simpler to reason about.

When developers talk about "modular" CSS today, they do so nominally. While the techniques typically proposed are incredibly valuable, they're just methodologies and conventions.

## Modular CSS today

Generally speaking, the purpose of modular programming is to break a large problem down into smaller pieces that are easier to reason about. Modules should be self-contained and interchangeable, allowing you to affect one part of the system without fear of unintended consequences.

In CSS, it could be said that a selector is a module's interface and a declaration (i.e. properties and values) its implementation. This conceptually works, and seems to be how the creators of CSS intended it to manifest; however, in practice CSS modules are more complicated than a single selector.

In practice, modules in CSS correspond to individual parts of a design or interface. A button group, a volume slider, a dropdown menu. These are all conceptually modules in the world of CSS, and *all* of them require more than one selector to style.

As such, modules aren't so much about selectors as they are about the relationships between selectors. A modules is a group of selectors and UI is a group of modules. In theory, the implementation of any single module should be able to be swapped out for another module with an identical interface, and the system (the UI) should still work.

The problem (as I already alluded to), is that modules are typically comprised of more than one selector, which means they're also comprised of more than one DOM element. To swap out a modules implementation for another requires not only changing the CSS but changing the HTML as well.

This means there's coupling.

### A history of abstraction

When CSS was first introduced, it *was* the abstraction layer. CSS allowed us to remove `<font>` tags and `align` attributes from our markup, define reusable collections of styles, and target elements to apply those styles to via selectors.

While there's absolutely nothing wrong this this approach, it doesn't scale well on sites that have many developers all writing styles at the same time. As already mentioned, selectors are global and globals don't normally scale well.

#### Methodologies

Methodologies like OOCSS, SMACSS, and BEM emerged specifically to address the scalability issue. With these methodologies, the abstraction is split between the HTML and CSS.

The CSS still contains the declarations:

```css
.MainNav { ... }
.MainNav-item { ... }
.MainNav-link { ... }
```

But the HTML contains many of the classes in an effort to reduce selector complexity. The abstraction layer is split across both:

```html
<ul class="MainNav">
  <li class="MainNav-item">
    <a class="MainNav-link"></a>
  </li>
  <li class="MainNav-item">
    <a class="MainNav-link"></a>
  </li>
</ul>
```

As it turns out, this approach ends up being much easier to maintain on a large team (despite the repetition in the HTML), but there still is coupling. If the `MainNav` module needs to change, both the HTML and CSS must change with it.

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

### Downsides

Each of the examples above tries to be modular to an extent but they all hit up against the same walls&mdash;the limitations of CSS.








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




For about as long as people have been writing CSS, people have been writing CSS the same way. Our tools change, methodologies go in an out of fashion, but at the end of the day, most of us serve one CSS file that styles our entire site.

This isn't a critique of our current best-practices, it simply the reality. When we say we write modular CSS we mean that nominally. All CSS rules are global and every rule has the potential to conflict with every other rule. This is just the way it is.

People who are new to CSS often complain that things which should be simple are unnecessarily complex, unintuitive, or hacky. Why do I have to use `border-color: transparent` to make a triangle? Why doesn't `vertical-align: center` ever work when I want it to? Why are the position keywords `static`, `absolute`, and `fixed` all sound like they do the same thing?

Sure these are annoyances, and yes being skilled at CSS does require an encyclopedic knowledge of hacks and tricks, but these things are not the truly hard problems of CSS. These are not the problems that make it nearly impossible to redesign without starting over or prevent the development of new features for fear of the consequences of changing *anything*!

The longer I work in this industry, the more I'm convinced that there are really just two hard problems in CSS:

1. Getting your rules to match the elements you want without them accidentally matching the elements you don't.
2. Solving the first problem without writing too much code.

While this might seem like an oversimplification, I believe it's true. Every truly hard problem I've ever faced in CSS has involved fighting with an existing stylesheet. Far too often this is my dilemma:

* I can't write the rules I want because the existing rules trump them.
* I can't change the existing rules because refactoring would take too long.
* My hand is forced, and I end up writing rules I know are bad.
* Now the problem is worse than when I started.

The situation exists because developers routinely come up with bad solutions to hard problem #2. They think they're being clever, but they're really just digging a whole they'll eventually fall into.

Developers like to notice patterns, and they've been taught not to repeat themselves. So when a developer looks at a site and notices that every time an `<h3>` is followed by `<ul>` in the sidebar, there's a `20px` gap, what do you expect him to do? Most people who encounter this scenario write some form of the following rule:

```css
#sidebar h3 + ul {
  margin-top: 20px;
}
```

This rule isn't necessarily bad. The probably with it is it has the *potential* to be bad. It's going to do exactly what you want it to, but, in the future, it may also do a bunch of stuff you don't want it to do.

Therein lies the problem with most people's CSS. It solves the present problem with little consideration for the future.

## Modular CSS

Modular CSS methodologies ([BEM](http://bem.info/method/), [SMACSS](http://smacss.com/), [OOCSS](https://github.com/stubbornella/oocss/wiki)) have been, in my opinion, one of the things to happen to CSS. While all of these methodologies take a slightly different approach, they all, at their core, do a fantstic job at solved CSS's first hard problem. They codify how to write CSS that styles the elements you want without accidentally affecting the elements you don't.


One of my favorite [Twitter exchanges](https://twitter.com/rstacruz/status/272765333977325568) on the subject of methodologies:

> [@simurai](https://twitter.com/simurai): "I think the problem with the 'never use IDs' debate is that both sides come from two different perspectives. Small site vs large site."
> <br>[@rstacruz](https://twitter.com/rstacruz): "@simurai Where is this debate being held?"
> <br>[@divya](https://twitter.com/divya): "@rstacruz on small sites.""

## Code Reuse

### Inheritence

```
var root = this.createShadowRoot();
var



