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

Last week [@simurai](https://twitter.com/simurai) wrote [a great article](http://simurai.com/blog/2015/05/11/nesting-components/) discussing the various strategies for contextual styling in CSS. If you haven't read the article yet, you should&mdash;it will give you better context for this read, and you'll probably learn something you didn't know.

The problem? What is the best way to approach styling a component differently when it's a descendant of another component?

The example given is a button that should render differently when it's inside the site's header. In the article @simurai outlines a number of the more common approaches, assess the pros and cons of each, and then states that he doesn't believe there's a clear winner. He closes by opening it up to the community for feedback in the hopes that a consensus can be reached.

While I share the desire to nail down the best strategy (and I do have an option on the subject), I think it's actually more valuable to discuss *how* one might approach answering this question rather than *what* the actual answer may be. If you understand the how and the why, you'll be more equipped to answer similar questions in the future.

## Criteria for choosing

The point of extending styles is code reuse. If you've defined some base-level styles, you want to be able to reuse those styles without having to rewrite them. And if you change those base-level styles, you want those changes to propagate throughout.

Simply reusing code is easy. Reusing code in a way that is predictable, maintainable, and scalable is hard.

Fortunately, computer scientists have been studying these problems for decades, and a lot of the principles of good software design apply to CSS too.

### Adherence to software design principles

All of the options listed in @simurai's article are examples of either modifying a style definition or extending it. When presented with these two choices, we can heed the advice offered by the [open/close principle](http://en.wikipedia.org/wiki/Open/closed_principle) of software development. It states:

> software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification

To understand what this means in the context of CSS components, it's important to define the terms *extension* and *modification*.

Modifying a component means you change its definition&mdash;its style properties. Extending a component, by contrast, means you take an existing component and build on top of it. You do not change the definition of the existing component, instead, you create a new component that includes the original styles and adds new styles on top of them.

The reason extending components is preferable to modifying components is because when you extend components, you can continue to use the original component as-is. When you modify a component, you can no longer use the unmodified version in that context, so you've limited your options. Another problem with modified components is they'll always be less predictable since they're capable of behaving differently in different context. A modified component can have multiple sources of truth&mdash;multiple style definitions scattered through the codebase.

### Compatibility with future technologies

Another important criteria for weighing our options and choosing our best-practices is how those practices will align with future technologies. Writing modular CSS today is challenging because the web platform doesn't support a lot of the feature we've come to enjoy in other platforms that promote modular development. But this will not always be the case.

As the web evolves, it's going to become easier and easier to write CSS without having to worry about all the complications and [side effects](/articles/side-effects-in-css/) that come from all rules existing in the global scope. We need to make sure our choices today don't force our hand and lock us in to outdated technology tomorrow.

Web Components give us real solutions to almost all the problems that make writing modular CSS hard. And now that all major browser vendors have [reached some consensus](https://www.w3.org/wiki/Webapps/WebComponentsApril2015Meeting) on the contentions parts of the specification and agreed to move forward with implementation, we as web developers need to start thinking about how our current methodologies will fit into that future.

With these things in mind, let's consider the current options.

## Option 1 &ndash; descendant combinator

The following code is a perfect illustration of component modification&mdash;what the open/closed principle says *not* to do.

```css
.Header .Button {
  font-size: .75em;
}
```

In this code the `.Button` definition is assumed to be defined somewhere else in the codebase, and then it's modified for all cases where `.Button` is used as a descendant of a `.Header` component.

This makes the the `.Button` component less predictable because it can now render differently in different contexts. Someone on the team who's used `.Button` in the past might want to use it again and be unaware that its definition has been changed outside of its source file.

Moreover, this option is short-sighted. It solve the immediate problem at hand, but it limits your options for the future. What if a new feature is added that requires additional buttons in the header? Since this approach modifies the definition of `.Button`, its original styles can no longer be used and refactoring will have to happen, increasing the risk of bugs.

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

When using this option, you don't change the original style definition, and you are still able to use the original `.Button` component, even inside of `.Header`.

## Option 3 &ndash; adopted child

With the adopted child option (or [mixes](https://en.bem.info/forum/issues/4/) as it's called in BEM) you style an element with two classes from two different components.

While I've certainly used this pattern in my own code from time to time, it always makes me a little uneasy. The problem with this approach is if two classes are applied to the same element, and they contain some of the same property declarations, the more specific selector wins. Sometimes this works out how you want, but other times it doesn't and you have to resort to specificity hacks:

In `header.css`:

```css
/*
 * Increased specificity needed so this class will win
 * when used on elements with the class "Button".
 */
.Header .Header-item {
  font-size: .75em;
}
```

And in `button.css`:

```css
.Button {
  font-size: 1em;
}
```

While sometimes a comment like does the trick, it's definitely not an ideal solution.

Whenever you put more than one class on an element, those classes combine to form the final rendered state. With modifiers this is not a problem because the two classes are defined in the same file, so preference can be easily managed by source order.

On the other hand, when adding two classes to an element and those classes are defined in *different* file, that's where you run into issues. Most of the time there is a "base" class and an "extending" class (even if there's not a clear [*is-a*](http://en.wikipedia.org/wiki/Is-a) relationship), and in those cases I think it makes more sense to make the relationship explicit and the dependencies clear. More about this in option 4.

## Option 4 &ndash; @extend

Most CSS preprocessors today support some method of extending an existing classes. In fact, this may soon be supported natively in CSS if the [extend rule proposal](https://tabatkins.github.io/specs/css-extend-rule/) is approved.

Another thing most preprocessors support is declaring dependencies through `import` or `include` statements. This help ensure your styles cascade properly by forcing the correct source order at build time.

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

Once again, this nice this about this approach is it's very clear that `.PromoButton` includes styles from `.Button` and should therefore be included after `button.css` when the final CSS is built.

If you were using the mixes approach above and using more than two classes on a single HTML element, `@extend` can be a very handy way to construct a new component from those parts while simultaneously ensuring the source order is correct.

```scss
@include './button.css';
@include './logo-type.css';

.PromoButton {
  @extend .Button;
  @extend .LogoType;
  /* Additional styles... */
}
```

By listing `.LogoType` second in the include statement and second in the `@extend` list, you can more easily ensure the styles cascade correctly.

## Web Component considerations

I mentioned "future technologies" when discussing the choice criteria, and now that it all major browser vendors have [reached some consensus](https://www.w3.org/wiki/Webapps/WebComponentsApril2015Meeting) on Web Components and agreed to implement them, we as web developers need to start thinking about how our methodologies will fit into that future.

There are two key parts two Web Components that affect this discussion: scoped styles and the component model.

### Scoped styles

Shadow DOM has two-way style scoping, meaning outside styles will not affect component styles unless the component author has explicitly exposed that ability.

This means that we literally will not be able to use option 1 (descendant combinators) for style modifications in the future. As a result it makes no sense for our architectures to depend that approach.

### The component model

Web Component encapsulate style and functionality and expose it as an individual HTML element. This means it's probably wise to stop thinking about elements as the results of a mix of different CSS class declarations.

Consider the following. How would you represent this as a single component?

```html
<div class="Button LogoType">Download</div>
```

Do not assume from this that Web Components do not allow composition; that's not the case. Composition and inheritance can happen, it just happens internally and the result is exposed as a single interface.

Consider the following hypothetical code sample:

```js
import buttonStyles from './css/button';
import logoTypeStyles from './css/logo-type';

// A library that helps add new styles to an
// element's shadow root.
import styleMixins from './lib/style-mixins';

export class PromoButton extends HTMLButtonElement {
  constructor() {
    super()

    // Mix in styles, similar to @extend.
    styleMixins.add(buttonStyles, this.shadowRoot);
    styleMixins.add(logoTypeStyles, this.shadowRoot);
  }
}
```

And the you'd use the `PromoButton` element like so:

```html
<site-header>
  <promo-button>Download</promo-button>
</site-header>
```

Option 2 (variations) also translates well to a Web Components paradigm. Instead of modifier classes, you'd have modifier attributes.

```html
<!-- Using BEM -->
<button class="Button Button--small">Download</button>

<!-- Using an attribute for variation -->
<x-button small>Download</x-button>
```

Attributes become part of the public API for style components in their different variations.

## Conclusions

Given all the options discussed so far, I favor option 2 for simple style extensions and option 4 for anything more complex.

If the component in question just needs a simple change in some new context, a variation (modifier/subclass) is usually simpler and makes more sense. On the other hand, if the component in question is really its own thing, built on top of a base component, requiring a multi-level inheritance hierarchy, or composing several complex styles together, it's probably better to make those relationships known through @extend statements and explicitly listed dependencies.

In general, when faced with these decisions it's important to not just think about solving the immediate problem at hand. You should instead consider how your choices will limit your options in the future. Are you coding yourself into a corner, or are you leaving yourself room to build new features and adapt to future design requirements.
