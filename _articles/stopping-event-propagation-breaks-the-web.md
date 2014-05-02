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

In the bad old days of JavaScript, it was common for both developers and library authors to modify the prototypes of built in object. At first it wasn't a big deal, but as websites started using more and more JavaScript, it became a nightmare. When two libraries get loaded onto the same site and they both define `Object.prototype.keys` to work in incompatable ways, it leads to some pretty nasty bugs.

In this article I'm going to argue that preventing events from propagating up the DOM is an equally bad practice. In both cases you're altering global variables; you're changing the expected behavior in a way that other code can't possibly predict or defend against.

This problem is maginifed by the fact that event delegation is becoming so popular. More and more libraries are just listening to events registered on the document, and every time you stop an event from propagating up the DOM, you run the risk of causing a bug somewher else.

And trust me, bugs that result from events not firing when you expect are some of the hardest bugs to track down. Ever.
