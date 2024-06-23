One of the most annoying bugs I've ever had deal with happened at my previous company. In one of our apps there was a "what's new" button in the top left. When you clicked on the button it would display a dropdown of newly added features, and when you clicked anywhere else on the page the dropdown would go away&mdash;except it didn't.

The problem ended up being caused by a single line of code in a third-party library that returned `false` from an event handler. This caused the event to stop propagating through the DOM, and as a result the handler that was listening for the event never ran.

The most frustrating thing about this bug was that it didn't come from our code. It came from another library that the rest of our app depended on. So we couldn't use it, and we couldn't not use it. We were forced to write a messy, fragile work-around.

In this [article on CSS-Tricks](http://css-tricks.com/dangers-stopping-event-propagation/) I explain why stopping event propagation is often a terrible idea that leads to unpredictable and unintended consequences. Events are global objects, and when you mess with them you mess with any code that's depending on them.
