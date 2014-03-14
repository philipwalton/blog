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

Prefixing a method or variable name with an underscore is a pretty common convention used in many languages to signal to other developers that some thing is private. JavaScript is no different.

Many of the more popular JavaScript style guides ([airbnb](https://github.com/airbnb/javascript#naming-conventions), [Dojo](http://dojotoolkit.org/community/styleGuide#Naming_Conventions), [aloha](http://aloha-editor.org/guides/style_guide.html#code-conventions)) recommend using this convention. But the funny thing is that most of them, immediately after recommending this convention, warn readers against accessing these private members outside of the class definition. Dojo says, "The [private] method or property is not intended for use by anything other than the class itself", and Alhoa offers this kind advice: "If you use methods that are not marked with @api@ you are on your own."

If you're coming from another language, you might be scratching your head right now. *Wait, if it's private, how can someone access it outside of the class definition?*

Well, therein lies the problem. In JavaScript all properties of all objects are public &mdash; all the time.

These conventions are used to signal intent but that's all they do. They don't enforce anything.

[Douglas Crockford](http://javascript.crockford.com/code.html#names) has this to say on the subject:

```
Do not use _ (underbar) as the first character of a name. It is sometimes used to indicate privacy, but it does not actually provide privacy. If privacy is important, use the forms that provide private members. Avoid conventions that demonstrate a lack of competence.
```

You won't hear me say this very often, but in this case I agree with Douglas Crockford. I think it's time we as JavaScript developers to privacy seriously.
If you want something to be private then there's usually a good reason, and an underscore in front of the name is not a real solution.

At the end of the day, users of your library *will* touch your private parts in ways you don't want (pun intended).

## Privacy in JavaScript

JavaScript has a very simple and easy to understand privacy model based on lexical, function scoping. In plain English, variables can access other variables declared in the same function or in any of the outer (enclosing) functions. By contrast, variables cannot access other variables declared inside inner functions.

```javascript
(function outer() {
  var a = 1;
  (function current() {
    var b = 2;
    (function inner() {
      var c = 3;
    }());
    // The current scope has access to variables in the same
    // scope and the outer scope but not in the inner scope.
    console.log(a) // 1
    console.log(b) // 2
    console.log(c) // ReferenceError: c is not defined
  }());
}());
```

That's really all there is. There's no private; there's no protected. It's just good old function scoping.

If you want to make a variable private but still be able to read or modify it in from an outside scope, you need to wrap the variable in a function and then create some accessor methods:

```javascript
(function() {
  var age = 42;
  // Expose a function globally to access the age variable
  window.getAge = function() {
    return age;
  }
  window.setAge = function(newAge) {
    if (typeof age == 'number' && age >= 0) {
      age = newAge;
    }
  }
}());
```

In the above example, `age` is private, but we can still get and set it from the global scope. The difference is we apply business rules so that `age` cannot be a string or a negative number. This is the whole point of privacy and when you simply say `_age` and hope the other users of your library abide by your rules, you're gonna have a bad time.

Nothing I've said so far is particularly novel and if you're an experienced JavaScript developer you probably want me to get to the hard part.

As you're probably aware, variables are easy, the bigger questions is how to make something private if it's a property of `this`?

## Private Members

The short answer is that you can't. If part of the code has access to an object, it has access to all of its properties. The `this` context is no exception.

The long answer is that you kind of can, but you have to fake it.

A lot of people have written about their solutions to this problem, but as far as I'm concerned, none of the proposals are convenient enough to motivate developers to prefer them over just using the underscore convention. This is a shame because privacy and encapsulation are actually important.

Here's a simple and straight-forward example of how you can have private members in JavaScript:

```javascript
var Car = (function() {

  var privStore = {};
  var uid = 0;

  function Car(mileage) {
    // Create a place in `privStore` to save private properties
    // that is uniquely tied to this particular instance.
    this.id = uid++;
    privStore[this.id] = {}

    // Store private stuff in `privStore` instead of on `this`.
    privStore[this.id].mileage = mileage || 0;
  }

  Car.prototype.drive = function(miles) {
    privStore[this.id].mileage += miles;
  };

  Car.prototype.getMileage = function() {
    return privStore[this.id].mileage;
  };

  return Car;
}());
```

In the above code, you give each instance a unique ID, and then everywhere you would have previously written `this._mileage` you now write `privStore[this.id].mileage`. Since `privStore` is defined in the closure created by the [IIFE](http://en.wikipedia.org/wiki/Immediately-invoked_function_expression), there's no way for any external code to modify it without going through the Car methods.

This works, and it delivers true privacy, but it has a number of downsides:

* There's too much boilerplate. If you have tens or hundred of modules it will quickly get out of hand.
* By using the object `privStore[this.id]` instead of `this` you lose access to the prototype.
* It's not memory efficient. Since the `privStore` object holds a reference to each of the private instance objects, none of those objects can be garbage collected. If the public instance goes away it will be impossible to access those private properties, but they'll still be taking up space in memory. In other words, it's a memory leak.

Whether these downsides trump the downsides of not actually having privacy is hard to say and depends on the situation. Either way, we can certainly do better than this.

## What Does a Good Solution Look Like?

I mentioned above that while most of the existing solutions do work, you don't really see them in the wild. My guess is they're too much of a hassle to deal with. There's too much boilerplate. Developers don't want to have to jump through hoops to access an instance variable within a class definition, so they don't.

Before looking at other solutions to this issue, I think it would be helpful to define what a good solution is. What are the goals we're trying to achieve? If we can clearly define out goals then we can measure any solution against how close it gets to the ideal.

This is my personal list of must-haves before I'd consider using a technique in a real project:

* The way to declare and access a private property should be simple, convenient, and intuitive.
* It should be clear from the code whether or not a property is private.
* Private properties should only be accessible inside the function in which they're defined.
* The `this` context inside a function stored on a private property should have the public properties and the constructor prototype in its prototype chain.
* Dynamic changes to the instance or the constructor's prototype at runtime should never expose any private properties (lexical scoping rules should still apply).
* The solution should be memory efficient.

### An Acceptable Solution

After thinking about the problem a bit more, I realized you could eliminate most of this boilerplate by replacing `privStore[this.id]` with a function that does the same thing.

Basically, you write a function that accepts an object and returns another object that is just used to store private members. Since the only way to access this private object is to call this function, the scope of the private objects become the same as the scope of this particular function.

I also realized that if the returned private object were created with the passed object as its prototype, then you'd be able to use `this` in private methods and access both private and public properties.

Lastly, with ES6 [WeakMaps](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) (or using a WeakMap [shim](https://github.com/Benvie/WeakMap)) we now have a data structure that can associate JavaScript objects with other objects rather than just objects with strings (like traditional JavaScript objects). This means we can avoid having to put an ID on each instance. It also means we can avoid the garbage collection issue since WeakMaps don't create strong references to the objects they hold.

I wanted to take this solution for a spin, so I wrote a small module to do it.

## Introducing "Private Parts"

The private parts module provides a simple and intuitive way to achieve property encapsulation in JavaScript. It builds on the common convention to use an underscore to represent something private, but it provides actual privacy. And as a plus, it only requires one line of setup code.

### Usage

Using private parts is very easy, and honestly it's mostly just syntactic sugar. The gist is that whenever you have a property that you want to be private, instead of using `this.prop` you use `_(this).prop`.

The `_()` function, which I refer to as the key function, accepts an object and returns a new object that's uniquely linked to the passed object so you can store private properties on it and those properties can't be access by anyone else. It call it a key function because it provides secure access to the private data. Without it, there's no way to access the private properties.

I chose the underscore as the name for the key function because underscores are commonly used when naming private variables. If you're using the underscore variable for something else, that's OK. You can easily name the key something else.

The scope of the key function is determined by you. The private parts module has a single `createKey()` factory method that returns a new key function, so whatever scope you call `createKey()` in, that's the scope it gets.

Here's a full example:

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

I experimented with trying to inject a private prototype into the prototype chain so all instances could share a common object that contained the private methods, but I could get it to work and I don't think it's possible for a number of reasons. For one thing, `this` needed to be in the prototype chain, and it needed to be in the chain after the private methods (or they'd no longer be private). Unfortunately, that means that there needs to an object containing the private methods for each instance.

Since JavaScript doesn't support multiple inheritance, sharing a private prototype won't work. If you're going to create a lot of instances and you have a lot of private methods, it's probably better to use another method.

At minimum, you can use a mixin and assign each private method to the private instance. That way you're only created extra references for each new instance instead full copies for each new instance.

(If anyone can come up with a better solution, I'd love to hear it!)

### The Prototype Chain

For a clearer explanation about how the prototype chain is structured for the object, consider an instance of a `Car` object created using the expression `new Car()`

```text
_(this)  -->  this  -->  Car.prototype
```

### Environment Support

Private Parts works natively in any environment that supports the ES6 `WeakMap` data type. If you need to support an environment that doesn't natively support those things, you can easily include polyfills for them. Here are that two I've used.

* [WeakMap](https://github.com/Benvie/WeakMap)
* [Object.create](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create)

### Why Privacy Matters

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

This limitation might not seem so bad if you're just writing code for yourself. You know what should and shouldn't be done with your objects, and hopefully you'll respect those rules. But if you're on a bigger team, and you're dealing with objects whose business rules aren't obvious to everyone, having direct access to properties that should be private can be disastrous.

The problem gets even worse when you need to change the names or implementation details of these private properties. If anyone depending on your code is accessing the private members directly (even though they shouldn't be), your changes will break their code.
