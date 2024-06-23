Chrome is experimenting with two new features that I firmly believe will completely change how we bundle and deploy JavaScript applications in the future (for the better):

[Built-in Modules](https://github.com/tc39/proposal-javascript-standard-library) and [Import Maps](https://github.com/WICG/import-maps).

The first built-in module we're shipping (behind the experimental web platform features flag) is called [KV Storage](https://github.com/WICG/kv-storage). It's an asynchronous key/value storage API built on top of IndexedDB.

In [this article on developers.google.com](https://developers.google.com/web/updates/2019/03/kv-storage) I introduce these new APIs and show you how you can use them in your applications. I've also built a [demo application](https://rollup-built-in-modules.glitch.me/) that shows how you can actually deploy these features on the web today (via [this origin trial](https://developers.chrome.com/origintrials/#/registration/1097752409171558401)) while still providing fallbacks so they work in all browsers.
