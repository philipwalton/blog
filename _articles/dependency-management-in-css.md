<!--
{
  "layout": "article",
  "title": "Dependency Management in CSS",
  "date": "2014-01-30T21:06:39-08:00",
  "draft": true,
  "tags": [
    "CSS",
    "Architecture"
  ]
}
-->

Dependency management is a problem in CSS. The cascade considers both specificity and source order when determining rule precedence, so the order in which you write (or concatenate) you CSS is critically important.

Consider the following visual elements: a button, a button row, an alert, and a modal dialog.

The button is a normal button, style nicely. The button group is a containing element that, when used as the parent of a button, it gives each child button a right margin so that multiple consecutive buttons can be spaced out evenly.

The alert is a block of text that stands out with a red, yellow, or green background for things like success, info, and error messages.

Finally, the modal is a dialog that appears as its own "layer" in front of everything else on the page.

These are all pretty common visual elements, and they (or variations of them) appear in pretty much every single CSS framework.

When writing modular CSS, the goal is to make each component (or module or block or whatever you prefer to call it) completely independent from it's context. In other words, a button should always look like a button, no matter where it appears in the HTML structure.

The rational behind this is predictability. If you're working on a large team, you want people to be able to use any component and not be surprised by how it ends up looking in their situations.

The problem is that in many cases, you have to made a compromise between predictability and reusability. Let me illustrate this dilemma with an example:

Given the modal and button row components I've described above, suppose you want your buttons to be right aligned and have a left margin (instead of the usual right margin) when appearing in a modal's footer. So to accomplish this you write a rule like:

```css
.ButtonRow .Button {
  margin-right: .5em;
}
.Modal .ButtonRow .Button {
  margin-right: 0;
  margin-left: .5em;
}
```

There's nothing technically wrong with the above code, but it does break a lot fo the principles of modular.

The `Button` component is now context dependent. It's appearance depends on where it appears in the HTML (whether or not it's a child of a element with the `.ButtonRow` class). And the `ButtonRow` component is now also context dependent, which means that there's an added level of contextual dependency for the `Button` component when it's used within modals.

The upside of this approach is it allows the comonents to be smarter. They "just work" as long as they're put in the right containers and the CSS is correctly coded for those containers.

The downside of this approach is it quickly becomes very hard to know how a component is going to look when you're writing your HTML, especially if the person writing the HTML is not the person who wrote the CSS.

This is also a pretty trivial example. As soon as you start adding more levels of context dependency, it can quickly get out of hand.

A different approach to the same problem would be to use component modifiers. Modifiers are something I highly recommend and are part of systems like OOCSS, BEM, and SMACSS. They help you avoid a lot of the context dependency issues here.

This is what the above problem would look like with modifiers. Instead of you descendent selectors with .Modal and .ButtonGroup, you'd just you modifier classes:

```css
.Modal-footer {
  text-align: right;
}

.Button { }
.Button--rtl {
  margin-left: .5em;
}
```

Then the HTML would look something like this:

```xml
<div class="Modal">
  <!-- some content goes here -->
  <div class="Modal-footer">
    <a class="Button Button--rtl">Cancel</a>
    <a class="Button Button--rtl">OK</a>
  </div>
</div>
```

As anyone who has used modifiers in the past knows, the trade off here is less coupled CSS modules, but more classes needed in the HTML. In most situations I'd strongly prefer this approach over descendant selectors.

But there are some cases where the modifier approach is impractical.

What if the contents of the modal were a form whose HTML lived in a template file somewhere, and that template was used in both modal and non-modal contexts? How do you handle that case?

If you puristically stick to modifiers then at best you end up with a bunch of conditionals in your templates. At worse you end up with two separate templates for what is essentially the same form.

Again, this is a pretty trivial example. As soon as you start introducing additional layout variants due to container size, device width, or other responsive considerations, you can quickly end up with too many combinations to manage with modifiers.

So, as with many things in front-end development, sometimes it better to use one strategy, and sometimes it's better to use another.

At the end of the day, whatever strategy you pick, you goal should be to maximize the strengths of that method while minimizing its weaknesses.

In the case of the context dependendent components, you should do everything you can to minimize unpredictability.

## A Solution

Part of the reason many people in the CSS community recommend modifiers over context dependency is due to the fact that with any sort of dependency, as it scales, you need a way to manage those dependencies.

CSS doesn't have a way to manage dependencies. Nor do any CSS preprocessors that I know of.

The reason dependency management is needed is because if module A is going to reference module B, but the CSS file for module B hasn't been included yet, module B's later inclusion may override module A's declaration. For example:

```css
/* in modal.css */
.Modal-footer .Button {
  margin-right: 0;
  margin-left: 0.5em;
}

/* in button-row.css */
.ButtonRow .Button {
  margin-right: 0.5em;
}
```

In the above example, the "button-row.css" file should have been included before the "modal.css" file. But if the person who wrote the "button-row.css" file didn't know "modal.css" existed (much less the contents of it or the specificity of its rules) then he's probably just going to add it to the end of the file list for the build system, and suddenly you have a bug.

Messing up the order of how CSS files are concatenated together during the build step is a big problem. I've seen it happen many times. It shouldn't be the responsibility of the person writing the new module to learn the entire system before contributing, it should be the responsibility of the build system to resolve these issues.

A naive solution would be to add something like a require statement to the top of a file that depends on another file coming before it. The require statement would include that file if it hadn't been included already.

```css
/* in modal.css */
@require url('components/button.css');
@require url('components/button-row.css');

.Modal { }
```

This solution is OK, but I think it could lead to an over-dependence on source order. The distinction is subtle, but rather than a module depending on some other file comming before it, I think a module should depend on some other module existing.

Like I said, the difference is subtle, but we see this practice in other languages. An analogy would be using RequireJS or Browserify to structure your code verses simply concatenating them all together via a Grunt task. Both systems may end up producing the same result, but using a module system like AMD or CommonJS (via RequireJS or Browserify respectivly) forces you structure you code in a more maintainable way.

CSS dependency management shouldn't be any different.

## The Strategy

If the file that defines Module A is going to reference Module B in any of its selectors, then it needs to declare Module B as a dependency.

```css
/* in modal-a.css */
@require ModuleB;

.ModuleA { }
.ModuleA .ModuleB { }
```

Being explicit about this dependency at the top the file allows a build system to ensure the dependencies are loaded first, but it does two other much more important things as well:

* It informs other developers of the dependency
* It allows the build to fail when dependencies aren't met, when dependencies are found but not declared, or when there are circular dependencies.

If you're willing to follow a few simple conventions, this can be a lifesaver.

1. Every component must be in its own file and the name of that file should be the same as the component name.
2. Every selector in the file must begin with the component class, a component class sub-element, or a component modifier, e.g., `.Modal`, `.Modal-footer`, `.Modal--wide` but not `.Foobar .Modal` or `.supports-draganddrop .Modal`.
3. Components can only be context dependent on other components, never just arbitrary selectors, e.g. don't do `#content article .Button { }`




TODO:

* What about modernizr classes or other global classes that get added to the `html` or `body` element? (Such as media query classes added via JavaScript.)

* What about altering html elements like `<a>` or `<ul>`, seems like it might be nice to know whan that's happening.



Directory Structure:

/css
-- /base
-- /elements
-- /components
-- /utilities
-- /vendor


