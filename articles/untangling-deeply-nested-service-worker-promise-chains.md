If you've been in this industry for a few years, you've probably heard terms like "callback hell" and "spaghetti code". When JavaScript Promises came out, callback hell was supposed to be a thing of the past; unfortunately since more and more new web APIs are asynchronous and return promises, spaghetti code is still alive and well.

Where I'm seeing this happen a lot today is in service worker tutorials and boilerplate.

Consider the following "basic" example of a *network-first with cache fallback* fetch strategy:

```js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open('site-cache').then((cache) => {
      return fetch(event.request).then((response) => {
        cache.put(event.request, response.clone());
        return response;
      }).catch(() => {
        return cache.match(event.request).then((response) => {
          return response || Response.error();
        });
      });
    })
  );
});
```

If you look at the above code and can quickly understand exactly what's going on (and you're confident everyone on your team will be able do the same), then you can stop reading now.

But if you're like me and you really have to stop and think about it, carefully reading over each statement before you can follow the logic, then this article is for you.

After implementing a service worker on a couple of sites for the first time recently, I wanted to share a few strategies I used to keep my code clear, readable, and (hopefully) more maintainable going forward.

## What is this code doing?

When adding a `fetch` event listener to a service worker, you typically call `event.repondWith` and pass a `Promise` object that resolves to a `Response` object. But when you pass a promise chain like the code example&mdash;with multiple levels of nesting `then` and `catch` calls&mdash;it can be pretty hard to see all the points at which the resolution can happen.

Here is the above promise logic, step by step:

1. Open the `'site-cache'` cache.
2. Make a `fetch()` over the network for `event.request`.
3. If the `fetch()` succeeds:
   a. Put a copy of the network response in the cache.
   b. Resolve the promise with the network response.
4. If the `fetch()` fails:
   a. Attempt to find a matching request in the cache.
   b. If a match is found:
      i. Resolve the promise with the cached response.
   c. If a match is not found:
      i. Resolve the promise with a generic `Response.error()` object.


## Betting variable naming

When writing service worker code you'll find yourself dealing with a lot of `request` and `response` objects, and it can be tempting to just use these names in every occurrence of these objects in your code (after all, we all know coming up with good names is hard).

However, in the above code we're writing a promise that can either be fulfilled with a network response or a cache response, so quick and easy way to bring clarity to the code is to differentiate between these two responses with new names:

```js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open('site-cache').then((cache) => {
      return fetch(event.request).then((**networkResponse**) => {
        cache.put(event.request, **networkResponse**.clone());
        return **networkResponse**;
      }).catch(() => {
        return cache.match(event.request).then((**cacheResponse**) => {
          return **cacheResponse** || Response.error();
        });
      });
    })
  );
});
```

Any time you're returning a response based on some specific condition, an easy way to add clarity to your code is to give the response a more meaningful name.

## Removing red flags

If you look at the last five lines of the original code example here's what you see:

```js
          // ...
        });
      });
    **})**
  );
});
```

When I first saw this, I assumed the author of the tutorial I was reading had missed a semicolon, but I was wrong.

What was actually happening is the following line was so long that the argument to `respondWith()` was move to a new line and indented:

```js
event.respondWith(
  caches.open('site-cache').then((cache) => {
  // ...
```

Any time you see code that looks like it's a mistake but actually isn't, you've probably found code that should be refactored. Similarly, any time the argument to a function is so long you have to move it to its own line and indent, you've probably found an opportunity to abstract that logic into its own function.

By abstracting the argument to `respondWith()` into its own function with a meaningful name, the code becomes significantly easier to follow, it's also much more reusable and testable:

```js
const **networkFirstWithCacheFallback** = (request) => {
  return caches.open('site-cache').then((cache) => {
    return fetch(request).then((networkResponse) => {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }).catch(() => {
      return cache.match(request).then((cacheResponse) => {
        return cacheResponse || Response.error();
      });
    });
  });
}

self.addEventListener('fetch', (event) => {
  event.respondWith(**networkFirstWithCacheFallback()**)
});
```

## Abstracting logical units into utility functions

Whenever you see multiple levels of nested callback or promises in JavaScript, it's usually a sign of logic that's doing too much. In other words, it has [too many responsibilities](https://en.wikipedia.org/wiki/Single_responsibility_principle).

In the initial tutorial code we find logic that makes both network and cache requests and responds based on the success or failure of the network request. But by breaking this code up in to logical chunks, each part can be separately tested and nesting can be removed.

I attempted to separate the logic that did the network request from the logic that dealt with the cache, and in doing so not only did I eliminate some of the nesting, but I also discovered an obvious optimization that I'd previously missed (possibly due to the complexity).

Here are the two utility functions I created:

```js
const addRequestToCache = (request, response) => {
  return caches.open('site-cache')
    .then((cache) => cache.put(request, response.clone());
}

const getResponseFromCache = (request) => {
  return caches.open('site-cache').then((cache) => {
    return cache.match(event.request);
  });
}
```

You'll notice that each of these functions makes a call to `open()` before either reading from or writing to the cache. In the initial code, only a single call to `open()` was made.

While at first it might seem like this abstraction will end up doing more work, what actually happened is I discovered an optimization that was missing from the original code.

Consider the case where the service worker makes a network request that is successful. This is the most common case, so we should optimize for it (i.e. get the response to the user as quickly as possible). In the tutorial code, the first step of the logic was to open the cache, and then only respond with a network request once the cache was open.

This is absolutely not necessary. While it's true that we do need to write to the cache even in the network case, that write doesn't need to block the response to the user. It can easily happen in parallel.

With these two new utility functions, the code now looks like this:

```js
const addRequestToCache = (request, response) => {
  return caches.open('site-cache')
    .then((cache) => cache.put(request, response.clone());
}

const getResponseFromCache = (request) => {
  return caches.open('site-cache').then((cache) => {
    return cache.match(event.request);
  });
}

const networkFirstWithCacheFallbackPromise = (request) => {
  return fetch(event.request).then((networkResponse) => {
    addRequestToCache(event.request, networkResponse);
    return networkResponse;
  })
  .catch(() => {
    return getResponseFromCache(request)
      .then((cacheResponse) => cacheResponse || Response.error());
  });
};

self.addEventListener('fetch', (event) => {
  event.respondWith(networkFirstWithCacheFallback(event.request));
});
```

## Clarifying the intent of a promise

A promise is a JavaScript object that will eventually resolve to a value, but with multiple levels of nesting and promises chained to other promises, it's not always easy to look at a piece of code and know what that resolved value will be.

In the `respondWith()` method, we know that the promise will eventually resolve to a `Response` object, but in the tutorial code it's not immediately clear (at least to me) where that happens (and keep in mind this is a "basic" example).

Even in our refactored, `networkFirstWithCacheFallback` utility function, it might not be completely obvious where the resolution is:

```js
const networkFirstWithCacheFallbackPromise = (request) => {
  return fetch(event.request).then((networkResponse) => {
    addRequestToCache(event.request, networkResponse);
    return networkResponse;
  })
  .catch(() => {
    return getResponseFromCache(request)
      .then((cacheResponse) => cacheResponse || Response.error());
  });
};
```

In situations like these, you can add resolution clarity by wrapping the whole function in a promise. Then all readers of the code have to look for is where the `resolve()` function appears:

```js
const networkFirstWithCacheFallback = (request) => {
  return new Promise((resolve) => {
    fetch(event.request).then((networkResponse) => {
      addRequestToCache(event.request, networkResponse);
      **resolve(networkResponse);**
    })
    .catch(() => {
      return getResponseFromCache(request).then((cacheResponse) => {
        **resolve(cacheResponse || Response.error())**
      });
    }
  });
};
```

## Removing nesting entirely with async/await

Perhaps the most significant way to improve the readability of complex promise code is to use [`async`/`await`](https://tc39.github.io/ecmascript-asyncawait/).

To give an *extremely* brief overview of `async` and `await`, the `await` keyword can be used in front of a promise to halt execution of the current code until that promise is resolved, and that expression evaluates to the resolved value of the promise. Complementary to that, an `async` function is syntactic sugar for a regular function that, instead of returning a value, will instead return a promise that will resolved to the return value.

To give an example, our code above that opens the cache looks like this:

```js
caches.open('site-cache').then((cache) => {
  // Use `cache` here.
}
```

But it can be rewritten using the `await` keywords as follows:

```js
const cache = await caches.open('site-cache');
```

This is already substantially clearer, and it removes the need for an entire level of nesting.

`async` functions can similarly remove a lot of nesting a boilerplate. Consider the `getResponseFromCache` utility function we abstracted above:

```js
const getResponseFromCache = (request) => {
  return caches.open('site-cache').then((cache) => {
    return cache.match(event.request);
  });
}
```

This can be rewritten to use `async` and `await` as follows:

```js
const getResponseFromCache = async (request) => {
  const cache = await caches.open('site-cache');
  const cachedResponse = await cache.match(event.request);
  return cachedResponse;
}
```

Notice how in the above code the function returns the value `cachedResponse`. Since this is an `async` function, it will actually return a promise that resolves to the value `cachedResponse`, which allows it to be used in conjunction with the `await` keyword (since `await` requires the expression it prefixes to evaluate to a promise).

With a basic understanding of how `async` and `await` work, compare the `async` and non-`async` version of our `networkFirstWithCacheFallback` function below:

**non-async version**

```js
const networkFirstWithCacheFallback = (request) => {
  return new Promise((resolve) => {
    fetch(event.request).then((networkResponse) => {
      addRequestToCache(event.request, networkResponse);
      resolve(networkResponse);
    })
    .catch(() => {
      return getResponseFromCache(request).then((cacheResponse) => {
        resolve(cacheResponse || Response.error())
      });
    }
  });
};
```

**async version**

```js
const networkFirstWithCacheFallback = async (request) => {
  try {
    const networkResponse = await fetch(request);
    addRequestToCache(request, networkResponse);
    return networkResponse;
  }
  catch (err) {
    const cacheResponse = await getResponseFromCache(request);
    return cacheResponse || Response.error();
  }
}
```

As you can see, the `async` version is substantially more concise and easier to follow.

### Using `async`/`await` today

I've known about `async`/`await` for a while now, and I've also known that you can use it today in code if you transpile it to ES5 with babel. Unfortunately, to use `async`/`await` in all browsers today, you also have to include the `babel-polyfill`, which includes Facebook's regenerator runtime.

While this might make sense for some projects, the added code weight of the polyfill is an absolutely unacceptable cost for a 50-line service worker script.

Fortunately, when it comes to service worker scripts, there's another way!

Since all browsers that support service worker *also* support generators, you can avoid the regenerator runtime and compile your code with just a single babel transform: `async-to-generator`.

This transform adds less than 1K of extra code to your built file, so its file size is negligible.

## Wrapping up

Compare the initial tutorial version with the version containing all our refactoring:

```js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open('site-cache').then((cache) => {
      return fetch(event.request).then((response) => {
        cache.put(event.request, response.clone());
        return response;
      }).catch(() => {
        return cache.match(event.request).then((response) => {
          return response || Response.error();
        });
      });
    })
  );
});
```

```js
const addRequestToCache = async (request, response) => {
  const cache = await caches.open('site-cache');
  cache.put(request, response.clone());
}

const getResponseFromCache = async (request) => {
  const cache = await caches.open('site-cache');
  const cachedResponse = await cache.match(event.request);
  return cachedResponse;
}

const networkFirstWithCacheFallback = async (request) => {
  try {
    const networkResponse = await fetch(request);
    addRequestToCache(request, networkResponse);
    return networkResponse;
  }
  catch (err) {
    const cacheResponse = await getResponseFromCache(request);
    return cacheResponse || Response.error();
  }
};

self.addEventListener('fetch', (event) => {
  event.respondWith(networkFirstWithCacheFallback(event.request));
});
```

While our version is longer and contains more code, it's clearer and easier to follow, which means it will be easier to update in the future and less likely to result in bugs from developers misunderstanding the logic.

It's also more modular, which makes it easier to test and reuse in other situations that require similar logic.



