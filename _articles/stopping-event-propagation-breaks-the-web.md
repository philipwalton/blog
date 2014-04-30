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

In this article I'm going to argue that preventing events from propagating up the DOM is an equally bad practice.

When you stop events from propagation in their normal fashion, you change the whole paradigm. And unfortunately, this is the only game in town. There's nothing other libraries can do to prevent you from doing this. They can just hope.

