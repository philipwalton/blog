---
template: article.html
title: "CSS Architecture"
date: 2012-11-16T18:04:25-08:00
excerpt: To many Web developers, being good at CSS means you can take a visual mock-up and replicate it perfectly in code
---

<p class="Callout">
  This article was originally published on the <a href="http://engineering.appfolio.com/2012/11/16/css-architecture">AppFolio Engineering Technical Blog</a>. It has been reprinted here with permission.
</p>

To many Web developers, being good at CSS means you can take a visual mock-up and replicate it perfectly in code. You don't use tables, and you pride yourself on using as few images as possible. If you're really good, you use the latest and greatest techniques like media queries, transitions and transforms. While all this is certainly true of good CSS developers, there's an entirely separate side to CSS that rarely gets mentioned when assessing one's skill.

Interestingly, we don't usually make this oversight with other languages. A Rails developer isn't considered good just because his code works to spec. This is considered baseline. Of course it must work to spec; its merit is based on other things: Is the code readable? Is it easy to change or extend? Is it decoupled from other parts of the application? Will it scale?

These questions are natural when assessing other parts of the code base, and CSS shouldn't be any different. Today's web applications are larger than ever, and a poorly thought-out CSS architecture can cripple development. It's time to evaluate CSS the same way we evaluate every other part of the application. It cannot be an afterthought or written off as merely the *designer's* problem.

## The Goals of Good CSS Architecture

In the CSS community, a general consensus of best practices is very difficult to come by. Judging purely by the [comments on Hacker News](http://news.ycombinator.com/item?id=2658948) and the [reaction of developers](http://2002-2012.mattwilcox.net/archive/entry/id/1054/) to the release of [CSS Lint](http://csslint.net/), it's clear that many people disagree over even the basic things CSS authors should and shouldn't do.

So instead of laying out an argument for my own set of best practices, I think we should start by defining our goals. If we can agree upon the goals, hopefully we can start to spot bad CSS not because it breaks our preconceived notions of what's good but because it actually hinders the development process.

I believe the goals of good CSS architecture shouldn't be that different from the goals of all good software development. I want my CSS to be predictable, reusable, maintainable, and scalable.

### Predictable

Predictable CSS means your rules behave as you'd expect. When you add or update a rule, it shouldn't affect parts of your site that you didn't intend. On small sites that rarely change, this isn't as important, but on large sites with tens or hundreds of pages, predictable CSS is a must.

### Reusable

CSS rules should be abstract and decoupled enough that you can build new components quickly from existing parts without having to recode patterns and problems you've already solved.

### Maintainable

When new components and features need to be added, updated or rearranged on your site, doing so shouldn't require refactoring existing CSS. Adding component X to the page shouldn't break component Y by its mere presence.

### Scalable

As your site grows in size and complexity it usually requires more developers to maintain. Scalable CSS means it can be easily managed by a single person or a large engineering team. It also means your site's CSS architecture is easily approachable without requiring an enormous learning curve. Just because you're the only developer touching the CSS today doesn't mean that will always be the case.

## Common Bad Practices

Before we look at ways to achieve the goals of good CSS architecture, I think it can be helpful to look at common practices that get in the way of our goals. It's often only through repeated mistakes that we can begin to embrace an alternate path.

The following examples are all generalizations of code I've actually written, and, while technically valid, each has lead to disaster and headache. Dispite my best intentions and the promise that this time would be different, these patterns consistently got me into trouble.

### Modifying Components Based On Who Their Parents Are

In almost every site on the web there will be a particular visual element that looks exactly the same with each occurrence, except one. And when faced with this one-off situation almost every new CSS developer (and even experienced ones) handles it the same way. You figure out some unique parent for this one particular occurrence (or you create one), and you write a new rule to handle it.

```css
.widget {
  background: yellow;
  border: 1px solid black;
  color: black;
  width: 50%;
}

#sidebar .widget {
  width: 200px;
}

body.homepage .widget {
  background: white;
}
```

At first this might seem like fairly harmless code, but let's examine it based on the goals established above.

First, the widget in the examle is not predictable. A developer who's made several of these widgets will expect it to look a certain way, yet when she uses it in the sidebar or on the homepage, it will look different, despite the markup being exactly the same.

It's also not very reusable or scalable. What happens when the way it looks on the homepage is requested on some other page? New rules will have to be added.

Lastly, it's not easily maintainable because if the widget were to get redesigned, it would have to get updated in several places in the CSS, and unlike the above example, the rules that commit this particular anti-pattern rarely appear right next to each other.

Imagine if this type of coding were done in any other language. You're essentially making a class definition, and then in another part of the code you're reaching into that class definition and changing it for a particular use case. This directly violates the open/closed principle of software development:

> Software entities (classes, modules, functions, etc.) should be open for extension, but closed for modification.

Later in this article we'll look at how to modify components without relying on parent selectors.

### Overly Complicated Selectors

Occasionally an article will make its way around the Internet showcasing the power of CSS selectors and proclaiming that you can style an entire site without using any classes or IDs.

While technically true, the more I develop with CSS, the more I stay away from complex selectors. The more complicated a selector the more coupled it is to the HTML. Relying on HTML tags and combinators keeps your HTML squeaky clean, but it makes your CSS gross and dirty.

```css
#main-nav ul li ul li div { }
#content article h1:first-child { }
#sidebar > div > h3 + p { }
```

All of the above examples make logical sense. The first is probably styling a dropdown menu, the second says that the article's main heading should look different from all other `<h1>` elements, and the last example is likely adding some extra spacing for the first paragraph in the sidebar sections.

If this HTML were never going to change, an argument could be made for its merits, but how realistic is it to assume the HTML will never change? Overly complicated selectors can be impressive and they can go far to rid the HTML of presentational hooks, but they rarely help us achieve our goals for good CSS architecture.

These examples above are not reusable at all. Since the selector is pointing to a very particular place in the markup, how could another component with a different HTML structure reuse those styles? Taking the first selector (the dropdown) as an example, what if a similar looking dropdown were needed on a different page and it wasn't inside of the `#main-nav` element? You'd have to recreate the entire style.

These selectors are also very unpredictable if the HTML needs to change. Imagine that a devloper wanted to change the `<div>` in the third example to the HTML5 `<section>` tag, the whole rule would break.

Finally, since these selectors only work when the HTML remains constant, they're by definition not maintainable or scalable.

In large applictaions you have to make trade-offs and compromises. The fragility of complex selectors are rarely worth the price in the name of keeping your HTML "clean".

### Overly Generic Class Names

When creating reusable design components, it's very common to scope (as it were) the component's sub-elements inside the component's class name. For example:


```xml
<div class="widget">
  <h3 class="title">...</h3>
  <div class="contents">
    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
    In condimentum justo et est dapibus sit amet euismod ligula ornare.
    Vivamus elementum accumsan dignissim.
    <button class="action">Click Me!</button>
  </div>
</div>
```


```css
.widget {}
.widget .title {}
.widget .contents {}
.widget .action {}
```

The idea is that the `.title`, `.contents`, and `.action` sub-element classes can be safely styled without having to worry about those styles spilling over to any other elements styled with the same classes. This is true, but it doesn't prevent the styling of classes with those same names from spilling into this component.

On a large project it's very likely that a class name like `.title` would get used in another context or even by itself. If that happened, the widget's title would suddenly look very different than intended.

Overly generic class names lead to very unpredictable CSS.

### Making a Rule Do Too Much

Sometimes you make a visual component that needs to be 20 pixels from the top left corner of a section in your site:

```css
.widget {
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: red;
  font-size: 1.5em;
  text-transform: uppercase;
}
```

Then down the road you need to use this exact same component in a different location. The above CSS won't work because it's not reusable in different contexts.

The problem is that you're making this one selector do too much. You're defining the look and feel as well as the layout and position within the same rule. The look and feel is reusable but the layout and position is not. And since they're used together, the whole rule is compromised.

While this may seem harmless at first, it often leads to copying and pasting from less CSS-savvy developers. If a new team member wants something to look like a particular component, say an `.infobox`, they'll probably start by trying that class. But if that doesn't work because it positions that new infobox in an undesired way, what are they likely to do? In my experience, most new developers will not break the rule up into its reusable parts. Instead they'll simply copy and paste the lines of code needed for this particular instance into a new selector, unnecessarily duplicating code.

## The Cause

All of the above bad practices share one similarity, they place far too much of the styling burden on the CSS.

That may seem like strange statement. After all, it is a stylesheet; shouldn't it bear most (if not all) of the styling burden? Isn't that what we want?

The simple answer to this question is "yes", but, as usual, things aren't always so simple. Separating content from presentation is a good thing, but just because your CSS is separate from your HTML doesn't mean your content is separate from your presentation. Put another way, striping all presentational code from your HTML doesn't fulfill the goal if your CSS requires an intimate knowledge of your HTML structure in order to work.

Furthermore, HTML is rarely just content; it's almost always structure too. And often that structure consists of container elements with no purpose other than to allow the CSS to isolate a certain group of elements. Even without presentational classes, this is still clearly presentation mixed into the HTML. But is it necessarily mixing presentation with content?

I believe, given the current state of HTML and CSS, it's necessary and often wise to have the HTML and CSS work together as a presentational layer. The content layer can still be abstracted away via templates and partials.

## The Solution

If your HTML and your CSS are going to work together to form the presentation layer of a web application, they need to do so in a way that promotes all of the principles of good CSS architecture.

The best approach that I've found is for the CSS to assume as little HTML structure as possible. The CSS should define how a set of visual elements look and (in order to minimize coupling with the HTML) those elements should look as they're defined regardless of where they appear in the HTML. If a certain component needs to look different in a different scenario, it should be called something different and it's the HTML's responsibility to call it that.

As an example, the CSS might define a button component via the `.button` class. If the HTML wants a particular element to look like a button, it should use that class. If there's a situation were the button needs to look different (perhaps larger and full-width), then the CSS needs to define that look as well with a new class, and the HTML can include that new class to employ the new look.

The CSS defines what your components look like, and the HTML assigns those looks to the elements on the page. The less the CSS needs to know about the HTML structure the better.

A huge benefit of declaring exactly what you want in the HTML is it allows other developers to look at the markup and know exactly what the element is supposed to look like. The intent is obvious. Without this practice it's impossible to tell if the look of an element is intentional or accidental, and this leads to confusion on the team.

A common objection to putting a lot of classes in the markup is the extra effort required to do so. A single CSS rule could target a thousand instances of a particular component. Is it really worth writing that classes a thousand times just to have it explicitly declared in the markup?

While this concern is clearly valid, it can be misleading. The implication is that either you use a parent selector in the CSS or you write that HTML class 1000 times by hand, but there are obviously other alternatives. View level abstractions in Rails or other frameworks can go a long way toward keeping the visual look explicitly declared in the HTML without having to write the same class over and over again.

## Best Practices

After making the above mistakes over and over again, and paying the consequences later on down the road, I've come up with the following bits of advice. While by no means comprehensive, my experience has shown that sticking to these principles will help you better achieve the goals of good CSS architecture.

### Be intentional

The best way to make sure your selectors don't style unwanted elements is to not give them the opportunity. A selector like `#main-nav ul li ul li div` could very easily end up applying to unwanted elements as your markup changes down the road. A style like `.subnav`, on the other hand, will have absolutely no chance of accidentally applying to an unwanted element. Applying classes directly to the elements you want to style is the best way to keep your CSS predictable.

```css
/* Grenade */
#main-nav ul li ul { }

/* Sniper Rifle */
.subnav { }
```

Given the two examples above, think of the first one like a grenade and the second like a sniper rifle. The grenade might work just fine today, but you never know when an innocent civilian could move inside the blast radius.

### Separate your concerns

I've already mentioned that a well organized component layer can help loosen the coupling of HTML structure in the CSS. In addition to that, your CSS components themselves should be modular. Components should know how to style themselves and do that job well, but they should not be responsible for their layout or positioning nor should they make too many assumptions about how they'll be spaced in relation to surrounding elements.

In general, components should define how they look, but not their layout or position. Be careful when you see properties like background, color, and font in the same rule as position, width, height, and margin.

Layout and position should be handled by either a separate layout class or a separate container element. (Remember that to effectively separate content from presentation it's often essential to separate content from its container.)

### Namespace your classes

We already examined why parent selectors aren't 100% effective at encapsulation and preventing style cross-contamination. A much better approach is applying namespaces to the classes themselves. If an element is a member of a visual component, every one of its sub-element classes should use the component's base class name as a namespace.

```css
/* High risk of style cross-contamination */
.widget { }
.widget .title { }

/* Low risk of style cross-contamination */
.widget { }
.widget-title { }
```

Namespacing your classes keeps your components self-contained and modular. It minimizes the likelihood that an existing class will conflict, and it lowers the specificity required to style child elements.

### Extend components with modifier classes

When an existing component needs to look slightly different in a certain context, create a modifier class to extend it.

```css
/* Bad */
.widget { }
#sidebar .widget { }

/* Good */
.widget { }
.widget-sidebar { }
```

We've already seen the downsides of modifying components based on one of their parent elements, but to reiterate: A modifier class can be used anywhere. Location based overrides can only be used in a specific location. Modifier classes can also be reused as many times as you need. Lastly, modifier classes express the intention of the developer very clearly right in the HTML. Location based classes, on the other hand, are completely invisible to a developer only looking at the HTML, greatly increasing the probability that it will be overlooked.

### Organize Your CSS Into a Logical Structure

[Jonathan Snook](http://snook.ca/), in his excellent book [SMACSS](http://smacss.com/), argues for organizing your CSS rules into four separate categories: base, layout, modules, and state. Base consists of reset rules and element defaults. Layout is for positioning of site-wide elements as well as generic layout helpers like grid systems. Modules are reusable visual elements, and state refers to styling that can be toggled on or off via JavaScript.

In the SMACSS system, modules (which are equivalent to what I call components) comprise the vast majority of all the CSS rules, so I often find it necessary to break them down even further into abstract templates.

Components are standalone visual elements. Templates, on the other hand, are building blocks. Templates don't stand on their own and rarely describe look and feel. Instead, they're single, repeatable patterns that can be put together to form a component.

To provide a concrete example, a component might be a modal dialog box. The modal might have the site's signature background gradient in the header, it might have a drop shadow around it, it might have a close button in the top right corner, and it might be positioned fixed and centered vertically and horizontally. Each of these four patterns might be used again and again all over the site, so you wouldn't want to have to recode those patterns each time. As such they're all templates, and together they comprise the modal component.

I typically don't use template classes in the HTML unless I have a good reason. Instead I use a preprocessor to include the template styles in the component definition. I'll discuss this and my rational for doing so in more detail later.

### Use Classes For Styling And Styling Only

Anyone who has worked on a large project has come across an HTML element with a class whose purpose was completely unknown. You want to remove it, but you're hesitant because it may have some purpose that you're not aware of. As this happens again and again, over time, your HTML become filled with classes that serve no purpose just because team members are afraid to delete them.

The problem is that classes are generally given too many responsibilities in front-end web development. They style HTML elements, they act as JavaScript hooks, they're added to the HTML for feature detections, they're used in automated tests, etc.

This is a problem. When classes are used by too many parts of the application, it becomes very scary to remove them from your HTML.

However, with an established convention, this problem can be completely avoided. When you see a class in the HTML, you should be able to tell instantly what its purpose is. My recommendation is to give all non-styled classes a prefix. I use `.js-` for JavaScript and I use `.supports-` for Modernizr classes. All classes without a prefix are for styling and styling only.

This makes finding unused classes and removing them from the HTML as easy as searching the stylesheets directory. You can even automate this process in JavaScript by cross referencing the classes in the HTML with the classes in the `document.styleSheets` object. Classes that aren't in `document.styleSheets` can be safely removed.

In general, just as it's a best practice to separate your content from your presentation, it's also important to separate your presentation from your functionality. Using styled classes as JavaScript hooks deeply couples your CSS and JavaScript in a way that can make it hard or impossible to update the look of certain elements without breaking functionality.

### Name your classes with a logical structure

These days most people write CSS with hyphens as word separators. But hyphens alone are usually not enough to distinguish between different types of classes.

[Nicolas Gallagher](http://nicolasgallagher.com) recently wrote about [his solution to this problem](http://nicolasgallagher.com/about-html-semantics-front-end-architecture/) which I have also adopted (with slight changes) with great success. To illustrate the need for a naming convention consider the following:

```css
/* A component */
.button-group { }

/* A component modifier (modifying .button) */
.button-primary { }

/* A component sub-object (lives within .button) */
.button-icon { }

/* Is this a component class or a layout class? */
.header { }
```

From looking at the above classes, it's impossible to tell what type of rule they apply to. This not only increases confusion during development, but it also makes it harder to test your CSS and HTML in an automated way. A structured naming convention allows you to look at a class name and know exactly what its relationship is to other classes and where it should appear in the HTML &mdash; making naming easier and testing possible where it previously was not.

```
# Templates Rules (using Sass placeholders)
%template-name { }
%template-name--modifier-name { }
%template-name__sub-object { }
%template-name__sub-object--modifier-name { }

# Component Rules
.component-name { }
.component-name--modifier-name { }
.component-name__sub-object { }
.component-name__sub-object--modifier-name { }

# Layout Rules
.l-layout-method { }
.grid { }

# State Rules
.is-state-type { }

# Non-styled JavaScript Hooks
.js-action-name { }
```

The first example redone:

```css
/* A component */
.button-group { }

/* A component modifier (modifying .button) */
.button--primary { }

/* A component sub-object (lives within .button) */
.button__icon { }

/* A layout class */
.l-header { }
```

## Tools

Maintaining an effective and well-organized CSS architecture can be very difficult, especially on large teams. A few bad rules here and there can snowball into an unmanageable mess. Once your application's CSS has entered into the realm of specificity wars and `!important` trumps, it can be next to impossible to recover without starting over. The key is to avoid those problems from the beginning.

Fortunately, there are tools that can make controlling your site's CSS architecture much easier.

### Preprocessors

These days it's impossible to talk about CSS tools without mentioning preprocessors, so this article won't be any different. But before I praise their usefulness, I should offer a few words of caution.

Preprocessors help you write CSS faster, not better. Ultimately it gets turned into plain CSS, and the same rules should apply. If a preprocessor lets you write your CSS faster then it also lets you write bad CSS faster, so it's important to understand good CSS architecture before thinking a preprocessor will solve your problems.

Many of the so-called "features" of preprocessors can actually be very bad for CSS architecture. The following are some of the "features" I avoid at all costs (and though the general ideas apply to all preprocessor languages, these guidelines apply specifically to Sass).

* Never nest rules purely for code organization. Only nest when the outputted CSS is what you want.
* Never use a mixin if you're not passing an argument. Mixins without arguments are much better used as templates which can be extended.
* Never use `@extend` on a selector that isn't a single class. It doesn't make sense from a design perspective and it bloats the compiled CSS.
* Never use `@extend` for UI components in component modifier rules because you lose the inheritance chain (more on this in a bit).

The best parts of preprocessors are functions like [`@extend`](http://sass-lang.com/docs/yardoc/file.SASS_REFERENCE.html#extend) and [`%placeholder`](http://sass-lang.com/docs/yardoc/file.SASS_REFERENCE.html#placeholder_selectors_). Both allow you to easily manage CSS abstraction without adding bloat to your CSS or a huge list of base classes in your HTML that can be very hard to manage.

`@extend` should be used with care though because sometime you want those classes in your HTML. For example, when you first learn about `@extend` it might be tempting to use it with all of your modifier classes like so:

```scss
.button {
  /* button styles */
}

/* Bad */
.button--primary {
  @extend .button;
  /* modification styles */
}
```

The problem with doing this is you lose the inheritance chain in the HTML. Now it's very difficult to select all button instances with JavaScript.

As a general rule, I never extend UI components or anything that I might want to know the type of later. This is what templates are for and another way to help distinguish between templates and components. A template is something you wouldn't ever need to target in your application logic, and therefore can be safely extended with a preprocessor.

Here's how it might look using the modal example referenced above:

```scss
.modal {
  @extend %dialog;
  @extend %drop-shadow;
  @extend %statically-centered;
  /* other modal styles */
}

.modal__close {
  @extend %dialog__close;
  /* other close button styles */
}

.modal__header {
  @extend %background-gradient;
  /* other modal header styles */
}
```

### CSS Lint

[Nicole Sullivan](http://www.stubbornella.org/) and [Nicholas Zakas](http://www.nczonline.net/) created [CSS Lint](http://csslint.net/) as a code quality tool to help developers detect bad practices in their CSS. Their site describes it as such:

> CSS Lint points out problems with your CSS code. It does basic syntax checking as well as applying a set of rules to the code that look for problematic patterns or signs of inefficiency. The [rules] are all pluggable, so you can easily write your own or omit ones you don't want.

While the general ruleset may not be perfect for most projects, the best feature of CSS Lint is its ability to be customized exactly how you want it. This means you can pick and choose the rules you want from their default list as well as write your own.

A tool like CSS Lint is essential for any large team to ensure at least a baseline of consistency and convention compliance. And like I hinted at previously, one of the great reasons for conventions is they allow for tools like CSS Lint to easily identify anything that breaks them.

Based on the conventions I've proposed above, it becomes very easy to write rules to detect particular antipatterns. Here are a few suggestions that I use:

* Don't allow IDs in your selectors.
* Don't use non-semantic type selectors (e.g. DIV, SPAN) in any multi-part rule.
* Don't use more than 2 combinators in a selector.
* Don't allow any class names that begin with "js-".
* Warn if frequently using layout and positioning for non "l-" prefixed rules.
* Warn if a class defined by itself is later redefined as a child of something else.

These are obviously just suggestions, but they're intended to get you thinking about how to enforce the standards you want on your projects.

### HTML Inspector

Earlier I suggested that it would be easy to search your HTML classes and all linked stylesheets and warn if a class was used in the HTML but not defined in any stylesheet. I'm currently developing a tool called the [HTML Inspector](https://github.com/philipwalton/html-inspector) to make this process easier.

HTML Inspector traverses your HTML and (much like CSS Lint) allows you to write your own rules that throw errors and warnings when some convention is being broken. I currently use the following rules:

* Warn if the same ID is used more than once on a page.
* Don't use any classes that aren't mentioned in any stylesheet or pass a whitelist (like "js-" prefixed classes).
* Modifer classes shouldn't be used without their base class.
* Sub-object classes shouldn't be used when no ancestor contains the base class.
* Plain old DIV or SPAN elements, without classes attached, should not be used in the HTML.

## Summary

CSS isn't just visual design. Don't throw out programming best practices just because you're writing CSS. Concepts like OOP, DRY, the open/closed principle, separation of concerns, etc. still apply to CSS.

The bottom line is that whatever you do to organize your code, make sure you judge your methods by whether or not they actually help make your development easier and more maintainable in the long term.
