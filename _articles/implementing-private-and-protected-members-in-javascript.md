<!--
{
  "layout": "article",
  "title": "Implementing Private and Protected Members in JavaScript",
  "date": "2014-04-09T20:59:27-08:00",
  "tags": [
    "JavaScript"
  ]
}
-->

Privacy has been a complicated issue throughout JavaScript's history.

While it's always been possible to meet even the most stringent privacy needs (the myriad of compile-to-js languages proves this), the extraneous ceremony required to really do it right is often too much of a turn-off for most developers &mdash; especially to those coming from other languages where privacy is built in.

In JavaScript we like to prefix our private members with an underscore to let other developers know not to touch them. In fact, many of the more popular JavaScript style guides ([airbnb](https://github.com/airbnb/javascript#naming-conventions), [Dojo](http://dojotoolkit.org/community/styleGuide#Naming_Conventions), [aloha](http://aloha-editor.org/guides/style_guide.html#code-conventions)) recommend this. But unless you have a way to enforce such a convention, it can never really be trusted.

Thought leaders in the JavaScript community have long warned against fake privacy. [Douglas Crockford](http://javascript.crockford.com/code.html#names) has this to say on the subject:

> Do not use _ (underbar) as the first character of a name. It is sometimes used to indicate privacy, but it does not actually provide privacy. If privacy is important, use the forms that provide private members. Avoid conventions that demonstrate a lack of competence.

Despite the warnings, a quick search on Github will show that this advice isn't being taken seriously. Developers don't like to jump through hoops, even if it's for their own good.

In my opinion, the only way we're really going to solve this problem is if we take the hoops away, or at least minimize them. In this article I present some ideas to do both.

## Privacy in JavaScript Today

In JavaScript it's really easy to make variables and functions private. Unfortunately, it's not possible to make properties of objects private.

This can be a real problem in situations where you need to manage the state of an instance (or in JavaScript terms, manage properties on `this`). No private properties means that any code with access to your instance can alter its state in any way it wants.

Here's an example of how I see most JavaScript code written today:

```javascript
function Car() {
  this._mileage = 0;
}

Car.prototype.drive(miles) {
  if (typeof miles == 'number' && miles > 0) {
    this._mileage += miles;
  } else {
    throw new Error('drive only accepts positive numbers');
  }
};

Car.prototype.readMileage() {
  return this._mileage;
};
```

This is a pretty basic car class with a single private member and two accessor methods. As you can see, the `drive` method takes a number and increments the mileage property of the car instance. And like any good method, it checks to make sure the input is valid before applying it, otherwise you could end up with bad data.

The problem is this check doesn't actually protect against bad data since anyone with access to the instance could manually change the `_mileage` property later.

```javascript
var honda = new Car();
honda._mileage = 'pwned';
```

So how can we protect against bad data if properties cannot be private? How can we ensure that the state of our instances are safe from outside tampering?

### A Step Closer

It's true that properties cannot be made private, but setting properties on an instance isn't the only way to manage its state. There could be another object that is uniquely linked to the instance that is responsible for storing its state. And this second object actually *could* be private.

Here's an example of how that might look:

```javascript
var Car = (function() {

  // Create a store to hold the private objects.
  var privateStore = {};
  var uid = 0;

  function Car(mileage) {
    // Create an object to manage this instance's state and
    // use a unique ID to reference it in the private store.
    privateStore[this.id = uid++] = {};
    // Store private stuff in the private store
    // instead of on `this`.
    privateStore[this.id].mileage = mileage || 0;
  }

  Car.prototype.drive = function(miles) {
    if (typeof miles == 'number' && miles > 0)
      privateStore[this.id].mileage += miles;
    else
      throw new Error('drive can only accept positive numbers');
  };

  Car.prototype.readMileage = function() {
    return privateStore[this.id].mileage;
  };

  return Car;
}());
```

In the above code, you give each instance a unique ID, and then everywhere you would have previously written `this._mileage` you now write `privateStore[this.id].mileage` which points to an object that is only accessible inside the module closure. This object holds all of the private data and it's truly private. You can pass car instances around to external code, and their internal state can't be modified.

### The Problems

As I said before, this method works, but it has a number of downsides:

* There's too much extra code to type. If you have tens or hundreds of modules, it will quickly become a burden.
* You have to store an ID property on each instance, which is both annoying and potentially conflicting depending on the property name you choose.
* By using the object `privateStore[this.id]` instead of `this` you lose access to the instance's prototype.
* Private members can't be referenced in subclasses defined in different scopes, i.e. they can't be protected members.
* It's not memory efficient. Since the `privateStore` object holds a reference to each of the private instance objects, none of those objects can be garbage collected. If the public instance goes away it will be impossible to access those private properties, but they'll still be taking up space in memory.

Whether these downsides trump the downsides of not actually having privacy is debatable and depends on the situation. But based on the amount of code I've seen using this strategy (approximately zero code), I'd say developers prefer leaking private variables to all this boilerplate.

Regardless, I know we can do better.

## What Does a Good Solution Look Like?

Before looking at other solutions to this issue, I think it would be helpful to define what a good solution is. What are the goals we're trying to achieve? If we can clearly define some goals then we can measure any solution against how close it gets to the ideal.

This is my personal list of must-haves before I'd consider using a new privacy technique in a real project:

* The way to declare and access a private member should be simple, convenient, and intuitive.
* It should be clear from the code whether or not a member is private.
* Private members should only be accessible within the scope(s) you choose.
* Private members, if needed, should be able to access the public prototype.
* The solution should support subclasses, i.e. protected members should be possible.
* Dynamic changes to the instance or the instance's prototype at runtime should never expose any private members.
* The solution should be memory efficient.

### My Attempt

I wanted to solve this problem for myself and my own code, so I spent some time trying to improve upon the previous example. Like I said, that solution works (meaning it actually provides privacy), and if I could hide away some of the boilerplate, it would be much more approachable.

An obvious optimization is that all the setup code should be abstracted away into its own module. Creating the private store and mapping each new instance to an object that holds those private members should all happen behind the scenes.

A second optimization is that if the private object were created using `Object.create`, I could set its prototype to whatever I wanted. This would allow private instances to share the same prototype as their public counterparts. I could even add additional methods to the prototype chain.

Finally, with ES6 [WeakMaps](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) (or using a WeakMap [shim](https://github.com/Benvie/WeakMap)) we now have a data structure that can associate objects with other objects (traditional JavaScript objects can only have string keys). This means we can avoid having to put a unique ID on each instance. It also means we avoid the garbage collection issue since WeakMaps don't create strong references to the objects they hold.

I wanted to take these optimizations for a spin, so I started writing some code. I ended up making two new modules: [Private Parts](https://github.com/philipwalton/private-parts), a low level public-private store, and [Mozart](https://github.com/philipwalton/mozart), a full-featured classical inheritance solution.

In the next few sections I'll talk about how these modules can help you define classes with both private and protected properties and methods.

## Private Properties

In the original car class example, there was a private property called `_mileage` that we already discovered wasn't actually private.

The following example shows that same class rewritten using Private Parts. Notice that the code looks almost identical, yet the privacy is now real.

```javascript
var Car = (function() {

  **var _ = PrivateParts.createKey();**

  function Car(mileage) {
    // Store the mileage property privately.
    _(this).mileage = mileage;
  }

  Car.prototype.drive = function(miles) {
    if (typeof miles == 'number' && miles > 0) {
      _(this).mileage += miles;
    } else {
      throw new Error('drive only accepts positive numbers');
    }
  }

  Car.prototype.readMileage = function() {
    return _(this).mileage;
  }

  return Car;
}());
```

The main difference (highlighted in the above example) is one line of code that invokes a method called `createKey` and stores it on the underscore variable. The other difference is everywhere I previously wrote `this._mileage` I now write `_(this).mileage`.

As you can probably guess, the underscore variable that stores the result of the `createKey` method is actually a function that takes the `this` object and returns its private instance. It's the same idea as in the second example I showed, but without all the boilerplate.

The underscore variable in the above example is what I call the "key function". You can create new key functions by invoking the `createKey` method as shown in the example. A key function accepts an object (which I call the "public instance") and returns a new object (the "private instance"). It's uniquely linked to the public instance, so you can store private properties on it.

I call it a key function because it provides secure, one-way access to the private instance. Without it, the private instance is completely inaccessible. I typically assign the key function to the underscore variable because it's short and is often used to denote privacy. But you can choose whatever you like.

The reason this works (and actually provides privacy) is because the only way to access the private instance is with the key function, and the only way to access the key function is to be in the scope where its declared. If you always define your classes/modules within a closure, and your key function is within that closure, you can have truly private members.

## Private Methods

Private methods have always been semi-possible in JavaScript thanks to dynamic `this` and the Function prototype methods `call` and `apply`.

```javascript
function privateMethod() {
  this.doSomething();
}

// The public method can call the above function
// and retain the `this` context.
SomeClass.prototype.publicMethod = function() {
  privateMethod.call(this);
}
```

But using `call` or `apply` isn't as convenient as invoking a private method directly on an object, nor does it allow for chaining multiple methods together.

Private Parts has a solution to this problem.

The `createKey` function accepts an optional argument that, when passed, is used to control how private instances are created. If `createKey` is passed an object, that object is used as the prototype for all newly created private instances.

In essence, this object becomes a sort of "private prototype" because it's in the prototype chain but only the private instances have access to it.

```javascript
var privateMethods = {
  privateMethodOne: function() { ... },
  privateMethodTwo: function() { ... }
}

var _ = PrivateParts.createKey(privateMethods);

SomeClass.prototype.publicMethod = function() {
  // Now the private methods can be invoked
  // directly on the private instances.
  _(this).privateMethodOne();
  _(this).privateMethodTwo();
}
```

In some cases, a private method might need to call a public method. In order for that to work, `privateMethods` will need to have the public prototype in its prototype chain. This can be easily achieved using `Object.create` to instantiate the `privateMethods` object.

```javascript
var privateMethods = Object.create(SomeClass.prototype);
privateMethods.privateMethodOne = function() { ... };
privateMethods.privateMethodTwo = function() { ... };

var _ = PrivateParts.createKey(privateMethods);
```

The sample below shows what the prototype chain will look like for private instances created this way. As you can see, both the private and public methods are accessible to private instances, but only the public methods are accessible to regular instances.

```javascript
// The private instance prototype chain.
_(this)  >>>  privateMethods  >>>  SomeClass.prototype

// The public instance prototype chain.
this  >>>  SomeClass.prototype
```

Hopefully this isn't too confusing, but in case it is, the [customizing the private instance](https://github.com/philipwalton/private-parts#customizing-the-private-instance) section of the Private Parts README goes into more detail about how it all works.

## Protected Members and Class Hierarchies

The Private Parts key function limits the access of private members to just the scope where its defined. But what if your programs contain subclasses that are defined in separate scopes or separate files altogether? How can you safely share access?

Private Parts is a fairly low level privacy solution and doesn't attempt to solve all problems. It doesn't have an out-of-the-box solution for subclasses; however, it provides you with all the tools you'd need to build your own.

The [Mozart](https://github.com/philipwalton/mozart) module I mentioned above is one such example. Mozart is a classical inheritance implementation based on [Brandon Benvie's work](http://bbenvie.com/articles/2012-07-25/JavaScript-Classes-with-private-protected-and-super) and built to show off the power of Private Parts. Some of the features of Mozart include:

- Simple subclassing.
- Private and protected methods and properties.
- Intuitive super method calling.
- Dynamic getter and setter generation.

Mozart uses a function closure for its class definitions. These closures allow the key functions to be passed to the appropriate subclasses yet still remain inaccessible to the public.

Here's an example class built with Mozart:

```javascript
var ctor = require('mozart');

var Citizen = ctor(function(prototype, _, _protected) {

  // == PUBLIC ==

  prototype.init = function(name, age) {
    _(this).name = name;
    _(this).age = age;
  };
  prototype.vote = function(politician) {
    if (_(this).allowedToVote()) {
      console.log(_(this).name + ' voted for ' + politician);
    } else {
      throw new Error(_(this).name + ' is not allowed to vote.');
    }
  };

  // == PROTECTED ==

  _protected.allowedToVote = function() {
    return this.age > 18;
  };
});
```

The above citizen class defines both public and protected methods and uses the passed key function to store data on the instance.

To subclass citizen, simply call its `subclass` method. As you'll see, two of the methods in this subclass (`init` and `allowedToVote`) are overridden and call super, and the `vote` method is simply inherited as you'd expect from a subclass.

```javascript
var Criminal = Citizen.subclass(function(prototype, _, _protected) {

  prototype.init = function(name, age, crime) {
    _(this).crime = crime;
    prototype.super.init.call(this, name, age);
  };

  _protected.allowedToVote = function() {
    return _(this).crime != 'felony'
      && _protected.super.allowedToVote.call(this);
  };
});

var joe = new Criminal('Joe', 27, 'felony');
joe.vote('Obama') // Throws: Joe is not allowed to vote.
```

In case it's not clear what's going on here, the class definition is providing you with two prototypes to define methods on. The public (regular) prototype, and the protected prototype (the `_protected` variable). Protected methods and properties are accessed using the protected key (the `_` variable), and regular methods are accessed using `this` as usual.

When calling `subclass` on a constructor, a new class is formed that extends both the public and protected prototypes and makes them available to the subclass definition. It also stores a property called `super` that points to the parent class' respective prototypes for easy super method invocation. The protected key is also passed to the subclass allowing all instances of this class hierarchy to access it.

This just skims the top of what you can do with Mozart. I didn't even mention private methods or dynamic getters and setters. If you'd like to dig deeper, check out the [documentation on Github](https://github.com/philipwalton/mozart) and play around with it. I'd love feedback or suggestions for how to make it simpler.

## Wrapping Up

I don't want to present the techniques promoted in this article as *the* true way to do privacy in JavaScript, but I do think they're cleaner and more powerful than anything I've tried before. I'm primarily interested in starting a conversation around how we can do this better, because I know we can.

Fake privacy shouldn't be an option. JavaScript as a language is incredibly flexible and provides many different ways to achieve true privacy. We should use them.

The notions of privacy and encapsulation have existed for a long time and are staples of programming best practices. No one questions their usefulness. The mere fact that so much JavaScript code uses the underscore convention is proof that JavaScript developers get it.

But we don't need nominal privacy. We need real privacy.

## Further Reading

- [Private Properties: Mozilla Developer Network](https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/Contributor_s_Guide/Private_Properties)
- [Private Members in JavaScript: Douglas Crockford](http://javascript.crockford.com/private.html)
- [Private instance members with weakmaps in JavaScript: Nicholas C. Zakas](http://www.nczonline.net/blog/2014/01/21/private-instance-members-with-weakmaps-in-javascript/)
- [JavaScript Classes with private, protected, and super](http://bbenvie.com/articles/2012-07-25/JavaScript-Classes-with-private-protected-and-super)
