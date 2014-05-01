<!--
{
  "layout": "article",
  "title": "Stopping Event Propagation Breaks the Web",
  "date": "2014-04-29T21:02:45-07:00",
  "draft": true,
  "tags": [
    "JavaScript",
    "HTML"
  ]
}
-->

In the bad old days of JavaScript, it was common for both developers and library authors to modify the prototypes of built in object. At first it wasn't that big of a deal, but as websites started using more and more JavaScript, it became a nightmare. When two libraries are loaded on the same site and they both define `Array.prototype.each` to work in incompatable ways, it leads to some pretty nasty bugs.

Modifying expected event behaviors is just as damaging as modifying native object functionality. In both cases you're alter the expected behavior that your other code might be depending on.

In this article I'm going to argue that preventing events from propagating up the DOM is an equally bad practice.

When you stop events from propagation in their normal fashion, you change the whole paradigm. You break the expectations that every other piece of code on the page has.

This problem is maginifed by the fact that event delegation is becoming so popular. More and more libraries are just listening to events on the document, and every time you stop an event from propagating up the DOM, you're potentially creating a bug somewhere else.

And trust me, bug that result from events not firing when you expect are some of the hardest bugs to track down. Ever.
