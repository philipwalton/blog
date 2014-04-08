<!--
{
  "layout": "article",
  "title": "Private and Protected Members in JavaScript",
  "date": "2014-03-01T21:59:57-08:00",
  "draft": true,
  "tags": [
    "JavaScript"
  ]
}
-->

Privacy has been a complicated issue throughout JavaScript's history.

While it's always been possible to meet even the most stringent privacy needs (the myriad of compile-to-js languages proves this), the extraneous ceremony required to really do it right is often too much of a turn-off &mdash; especially to those coming from other languages where privacy is built in.

In JavaScript we like to prefix our private members with an underscore to let other developers know not to touch them. Many of the more popular JavaScript style guides ([airbnb](https://github.com/airbnb/javascript#naming-conventions), [Dojo](http://dojotoolkit.org/community/styleGuide#Naming_Conventions), [aloha](http://aloha-editor.org/guides/style_guide.html#code-conventions)) recommend this. But unless you have a way to enforce such a convention, it can never really be trusted.

Thought leaders in the JavaScript community have long warned against fake privacy. [Douglas Crockford](http://javascript.crockford.com/code.html#names) has this to say on the subject:

> Do not use _ (underbar) as the first character of a name. It is sometimes used to indicate privacy, but it does not actually provide privacy. If privacy is important, use the forms that provide private members. Avoid conventions that demonstrate a lack of competence.

But despite the warnings, a quick search on Github will show that they're not being taken seriously. Developers don't like to jump through hoops, even if it's for their own good.

In my opinion, the only way we're really going to solve this problem is if we take the hoops away, or at least minimize them. In this article I present some ideas to do both.

## Privacy in JavaScript Today

In JavaScript it's really easy to make variables and functions private. Unfortunately, as I've already explained, it's not possible to make properties of objects private.

This can be a real problem in situations where you need to manage the state of an instance (or in JavaScript terms, manage properties on `this`). No private properties means that any code that has access to the instance can alter its state in any way it wants.

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
}

Car.prototype.readMileage() {
  return this._mileage;
}
```

This is a pretty basic car class with a single private member and two accessor methods. As you can see, the `drive` method takes a number and increments the mileage property of the car instance, and like any good method, it checks to make sure the input is valid before applying it, otherwise you could end up with bad data.

The problem is that this check doesn't actually protect against bad data because at any point, anyone with access to the instance could manually change the `_mileage` property.

```javascript
var honda = new Car();
honda._mileage = 'pwned';
```

So how can we protect against bad data if properties cannot be private? How can we ensure that the state of our instances are safe from outside tampering?

### A Step Closer

It's true that properties cannot be made private, but setting properties on an instance aren't the only way to manage its state. There could be another object that is uniquely linked to the instance that is responsible for storing its state. And this second object *could* actually be private.

Here's an example of how that might look:

```javascript
var Car = (function() {

  // Create a store to hold the private objects.
  var privateStore = {};
  var uid = 0;

  function Car(mileage) {
    // Use a unique ID to reference this instance
    // in the private store.
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

In the above code, you give each instance a unique ID, and then everywhere you would have previously written `this._mileage` you now write `privateStore[this.id].mileage` which points to an object that is only accessible inside the closure created by the [IIFE](http://en.wikipedia.org/wiki/Immediately-invoked_function_expression). This object holds all of the private data and it's truly private. You can pass car instances around to external code their internal state can't be modified.

As I said before, this method works, but it has a number of downsides:

* There's too much extra code to type. If you have tens or hundreds of modules, it will quickly become a burden.
* You have to store an ID property on each instance, which is both annoying and potentially conflicting depending on the property name you choose.
* By using the object `privateStore[this.id]` instead of `this` you lose access to the instance's prototype.
* This won't work with subclasses that are defined in another scope.
* It's not memory efficient. Since the `privateStore` object holds a reference to each of the private instance objects, none of those objects can be garbage collected. If the public instance goes away it will be impossible to access those private properties, but they'll still be taking up space in memory. In other words, it's a memory leak.

Whether these downsides trump the downsides of not actually having privacy is hard to say and depends on the situation. Based on the amount of code I've seen using this strategy (approximately zero code), I'd say developers prefer leaking private variables to all this boilerplate.

Either way, I think we can do better.

## What Does a Good Solution Look Like?

Before looking at other solutions to this issue, I think it would be helpful to define what a good solution is. What are the goals we're trying to achieve? If we can clearly define some goals then we can measure any solution against how close it gets to the ideal.

This is my personal list of must-haves before I'd consider using a new privacy technique in a real project:

* The way to declare and access a private property should be simple, convenient, and intuitive.
* It should be clear from the code whether or not a property is private.
* Private properties should only be accessible in the scope in which they're defined.
* The prototype of `this` in the context of a private method should include the instance's prototype, so private methods can call public methods if they wish.
* Dynamic changes to the instance or the instance's prototype at runtime should never expose any private properties (lexical scoping rules should still apply).
* The solution should be memory efficient.

### My Attempt

I wanted to solve this problem for myself and my own code, so I spent some time trying to improve upon the code in the previous example. Like I said, that solution works (meaning it actually provides privacy), and if I could hide away some of the boilerplate, it would be much more approachable.

An obvious optimization is that all setup code should be abstracted away into its own module. Creating the private store and mapping each new instance to an object that holds the private properties could all happen behind the scenes.

A second optimization is that if the private object used to hold the instance members were created using `Object.create`, I could set its prototype to whatever I wanted. In this case, I want the prototype of the private object to be same as the prototype of the public instance (or some object that has the instance's prototype in its prototype chain). That way prototype methods can be shared rather than copied.

Finally, with ES6 [WeakMaps](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) (or using a WeakMap [shim](https://github.com/Benvie/WeakMap)) we now have a data structure that can associate objects with other objects (traditional objects in JavaScript can only have string keys). This means we can avoid having to put a unique ID on each instance. It also means we can avoid the garbage collection issue since WeakMaps don't create strong references to the objects they hold.

I wanted to take these optimizations for a test drive, so I wrote a small module to do it.

### Introducing "Private Parts"

The [Private Parts](https://github.com/philipwalton/private-parts) module provides a simple and intuitive way to achieve property encapsulation in JavaScript. It builds on the common convention to use an underscore to represent something private, while providing actual (rather than nominal) privacy.

Using Private Parts is very easy, and honestly it's mostly just syntactic sugar. The gist is that whenever you have a property that you want to be private, instead of writing `this.prop` you write `_(this).prop`.

The `_()` function, which I refer to as the key function, accepts an object (the "public instance") and returns a new object (the "private instance") that is uniquely linked to the passed object so you can store private properties on it, and those properties can't be accessed by anyone else. It's called it a key function because it provides secure, one-way access to the private instance. Without it, the private instance is completely inaccessible. I chose the underscore as the variable name for the key function because it's short and is often used to denote privacy. But you can choose whatever you like.

The magic behind the key function is where it's defined &mdash; its scope. Since using the key function is the only way to access the private instance data, where you define that key determines which scope has access to the private instances. Usually you'll define it within your class or module, making it impossible for external code to access your instance variables.

Here's the previous example redone using Private Parts:

```javascript
var Car = (function() {

  // Create the key function.
  **var _ = PrivateParts.createKey()**;

  function Car(mileage) {
    // Store the mileage property privately.
    **_(this)**.mileage = mileage;
  }

  Car.prototype.drive = function(miles) {
    if (typeof miles == 'number' && miles > 0) {
      **_(this)**.mileage += miles;
    } else {
      throw new Error('drive only accepts positive numbers');
    }
  }

  Car.prototype.readMileage = function() {
    return **_(this)**.mileage;
  }

  return Car;
}());
```

As you can see, this is surprisingly similar to the original example. I've highlighted the differences and they're minimal, yet offer real privacy.

```javascript
var honda = new Car();
honda.drive(500);

// Private properties are no longer accessible globally!
console.log(honda.mileage); // undefined
```

There's a lot more that private parts can do (like setting the prototype chain for private instances, or passing a factory function to define how private instaces are created), but I won't repeat here what is already stated in the [README](https://github.com/philipwalton/private-parts).

## What about Private Methods?

Private methods have always been semi-possible in JavaScript thanks to dynamic `this` and the function methods `call` and `apply`:

```javascript
// Some function in a closure.
function privateMethod() {
  this.doSomething();
}

// The public method can call the above function
// and retain the `this` context.
SomeClass.prototype.publicMethod = function() {
  privateMethod.call(this);
}
```

But using `call` or `apply` isn't as convenient as invoking a private method directly on an object, plus it doesn't allow for chaining of multiple methods together.

Private Parts has a solution to this problem.

The `createKey` function accepts an optional argument that, when passed, is used to control how private instances are created. If `createKey` is passed an object, that object is used as the prototype for all newly created private instances.

In essence, this object becomes a sort of "private prototype" because it's in the prototype chain but only the private instances have access to it.

```javascript
var privateMethods = {
  privateMethodOne: function() { /* ... */ },
  privateMethodTwo: function() { /* ... */ }
}

var _ = PrivateParts.createKey(privateMethods);

SomeClass.prototype.publicMethod = function() {
  // Now the private methods can be invoked
  // directly on the private instances.
  _(this).privateMethodOne();
  _(this).privateMethodOne();
}
```

In some cases, a private method might need to call a public method. In order for that to work, the private methods object will need to have the public prototype in its protype chain. This can be easily achieved using `Object.create` when creating the private methods object.

```javascript
var privateMethods = Object.create(SomeClass.prototype);
privateMethods.privateMethodOne = function() { /* ... */ };
privateMethods.privateMethodTwo = function() { /* ... */ };

var _ = PrivateParts.createKey(privateMethods);
```

This is how the prototype chain will now look for private instances. As you can see, both the private and public methods are accessible. For public instances, however, only the public methods are visible.

```javascript
// The private instance prototype chain.
_(this)  >>>  privateMethods  >>>  SomeClass.prototype

// The public instance prototype chain.
this  >>>  SomeClass.prototype
```

Hopefully this isn't too confusing, but in case it is, the [GitHub README](https://github.com/philipwalton/private-parts#controlling-the-prototype-chain) goes into more detail about the prototype chain and how you can control it.

## What About Protected Members and Subclasses?

The Private Parts key function limits the access of private members to just the scope where its defined. But what if your programs contain subclass that are defined in separate scopes or separate files altogether?

Private Parts is a fairly low level privacy solution and doesn't attempt to solve all problems. It doesn't have an out-of-the-box solution for subclasses; however, it provides you with all the tools you'd need to build your own.

JavaScript is an incredibly flexible language, and through the power of closures and first class functions, you can easily create a fully-functioning class inheritance system that gives you public, private, and protected members.

To demonstrate how, I wrote one.

### Introducing "Mozart"

[Mozart](https://github.com/philipwalton/mozart) is a classical inheritance implementation built to show off the power of Private Parts. Some of the features of Mozart include:

- Simple subclassing.
- Private and protected methods and properties.
- Intuitive super method calling.
- Dynamic getter and setter generation.

Mozart uses a function closures for its class definitions. These closures allow the key functions to be passed to the appropriate subclasses yet still remain inaccessible to the public.

Here's an example class built with Mozart:

```javascript
var ctor = require('mozart');

var Citizen = ctor(function(proto, _, _protected) {

  // == PUBLIC ==

  proto.init = function(name, age) {
    _(this).name = name;
    _(this).age = age;
  };
  proto.vote = function(politician) {
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

The above class defines both public and protected methods and uses the passed key function to store data on the instance.

To subclass `Citizen`, simply call its `subclass` method:

```javascript
var Criminal = Citizen.subclass(function(proto, _, _protected) {

  proto.init = function(name, age, crime) {
    _(this).crime = crime;
    proto.super.init.call(this, name, age);
  };

  _protected.allowedToVote = function() {
    return _(this).crime != 'felony'
      && _protected.super.allowedToVote.call(this);
  };
});

var joe = new Criminal('Joe', 27, 'felony');
joe.vote('Obama') // Throws: Joe is not allowed to vote.
```

As you can see, two of the methods in this subclass (`init` and `allowedToVote`) are overriden, yet they're still able to invoke their supermethods. The `vote` method is simply inherited as you'd expect.

### Class Definitions

The above example only used protected methods, but Mozart provides the ability to do private methods as well. Here's the full function signature of class definitions:

```javascript
var SomeClass = ctor(function(proto, _, _protected, __, __private) {
  // proto : the constructor prototype
  // _ : the protected key function
  // _protected : the protected prototype
  // __ : the private key function
  // __private : the private prototype
});
```

Frequently you won't need to supply all of these variables as protected is often good enough, but in case you do, Mozart makes them available.

For a complete description of what all of these do, see the [Mozart API documentation](https://github.com/philipwalton/mozart#api-documentation).

### Supermethods

Since both public and prototected prototypes can have super methods, Mozart add a non-enumarable `super` property to each, allowing you to easily invoke a super method from a subclass.

```javascript
_protected.myMethod = function() {
  // Do stuff, then call super.
  _protected.super.myMethod.call();
}
```

The `super` property simply points to the prototype of the super class

This just skims the top of what you can do with Mozart. I didn't want to go into too much detail, but if you want to learn more you can check out the [documentation on Github](https://github.com/philipwalton/mozart).

## Wrapping Up

I don't want to present Private Parts as the one true way to do private properties in JavaScript, but I do think it's a lot cleaner than anything I've tried before. If others know of a better way, I'd love to hear it.

The point I do want to stress is that I think we need to do something.

Fake privacy shouldn't be an option. JavaScript as a language is incredibly flexible and provides many different ways to achieve true privacy. We should use them.

The notions of privacy and encapsulation have existed for a long time and are staples of programming best practices. No one questions there usefulness. The mere fact that so much JavaScript codes uses the underscore convention is proof that JavaScript developers get it.

But we don't need nominal privacy. We need real privacy.

## Further Reading

- [Private Properties: Mozilla Developer Network](https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/Contributor_s_Guide/Private_Properties)
- [Private Members in JavaScript: Douglas Crockford](http://javascript.crockford.com/private.html)
- [Private instance members with weakmaps in JavaScript: Nicholas C. Zakas](http://www.nczonline.net/blog/2014/01/21/private-instance-members-with-weakmaps-in-javascript/)
