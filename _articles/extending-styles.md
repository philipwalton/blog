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

To summarize, he explains a few of the more common approaches, assess the pros and cons of each, and then state that he doesn't believe there's a clear winner. He closes by opening it up to the community for feedback in the hopes that a consensus can be reached.

While I share Simurai's desire to nail down the best strategy, I'm actually more interested in discussing *how* one might approach answering this question, rather than *what* the actual answer may be. If you understand the how and the why, you'll be more equipped to answer similar questions in the future.

## Goals

The point of extending styles is code reuse. If you've defined some base-level styles, you want to be able to use those styles again without having to rewrite them. And if you change those base-level styles, you want those changes to propagate throughout.

Simply reusing code is easy. Reusing code in a way that is predictable, maintainable, and scalable is hard.

Fortunately, computer scientists have been studying these problems for decades, and a lot of the principles apply to CSS just as they would to software design.

## The open/close principle

The open/closed principle states:

> software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification

To understand what this means in the context of CSS components, it's important to define the terms *extension* and *modification*.

Modifying a component means you change its definition&mdash;its style properties. If you use a modified component again after modification in the same context, it will behave as per its modified state.

Extending a component, by contrast, means you take an existing component and build on top of it. You do not modify the definition of the existing component, instead, you create a new component with a new style definition that is the base component plus new styles on top of it.

The reason extending components is preferable to modifying components is because when you extend components, you can continue to use the original component as-is. When you modify a component, you can no longer use the unmodified version in that context, so you've limited your options. In addition, modified components will always be less predictable because a it can behave differently in different context. A modified component can have multiple sources of truth&mdash;multiple style definitions scattered through the codebase.

### Modification

Simurai lists the use of the descendant combinator as [option 1](http://simurai.com/blog/2015/05/11/nesting-components/#option-1---descendant-selector) in his article

```css
.Header .Button {
  font-size: .75em;
}
```

This example is a perfect illustration of component modification&mdash;what the open/closed principle says *not* to do.

In the above code, the `.Button` definition is assumed to already be defined somewhere else in the codebase, and then it's modified for all cases where `.Button` is used as a descendant of a `.Header` component.

As already stated, this is not ideal because the `.Button` component will now render differently in different contexts. Someone on the team who's used `.Button` in the past might want to use it again and be unaware that it's definition has been modified outside of its source file.

Moreover, this approach is short-sighted. What if a new feature is added that requires additional buttons in the header? Since this approach modifies the definition of `.Button`, its original state can not longer be used and refactoring will have to happen, increasing the risk of bugs.

Imagine what it might look like if some JavaScript code did the equivalent of this in JavaScript:

```js
@import Button from './button';

// Store a reference to the original click handler.
let originalClickHandler = Button.prototype.handleClick;

// Modify the click handler to behave differently when inside
// a `.Header` component.
Button.prototype.handleClick = function() {
  let header = document.querySelector('.Header');
  **if (header.contains(this.getDOMNode()) {**
    // Do different stuff because we're inside `.Header`;
  }
  else {
    originalClickHandler.call(this);
  }
}
```

If you write much front-end JavaScript code, it should be pretty obvious how bad this pattern is, yet it's exactly the same thing people do in CSS all the time.

A much better approach would be as follows:

```js
@import Button from './button';

export default class HeroButton extends Button {
  handleClick() {
    // Do something different for instances of `HeroButton`.
  }
}
```

In CSS you can do the same thing via a preprocessor that supports some form of `@extend` (or event possibly in CSS itself if [the extend rule proposal](https://tabatkins.github.io/specs/css-extend-rule/) is approved).

```scss
/* In button.css */
.Button { ... }

/* In hero-button.css */
.HeroButton {
  @extends .Button;
  /* Additional styles... */
}
```

Just as in the JavaScript example above, if you're goign to extend a component, it's important to list that component as a dependency, so the relationship is clear and the include order can be determined. If you use a preprocessor, pick one that supports dependency management in this way:

```scss
**@include './button.css';**

.HeroButton {
  @extend .Button;
  /* Additional styles... */
}
```

###









## Preparing for the future


```html
<site-header>
  <h1>My New Project</h1>
  <hero-button>Download</hero-button>
</site-header>
```
