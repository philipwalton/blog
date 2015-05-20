<!--
{
  "layout": "article",
  "title": "Extending Styles",
  "date": "2015-05-15T12:36:19-07:00",
  "tags": [
    "CSS"
  ]
}
-->

Last week [@simurai](https://twitter.com/simurai) wrote [a great article](http://simurai.com/blog/2015/05/11/nesting-components/) discussing the various strategies for contextual styling in CSS. If you haven't read his article yet, you should&mdash;it will give you better context for this read, and you'll probably learn something you didn't know.

The problem? What is the best way to approach styling a component differently when it's a descendant of another component?

The example he uses is a button component that should render differently when it's inside the header component. In the article @simurai outlines a number of the more common approaches, assess the pros and cons of each, and then states that he doesn't believe there's a clear winner. He closes by opening it up to the community for feedback in the hopes that a consensus can be reached.

While I share his desire to nail down the best strategy (and I do have an option on the subject), I think it's actually more valuable to discuss *how* one might approach answering this question rather than *what* the actual answer may be. If you understand the how and the why, you'll be more equipped to answer similar questions in the future.

## Criteria for choosing

The point of extending styles is to reuse code. If you've defined some base-level styles, you want to be able to use those styles again without having to rewrite them. And if you need to change those base-level styles, you want those changes to propagate throughout.

Simply reusing code is easy. But reusing code in a way that is predictable, maintainable, and scalable is hard. Fortunately, computer scientists have been studying these problems for decades, and a lot of the principles of good software design apply to CSS too.

### Adherence to software design principles

All of the options @simurai lists in his article are examples of either modifying a style declaration or extending it. When presented with these two choices, we can heed the advice offered by the [open/close principle](http://en.wikipedia.org/wiki/Open/closed_principle) of software development. It states:

> software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification

To understand what this means in the context of CSS components, it's important to define the terms *extension* and *modification*.

Modifying a component means you change its style definition&mdash;its properties and values. Extending a component, by contrast, means you take an existing component and build on top of it. You do not change the definition of the existing component, instead, you create a new component that includes the original styles and adds new styles (or overrides) on top of them.

There are two primary reason why components should be extended rather than modified. First of all, when you modify a component you break its contract and the expectations of developers familiar with that component. You also run the risk of breaking your existing design. For small sites this risk is probably minimal, but for large sites with lots of components, you may not always know all the places a particular component is used.

A second reason to prefer extension over modification is when you modify a component, you limit your options going forward. You can no longer use that component in its pre-modified form.

### Compatibility with future technologies

Another important criteria for weighing our options and choosing our best-practices is how those practices will align with future technologies. Writing modular CSS today is challenging because the web platform doesn't support a lot of the feature we've come to enjoy in other environments that promote modular development. But this will not always be the case.

As the web evolves, it's going to become easier and easier to write CSS without having to worry about all the complications and [side effects](/articles/side-effects-in-css/) that come from all rules existing in the global scope. So we need to make sure our choices today don't force our hand and lock us in to outdated technology tomorrow.

Web Components give us real solutions to almost all the problems that make writing modular CSS hard. And now that all major browser vendors have [reached some consensus](https://www.w3.org/wiki/Webapps/WebComponentsApril2015Meeting) on the contentions parts of the specification and agreed to move forward with implementation, we as web developers need to start thinking about how our current methodologies will fit into that future.

With these things in mind, let's consider the current options.

## Option 1 &ndash; descendant combinator

Option 1 is a textbook example of component modification&mdash;what the open/closed principle says *not* to do.

```css
.Header .Button {
  font-size: .75em;
}
```

In this example the `.Button` component is defined somewhere else in the stylesheet, and then it's redefined (modified) here for all cases where `.Button` appears as a descendant of a `.Header` component.

As I mentioned above, this practice can be really problematic. It makes the `.Button` component less predictable because it can now render differently depending on where it lives in the HTML. Someone on the team who's used `.Button` in the past might want to use it again but be unaware that its definition has been changed outside of its source file.

Moreover, this option is short-sighted. It solves the immediate problem at hand, but it limits your options for using the `.Button` component in the future. What if a new feature is added that requires additional buttons in the header, some with the modified, smaller state but some using the original styles? Since this approach modifies the definition of `.Button`, its pre-modified styles can no longer be used inside `.Header`, and refactoring will have to happen, increasing the risk of bugs.

## Option 2 &ndash; variations

In BEM this option is called a "modifier" (the "M" in BEM), and in SMACSS it's called "subclassing". Note that despite being called a modifier in BEM, it's not a modification in the sense that the open/close principle is warning against.

```css
.Button--small {
  font-size: .75em;
}
```

```html
<header class="Header">
  <button class="Button Button--small">Download</button>
</header>
```

When using this option, you don't change the original style definition, and you are still able to use the original `.Button` component inside of `.Header`.

## Option 3 &ndash; adopted child

With the adopted child option (or [mixes](https://en.bem.info/forum/issues/4/) as it's called in BEM) you style an element with two classes from two different components.

While I've certainly used this pattern in my own code from time to time, it always makes me a little uneasy. The problem with this approach is if two or more classes are applied to the same element, and they contain some of the same property declarations, the more specific selector will win. Sometimes this works out exactly how you want, but sometimes times it doesn't, and you have to resort to specificity hacks (as you can see in the provided example).

In *header.css*:

```css
/*
 * Increased specificity needed so this class will win
 * when used on elements with the class "Button".
 */
.Header .Header-item {
  font-size: .75em;
}
```

And in *button.css*:

```css
.Button {
  font-size: 1em;
}
```

While sometimes a comment like this does the trick, it's definitely not a fool-proof solution.

Whenever you put more than one class on an element, those classes combine to form the final, rendered state. With modifiers this is not really a problem because the two classes are defined in the same file, so cascade preference can be easily managed by source order.

On the other hand, when adding two classes to an element and those classes are defined in *different* files, that's where you run into issues. Most of the time there is a "base" class and one or more "extending" class, and in those cases I think it makes more sense to make the relationship explicit and the dependencies clear. More about this in option 4.

## Option 4 &ndash; @extend

Most CSS preprocessors today support some method of extending existing styles. In fact, this may soon be supported natively in CSS if the [extend rule proposal](https://tabatkins.github.io/specs/css-extend-rule/) is approved.

Most CSS preprocessors also support declaring dependencies through `import` or `include` statements, which helps ensure your styles cascade properly by forcing the correct source order at build time.

```scss
@include './button.css';

.PromoButton {
  @extend .Button;
  /* Additional styles... */
}
```

```html
<header class="Header">
  <button class="PromoButton">Download</button>
</header>
```

Once again, what's nice about this approach is it's clear to other developers that `.PromoButton` includes styles from `.Button`, and it's clear to the preprocessor (or build system) that *button.css* needs to be included before *promo-button.css* when the final stylesheet is built.

If you were using the mixes approach above and using more than two classes on a single HTML element, `@extend` can be a very handy way to construct a new component from those parts while simultaneously ensuring the source order is correct.

```scss
@include './button.css';
@include './full-width-block.css';
@include './logo-type.css';


.PromoButton {
  @extend .Button;
  @extend .FullWidthBlock;
  @extend .LogoType;
  /* Additional styles... */
}
```

The source order becomes the order listed in the `@include` statements, so you can more easily ensure the styles cascade correctly. And if you keep your component specificity to a single class, everything should work as expected.

## Web Component considerations

The primary way a future shift to Web Components will affect this discussion is that styling elements will no longer simply be a function of adding classes to elements or selectors to your stylesheets.

With Web Components (specifically Shadow DOM), the only styles that can affect the inner-workings of an element are the styles that the component author has packaged within that element. Likewise, the only way a parent context is allowed to affect the style of an element is if the component author has explicitly OK'd it.<sup>[[1]](#footnote-1)</sup>

This means that if you use options 1 or 3 now, it will be quite a bit harder to transition your code to use Web Components. Option 1 will never be able to work with third-party components (since they can't predict your HTML structure in advance), and adding a list of classes to a custom element (option 3) will only affect that particular element. It will *not* affect its descendants.

Options 2 and 4 are much more Web Component-friendly because they more closely resemble a single-component model.

Web Components encapsulate style and functionality internally, and they expose that to developers as a single HTML element. This means that components are always a single thing, even if under the hood they're the result of a bunch of smaller things put together.

Consider the following HTML. There's a button component that should be displayed as block and take of the full width of it's container. It should also use the typeface of the company's logo:

```html
<button class="Button FullWidthBlock LogoType">Download</button>
```

Converting this to a Web Component in the following way will not work:

```html
<promo-button class="FullWidthBlock LogoType">Download</promo-button>
```

Instead, you'd have to add these styles under the hood, as part of the component's internal (private) implementation:

```html
<!-- Pseudo Code -->
<promo-button>
  #shadow-root
    <style>
      @import './button.css';
      @import './full-width-block.css';
      @import './logo-type.css';
    </style>
    <button class="Button FullWidth LogoType">
      <content></content>
    </button>
  /#shadow-root
</promo-button>
```

This may seem like more work, but it will end up being much more robust and predictable. This component will always look exactly how you want it to, regardless of where it appears in the HTML and what other styles exist on the page.

This is very similar using `@extend` as shown in option 4. If you use this pattern in your code today, it will probably be very easy to transition your CSS components to Web Components in the future.

Likewise, option 2 (variations) also fits very nicely into the Web Component model. But instead of modifier classes, we'll likely define element attributes that represent the different variations of our components.

```html
<!-- Using BEM -->
<button class="Button Button--small">Download</button>

<!-- Using an attribute for variation -->
<my-button small>Download</my-button>
```

Attributes become part of the public API for style components, and only the approved attributes will affect the style. Attributes without a corresponding rule defined internally in the component will simply do nothing.

## Conclusions

Given all the options discussed so far, I favor option 2 for simple style extensions and option 4 for anything more complex.

If the component in question just needs a small change in some new context, a variation (modifier/subclass) is usually simpler and makes more sense. On the other hand, if the component in question is really its own thing, built on top of a base component, requiring a multi-level inheritance hierarchy, or composing several complex styles together, it's probably better to make those relationships known through @extend statements and explicitly listed dependencies.

In general, when faced with these decisions it's important to not just think about solving the immediate problem at hand. You should also consider how your choices will limit your options in the future. Are you coding yourself into a corner, or are you leaving yourself room to build new features and adapt to future design requirements.

<aside class="Footnotes">
  <h1 class="Footnotes-title">Footnotes:</h1>
  <ol class="Footnotes-items">
    <li id="footnote-1">This can be accomplished via the [`:host-context()`](http://dev.w3.org/csswg/css-scoping/#host-selector) selector, though arguably its usage should be mostly avoided for all the reasons listed in this article.</li>
  </ol>
</aside>
