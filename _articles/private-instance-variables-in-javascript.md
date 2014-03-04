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

Everyone once in a while I get a little annoyed that properties on `this` can't be private in JavaScript. I mean, you can't make properties on any object private in JavaScript, but I find it especially limiting that it can't be done on `this`.

The equivalent to private properties on `this` would be private members or instance variables in many other object oriented language. In fact, in most other languages, instance variables are private by default, and can only be modified outside of the class definition with getters and setters.

Privacy and encapsulations are interesting concepts. They're kind of like laws in a society. It's possible to write a well-designed program without privacy and encapsulation just like it's possible to have a peaceful and orderly society without laws. But in reality, it turns out these constraints are actually very helpful because even the best of us end up tempted to do bad things every once in a while.

In case you're not familiar with why private instance variables are a good thing, consider this example:

```javascript
function Car(mileage) {
  this.mileage = mileage || 0;
}

Car.prototype.drive = function(miles) {
  this.mileage += miles;
};

var honda = new Car(0);
honda.drive(100);

console.log(honda.mileage); // 100
```

In the above code, `mileage` is an instance variable of the car object since each new Car object has its own `mileage` property. (Note that this is distinct from regular variables in JavaScript which *can* be private.)

You'll notice that there is a drive method that increments the mileage of the car by the amount driven. Since in the real world the only way the mileage of a car should increase is by driving it, the code should reflect that.

The problem with the above code (as most JavaScripter will easily spot) is that anyone with access to the car instance can easily change its `mileage` property directly.

```javascript
var honda = new Car(0);

// Mileage can be set directly at any time
honda.mileage = 'pwned';
```

This limitation might not seem so bad if you're just writing code for yourself. You know what should and shouldn't be done with your objects, and hopefully you'll respect those rules. But if you're on a bigger team, and you're dealing with objects whose business rules aren't obvious to everyone, the ability to change object properties directly can be disastrous.

## Privacy In JavaScript

In JavaScript, the only way to make something private is to declare it in a scope that is not visible to other code. Here's is an incredibly simplified example of how this is usually done:

```javascript
(function() {
  var age = 42;
  // Expose a function globally to access the age variable
  window.getAge = function() {
    return age;
  }
}());

// Since `age` is defined in the closure,
// it can't be accessed form the outer scope
console.log(age) // undefined

// But it can be accessed through the getter.
console.log(window.getAge()) // 42
```

This pattern works well for keeping a regular variable private, but it doesn't work at all if what you want to keep hidden is a property of an object. As mentioned before, if you have access to an object, you have access to all of its properties.

So what can we do?

### The Goal

Before we attempt to solve this problem, I think it's helpful to clearly establish what we want to accomplish.

It's impossible (and often unwise) to try to make JavaScript be something its not. So, instead of just trying to recreate some other language's version of private instance variables, let's see if we can achieve the same ends by leveraging JavaScript's good features.

Here are our goals:

* Private properties should be accessible to all code within the class or module definition, but not accessible to any code outside of it.
* Dynamic changes to the instance or the object's prototype at runtime should never expose any private properties. Lexical scoping rules should still apply.
* Private properties should have access to all public properties, but not necessarily the other way around (since public properties might be modified at runtime).
* The way to make a property private should be simple and intuitive, and the fact that it is private should be apparent to other developers.

### Finding a Solution

True private properties are impossible in JavaScript (and least right now), so any solution to this problem will require faking it to a degree.

When I was thinking about how to solve this issue, here was my initial (albeit crappy) solution:

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

In the above code, you give each instance a unique ID, and then everywhere you would have previously written `this.mileage` you now write `privStore[this.id].mileage`. Since `privStore` is defined in the closure created by the [IIFE](http://en.wikipedia.org/wiki/Immediately-invoked_function_expression), there's no way for any external code to modify it without going through the Car methods.

This works, but like I said, it's really crappy. It meets some of our goals, but it's not simple or intuitive. It's also a lot of boilerplate, and if you have tens or hundred of modules it will quickly get out of hand.

In addition, by using `privStore[this.id]` instead of `this` you won't be able to access public properties inside of private methods. You lose all the power of dynamic `this` in JavaScript.

I wasn't satisfied, so I decided to keep exploring.

After thinking about the problem a bit more, I realized you could eliminate most of this boilerplate by replacing `privStore[this.id]` with a function that does the same thing.

Basically, you write function that accepts an object and returns another object that is just used to store private members. Since the only way to access this private object is to call this function, the scope of the private objects because the same as the scope of this particular function.

I also realized that if the returned private object were created with the passed object as its prototype, then you'd be able to use `this` in private methods and access both private and public properties.

I wanted to take this solution for a spin, so I wrote a small module to do it.

## Introducing "Private Parts"

The private parts module provides a simple and intuitive way to achieve property encapsulation in JavaScript. It builds on the common convention to use an underscore to represent something private, and it requires only one line of setup code.

### Usage

Using private parts is very easy. The gist is that whenever you have a property that you want to be private, instead of using `this.prop` you use `_(this).prop`.

The `_()` function, which I refer to as the key accepts an object and returns a new object that's uniquely linked to the passed object so you can store private properties on it and those properties can't be access by anyone else. It acts like a key because without the key, you can't access the private properties.

I chosen the underscore as the name for the key function because underscores are commonly used when naming private variables. If you're using underscore for something else, you can easily change it.

The scope of the key function is determined by you. The private parts factory has a `scope()` method that returns a new key function, so wherever you assign it, that's the scope it gets.

Here's a more complete example:

```javascript
var Car = (function() {
  // Create the key function.
  var _ = PrivateParts.scope();

  function Car(mileage) {
    // Store the mileage property privately.
    _(this).mileage = mileage
  }

  Car.prototype.drive(miles) {
    _(this).mileage += mileage;
  }

  Car.prototype.getMileage() {
    return _(this).mileage;
  }

  return Car;
}());

var honda = new Car(0);
honda.drive(500);

console.log(honda.getMileage); // 500

// The mileage property is inaccessible.
console.log(honda.mileage); // undefined
```

### What About Private Methods?

Since methods in JavaScript are just properties than happen to be functions, you can create private methods by assigning them to `_(this)`.

I experimented with trying to inject a private prototype into the prototype chain so all instances could share a common object that contained the private methods, but I don't think this is possible for a number of reasons. `this` needed to be in the prototype chain, and it needed to be in the chain after the private methods (or they'd no longer be private). That means that there needs to an object containing the private methods for each instance.

Since JavaScript doesn't support multiple inheritance, sharing a private prototype won't work.

(If anyone can come up with a better solution than a mixin, I'd love to hear it!)


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


