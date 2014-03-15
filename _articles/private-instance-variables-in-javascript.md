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

Well, therein lies the problem. In JavaScript all properties of all objects are public &mdash; all the time.

These conventions are used to signal intent but that's all they do. They don't enforce anything. [Douglas Crockford](http://javascript.crockford.com/code.html#names) has this to say on the subject:

> Do not use _ (underbar) as the first character of a name. It is sometimes used to indicate privacy, but it does not actually provide privacy. If privacy is important, use the forms that provide private members. Avoid conventions that demonstrate a lack of competence.

You won't hear me say this often, but I agree with Douglas Crockford. It's time we, as JavaScript developers, take privacy seriously.

There are [many compelling reasons](http://programmers.stackexchange.com/questions/143736/why-do-we-need-private-variables) to use private variables, and none of them are solved with a naming convention alone. It's short sighted to just say, "If someone uses a private variable out of scope, that's their problem". Because chances are, it's going to be your problem too.

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
var global = this;
(function() {
  var age = 42;
  // Expose a function globally to access the age variable
  global.getAge = function() {
    return age;
  }
  global.setAge = function(newAge) {
    if (typeof age == 'number' && age >= 0) {
      age = newAge;
    }
  }
}());
```

In the above example, `age` is private, but we can still get and set it from the global scope. The difference is we apply business rules so that `age` cannot be a string or a negative number. This is the whole point of privacy and when you simply say `_age` and hope the other users of your library abide by your rules, you're gonna have a bad time.

So far, I haven't said anything particularly novel or insightful. If you're an experienced JavaScript developer, you probably want me to get to the hard part.

## Private Members

Variables are easy, the bigger questions is how to make something private if it's a property of `this`?

The short answer is that you can't. If part of the code has access to an object, it has access to all of its properties. The `this` context is no exception.

The long answer is that you kind of can, but you have to fake it.

A lot of people have written about their solutions to this problem, but as far as I'm concerned, none of the proposals are convenient enough to motivate developers to prefer them over just using the underscore convention. This is too bad, but it's also the reality.

Here's one such example that works, but is rarely used because (honestly) it's just too much extra stuff to type:

```javascript
var Car = (function() {

  // Create an object to store private instance variables.
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
      throw new Error('`drive` can only accept positive numbers.')
  };

  Car.prototype.readMileage = function() {
    return privStore[this.id].mileage;
  };

  return Car;
}());
```

In the above code, you give each instance a unique ID, and then everywhere you would have previously written `this._mileage` you now write `privStore[this.id].mileage`. Since `privStore` is defined in the closure created by the [IIFE](http://en.wikipedia.org/wiki/Immediately-invoked_function_expression), there's no way for any external code to modify it without going through the Car methods.

This works, and it delivers true privacy, but it has a number of downsides:

* There's too much boilerplate. If you have tens or hundred of modules it will quickly get out of hand.
* You have to store an ID on each instance, which is annoying.
* By using the object `privStore[this.id]` instead of `this` you lose access to the prototype.
* It's not memory efficient. Since the `privStore` object holds a reference to each of the private instance objects, none of those objects can be garbage collected. If the public instance goes away it will be impossible to access those private properties, but they'll still be taking up space in memory. In other words, it's a memory leak.

Whether these downsides trump the downsides of not actually having privacy is hard to say and depends on the situation. Either way, we can certainly do better than this.

## What Does a Good Solution Look Like?

Before looking at other solutions to this issue, I think it would be helpful to define what a good solution is. What are the goals we're trying to achieve? If we can clearly define out goals then we can measure any solution against how close it gets to the ideal.

This is my personal list of must-haves before I'd consider using a technique in a real project:

* The way to declare and access a private property should be simple, convenient, and intuitive.
* It should be clear from the code whether or not a property is private.
* Private properties should only be accessible in the scope in which they're defined.
* The `this` context inside a function stored on a private property should have the instance itself as well as the constructor prototype in its prototype chain.
* Dynamic changes to the instance or the constructor's prototype at runtime should never expose any private properties (lexical scoping rules should still apply).
* The solution should be memory efficient.

### Improving Upon Existing Solutions

I wanted to solve this problem for myself and my own code, so I spent some time trying to improve upon the solution shown above. Like I said, the solution works (meaning it actually provides privacy), and if I could hide away some of the boilerplate, it would be much more approachable.

An obvious optimazation is that all setup code should be abstracted away into its own module. Creating the private store and maping each new instance to an object that holds the private properties could all happen behind the scenes.

A second optimiaztion was that if the private object used to hold an instances private properties were created using `Object.create` then I could set its prototype to whatever I want. In this case, I want the prototype to be the instance. That way I can still call prototype methods by saying `this.someMethod()` as normal.

Finally, with ES6 [WeakMaps](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) (or using a WeakMap [shim](https://github.com/Benvie/WeakMap)) we now have a data structure that can associate JavaScript objects with other objects rather than just objects with strings (like traditional JavaScript objects). This means we can avoid having to put a unique ID on each instance. It also means we can avoid the garbage collection issue since WeakMaps don't create strong references to the objects they hold.

I wanted to take these optimazations for a test drive, so I wrote a small module to do it.

## Introducing "Private Parts"

The private parts module provides a simple and intuitive way to achieve property encapsulation in JavaScript. It builds on the common convention to use an underscore to represent something private, while providing actual (rather than nominal) privacy. And as a plus, it only requires one line of setup code.

### Usage

Using private parts is very easy, and honestly it's mostly just syntactic sugar. The gist is that whenever you have a property that you want to be private, instead of using `this.prop` you use `_(this).prop`.

The `_()` function, which I refer to as the key function, accepts an object and returns a new object that's uniquely linked to the passed object so you can store private properties on it, and those properties can't be access by anyone else. It's called it a key function because it provides secure access to the private object. Without it, the private object is completely inaccessable. I chose the underscore as the key function's name for convention reasons and also because it's short. But you can use anything you like.

The magic behind the key function is it's scope &mdash; where it's defined. Since the key function is the only want to access the private data, where you define that key determines what other variables and functions have access to it. Usually you'll define it within your class module, making it impossible for external code to access your instance variables.

Here's a full example:

```javascript
var Car = (function() {

  // Create the key function.
  var _ = PrivateParts.createKey();

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

// Create a new Car instance.
var honda = new Car(0);

// Drive it.
honda.drive(500);

// Get its mileage.
console.log(honda.readMileage()); // 500

// Notice that the mileage property is not accessible directly!
console.log(honda.mileage); // undefined
```

### What About Private Methods?

Since methods in JavaScript are just properties than happen to be functions, you can create private methods by assigning them to `_(this)`.

I experimented with trying to inject a private prototype into the prototype chain so all instances could share a common object that contained the private methods, but I couldn't get it to work and I don't think it's possible for a number of reasons. For one thing, `this` needed to be in the prototype chain, and it needed to be in the chain after the private methods (or they'd no longer be private). Unfortunately, that means that there needs to an object containing the private methods for each instance.

Since JavaScript doesn't support multiple inheritance, sharing a private prototype won't work. If you're going to create a lot of instances and you have a lot of private methods, it's probably better to use another method.

At minimum, you can use a mixin and assign each private method to the private instance. That way you're only created extra references for each new instance instead full copies for each new instance. Here's an example:

```javascript
var _ = PrivateParts.createKey();

function Klass(name) {
  this.name = name;
  // Assuming `mixin` exists.
  mixin(this, privateMethods);
}

Klass.prototype.publicMethod = function() {
  // Call a private method
  _(this).privateMethod();
}

// Private methods don't go on the prototype, instead
// they get "mixed in" to each instance by the constructor.
var privateMethods = {
  privateMethod: function() {
    // Inside the private method `this` refers to the
    // private object, but it has the public instance
    // in it's prototype chain. So it can do anything
    // the public instance can.
    console.log(this.name);
  }
  someOtherPrivateMethod: function() {
    // ...
  }
}
```

(If anyone can come up with a better solution, I'd love to hear it!)

### The Prototype Chain

For a clearer explanation about how the prototype chain is structured for the object, consider an instance of a `Car` object created using the expression `new Car()`

```text
_(this)  =>  this  =>  Car.prototype
```

### Environment Support

Private Parts works in both Node and the Browser.

It works natively in any environment that supports the ES6 `WeakMap` data type. If you need to support an environment that doesn't natively support WeakMap, there are many polyfills out there. I use this [WeakMap Polyfill](https://github.com/Benvie/WeakMap) by Brandon Benvie of Mozilla.

## Conclusion

JavaScript is an amazingly powerful and flexible language that allows you to do just about anything you want.

Sure it doesn't have statements like `private void doSomething()` but that doesn't mean privacy isn't possible. As I hope I've shown, JavaScript's existing privacy features are simple, easy to understand, and incredibly flexible. And unlike many other language whose privacy rules are built in, JavaScript gives you complete control over the scope and reach of your privacy implementation.

The notions of privacy and encapsulation have existed for a long time and are staples of programming best practices. No one questions there usefulness. The mere fact that so much JavaScript codes uses the underscore convention is proof that JavaScript developers get it.

But we don't need nominal privacy. We need real privacy.

