<!--
{
  "layout": "article",
  "title": "Real Private Members in JavaScript",
  "date": "2014-03-01T21:59:57-08:00",
  "draft": true,
  "tags": [
    "JavaScript"
  ]
}
-->

In many programming languages, it's common to prefix a variable or method name with an underscore to signal to other developers that it's private. JavaScript is no different. Many of the more popular JavaScript style guides ([airbnb](https://github.com/airbnb/javascript#naming-conventions), [Dojo](http://dojotoolkit.org/community/styleGuide#Naming_Conventions), [aloha](http://aloha-editor.org/guides/style_guide.html#code-conventions)) suggest doing this.

Ironically, most of them, immediately after recommending this convention, warn readers against accessing these private members outside of the class definition. Dojo says, "The [private] method or property is not intended for use by anything other than the class itself", and Alhoa offers this kind advice: "If you use methods that are not marked with @api@ you are on your own."

If you're coming from another language, you might be scratching your head right now. *Wait, if it's private, how can someone access it outside of the class definition?*

Well, therein lies the problem. In JavaScript all properties of all objects are public &mdash; all the time. This naming convention is used to signal intent, but that's all it does. It doesn't enforce anything.

[Douglas Crockford](http://javascript.crockford.com/code.html#names) has this to say on the subject:

> Do not use _ (underbar) as the first character of a name. It is sometimes used to indicate privacy, but it does not actually provide privacy. If privacy is important, use the forms that provide private members. Avoid conventions that demonstrate a lack of competence.

You won't hear me say this often, but I agree with Douglas Crockford here. It's time the we, the JavaScript community (myself included), take privacy seriously.

There are [many compelling reasons](http://programmers.stackexchange.com/questions/143736/why-do-we-need-private-variables) to use private members, and not a single one of them is solved with a naming convention alone. It's short sighted to merely say, "If someone uses a private variable out of scope, that's their problem". Because chances are, it's going to be your problem too.

## Privacy in JavaScript Today

In JavaScript it's really easy to make variables and functions private. Unfortunately, as I've already explained, it's not possible to make properties of objects private.

This is a real problem if you need to manage the state of an instances of a class (or in JavaScript terms, manage properties on `this`). No private properties means that any code that has access to the instance can alter the state in any way it wants.

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

This is a pretty basic `Car` class with a single private member and two accessor methods. As you can see, the `drive` method take a number and increments the mileage property of the `Car` instance, and like any good method, it checks to make sure the input is valid before applying it, otherwise you could end up with bad data.

The problem is that this check doesn't actually protect against bad data because at any point, anyone with access to the instance could manually change the `_mileage` property.

```javascript
var honda = new Car();
honda._mileage = 'pwned';
```

So how can we protect against this? If properties cannot be made private, how can we protect the state of instances from outside tampering?

### A Step Closer

It's true that properties cannot be made private, but properties of an instance aren't the only way to manage the state of an object. There could be a second object that is linked to the instance that stores the private state. And this second object *could* actually be private.

Here's an example of how that might look:

```javascript
var Car = (function() {

  // Create an store to hold the private objects.
  var privStore = {};
  var uid = 0;

  function Car(mileage) {
    // Use a unique ID to reference this instance
    // in the private store.
    privStore[this.id = uid++] = {}
    // Store private stuff in the private store
    // instead of on `this`.
    privStore[this.id].mileage = mileage || 0;
  }

  Car.prototype.drive = function(miles) {
    if (typeof miles == 'number' && miles > 0)
      privStore[this.id].mileage += miles;
    else
      throw new Error('drive can only accept positive numbers')
  };

  Car.prototype.readMileage = function() {
    return privStore[this.id].mileage;
  };

  return Car;
}());
```

In the above code, you give each instance a unique ID, and then everywhere you would have previously written `this._mileage` you now write `privStore[this.id].mileage` which points to an object that is only accessible inside the closure created by the [IIFE](http://en.wikipedia.org/wiki/Immediately-invoked_function_expression). This object holds all of the private data and it's truly private. You can pass `Car` instances around to external code and that code can't modify the instance state.

As I said before, this method works, but it has a number of downsides:

* There's too much extra code to type. If you have tens or hundreds of modules, it will quickly become a burden.
* You have to store an ID property on each instance, which is both annoying and potentially conflicting depending on the property name you choose.
* By using the object `privStore[this.id]` instead of `this` you lose access to the instance's prototype.
* It's not memory efficient. Since the `privStore` object holds a reference to each of the private instance objects, none of those objects can be garbage collected. If the public instance goes away it will be impossible to access those private properties, but they'll still be taking up space in memory. In other words, it's a memory leak.

Whether these downsides trump the downsides of not actually having privacy is hard to say and depends on the situation. Based on the amount of code I've seen using this strategy (approximately zero code), I'd say developers prefer leaking private variables to all this boilerplate.

In any case, we can certainly do better than this.

## What Does a Good Solution Look Like?

Before looking at other solutions to this issue, I think it would be helpful to define what a good solution is. What are the goals we're trying to achieve? If we can clearly define out goals then we can measure any solution against how close it gets to the ideal.

This is my personal list of must-haves before I'd consider using a new privacy technique in a real project:

* The way to declare and access a private property should be simple, convenient, and intuitive.
* It should be clear from the code whether or not a property is private.
* Private properties should only be accessible in the scope in which they're defined.
* The prototype of `this` in the context of a private method should be the same as the prototype of `this` in a public method.
* Dynamic changes to the instance or the constructor's prototype at runtime should never expose any private properties (lexical scoping rules should still apply).
* The solution should be memory efficient.

### My Attempt

I wanted to solve this problem for myself and my own code, so I spent some time trying to improve upon the code in the previous example. Like I said, that solution works (meaning it actually provides privacy), and if I could hide away some of the boilerplate, it would be much more approachable.

An obvious optimization is that all setup code should be abstracted away into its own module. Creating the private store and mapping each new instance to an object that holds the private properties could all happen behind the scenes.

A second optimization was that if the private object used to hold an instances private properties were created using `Object.create` then I could set its prototype to whatever I want. In this case, I want the prototype to be the instance. That way I can still call prototype methods by saying `this.someMethod()` as normal.

Finally, with ES6 [WeakMaps](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) (or using a WeakMap [shim](https://github.com/Benvie/WeakMap)) we now have a data structure that can associate JavaScript objects with other objects rather than just objects with strings (like traditional JavaScript objects). This means we can avoid having to put a unique ID on each instance. It also means we can avoid the garbage collection issue since WeakMaps don't create strong references to the objects they hold.

I wanted to take these optimizations for a test drive, so I wrote a small module to do it.

### Introducing "Private Parts"

The private parts module provides a simple and intuitive way to achieve property encapsulation in JavaScript. It builds on the common convention to use an underscore to represent something private, while providing actual (rather than nominal) privacy. And as a plus, it only requires one line of setup code.

Using private parts is very easy, and honestly it's mostly just syntactic sugar. The gist is that whenever you have a property that you want to be private, instead of using `this.prop` you use `_(this).prop`.

The `_()` function, which I refer to as the key function, accepts an object and returns a new object that's uniquely linked to the passed object so you can store private properties on it, and those properties can't be access by anyone else. It's called it a key function because it provides secure access to the private object. Without it, the private object is completely inaccessible. I chose the underscore as the key function's name for convention reasons and also because it's short. But you can use anything you like.

The magic behind the key function is it's scope &mdash; where it's defined. Since the key function is the only want to access the private data, where you define that key determines what other variables and functions have access to it. Usually you'll define it within your class module, making it impossible for external code to access your instance variables.

Here's a full example:

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

### Preserving the Prototype Chain

When you use the key function to return a private instance, what happens if you try to access a public or prototype property from the private instance? Consider the following somewhat contrived example:

```javascript
function driveOnlyIfYouCan(miles) {
  if (this.mileage < 100000) {
    this.drive(miles);
  } else {
    this.turnOnCheckEngineLight();
  }
}

// Assume the above function is invoked with the
// private instance as its `this` context.
driveOnlyIfYouCan.call(_(this), miles);
```

In the above example `this` inside the `driveOnlyIfYouCan` function is not the public `Car` instance; rather, it's the private instance return by the key function. And it's used to reference both private members (like `mileage`) and prototype members (like `drive`). Will this work?

The answer is yes, because the private instance return by the key function is created with the public instance as its prototype. To visualize how this works, here's the prototype chain for a private instance of the `Car` class:

```text
_(this)  >>>  this  >>>  Car.prototype
```

The only gotcha to this approach is that the private instance can have [own](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwnProperty) properties with the same name as its public or prototype properties. It's possible that you might think you're setting a public property when in fact you're actually setting an own property by the same name on the private instance.

### What About Private Methods?

Since methods in JavaScript are just properties that happen to be functions, you can create private methods by assigning them to `_(this)`.

I experimented with trying to inject a private prototype into the prototype chain so all instances could share a common object that contained the private methods, but I couldn't get it to work and I don't think it's possible for a number of reasons. For one thing, the public instance (`this`) needed to be in the prototype chain, and it needed to be in the chain after the private methods (or they'd no longer be private).

Since there are multiple instances, and the private methods object would need to be in the prototype chain ahead of the public instance, there would also need to be multiple private methods objects. One for each instance. Since JavaScript doesn't support multiple inheritance, sharing a private prototype won't work.

That being said, there are still good and bad ways to do this. Adding an object to the prototype chain that references the function in the private methods object (the mixin strategy) is much better than creating completely separate copies of all of those functions.

Here's an example of creating private methods with a mixin:

```javascript
var _ = PrivateParts.createKey();

function Klass() {
  // Assuming a `mixin` function is defined.
  **mixin(this, privateMethods)**;
}

Klass.prototype.publicMethod = function() {
  // Call a private method via _(this).
  _(this).privateMethod();
}

// Private methods don't go on the prototype, instead
// they get "mixed in" to each instance by the constructor.
var privateMethods = {
  privateMethod: function() { /* ... */ },
  someOtherPrivateMethod: function() { /* ... */ }
}
```

(If anyone can come up with a better solution, I'd love to hear it!)

## Conclusion

I don't want to present this method as the one true way to do private properties in JavaScript, but I do think it's a lot cleaner than anything I've tried before. If others know of a better way, I'd love to hear it.

The point I do want to stress is that I think we need to do something.

Fake privacy shouldn't be an option. JavaScript as a language is incredibly flexible and provides many different ways to achieve true privacy. We should use them.

The notions of privacy and encapsulation have existed for a long time and are staples of programming best practices. No one questions there usefulness. The mere fact that so much JavaScript codes uses the underscore convention is proof that JavaScript developers get it.

But we don't need nominal privacy. We need real privacy.

## Further Reading

- [Private Properties: Mozilla Developer Network](https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/Contributor_s_Guide/Private_Properties)
- [Private Members in JavaScript: Douglas Crockford](http://javascript.crockford.com/private.html)
- [Private instance members with weakmaps in JavaScript: Nicholas C. Zakas](http://www.nczonline.net/blog/2014/01/21/private-instance-members-with-weakmaps-in-javascript/)
