---
template: article.html
title: "Learning How to Set Up Automated, Cross-browser JavaScript Unit Testing"
date: 2016-05-29T12:19:27-07:00
---

I have a confessions to make. I've created several open source projects where I claimed they "work in these browsers", but I didn't always test them in every browser I claimed to support.

I mean, I would usually test them to some degree, especially before the initial release. But the reality is I don't have easy access to every version of every browser. And even given the browsers I do have, it's time consuming to run the tests manually&mdash;especially if I want to run them for every new commit.

Now, I know I'm not alone in this, and a quick Github search can prove that to be true. But I still feel a bit guilty. And I think we as an industry can do better. I know I want to do better.

For about the past two years, I've had the [Karma](http://karma-runner.github.io/) documentation page open among the many open tabs in my browser, but every time I tried to learn it, I ended up giving up. Figuring out which plugins I needed to install and what configuration options I needed to set was just daunting (convoluted???) enough that I never gave it a fair shot.

In addition, I've realized I don't like libraries that try to do too much or have a lot of "magic" going on. Things that hide complexity and claim to "just work" are nice sometimes, but they're terrible for learning, and what I wanted was to actually understand how the process worked under the hood, so that when it broke (which it always eventually does), I could fix it.

For me, the best way to fully understand how something works is to try to recreated it from scratch myself. So I decided to build my own testing tool, and then share with the community what I learned.

I'm writing this article because it's the article I wish existed years ago when I first started releasing open source projects. Sadly, the available content on this topic is surprisingly sparse. If you've ever done a search for how to run automated cross-browser JavaScript unit tests, most of the results you'll get are really just tutorials explaining how to use whatever fill-in-the-blank tool was popular at the time. You rarely find a comprehensive explanation of what  the tool is actually doing.

## The manual process

Before going too deep into how to set up automated cross-browser testing, I want to explain the manual process that I was doing before I took the time to learn this stuff. Based on the sample of people I've talked to, it's the same situation most developers are in today.

In the manual process, you write your tests in a test file, and it probably looks something like this:

```javascript
const assert = require('assert');
const SomeClass = require('../lib/some-class');

describe('SomeClass', () => {
  describe('someMethod', () => {
    it('accepts thing A and transforms it into thing B', () => {
      const sc = new SomeClass();
      assert.equal(sc.someMethod('A'), 'B');
    });
  });
});
```

This example uses Mocha and the Node.js `assert` module, but it doesn't really matter what testing or assertion library you use, it could be anything.

Since Mocha runs in Node.js, you can run this test from the terminal line with the following command:

```
mocha test/some-class-test.js
```

To run this test in your browser, you'll need an HTML file with a script tag that loads the JavaScript, and since browsers don't understand the `require` statement, you'll need a module bundler like [browserify](http://browserify.org/) or [webpack](https://webpack.github.io/) to resolve the dependencies.

```
browserify test/*-test.js > test/index.js
```

The nice thing about a tool like browserify is it combines all your tests (as well as any required dependencies) into a single file, so it's easy to load it from your test page (Note that if your test runner requires additional JS or CSS assets to run, you'll have to those as well).

A typical test file using mocha looks something like this:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Tests</title>
  <link href="../node_modules/mocha/mocha.css" rel="stylesheet" />
  <script src="../node_modules/mocha/mocha.js"></script>
</head>
<body>

  <!-- A container element for the visual mocha results -->
  <div id="mocha"></div>

  <!-- Mocha setup and initiation code -->
  <script>
  mocha.setup('bdd');
  onload = function() {
    mocha.run();
  };
  </script>

  <!-- The script under test -->
  <script src="index.js"></script>

</body>
</html>
```

If you're not using Node.js, then your starting point likely already looks like this HTML file, the only difference is your dependencies are probably listed individually as `<script>` tags.







<!--

If any of your assertions fail, an `Error` is thrown, which is how the test runner knows that a test failed. Most testing frameworks (like Mocha) will provide hooks so you can plug into the testing process, giving other scripts on the page access to the test results.

I've intentionally gone into a lot of detail so far in case anyone reading wasn't completely clear on how the manual part of this process works. No matter what your level of experience in this area, there are really only two keys points to make sure you understand so far:

* Your tests are run in the browser via an HTML page that loads both the code under test as well as the testing library itself.
* The results of the test are accessible to other scripts running on the page.

-->

### Benefits of the manual approach

There are few things more frustrating than running a set of tests from your terminal, seeing a failure logged to the console, and then not having any idea how to debug that failure.

A major benefit of running your tests manually in a browser is, if one of your tests fails, you can use the browser's existing developer tools to debug it.

It's as simple as this:

```javascript
describe('SomeClass', () => {
  describe('someMethod', () => {
    it('accepts thing A and transforms it into thing B', () => {
      const sc = new SomeClass();

      **debugger;**
      assert.equal(sc.someMethod('A'), 'B');
    });
  });
});
```

Now when you re-bundle and refresh the browser with the devtools open, you'll be able to step through your code and easily track down the source of the problem.

The thing that always turned me off about test runners bundle your test code for you and run it in a sub-process is that you don't get to use the debugging tools you already know and love.

If your tests fail in a black box, and you can't rerun them locally to reproduce the error, it can be a debugging nightmare!

## The automated process

I've just outlined the benefits of being able to debug locally, and I believe any serious automated testing workflow must include local debugging capabilities.

An automated system isn't better if it sacrifices the primary benefits of the manual system.

### Requirements

Along with this requirement, I realized I had other must-haves running through my head as well, so I decided to write them down:

* I need to be able to run the tests from the command line
* I need to be able to debug failed tests locally.
* I need all the dependencies required to run my tests to be installable via `npm`, so anyone checking out my code could run them by simply typing `npm install && npm test`.
* I need the process for running the tests on a CI machine to be the same process as running them from my development machine. That way I can debug failures without having to check in new changes.
* I need all the tests to run automatically anytime I (or anyone else) commits changes or makes a pull request.

With this rough list in mind, the next step was to dive into to how automated cross-browser testing works on the popular cloud testing providers.

### How cloud testing works

The most surprising thing to me that I discovered as I started diving into how cloud testing works, is how simple it actually is. Because of how many frameworks there are out there that claim to make this easy, I assumed (incorrectly) that it was really hard!

I made a big deal out of the first item in my requirements list, but as it turns out, all the cloud testing providers run your tests in exactly the same way you do via the manual process.

Here are the basic steps:

1. You give the provider a URL to your test page as well as a list of browsers/platforms you want it to run the tests on.
2. The provider uses selenium webdriver to load the page for each browser/platform combination you give it.
3. Webdriver inspects the page to see if any tests failed, and it stores the results.
4. The provider makes the results available to you.

It's really that simple.

I mistakenly assumed that you had to give these providers your code, and they ran it on their machines, but instead they just go to whatever URL you give them.

### A specific example

There are a number of cloud testing providers out there, each with their own strengths and weakness. For my case I was writing open source, so I only looked at providers that offered a free plan for open source projects, and of those, [Sauce Labs](https://saucelabs.com/opensauce/) was the only one that didn't require me to email support to start a new open source account.

And the Sauce Labs JavaScript API, though clearly not written by people who write JavaScript for a living, is actually relatively simple to use.

It consists of two methods:

- [Start JS Unit Tests](https://wiki.saucelabs.com/display/DOCS/JavaScript+Unit+Testing+Methods#JavaScriptUnitTestingMethods-StartJSUnitTests)
- [Get JS Unit Test Status](https://wiki.saucelabs.com/display/DOCS/JavaScript+Unit+Testing+Methods#JavaScriptUnitTestingMethods-GetJSUnitTestStatus)

The [Start JS Unit Tests](https://wiki.saucelabs.com/display/DOCS/JavaScript+Unit+Testing+Methods#JavaScriptUnitTestingMethods-StartJSUnitTests) initiates testing of a single HTML page (at the given URL) on as many browser/platform combinations as you give it.

The documentation gives an example using `curl`:

```sh
curl https://saucelabs.com/rest/v1/SAUCE_USERNAME/js-tests \
  -X POST \
  -u SAUCE_USERNAME:SAUCE_ACCESS_KEY \
  -H 'Content-Type: application/json' \
  --data '{"url": "https://example.com/tests.html",  "framework": "mocha", "platforms": [["Windows 7", "firefox", "27"], ["Linux", "googlechrome", ""]]}'
```

Since this is for JavaScript unit testing, I'll give an example that uses the [request](https://www.npmjs.com/package/request) node module, which is probably closer to what you'll end up doing if you're using Node.js:

```javascript
request({
  url: `https://saucelabs.com/rest/v1/${username}/js-tests`,
  method: 'POST',
  auth: {
    username: process.env.SAUCE_USERNAME,
    password: process.env.SAUCE_ACCESS_KEY
  },
  json: true,
  body: {
    url: 'https://example.com/tests.html',
    framework: 'mocha',
    platforms: [
      ['Linux', 'googlechrome', ''],
      ['Windows 7', 'firefox', '27'],
    ]
  }
}, (err, response) => {
  if (err) {
    console.error(err);
  } else {
    console.log(response.body);
  }
});
```

Notice in the post body you see `framework: 'mocha'`. Sauce Labs provides support for many of the popular JavaScript unit testing frameworks including Mocha, Jasmine, Qunit, and YUI. And by "support" it just means that Sauce Lab's webdriver client knows where to look to get the test results (though in most cases you still have to populate those results yourself, more on that later).

If you're using a test framework not in that list, you can set `framework: 'custom'`, and Sauce Labs will instead look for a global variable called `window.global_test_results`. The format for the results is listed in the [custom framework](https://wiki.saucelabs.com/display/DOCS/Reporting+JavaScript+Unit+Test+Results+to+Sauce+Labs+Using+a+Custom+Framework
) section of the documentation.

#### Making mocha test results available to Sauce Lab's webdriver client

Sauce Labs claims to have support for all these testing frameworks, but then it requires you to add additional code to make the webdriver client aware of the test results, so arguably it's not real support.

Either way, the amount of code required to make your tests Sauce Labs-aware is very small, and it doesn't interfere with running the tests locally, so it's not that big of a deal to add to any mocha test page you create.

To add mocha support you change these lines in your HTML page:

```html
<script>
mocha.setup('bdd');
onload = function() {
  mocha.run();
};
</script>
```

To something like this:


```html
<script>
mocha.setup('bdd');
window.onload = function() {
  var runner = mocha.run();
  var failedTests = [];

  runner.on('end', function() {
    window.mochaResults = runner.stats;
    window.mochaResults.reports = failedTests;
  });

  runner.on('fail', logFailure);

  function logFailure(test, err){
    var flattenTitles = function(test){
      var titles = [];
      while (test.parent.title){
        titles.push(test.parent.title);
        test = test.parent;
      }
      return titles.reverse();
    };

    failedTests.push({
      name: test.title,
      result: false,
      message: err.message,
      stack: err.stack,
      titles: flattenTitles(test)
    });
  };
};
</script>
```

The only difference between the above code and the default mocha boilerplate is this logic assigns the results of the tests to a variable called `window.mochaResults` in a format that Sauce Labs is expecting.

To reemphasize the point I made earlier, when Sauce Labs "runs" your tests, it's not actually running anything, it's simply visiting a webpage and waiting until a value is found on the `window.mochaResults` object. Then it records those results.

#### Determining whether your tests passed or failed

The [Start JS Unit Tests](https://wiki.saucelabs.com/display/DOCS/JavaScript+Unit+Testing+Methods#JavaScriptUnitTestingMethods-StartJSUnitTests) method tells Sauce Labs to queue running your tests in all the browsers/platforms you give it, but it doesn't return the results of the tests.

All it returns is the IDs of the jobs it queued. The results will look something like this:

```js
{
  "js tests": [
    "9b6a2d7e6c8d4fd2afeeb0ff7e54e694",
    "d38688ec7256497da6966f4523ddee76",
    "14054e68ccd344c0bed77a798a9ce1e8",
    "dbc54181f7d947458f52201ea5fcb901"
  ]
}
```

To determine if your tests have passed or failed, you call the [Get JS Unit Test Status](https://wiki.saucelabs.com/display/DOCS/JavaScript+Unit+Testing+Methods#JavaScriptUnitTestingMethods-GetJSUnitTestStatus) method, which accepts a list of job IDs and returns the current status of each job.

The idea is you call this method periodically until all the jobs are complete.

```javascript
request({
  url: `https://saucelabs.com/rest/v1/${username}/js-tests/status`,
  method: 'POST',
  auth: {
    username: process.env.SAUCE_USERNAME,
    password: process.env.SAUCE_ACCESS_KEY
  },
  json: true,
  body: jsTests, // The response.body from the first API call.

}, (err, response) => {
  if (err) {
    console.error(err);
  } else {
    console.log(response.body);
  }
});
```

The response will look something like this:

```javascript
{
  **"completed": false,**
  "js tests": [
    {
      "url": "https://saucelabs.com/jobs/75ac4cadb85e415fae957f7811d778b8",
      "platform": [
        "Windows 10",
        "chrome",
        "latest"
      ],
      "result": {
        "passes": 29,
        "tests": 30,
        "end": {},
        "suites": 7,
        "reports": [],
        "start": {},
        "duration": 97,
        "failures": 0,
        "pending": 1
      },
      "id": "1f74a237d5ba4a47b5a42570ae1e7999",
      "job_id": "75ac4cadb85e415fae957f7811d778b8"
    },
    // ... the rest of the jobs
  ]
}
```

Once `response.body.complete` is `true`, your tests have finished running, and you can loop through each job to report passes and failures.

### Accessing tests on localhost

I've explained that Sauce Labs "runs" your tests by visiting a URL. Of course, that means the URL you use must be publicly available on the internet.

This is a problem if you're serving your tests on `localhost`.

Most of posts online (including the Sauce Labs documentation) will suggest using [Sauce Connect](https://wiki.saucelabs.com/display/DOCS/Sauce+Connect) to workaround this problem, but I would strongly suggesting *not* doing that, unless you have a very good reason.

Recall the third and fourth item from my original list of requirements:

* I need all the dependencies required to run my tests to be installable via `npm`, so anyone checking out my code could run them by simply typing `npm install && npm test`.
* I need the process for running the tests on a CI machine to be the same process as running them from my machine. That way I can debug failures without having to check in new changes.

Using Sauce Connect significantly complicates both of these requirements. In addition, the process for using Sauce Connect on Travis CI is different from using it on my local machine (via their Sauce Connect plugin), and if you're using their plugin, I couldn't get it to run on pull requests, which failed my final requirement:

* I need all the tests to run automatically anytime I (or anyone else) commits changes or makes a pull request.

While it probably is technically possible to run Sauce Connect in a way that meets all my requirements, it certainly wasn't easy to figure out. Furthermore, I see no obvious benefits to using Sauce Connect over open-source alternatives like `ngrok`.

#### ngrok

[ngrok](https://ngrok.com/) is a tool for creating secure tunnels to localhost.
If you do any development or manual testing on a VM, you've probably already heard of ngrok, and if you haven't, you should definitely check it out. It's an extremely useful tool.

Installing ngrok on your matching is a simple as downloading the binary and adding it to your path; though, if you're going to be using ngrok in Node, you may as well install it via npm.

```
npm install ngrok
```

And you can programmatically start it from a Node program with the following code (see the [documentation](#) for the complete API details):

```javascript
const ngrok = require('ngrok');

ngrok.connect(port, (err, url) => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Tests now accessible at: ${url}`);
  }
});
```

Once you have a public URL to your test file, using Sauce Labs to cross-browser test your local code become substantially easier.

## Putting all the pieces together

This article has covered a lot of things so far, which might give the impression that automated cross-browser testing is complicated. But this is not the case.

I've framed the article from my point of view&mdash;as I was attempting to solve this for myself. And, looking back on the experience, the only complications were due to the lack of good information out there as to how the whole process works and how all the pieces fit together.

Once you understand all the steps, the process is quite simple. Here is the full list of steps:

**The initial, manual Process:**

1. Write the tests and then create a single HTML file that runs all of them.
2. Run the tests locally in one or two browsers to make sure they work.

**Adding automation to the process:**

1. Create an open-source Sauce Labs account and get a username and access key.
2. Update your test page's source code so Sauce Labs can read the results of the tests through a global JavaScript variable.
2. Use ngrok to create a secure tunnel to your local test page, so it's accessible publicly on the internet.
3. Call the [Start JS Unit Tests](https://wiki.saucelabs.com/display/DOCS/JavaScript+Unit+Testing+Methods#JavaScriptUnitTestingMethods-StartJSUnitTests) API method with the list of browsers/platforms you want to test.
4. Call the [Get JS Unit Test Status](https://wiki.saucelabs.com/display/DOCS/JavaScript+Unit+Testing+Methods#JavaScriptUnitTestingMethods-GetJSUnitTestStatus) method periodically until all jobs are finished.
5. Report the results.

## Making it even easier

I know at the beginning of this article I talked a lot about how you didn't need a framework to do automated cross-browser testing, and I still believe that. However, even though the steps above are simple, you probably don't want to have to hand code them every time for every project.

I have a lot of open source projects I wanted to add automated cross-browser testing to, so for me it made sense to abstract this logic into its own package.

If do recommend you take a stab at implementing this yourself, so you can fully appreciate how it works, but if you don't have time and you want to get testing set up quickly, I recommend trying the library I created called Easy Sauce.

### Easy Sauce

Easy Sauce is a Node package and a command line tool (`easy-sauce`), and it's what I now use for every JavaScript project I want to unit test on the Sauce Labs cloud.

The `easy-sauce` command takes a path to your HTML test file (defaulting to `/test/`), a port to start a local server on (defaulting to 1337), and a list of browsers/platforms to test against. `easy-sauce` will then run your tests on Sauce Lab's selenium cloud, log the results to the console, and exit with the appropriate status code indicating whether or not the tests passed.

To make it even more convenient for npm packages, `easy-sauce` will by default look for configuration options in `package.json`, so you don't have to separately store them. This also has the added benefit of clearly communicating to users of your package exactly what browsers/platforms you support.

For complete `easy-sauce` usage instructions, check out the [documentation](https://github.com/philipwalton/easy-sauce) on Github.

Finally, I want to stress that I built this project specifically to solve my use-case. While I think the project will likely be quite useful to many other developers, I have no plans to turn it into a full-featured testing solution.

The whole point of `easy-sauce` was to fill a complexity gap that was keeping me&mdash;and I believe many, many other developers--&mdash;from properly testing their software in the environments they claimed to support.

## Wrapping up

At the beginning of this article I wrote down a list of requirements, and with the help of Easy Sauce, I can now meet these requirements for any project I'm working on.

If you're not already using automated cross-browser testing for your projects, I'd encourage you to give Easy Sauce a try. Even if you don't want to use Easy Sauce, you should at least now have the knowledge needed to roll your own solution or better understand the existing tools.
