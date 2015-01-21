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
5. Conclusion
   a. Are there downsides to BEM?
      i. Yes, it's verbose and requires a lot of classes in the HTML
     ii. But the confidence you get when writing with just BEM is well worth the extra work.
    iii. Until the web platform evolves to support
-->

There's been a lot of talk lately about the rapidly increasing speed at which things are changing on the front-end. It seems like every week something new comes out, and it can feel pointless to jump on the latest and greatest trend because something even better is almost certainly right around the corner.

A few weeks ago, Chris Coyier wrote a post called [CSS: Just Try and Do a Good Job](http://css-tricks.com/just-try-and-do-a-good-job/) where he offers some very balanced suggestions for how to approach writing good CSS. I don't disagree with what Chris said, and in general I think that's pretty good adivce, for both CSS and life. But in this case, I want to take the opposite approach. I feel pretty strongly about this, so I want to take a firm stance and try to back it up with evidence. So here goes:

*BEM is, without a doubt, the best methodology for writing CSS today.*

You might think this is an impossible statement to defend. After all, isn't this primarily about personal preference? And isn't it true that what works in one context may not work in another?

Actually, no, this is not just about preference or context. The reason BEM is the best is because it's the only methodology that solves the hardest problems in CSS, and it's the only methodology that is 100% effective at doing so.

## It's not about preference, it's about solving problems

A lot of people who write CSS are designers, and when people talk about design they like to use words like "clean" and "elegant". It's no wonder the names of classes in frameworks like [Semantic UI](http://semantic-ui.com/) are so popular. When looking at the website source, you see markup like this:

```html
<div class="full height">…</div>
<div class="four wide column">…</div>
<div class="ui stackable inverted divided relaxed grid">…</div>
```

At first glance, this looks awesome. The classes are so readable and self-documenting. It's as if the code is expressing itself to the reader.

By contrast, BEM is often considered ugly and verbose:

```html
<article class="Excerpt Excerpt--promoted">
  <img class="Excerpt-thumbnail">
  <div class="Excerpt-body">
    <h1 class="Excerpt-title">…</h1>
    <p class="Excerpt-text">…</p>
    <span class="Excerpt-readMore">…</span>
  </div>
  <span class="Excerpt-close"></span>
</article>
```
I mean, is it really necessary to repeat the word "Excerpt" so many times? And what's with the mixture of single dashes, double dashes, and camelCase (some [flavors of BEM](https://github.com/philipwalton/html-inspector/blob/0.8.1/src/rules/convention/bem-conventions.js#L1-L27) mix dashes and underscores)? Isn't this way more confusing?

The phrase "is this really necessary?" pretty well sums up most people's reaction to seeing BEM for the first time. But I assure you, everything in the above code exists for a reason, and none of it is unnecessary.

The BEM conventions [evolved over time](https://bem.info/method/history/), and they exist to address the fact that writing CSS for anything other than the most trivial website is actually really hard.

*Note: as I hinted above, there are several different variations on the traditional BEM naming conventions. I personally prefer the flavor used in MontageJS and SUIT CSS.*

## The hardest problem in CSS

There are a lot of problems with CSS; no one would deny that. But the problems that get the most attentionare not the

There are two types of problems in CSS: cosmetic problems and architectural problems. Cosmetic problems&mdash;issues like vertical centering or equal-height columns&mdash;usually engender the most vocal complaints, but architectural problems are actually far more egregious.

Cosmetic problems can make it hard to replicate a design in code, but architectural problems can cripple development. At every company I've worked at, I can remember a time where we passed on building something new because we were afraid to change *any* of the CSS.

At the end of the day, there's one hard problem in CSS that's harder than all the rest of the problems:

*Getting your rules to match the elements you want, without them accidentally matching the elements you don't.*

It's this notion of accidental matches that makes CSS truly hard. Since all rules in CSS exist in the same global space, every rule can potentially effect or override every other rule on the page.[[1]](#footnote-1) To put that another way, any change, no matter how small, can have disastrous side effects.

The reason I say BEM is the best methodology is because it's the only methodology that completely solves this problem. Other modular CSS methodologies offer suggestions to minimize side effects and accidental matching, but BEM eliminates it.

## Three forms of side effects


### Implicit verses explicit matching

There are a finite number of HTML tags but an infinite number of possible class names.[[2]](#footnote-3) If you use class selectors to style elements, you can choose unique names to avoid conflicts, but if you use tag selectors (e.g. `h1`, `ul`, `p`), you're eventually going to have rules that apply to elements that you didn't intend.

Since developers *have* to use tags to write HTML, it's extremely likely that someone will use a tag without realizing that styles come with it. On the other hand, when you add a class to an element, you expect styles to come with it.

### Subtree matching

Developers often think that using tag selectors is safe as long as they're scoped to a particular module. While this does offer some protection, it's not guaranteed.

Scoping tag selectors to a parent module prevents those styles from affecting the rest of the page, but it doesn't prevent outside changes from creeping in, nor does it prevent other elements in the subtree from matching those rules.

Consider the following example:


```
/* In elements.css */
a {
  color: red;
  text-decoration: underline;
}

/* In widget.css */
.footer a {
  color: inherit;
  text-decoration: none;
}
```

In this example, links in the footer override their default `color` and `text-decoration` properties. This works for now, but what happens when another developer decides they want to update the base link rules as follows:

```
a {
  border-bottom: 1px solid;
  color: red;
  text-decoration: none;
}
```

There's a good chance that the author of this change didn't realize he was `.footer` module.

And while using a tag selectors makes this situation way more dangerous, it still exists if you use classes. The next example shows two modules that can still be problematic, despite the fact that they only use class selectors.

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

While it's true that neither of the above rules will affect `.title` elements not found within the `.widget` or `.media` modules, but still not 100% safe. In real-world development, module after nested within other modules all the time, so the above rules are still of problematic potential.

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

As you can see, the border style from the `.widget .title` rule is going to apply to the `.media .title` element, even though it's qualified. The reality is that qualifying selectors prevents styles from leaking out, but it does nothing to prevent styles from leaking in, and in tree structures like the DOM, this is inevitable.

### Naming collisions

Another common cause of side effects is naming collisions. CSS happily allows you to define rules with the same class names in different parts of a stylesheet. As a result, there's no easy way to know if your rule is overriding a rule that already exists with the same class name.

This can happen as a top level class selector, but it often happens in nested contexts as well, usually with common class names like "button" or "content" or "title" as in the example above. When multiple developers are committing to the same code base, the chances of two people choosing the same name and not knowing it is extremely high.

## How BEM eliminates side effects

I said above that all CSS rules are global and every rule has the potential to conflict with every other rule on the page. This means side effects cannot be prevented by the language; however, they *can* be prevented through disciplined and enforceable naming conventions. And that's exactly what BEM does.

### Implicit verses explicit matching

BEM conventions require the explicit use of class selectors. This means that developers can only style elements by adding a class to them. This *greatly* reduces accidental styling, as most developers understand that when add a class to an element, it's probably going to style it, and they should check to make sure the style is correct.

### Subtree matching

The example above used the selectors `.widget .title` and `.media .title`, and since the class name "title" is used in both, there's a risk of subtree matching. BEM avoids this issue completely by requiring all subtree element classes to have the block name as a prefix. The BEM equivalents of these two title selectors would be `.Widget-title` and `.Media-title`. Since the class names are different, its impossible for styles from one rule to inadvertently apply to subtree elements of the other.

### Naming collisions

In BEM, every class selector starts with the name of the block, and the rules for each block live in a dedicated file. Since file systems do not allow two files to have the same name, the OS is actually helping to prevent accidental duplication. If you follow all of the naming conventions, and you always put all block code in its own file, there's zero chance of naming collisions.

