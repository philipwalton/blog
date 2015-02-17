<!--
{
  "layout": "article",
  "title": "Why BEM",
  "date": "2015-01-16T07:57:26-08:00",
  "draft": true,
  "tags": [
    "JavaScript"
  ]
}
-->

<!--

1. CSS Methodologies shouldn't be about being pretty or elegant they should be about solving problems
   a. simple, "clean" class names
   b. readable, "elegant" pairings
2. The hardest problem in CSS
   a. writing selectors that match the elements you want without accidentally matching the elements you don't want.
   b. BEM is the only methodology that allows you to be 100% sure you won't have unintended side-effects.
3. Three forms of side effects
   a. Implicit rather than explicit matching
   b. Subtree matching
   c. Name collisions
4. How BEM is side-effect free
5. Learning from JavaScript
6. Conclusion
   a. Are there downsides to BEM?
      i. Yes, it's verbose and requires a lot of classes in the HTML
     ii. But the confidence you get when writing with just BEM is well worth the extra work.
    iii. Until the web platform evolves to support


[BEM](http://bem.info/)
[OOCSS](https://github.com/stubbornella/oocss/wiki)
[SMACSS](http://smacss.com/)
[ACSS](http://www.smashingmagazine.com/2013/10/21/challenging-css-best-practices-atomic-approach/)
[AMCSS](http://amcss.github.io/)
[FUNCSS](http://benfrain.com/fun-css-naming-convention-explained/)

-->

There's been a lot of talk lately about the rapidly increasing speed at which things are changing on the front-end. New tools, methodologies, and conventions are coming out all the time, and it can be hard to keep up.

On the CSS side of things, you have frameworks like [Bootstrap](http://getbootstrap.com/) and [Foundation](http://foundation.zurb.com/), you have tools like [Less](http://lesscss.org/) and [Sass](http://sass-lang.com/), you have methodologies like [OOCSS](https://github.com/stubbornella/oocss/wiki), [SMACSS](https://smacss.com/), and [BEM](http://bem.info/), and it seems like there are a million differing viewpoints out there as to what constitutes a "best practice".

Recently it seems like the trend has been to shy away from bandwagon jumping in favor of a more personalized, pragmatic approach. As a prime example, Chris Coyier wrote a great article a few months ago where he describes his approach to good CSS. In the post, [CSS: Just Try and Do a Good Job](http://css-tricks.com/just-try-and-do-a-good-job/), he offers some very balanced suggestions that honestly apply to both CSS and professional life in general.

While I don't necessarily disagree with the article or this emerging sentiment, I think it's important to understand the rationale behind some of these methodologies before making a choice to use them or not use them. I use BEM, and I think it's the best methodology for writing CSS today, so I thought I'd take the time to defend it. If you've never thought about the *why* behind some of these conventions, hopefully this article will help you realize that this isn't just a matter of taste or personal preference.

I use BEM because it's the only methodology that doesn't just minimize the issues and hard problems in CSS; it actually eliminates them. And it does so 100% of the time with zero risk of side-effects.

## It's not about preference, it's about solving problems

The majority of people who write CSS value good design. They're either designers themselves or they have strong aesthetic sensibilities and care deeply about form, elegance, and craftsmanship. Unfortunately, these are the people who seem to hate BEM the most.

While I definitely consider myself firmly in the group I just described, I've written enough CSS in my day, and worked on large enough projects that I know from experience, and from repeatedly screwing up, that predictable code is far better than elegant code. Especially when that elegance is never seen by the end user.

Consider the following two examples. This first sample is from [Semantic UI](http://semantic-ui.com/) and is the poster child of what I'd consider "clean" and "elagant" naming schemes:

```html
<div class="full height">…</div>
<div class="four wide column">…</div>
<div class="stackable inverted divided relaxed grid">…</div>
```

The classes are so readable and self-documenting. It's as if the code is expressing itself to the reader. By contrast, here's an example of BEM, which is quite verbose and perhaps "ugliy" by comparison:

```html
<article class="ArticleExcerpt ArticleExcerpt--promoted">
  <img class="ArticleExcerpt-thumbnail">
  <div class="ArticleExcerpt-body">
    <h1 class="ArticleExcerpt-title">…</h1>
    <p class="ArticleExcerpt-content">…</p>
    <span class="ArticleExcerpt-readMore">…</span>
  </div>
  <span class="ArticleExcerpt-close"></span>
</article>
```
I mean, c'mon BEM. Is it really necessary to repeat the text "ArticleExcerpt" so many times? And what's with the mixture of single dashes, double dashes, camelCase and PascalCase? Does that makes things *more* confusing?

The phrase "is all this really necessary?" pretty well sums up most people's reaction to seeing BEM for the first time. But I assure you, everything in the above code exists for a reason, and none of it is unnecessary.

The BEM conventions [evolved over time](https://bem.info/method/history/), and they exist to address the fact that writing CSS for anything other than the most trivial of websites is actually really hard.

## The hardest problem in CSS

There are two types of problems in CSS: cosmetic problems and architectural problems. Cosmetic problems&mdash;issues like vertical centering or equal-height columns&mdash;usually engender the most vocal complaints. They make it challenging to replicate a visual design in code, but they're almost never show-stoppers.

Architectural problems, on the other hand, can cripple development. I can remember distinct cases, at each of the companies I've worked for, where we postponed developing a new feature because we were too afraid to make *any* changes to the CSS. CSS is global, and every rule you write has the potential to affect completely unrelated parts of the site. It's this unpredictability that makes writing CSS so challenging.

To reemphasize this point, there is one problem in CSS that's harder to solve than all the rest:

*Getting your rules to match the elements you want, without them accidentally matching the elements you don't.*

This is why BEM is better than any other CSS methodology in use today. It solves this problem by eliminating the potential for side-effects.

## Side effects in CSS

Most programming languages have a concept of scope, a way to prevent a variable defined in a particular module or package from conflicting with a variable defined in another.

For scope to be fool-proof, it must be two-way. In other words, what's defined inside the scope must not be able to affect the outside world, and at the same time what's defined in the outside world must not be allowed to affect what's inside the scope; that is, without developers explicitly allowing things in and out.

CSS has one-way scoping. Child and descendant combinators can be used in selectors to isolate a ruleset to a particular subtree, but there's no way to prevent outside styles from applying to the contents of that subtree.

In CSS unwanted style matching, or side effects come in three forms:

- Base/default rule changes
- Naming collisions
- Subtree matching

### Base/default rule changes

Developers *have* to use HTML tags to write HTML, and there are a finite number of tags to choose from.<sup>[[2](#footnote-2)]</sup> If your CSS contains tag selectors (technically they're called type selectors), you're necessarily breaking two-scoping rules. When first building a site, this might not seem like a problem, but as soon as you decide you want your `<h1>` elements to be a slightly larger font size, or your `<p>` elements to have a slightly larger bottom margin, you're taking a big risk.

It's possible your changes won't cause any problems, but how can you know for sure? It's extremely likely that other rules in your stylesheet were counting on those base rules being *exactly* what they were.

When rules in your stylesheets depend on other rules, and there's not a clear dependency relationship established, there are bound to be side effects when changes happen.

### Naming collisions

CSS, as a language, will not warning you or fail to build if you pick a class name that already exists. In fact, the ability to override rules is actually one of the "features" of the language. As a result, without a convention in place to avoid this, or a build-time check, there's no good way to know whether the class name you picked is already in use.

When multiple developers are committing to the same code base, the chances of two people choosing the same name and not knowing it is extremely high. This is especially true of common name choices like "button", "content" or "title".

### Subtree matching

Most developers are aware of the above two forms of CSS side effects. As such, you'll often see people do what I mentioned above use a child or descendent selector to limit the reach of the rules they're writing, e.g. `#homepage .header` or `.some-widget .title`.

While this approach is slightly safer, it doesn't cover 100% of cases. The problem is that limiting the reach of a selector to a particular DOM subtree does guarantee that it won't affect outside trees, but it doesn't guarantee that it won't unintentionally affect elements within that subtree.

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

While it's true that `.title` elements not found within the `.widget` or `.media` modules will not get either of these styles, there's still that chance that a `.title` element will be found within *both*  the `.widget` and `.media` modules at the same time.

```html
<div class="widget">
  **<h1 class="title">Widget Title</h1>**
  <div class="content">
    …
    <div class="media">
      **<h2 class="title">Media Title</h2>**
      …
    </div>
  </div>
</div>
```

In real-world development, HTML structures are complex and if multiple people are all writing CSS modules this way, it's only a matter of time before two of them pick the same name.

## How BEM eliminates side effects

I said above that all CSS rules are global and every rule has the potential to conflict with every other rule on the page. This means side effects cannot be prevented by the language; however, they *can* be prevented through disciplined and enforceable naming conventions. And that's exactly what BEM does.

- **Base/default rule changes:**<br>
  Strict BEM conventions require the explicit use of class selectors, which means that developers can only style elements by adding a class to them. This means that all styling is opt-in via classes rather than de facto via tag selectors.

- **Naming collisions:**<br>
  In BEM, every class selector starts with the name of the block, and the rules for each block live in a dedicated file. Since file systems do not allow two files to have the same name, the OS is actually helping to prevent accidental duplication. If you follow all of the naming conventions, and you always put all block code in its own file, there's zero chance of naming collisions.

- **Subtree matching:**<br>
  The subtree matching example in the previous section used the selectors `.widget .title` and `.media .title`, and since the class name "title" was used in both cases, there's a risk of subtree matching. BEM avoids this issue by requiring all element classes to have the block name as a prefix. The BEM equivalents of these two title selectors would be `.Widget-title` and `.Media-title`. Since the class names are different, its impossible for styles from one rule to inadvertently apply to subtree elements of the other.

### Enforcing conventions

I mentioned that following BEM conventions prevents side effect, but how do you make sure the conventions are followed? If the return of side effects is as easy as a new developer not knowing (or fully understanding) the conventions, how is that any better than before?

Luckily, unlike most CSS naming conventions, proper usage of BEM very easy to test and enforce, both on the CSS side and on the HTML side. Without going into too much detail, here's the gist:

In the CSS:

- All .css files (or .scss, or whatever) must only contain selectors that begin with the name of the file itself.
- Rules with nested selectors are only allowed if the root selector is a modifier.

In the HTML:

- Any element with a class that matches the format for an element must be a descendant of a block by the same name.
- Any element that contains a modifier class must also contain a block class by the same name.

In the real world, there are cases where exceptions must be made, so when choosing your enforcement tools, make sure they allow for real world exceptions.

## Are there downsides to BEM?

Obviously there are downsides to any methodology, particularly in CSS. All methodologies maximize for certain use cases at the expense of other things, and BEM is no exception.

BEM maximizes for code that is predictable, reusable, maintainable, and scalable. It's the only convention that can guarantee that a change in one file will *never* affect an unrelated part of the codebase.

This guarantee comes with a cost, and that cost is verbosity in both the naming of classes as well as in the markup. There are cases where the use of BEM is either impractical or impossible. One obvious example is if you don't have control over the HTML.

On most development teams, however, you have complete control over the code, and given the choice between "clean" looking markup and a guarantee of zero side effects, I'll throw "clean" markup out the window in a heartbeat. Typing a few extra characters takes a couple of seconds, but checking every single page of your application to make sure you changes didn't break anything can take hours or even days.

And after writing BEM for a couple of years, I can honestly say that my perspective on "clean" markup has completely changed. BEM markup may not read like a novel, but its incredibly self-documenting. I love that I can look at an HTML file and know exactly where to look for its corresponding styles. Not only do I know where its styles are, but I can be completely confident that aren't other styles I'm not aware of that are going to affect this particular element.

## Learning from JavaScript

In the bad old days of JavaScript, it was common for library authors to add methods to the native prototypes of global types like `Object`, `Array`, `String`, and `Function`. At first it seemed like a convenience, but developers quickly realized it was a nightmare. If two different libraries add the same method to `Array.prototype`, each with a slightly different signature or behavior, it would lead to bugs that were almost impossible to track down.

These days, almost no libraries modify native prototypes. In fact, I've seen some libraries publicly shamed for even trying. If we've learned our lesson in JavaScript, why haven't we learned it in CSS?

Every single one of the most popular CSS frameworks today uses absolutely terrible class names. They've chosen the most common names for the most common UI elements and globally reserved them with no consideration for the host environment.

Consider Bootstrap. Every single one of its JavaScript plugins uses a namespace and comes with a `.noConflict()` method to avoid naming collisions. It does this in JavaScript, but its CSS class names make no such effort, despite [numerous](https://github.com/twbs/bootstrap/issues/1235) [requests](https://github.com/twbs/bootstrap/issues/1287) for it, and [easy solutions](/articles/dynamic-selectors/) that I, and other developers, suggested years ago.

I don't mean to call about Bootstrap specifically because pretty much every framework does this. I just hope the CSS community would realize that practices like this are just as risky and damaging as modifying native prototypes in JavaScript.

## Wrapping up



<aside class="Footnotes">
  <h1 class="Footnotes-title">Footnotes:</h1>
  <ol class="Footnotes-items">
    <li id="footnote-1">There are several [different variations]((https://github.com/philipwalton/html-inspector/blob/0.8.2/src/rules/convention/bem-conventions.js#L1-L27) on the traditional BEM naming conventions. I personally prefer the flavor advocated for by [MontageJS](https://github.com/montagestudio/docs.montagestudio.com/blob/master/montagejs/naming-conventions.md) and [SUIT CSS](https://github.com/suitcss/suit/issues/80).</li>
    <li id="footnote-2">With custom elements, you can create additional tags, which partially solves this problem.</li>
  </ol>
</aside>
