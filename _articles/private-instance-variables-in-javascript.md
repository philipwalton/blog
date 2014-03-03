<!--
{
  "layout": "article",
  "title": "Shimming Private Instance Variables in JavaScript",
  "date": "2014-03-01T21:59:57-08:00",
  "draft": true,
  "tags": [
    "JavaScript"
  ]
}
-->

An instance variable is a variable defined in a class for which each new instance of that class gets its own unique copy. In JavaScript, the closest thing we have to instance variables are the properties added to `this` on objects that were created with the `new` operator.

Here's an example:

```javascript
function Car(mileage) {
  this.mileage = mileage || 0;
}

var honda = new Car(5000);
console.log(honda.mileage) // 5000
```

In the above code, `mileage` is an instance variable of the Car object since each new Car object gets its own copy. This is distinct from regular variables (defined with the `var` keyword) since such variables are not associated with any particular object.

In most Object Oriented language, instance variables are private, which means they cannot be modified by any code outside of the class definition. This is normally a good thing because you usually want strict control over how the state of an object can change, and you establish those rules through methods.

Continuing with the Car example, let's add a `drive` method, since a car's mileage should only change by driving it.

```javascript
Car.prototype.drive = function(miles) {
  this.mileage += miles;
};

var honda = new Car(0);
honda.drive(100);

console.log(honda.mileage); // 100
```

The problem with the above code (as most JavaScripter will easily spot) is that anyone who has access to the `honda` object can change the `mileage` directly. This is because in JavaScript, all properties are always public. There's no way to declare them private.

```javascript
var honda = new Car(0);

// Mileage can be set directly at any time
honda.mileage = 'pwned';
```

## Privacy In JavaScript

The only way to make something private in JavaScript is to declare it in a scope that is not visible to other code. Here's is an incredibly simplified example of how this is usually done. In short, you use a [closure](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures).

```javascript
(function() {
  var age = 42;
  // Expose a function globally to access the age variable
  window.getAge = function() {
    return age;
  }
}());

// Since `age` is encapsulated, it can't be accessed directly
console.log(age) // undefined

// But it can be accessed through the getter.
console.log(window.getAge()) // 42
```

This pattern works well for keeping a regular variable hidden from external scope, but it doesn't work at all if what you want to keep hidden are the properties of an object. As mentioned before, if you have access to an object, you alway have access to all its properties.

So what can we do?

Variable can be private, but as soon as you assign a variable to an instance you make it visible to an outer scope and therefore public.

### The Goal

Before we attempt to solve this problem, I think it's helpful to clearly layout what we want to accomplish. What is the goal?

It's impossible (and often unwise) to try to make JavaScript be something its not. Instead of just trying to recreate some other language's version of private instance variables, let's see if we can meet the same ends by taking advantage of the flexibility and power of JavaScript.

* Private properties should be accessible to all code within the class definition, but not accessible to any code outside of the class definition.
* Dynamic changes to the public interface at runtime should never expose the private properties of an instance. Lexical scoping rules should still apply.

* Private properties should have access to all public properties, but not necessarily the other way around (since public properties might be modified at runtime).
* Making something private should be simple, intuitive, and apparent from just looking at the code.

### A Naive Solution

True private properties are impossible in JavaScript, so the solution is to fake it with a shim. There are several ways to do this, but as I said, the goal is to make it simple and intuitive.

The trick is to create a store object that can keep track of all instances and their associated private "properties". If you define the store object variable in the same scope as the class definition, it will only be accessible to code in that scope.

Here's a naive solution:

```javascript
var Car = (function() {

  var **privStore** = {};

  function Car(mileage) {
    // Create a place in `privStore` to save private properties
    // that is uniquely tied to this particular instance.
    this.id = uniqueId();
    **privStore[this.id]** = {}

    // Store private stuff in `privStore` instead of on `this`.
    **privStore[this.id].mileage** = mileage || 0;
  }

  Car.prototype.drive = function(miles) {
    **privStore[this.id].mileage** += miles;
  };

  Car.prototype.getMileage = function() {
    return **privStore[this.id].mileage**;
  };

  return Car;
}());
```

In the above code, everywhere you used to say `this.mileage` you now say `privStore[this.id].mileage`. Since `privStore` is defined in the closure created by the [IIFE](http://en.wikipedia.org/wiki/Immediately-invoked_function_expression), there's no way for any external code to modify it without going through the Car methods.

This works, but it's really crappy.

It might only seem like a few extra lines of code, but its boilerplate, and if you have tens or hundred of modules it will quickly get out of hand.

Also, by using `privStore[this.id]` you lose all of the advantages you get with dynamic `this` in JavaScript.

## Introducing Private Parts

The private parts module provides a simple and intuitive way to achieve property encapsulation in JavaScript. It builds on the common convention to use an underscore to represent something private, and it require only one line of setup.

Private parts has only a single method to learn called `scope()`. When you invoke it, it returns a function that acts like a key. It allows you to access the private properties of any object, so any code that has access to the key can access the private properties of an object, and any code that doesn't have access can do nothing.

Here's how you use it:

```javascript
var Car = (function() {
  // Create the key function.
  var **_ = PrivateParts.scope()**;

  function Car(mileage) {
    // Store the mileage property privately.
    **_(this).mileage** = mileage
  }

  Car.prototype.drive(miles) {
    **_(this).mileage** += mileage;
  }

  Car.prototype.getMileage() {
    return **_(this).mileage**;
  }

  return Car;
}());

var honda = new Car(0);
honda.drive(500);

console.log(honda.getMileage); // 500

// The mileage property is inaccessible.
console.log(honda.mileage); // undefined
```

### How It Works

Private parts works almost exactly like I outlined in the naive solution, but it eliminates all of the boilerplate. It provides a straightforward way to access private properties, and it only adds a few extra characters of code.

Any time you pass an object to the key function, it returns an object that is uniquely tied to the instance passed, and all properties of that object are safely stored behind a closure that prevents any code from touching it. It is only access with the key function, and the key function is only available to whatever scope you define it in.

Furthermore, the object returned by the key function has the original instance as its prototype, so `_(this).somePublicMethod()` will work as well. This allows you to take full advantage of the dynamic `this` in JavaScript.

### What About Private Methods?



The `scope` method can take an optional argument. If you pass an object to `scope` then instead of setting the prototype of the privacy object to the instance, it sets it to the passed object.

This is very powerful. It allows you to define functions that are truly private yet still have full access to the `this` variable.

In order to keep the prototype chain in tact, it's important that the private methods be defined on an object whose prototype is the constructors prototype.

In case that was confusing, here's an full example that uses both private properties and private methods:

```javascript
var Car = (function() {

  // Create the key function
  var _ = PrivateParts.scope();

  function Car(mileage) {
    _(this).mileage = mileage

    // Mixin private methods.
    // I'm assuming such a function exists.
    mixin(_(this), privateMethods);
  }

  Car.prototype.drive(miles) {
    _(this).mileage += mileage;
  }

  Car.prototype.getMileage() {
    return _(this).mileage;
  }

  Car.prototype.makeNew = function() {
    // Private methods require wrapping `this`
    // with the key function as well.
    _(this).resetOdometer();
  }

  // Private methods
  var privateMethods = {
    resetOdometer = function() {
      _(this).mileage = 0;
    }
  }

  return Car;

}());

var honda = new Car(0);
honda.drive(500);

// You can't call private methods in an outer scope.
honda.resetOdometer(); // Error!

// But you can call public methods and internally
// call private methods.
honda.makeNew();

console.log(honda.getMileage()); // 0
```

## Caveats


