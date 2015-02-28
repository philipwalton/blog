<!--
{
  "layout": "article",
  "title": "Side Effects in CSS",
  "date": "2015-02-28T09:19:06-08:00",
  "draft": true,
  "tags": [
    "CSS"
  ]
}
-->

It feels like every few days I read about some shiny, new way people are writing CSS. Many of these "new" ways are not actually new, they're just variations on an existing, well-known methodology modified to meet the needs (or wants) of some developer or team.

Now I'm certainly not against progress or improving on the old ways of doing things. The problem is that many of these new ways are not better. In fact, many of them are much worse, and the reasons they're worse are not immediately obvious, so in addition to being worse, they're dangerous.

I personally believe [BEM](http://www.smashingmagazine.com/2012/04/16/a-new-front-end-methodology-bem/) is the best methodology for writing CSS today. I've been using BEM exclusively for over three years, and nothing I've seen since has convinced me to change.

I first discovered BEM shortly after being introduced to [OOCSS](https://github.com/stubbornella/oocss/wiki) and [SMACSS](http://smacss.com/). Since I liked and had started using a lot of these concepts, I simply added ideas from BEM to the mix creating my own personalize way of writing CSS. As time went by, I came to realize that BEM is feature complete on its own. Most of the contentions I was using that weren't strict BEM were just getting in the way.

Interestingly, most of the "new" methodologies out there do this same thing. They're based on BEM but with extra features sprinkled on top. They add traits or variations in addition to modifiers, they use attributes instead of classes, they mix in concepts like state and helpers from other methodologies, and they use preprocessors to abstract away the parts they don't like.

Again, I'm not trying to suggest that these ideas are necessarily bad, but they do all seem to have a common theme: they change BEM conventions to satisfy user preference rather than to solve any real problems.

CSS is full of problems&mdash;things that make writing CSS at scale incredibly hard. In my experience, strict BEM is the only methodology that not only minimizes these problems, it eliminates them.

## The hardest problem in CSS

There are two types of problems in CSS: cosmetic problems and architectural problems. Cosmetic problems&mdash;issues like vertical centering or equal-height columns&mdash;usually engender the most vocal complaints, but they're almost never show-stoppers. They're annoying, sure, but they don't break the build.

Architectural problems, on the other hand, can cripple development. I can remember distinct cases, at each of the companies I've worked for, where we postponed developing a new feature because we were too afraid to make *any* changes to the CSS. CSS is global, and every rule you write has the potential to affect entirely unrelated parts of the site. It's this unpredictability that makes writing CSS so challenging.

If I had to choose between hiring an amazing designer who could replicate even the most complicated visual challenges easily in code and someone who understood the nuances of writing predictable and maintainable CSS, I'd choose the latter in a heartbeat.

Cosmetic problems pale in comparison to architectural problems, and the hardest architectural problem of all can be summed up in this single sentence:

*Getting your rules to match the elements you want, without them accidentally matching the elements you don't.*

To put this in terms that may be more familiar to those with a programming background, the hardest problem in CSS is prevent side effects.

## Side effects in CSS

Side effects in computer science happen when a function, in addition to doing its job, modifies or changes the state of the outside world.

Side effects aren't always accidental. Frequently side effects are done intentionally because the change to the outside world is needed to make the program work. The problem is that someone else may need to run this function at a later time and not realize that changes to the outside world are being made.

Because all CSS rules live in the same global scope[1], side effects are extremely common. Since most stylesheets consist of an extremely fragile collection of highly-coupled rules, all intimately dependent on presence, order, and specificity of other rules, even the smallest changes usually come with unforeseen consequences.

In CSS, these consequences (side effects) come in four main forms:

- Base/default rule changes
- Naming collisions
- Subtree matching
- Non-deterministic cascading

### Base/default rule changes

Developers *have* to use HTML tags to write HTML, and there are a finite number of tags to choose from.<sup>[[2](#footnote-2)]</sup> If your CSS contains tag selectors (technically they're called type selectors), you're necessarily breaking the rules of two-way scoping. When initially building a site, this might not seem like a problem, but as soon as you decide you want to change things, perhaps make your `<h1>` elements slightly larger or increase the margin on your `<p>` elements, you realize just how coupled and fragile this code is.

It's possible your changes won't cause any problems, but how can you know for sure? It's extremely likely that other rules in your stylesheet were counting on those base rules being *exactly* what they were.

When rules in your stylesheets depend on other rules, and there's not a clear dependency relationship established, there are bound to be side effects when changes happen.

### Naming collisions

CSS, as a language, will not warn you or fail to build if you pick a class name that already exists. In fact, the ability to override rules is actually one of the features of the language. As a result, without a convention in place to avoid this, or a build-time check, there's no good way to be sure that the class name you picked doesn't already exist.

When multiple developers are committing to the same code base, the chances of two people choosing the same name and not knowing it is extremely high. This is especially true of common name choices like "button", "content" or "title".

### Subtree matching

Most developers are aware of the above two forms of CSS side effects. As such, you'll often see people use a child or descendent combinator to limit the scope of the rules they're writing, e.g. `#homepage .header` or `.some-widget .title`.

While this approach is slightly safer, it doesn't cover 100% of cases. The problem is that limiting the scope of a selector to a particular DOM subtree *does* guarantee that it won't affect outside trees, but it *doesn't* guarantee that it won't unintentionally affect elements within that subtree.

Consider the following example:

```
/* in widget.css */
.widget .title {
  border-bottom: 1px solid gray;
  color: black;
}

/* in media.css */
.media .title {
  color: blue;
  margin: 0;
}
```

While it's true that `.title` elements not found within the `.widget` or `.media` modules will not get either of these styles, there's still the possibility that a `.title` element will be found within *both*  the `.widget` and `.media` modules at the same time.

```html
<!-- The .widget module -->
<div class="widget">
  <h1 **class="title"**>Widget Title</h1>
  <div class="content">

    <!-- The .media module -->
    <div class="media">
      <h2 **class="title"**>Media Title</h2>
    </div>
  </div>
</div>
```

In real-world development, HTML structures are complex and if multiple people are all writing CSS modules this way, it's only a matter of time before two of them pick the same name and put them in the same DOM subtree.

## How BEM eliminates side effects

I said above that all CSS rules are global and every rule has the potential to conflict with every other rule on the page. This means side effects cannot be prevented by the language; however, they *can* be prevented through disciplined and enforceable naming conventions. And that's exactly what BEM does.

- **Base/default rule changes:**<br>
  Strict BEM conventions require the sole use of class selectors, making adding a class to an element the only way to style it. This means that all styling is opt-in via classes rather than de facto via tag selectors.

- **Naming collisions:**<br>
  In BEM, every class selector either is a block name or it uses the block name as a prefix, and the rules for each block live in a dedicated file. Since file systems do not allow two files to have the same name, the OS is actually helping to prevent accidental duplication. If you follow all of the naming conventions, and you always put all block code in its own file, it's impossible to have naming collisions.

- **Subtree matching:**<br>
  The subtree matching example in the previous section used the selectors `.widget .title` and `.media .title`, and since the class name "title" was used in both cases, there was a risk of subtree matching. BEM avoids this issue by requiring that all element classes be prefixed with the block name. The BEM equivalents of these two title selectors would be `.Widget-title` and `.Media-title`. Since the class names are different, their styles won't ever conflict, and thus it's impossible to have unintended subtree matches.

### Enforcing conventions

I've shown that strict adherence to BEM conventions prevents side effect, but how do you make sure the conventions are followed? If the return of side effects is as easy as a new developer not knowing (or fully understanding) the conventions, how is that any better than before?

Luckily, unlike most CSS naming conventions, proper usage of BEM very easy to test for and enforce, both on the CSS side and on the HTML side. The following are a few rules you can test for in a linter of your choice.

In the CSS:

- All .css files (or .scss, or whatever) must only contain selectors that begin with the name of the file itself.
- Rules with nested selectors are only allowed if the root selector is a modifier.
- The use of ID selectors is not allowed
- With the exception of a reset stylesheet, using tag selectors is not allowed.

In the HTML:

- Any element with a class that matches the format for an element must be a descendant of a block by the same name.
- Any element that contains a modifier class must also contain a block class by the same name.

You may find the following tools useful for enforcing BEM conventions:

- [HTML Inspector](https://github.com/philipwalton/html-inspector)
- [CSS Lint](http://csslint.net/)
- [Suit Conformance](https://github.com/suitcss/rework-suit-conformance)
- [PostCSS BEM Linter](https://github.com/necolas/postcss-bem-linter)

## Making exceptions

In the real world ther are cases where the strict adherence to BEM conventions is either impractical or impossible. This is common when using third-party plugins or tools that generate part of your HTML for you, or when building an application where the content may be created by an end user.

There are also cases where, for convenience, developers choose to ignore BEM rules. A common example is in the content area of a site, a developer may choose to favor tag selectors or having to put a class on every single `<p>` or `<a>` tag.

While I'm not going to say this is never a good idea, I will say doing this incurs risk. Hopefully after reading this article it will be apparent exactly what the risks are, and you can decide for yourself the likelihood of encountering side effects in your situation.

## Learning from JavaScript

In the bad old days of JavaScript, it was common for library authors to add methods to the native prototypes of global types like `Object`, `Array`, `String`, and `Function`. At first it seemed like a convenience, but developers quickly realized it was a nightmare. If two different libraries add the same method to `Array.prototype`, each with a slightly different signature or behavior, it would lead to bugs that were almost impossible to track down.

These days, almost no libraries modify native prototypes. In fact, I've seen some libraries publicly shamed for even trying. If we've learned our lesson in JavaScript, why haven't we learned it in CSS?

Every single one of the most popular CSS frameworks today uses absolutely terrible class names. They've chosen the most common names for the most common UI elements and globally reserved them with no consideration for the host environment.

Consider Bootstrap. Every single one of its JavaScript plugins uses a namespace and comes with a `.noConflict()` method to avoid naming collisions. It does this in JavaScript, but its CSS class names make no such effort, despite [numerous](https://github.com/twbs/bootstrap/issues/1235) [requests](https://github.com/twbs/bootstrap/issues/1287) for it, and [easy solutions](/articles/dynamic-selectors/) that I, and other developers, suggested years ago.

I don't mean to call about Bootstrap specifically because pretty much every mainstream CSS framework does this. My hope is that the CSS community would will start demanding better from their tools the same way the JavaScript has.

## Wrapping up

And after writing BEM for a couple of years, I can honestly say that my perspective on "clean" markup has completely changed. BEM markup may not read like a novel, but its incredibly self-documenting. I love that I can look at an HTML file and know exactly where to look for its corresponding styles. Not only do I know where its styles are, but I can be completely confident that there aren't other styles I'm not aware of that are going to affect this particular element.




<aside class="Footnotes">
  <h1 class="Footnotes-title">Footnotes:</h1>
  <ol class="Footnotes-items">
    <li id="footnote-1">There are several [different variations]((https://github.com/philipwalton/html-inspector/blob/0.8.2/src/rules/convention/bem-conventions.js#L1-L27) on the traditional BEM naming conventions. I personally prefer the flavor advocated for by [MontageJS](https://github.com/montagestudio/docs.montagestudio.com/blob/master/montagejs/naming-conventions.md) and [SUIT CSS](https://github.com/suitcss/suit/issues/80).</li>
    <li id="footnote-2">With custom elements, you can create additional tags, which partially solves this problem.</li>
  </ol>
</aside>

























## BEM Praise

I frequently hear people who've switched to BEM raving about how much more maintainable their code is. It's easier to organize, easier to find where rules are defined, easier to look at markup and understand what's going on.

But I pretty much never hear anyone praise what I consider to be BEM's single best feature: *it eliminates side effects*.

## Scope in CSS

Most programming languages have a concept of scope, a way to prevent a variable defined in a particular module or package from conflicting with a variable defined in another.

For scope to be fool-proof, it must be two-way. In other words, what's defined inside the scope must not be able to affect the outside world, and at the same time what's defined in the outside world must not be allowed to affect what's inside the scope. Of course, that is without developers explicitly allowing things in and out.

CSS has one-way scoping. Child and descendant combinators can be used in selectors to isolate a ruleset to a particular subtree, but there's no way to prevent outside styles from applying to the contents of that subtree.
