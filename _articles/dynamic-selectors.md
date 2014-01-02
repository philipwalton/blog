<!--
{
  "layout": "article",
  "title": "Dynamic Selectors",
  "date": "2013-02-20T14:22:24-08:00",
  "tags": [
    "Architecture",
    "CSS",
    "Sass"
  ]
}
-->

When creating a new CSS library or framework, developers typically take one of two approaches with component naming: the [Bootstrap](http://twitter.github.com/bootstrap/) approach or the [jQueryUI](http://jqueryui.com/) approach.

Bootstrap tries to be as simple and basic as possible, calling a component exactly what it is. If something is a tooltip, why not use the class selector `.tooltip` to define how it looks? This approach keeps things simple, clean, and easy to remember, but it has one big disadvantage. If you're trying to incorporate Bootstrap into an existing project, the chances are pretty high it will conflict with your existing selectors.

jQueryUI, on the other hand, takes the opposite approach. They prefix every class name with the string `ui-` greatly reducing the possibility of conflict, but at the cost of being more verbose.

Choosing between these two paths isn't always easy. Namespacing might be better for compatibility, but what should your prefix be? A longer, more unique prefix will lead to fewer conflicts at the cost of a lot more typing. But if you pick a simple prefix, another library might already be using it. And many of the short and sweet prefixes are already taken (like `ui-` by jQuery and `x-` by [ExtJS](http://www.sencha.com/products/extjs)).

What if there were a third option? One with all the benefits of clean and simple names like Bootstrap, but without any of the possible conflicts?

With the help of a CSS preprocessor like [Sass](http://sass-lang.com/), this *is* possible.

## Define Selectors with a Variable

Imagine I have a website that's been around for a while and already defines styles for `.tooltip` and `.alert`. Then I decide I want to start using Bootstrap, but I don't have the time to convert all of my legacy code to the Bootstrap format.

Given the current state of Bootstrap, I'm pretty much out of luck.

But what if there were a way to tell Bootstrap that I wanted to use its `.alert` component, but call it something else, perhaps `.notice`. With dynamic selectors, you can do exactly that.

Selectors don't have to be static. If you build your components with a predictable naming convention, it becomes easy to abstract that name into a variable.

The convention I use is to give each component a name and add that name to the root element of the component. Each sub-element of the component that needs styling defines a class with the component name as a prefix.

Here's a basic example of a messagebox component taken from an imaginary library called Flux:

```xml
<!-- the markup for the messagebox component -->
<div class="messagebox">
  <h1 class="messagebox-title">...</h1>
  <p class="messagebox-body">...</p>
</div>
```

```css
/* and the corresponding styles */
.messagebox { }
.messagebox-title { }
.messagebox-body { }
```

A predictable convention like this allows you to easily replace the static names in the selector with a Sass variable like so:

```scss
$flux-messagebox-name: "messagebox" !default;

.#{$flux-messagebox-name} { }
.#{$flux-messagebox-name}-title { }
.#{$flux-messagebox-name}-body { }
```

This technique has all the pros of a clean naming system like Bootstrap with almost none of the potential conflicts. If a project wants to include the messagebox styles above, but its CSS already has `.messagebox` defined, there's no problem. All they'd have to do is assign the `$flux-messagebox-name` variable to something else before including the messagebox's Sass file, and the conflict is solved.

```scss
/* first override the messagebox's class name */
$flux-messagebox-name: "some-other-name";

/* then import flux normally */
@import "flux";
```

Note: I'm prefixing the class name variables with the `flux` namespace for an extra level of protection since Sass variables live in the global scope. Doing this isn't 100% necessary, but I recommend it.

## JavaScript Plugins

Most component libraries come with a least some JavaScript that dynamically creates its own markup. If these components offer Sass variables for dynamic selectors, they'll also need to offer JavaScript variables to change the class names there as well.

Since components typically expose a defaults object, the class name variable could be a property on that object, allowing users of the library to change it globally in one place.

For example, if messagebox is a jQuery plugin, you might use code like this to dynamically change the class name:

```javascript
$.fn.messagebox.defaults.className = "some-other-name";
```

## What about static markup?

At this point I'm sure some readers are wondering whether I've overlooked half the problem. Dynamically building selectors is one thing, but what if the old class name is in hundreds of places in the HTML, how do you deal with that?

The truth is I don't think that situation would be very common. The typical use case for dynamic selectors is when you want to start using a third party library, haven't written any code for it yet, and realize there would be conflicts. In this use case, you're picking a class name that *isn't* in the HTML precisely to avoid conflict.

The only time I could see dynamic selectors leading to a lot of find-and-replace in the HTML is if you change your mind and suddenly decide you want to name your classes something else, in which case it's not really the library author's fault. Also, if you're repeating a lot of the same markup for each component and you think it's likely you'll change your mind later, this is a perfect place to abstract that markup into templates, partials, or helpers.

## Summary

All component libraries that use preprocessors should offer the option of dynamic selectors. It allows for a short and simple name for the majority of users and only requires extra effort for the ones who need it. It doesn't impose a verbose prefix on anyone and keeps the barrier to entry low. Those who want to make changes can dive into the Sass file, and those who just want to use it out of the box can simply grab the compiled CSS. Everybody wins.

I'd love to see libraries like Bootstrap adopt this approach. Bootstrap already uses a jQuery-like `noConflict()` method in each of its JavaScript plugins. Dynamic selectors wouldn't be much harder and would go a long way to increase its compatibility.

I believe that website authors should be able to write their markup however they want. They should be able to choose whatever names they want without the fear that someday those names will conflict with a third party library. It should be the responsibility of library and framework authors to make their code as compatible as possible.