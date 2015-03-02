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

It feels like every few days I read about some shiny new way people are writing CSS. Many of these "new" ways are not actually new, they're just variations on an existing, well-known methodology modified to meet the needs (or wants) of some developer or team.

Now I'm certainly not against progress or improving on the old ways of doing things. The problem is that many of these new ways are not actually better. In fact, many of them are much worse, and the reasons they're worse are not immediately obvious, so in addition to being worse, they're dangerous.

I personally believe [BEM](http://www.smashingmagazine.com/2012/04/16/a-new-front-end-methodology-bem/) is the best methodology for writing CSS today. I've used BEM exclusively for years, and nothing I've seen since has convinced me to change. BEM conventions make your code more structred, organized, and self-documenting than any of its competitors. But I think BEM's best features is something I rarely hear mentioned&mdash;so I decided to write about it.

When I first discovered BEM, it was only a few months after also being introduced to the [OOCSS](https://github.com/stubbornella/oocss/wiki) and [SMACSS](http://smacss.com/) methodologies. Since I'd already started using SMACSS and OOCSS concepts in my code, I simply added my favorite BEM ideas into the mix and created my own, personalized way of writing CSS. As time went by, I came to realize that this mashup was actually worse than if I had just used BEM on its own.

Interestingly, most of the methodologies that have come out recently do this same thing. They're based on BEM but with extra features sprinkled on top. They add traits or variations in addition to modifiers, they use attributes instead of classes, they mix in concepts like state and helpers from other methodologies, and they use preprocessors to abstract away the parts they don't like.

Again, I'm not trying to suggest that all these ideas are bad, but most of them do seem to have a common theme: they change BEM conventions to satisfy user preference rather than to solve any real problems.

CSS is full of bad parts&mdash;things that make writing code at scale incredibly challenging. In my experience, strict BEM is the only methodology that not only minimizes these problems, it virtually eliminates them.

## The hardest problem in CSS

There are two types of problems in CSS: cosmetic problems and architectural problems. Cosmetic problems&mdash;issues like vertical centering or equal-height columns&mdash;usually engender the most vocal complaints, but they're almost never show-stoppers. They're annoying, sure, but they don't break the build.

Architectural problems, on the other hand, can cripple development. I can remember distinct cases, at each of the companies I've worked for, where we postponed developing a new feature because we were too afraid to make *any* changes to the CSS.

CSS is global, and every rule you write has the potential to affect entirely unrelated parts of the site.<sup>[[1]](#footnote-1)</sup> It's this unpredictability that makes writing good CSS so hard.

If I had to choose between hiring an amazing designer who could replicate even the most complicated visual challenges easily in code and someone who understood the nuances of writing predictable and maintainable CSS, I'd choose the latter in a heartbeat.

Cosmetic problems pale in comparison to architectural problems, and the hardest architectural problem of all can be summed up in this single sentence:

*Getting your rules to match the elements you want, without them accidentally matching the elements you don't.*

To put this in terms that may be more familiar to those with a programming background, the hardest problem in CSS is eliminating side effects.

## Side effects in CSS

Side effects in computer science happen when a function, in addition to returning a value, also modifies some state of the outside world.

To put this more generally, side effects describe the phenomenon in which something that appears to only affect things in a very limited scope, will in actuality affect a much broader range of things, and do so in a way that may not be obvious the person performing the action.

Because all CSS rules live in the global scope, side effects are extremely common. And since most stylesheets consist of an extremely fragile collection of highly-coupled rules, all intimately dependent on the presence, order, and specificity of other rules, even the smallest changes usually come with unforeseen consequences.

In CSS, side effects come in three main forms:

- Base/default rule changes
- Naming collisions
- Subtree matching

### Base/default rule changes

Developers *have* to use HTML tags to write HTML, and there are a finite number of tags to choose from.<sup>[[2]](#footnote-2)</sup> While it can be tempting to define a lot of base styles with tag selectors (technically they're called [type selectors](http://www.w3.org/TR/CSS21/selector.html#type-selectors)) in order to avoid having to class everything, doing so necessarily creates an undeclared dependency between those rules and all of your components.

When first building a website, this doesn't usually seem like a big deal, in fact it feels natural and DRY. You create some base, foundational styles (margins, font sizes, colors, etc.) so your components don't have to redefine all that stuff later.

The problem is this approach only saves you time if you never change your base rules. But in practice, site designs can and do change. You might decide to make the font size of your headings a little larger, or use different default margin on your paragraphs, or maybe you realize you prefer borders instead of underlines for your links. If your `.article-title`, `alert-content`, and `footer-link` components depend on these base styles, you'll quickly realize how coupled and fragile your code is.

If your components depend on base styles, then changes to those base styles will require checking your entire site to ensure everything still looks right.

### Naming collisions

CSS, as a language, will not warn you or fail to build if you pick a class name that already exists. In fact, the ability to override rules is one of the "features" of the language. As a result, without a convention in place to avoid this, or a build-time check to protect yourself, there's no good way to be sure the class name you picked doesn't already exist or isn't being checked in by somebody else at that exact moment.

When multiple developers are committing to the same code base, the chances of two people choosing the same name and not knowing it is extremely high. This is especially true of common name choices like "button", "content" or "title".

And this isn't just a problem with top level class names. As I'll show in the next section, picking the same name in a subtree can be just as, if not more, dangerous.

### Subtree matching

Lots of developers are aware of the above two forms of CSS side effects, so you'll often see people use a child or descendent combinator to limit the scope of the rules they're writing (e.g. `#homepage .header` or `.some-widget .title`).

While this approach is slightly safer, it can still produce side effects. As I hinted at above, the appearance of safety can actually make this practice more risky.

Limiting the scope of a selector to a particular DOM subtree *does* guarantee that it won't affect elements outside of that subtree. The problem is it *doesn't* guarantee that it won't unintentionally affect elements within the *same* subtree.

Consider the following example:

```
/* in article.css */
.article .title {
  border-bottom: 1px solid gray;
  color: black;
}

/* in widget.css */
.widget .title {
  margin: 0;
  text-transform: uppercase;
}
```

While it's true that `.title` elements not inside `.article` or `.widget` subtrees will not get either of these styles, there's still the possibility that a `.title` element will be inside *both* `.article` and `.widget` subtrees at the same time.

The widget title in the following example is going to render with an unexpected bottom border:

```html
<!-- The .article module -->
<article class="article">
  <h2 **class="title"**>Article Title</h2>
  <div class="content">

    <p>&hellip;</p>

    <!-- The .widget module -->
    <div class="widget">
      <h2 **class="title"**>Widget Title</h2>
    </div>

  </div>
</article>
```

In real-world development, HTML structures are complex and if multiple people are all writing CSS like in the examples above, it's only a matter of time before two of them pick the same name and put it in the same subtree.

I should also point out that using scoped type selectors makes this problem much worse. Writing rules like `.article h3` is just asking for trouble.

## How BEM eliminates side effects

I said above that all CSS rules are global and every rule has the potential to conflict with every other rule on the page. This means side effects cannot be prevented by the language; however, they *can* be prevented through disciplined and enforceable naming conventions. And that's exactly what BEM provides.

- **Base/default rule changes:**<br>
  Strict BEM conventions require the sole use of class selectors. You start with a global reset, and then you use blocks to style everything on the page. In other words, adding a class to an element is the only way to style it, which means all styling is opt-in rather than de facto. Blocks encapsulate all of their styling and rely on no external dependencies.<sup>[[3]](#footnote-3)</sup>

- **Naming collisions:**<br>
  In BEM, every class selector either is the block name itself or uses the block name as a prefix, and the rules for each block live in its own dedicated file. Since file systems do not allow two files to have the same name, the OS is actually helping to prevent accidental duplication. If you follow all of the BEM naming conventions,<sup>[[4]](#footnote-4)</sup> and you ensure all block code resides in its own file, you will never have naming collisions.

- **Subtree matching:**<br>
  The subtree matching example in the previous section used the selectors `.article .title` and `.widget .title`. Since the class name "title" was used in both cases, there was a risk of subtree matching. BEM avoids this issue by requiring that all element classes be prefixed with the block name. The BEM equivalents of these two title selectors would be `.Widget-title` and `.Media-title`. Since the class names are different, their styles won't ever conflict, and thus it's impossible to have unintended subtree matches.

### Enforcing conventions

I've shown how a strict adherence to BEM conventions prevents all primary forms  of CSS side effects, but how do you make sure the conventions are always followed? If the reemergence of side effects can be due to something as simple a new developer not knowing (or fully understanding) the rules, how is that any better than before?

Luckily, unlike most CSS naming conventions, proper usage of BEM very easy to test and enforce, both on the CSS side and on the HTML side. The following are a few rules you can test for in a linter of your choice.

In the CSS:

- With the exception of a reset stylesheet, all other files must only contain class selectors.
- All class selectors must begin with the name of the file name.
- Nested selectors may only be two levels deep and must consist of a modifier classes followed by an element class.

In the HTML:

- Any HTML tag with an element class must be a descendant of a tag with a block class by the same name.
- Any HTML tag with a modifier class must also have a block class by the same name.

You may find the following tools useful for enforcing BEM conventions:

- [HTML Inspector](https://github.com/philipwalton/html-inspector)
- [CSS Lint](http://csslint.net/)
- [Suit Conformance](https://github.com/suitcss/rework-suit-conformance)
- [PostCSS BEM Linter](https://github.com/necolas/postcss-bem-linter)

## Making exceptions

In the real world there are cases where the strict adherence to BEM conventions is either impractical or impossible. This is common when using third-party plugins or tools that generate part of your HTML for you, or when building an application where content is going to be generated by an end user.

There are also cases where, for convenience, developers choose to ignore BEM conventions. A common example of this is in the content area of a site. A developer may choose to favor tag selectors over having to put a class on every single `<p>` or `<a>` tag.

By now I hope it's obvious that making exceptions or ignoring BEM conventions will incur risk. And after reading this article it should be apparent exactly what these risks are. You can decide for yourself the level of you are willing to take, given your situation.

If your exceptions are limited to just one area of your site (say, the content area), and if you don't have to support older browsers, you could adopt a strategy like this:

```css
.Content h1:not([class]) { }
.Content p:not([class]) { }
.Content a:not([class]) { }
```

While I haven't tested this approach in a real-world scenario, I mention it because it's an example fo a variation on BEM conventions that doesn't compromise its guarantee of no side-effects. Since all BEM blocks are styled via classes, styling elements that don't have a class is "safe", at least from conflict with the rest of your CSS (obviously if you're using classes for other things, this can still be risky as adding a class to such an element would prevent it from matching the selector).

## Learning from JavaScript

In the bad old days of JavaScript, it was common for library authors to add methods to the native prototypes of global constructor like `Object`, `Array`, `String`, and `Function`. At first it seemed like a convenience, but developers quickly realized it was a nightmare. If two different libraries add the same method to `Array.prototype`, each with a slightly different signature or behavior, it would lead to bugs that were almost impossible to track down.

These days, almost no libraries modify native prototypes. In fact, I've seen some libraries publicly shamed for even trying. If we've learned our lesson in JavaScript, why haven't we learned it in CSS?

The practices common in pretty much all of the popular CSS frameworks are just as bad if not worse than modifying native prototypes in JavaScript. They litter the global namespace with base styles, they choose class names so common they're almost guaranteed to conflict with your existing code, and they make almost no effort to encapsulate their components.

Consider Bootstrap. Every single one of its JavaScript plugins uses a namespace and comes with a `.noConflict()` method to avoid naming collisions. Its CSS, on the other hand, makes no such effort despite [numerous](https://github.com/twbs/bootstrap/issues/1235) [requests](https://github.com/twbs/bootstrap/issues/1287) for it, and [easy solutions](/articles/dynamic-selectors/) that people have been suggesting for a long time.

I don't mean to call about Bootstrap specifically because pretty much every mainstream CSS framework does this. My hope is that the CSS community will start demanding better from their tools the same way the JavaScript community has.

## Wrapping up

If you're trying to assess a new CSS methodology or framework, or you're wanting to develop your own, I urge you to make code predictability one of, if not your highest priority.

So many methodologies try to sell you on niceties and false comforts like minimal markup or readable class naming schemes. While patterns like `class="full-height"` or `class="four wide column"` sound nice when you read them out loud, the architectural concessions required to achieve this "feature" are simply not worth it.

While 100% predictable code may never be possible, it's important to understand the trade-offs you make with the conventions you choose. If you follow strict BEM conventions, you will be able to update and add to your CSS in the future with the full confidence that your changes will not have side-effects. If you choose to follow a watered down version of BEM, you will be taking a bit more risk. Sometimes these risks are manageable; sometimes they're not. The amount of risk you can afford to take is inversely proportionate to the size of your team.

In my opinion if your team is larger than just you, the risk is not worth the reward.

<aside class="Footnotes">
  <h1 class="Footnotes-title">Footnotes:</h1>
  <ol class="Footnotes-items">
    <li id="footnote-1">[Shadow DOM](http://w3c.github.io/webcomponents/spec/shadow/) brings real, two-way subtree scoping to CSS, though it's not currently supported by all browsers.</li>
    <li id="footnote-2">With [custom elements](http://w3c.github.io/webcomponents/spec/custom/), you can create additional tags, which partially solves this problem.</li>
    <li id="footnote-3">The only exception to this is [inheritable properties](http://dev.w3.org/csswg/css-cascade/#inheriting) like `font-size` and `line-height`. Blocks may depend on these styles being defined outside of the block because it allows them to be more adaptable to their host environment. If blocks choose to not reset inheritable properties, they should be flexible enough to adapt to whatever properties they may receive.</li>
    <li id="footnote-4">There are several [different variations]((https://github.com/philipwalton/html-inspector/blob/0.8.2/src/rules/convention/bem-conventions.js#L1-L27) on the traditional BEM naming conventions. I personally prefer the flavor [advocated for]((https://github.com/suitcss/suit/issues/80)) by [SUIT CSS](https://suitcss.github.io).</li>
  </ol>
</aside>
