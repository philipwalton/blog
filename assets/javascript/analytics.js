require('autotrack/lib/plugins/clean-url-tracker');
require('autotrack/lib/plugins/event-tracker');
require('autotrack/lib/plugins/media-query-tracker');
require('autotrack/lib/plugins/outbound-link-tracker');
require('autotrack/lib/plugins/page-visibility-tracker');
require('autotrack/lib/plugins/url-change-tracker');


var TRACKERS = ['t0', 'testing'];


/**
 * Shadows the `window.ga` command queue to allow for easier multi-tracking.
 */
var ga = (function() {
  // Randomizes the order in which tracker methods are called.
  // This is necessary because latter trackers will lose more hits (for various
  // reasons) and the results will be skewed.
  var randomizedTrackers = [];
  while (TRACKERS.length) {
    var index = Math.floor(Math.random() * TRACKERS.length);
    var name = TRACKERS.splice(index, 1)[0];
    randomizedTrackers.push(name);
  }
  return function() {
    var args = Array.prototype.slice.call(arguments);
    var command = args[0];
    for (var i = 0, name; name = randomizedTrackers[i]; i++) {
      args[0] = name + '.' + command;
      window.ga.apply(null, args);
    }
  };
}());


// Defines common tracker options.
var trackerOpts =  {siteSpeedSampleRate: 10};


window.ga('create', 'UA-21292978-1', 'auto', trackerOpts);
window.ga('create', 'UA-21292978-3', 'auto', 'testing', trackerOpts);


if (process.env.NODE_ENV !== 'production') {
  window.ga(function() {
    var trackers = window.ga.getAll();
    for (var i = 0, tracker; tracker = trackers[i]; i++) {
      tracker.set('sendHitTask', function(model) {
        console.log(model.get('name'), Date.now(),
            model.get('hitPayload').split('&').map(decodeURIComponent));

        throw 'Abort tracking in non-production environments.';
      });
    }
  });
}


ga('require', 'eventTracker');
ga('require', 'mediaQueryTracker', {
  definitions: [
    {
      name: 'Breakpoint',
      dimensionIndex: 1,
      items: [
        {name: 'sm', media: 'all'},
        {name: 'md', media: '(min-width: 36em)'},
        {name: 'lg', media: '(min-width: 48em)'}
      ]
    },
    {
      name: 'Resolution',
      dimensionIndex: 2,
      items: [
        {name: '1x',   media: 'all'},
        {name: '1.5x', media: '(-webkit-min-device-pixel-ratio: 1.5), ' +
                              '(min-resolution: 144dpi)'},
        {name: '2x',   media: '(-webkit-min-device-pixel-ratio: 2), ' +
                              '(min-resolution: 192dpi)'},
      ]
    },
    {
      name: 'Orientation',
      dimensionIndex: 3,
      items: [
        {name: 'landscape', media: '(orientation: landscape)'},
        {name: 'portrait',  media: '(orientation: portrait)'}
      ]
    }
  ]
});
ga('require', 'outboundLinkTracker');
ga('require', 'urlChangeTracker', {
  fieldsObj: {dimension4: 'urlChangeTracker'}
});


// Only requires experimental plugins on the 'testing' tracker.
window.ga('testing.require', 'cleanUrlTracker', {
  queryDimensionIndex: 5,
  indexFilename: 'index.html',
  trailingSlash: true
});
window.ga('testing.require', 'pageVisibilityTracker', {
  visibleMetricIndex: 1,
  hiddenMetricIndex: 2,
  fieldsObj: {
    dimension4: 'pageVisibilityTracker'
  },
  hitFilter: function(model) {
    // Sets the "Metric Property" dimension to the event value for bucketting.
    model.set('dimension6', model.get('eventValue'), true);
  }
});


ga('send', 'pageview', {dimension4: 'pageload'});


// Sends performance timing metrics after the page loads.
if (__userTiming) {

  window.addEventListener('load', function() {

    performance.measure('css:block', 'css:start', 'css:end');
    var cssBlockEntry = performance.getEntriesByName('css:block')[0];
    var cssBlockTime = Math.round(cssBlockEntry.duration);

    if (cssBlockTime) {
      // Tracks the amount of time the CSS blocks rendering.
      ga('send', 'timing', 'CSS', 'block', cssBlockTime, 'local');
    }


    performance.measure('js:load', 'js:start', 'js:end');
    var jsLoadEntry = performance.getEntriesByName('js:load')[0];
    var jsLoadTime = Math.round(jsLoadEntry.duration);

    if (jsLoadTime) {
      // Tracks the amount of time the JavaScript takes to load.
      ga('send', 'timing', 'JavaScript', 'load', jsLoadTime, 'local');
    }


    if (window.WebFontConfig) {
      WebFontConfig.waitUntilReady().then(function() {
        performance.measure('fonts:load', 'fonts:start', 'fonts:end');
        var fontsLoadEntry = performance.getEntriesByName('fonts:load')[0];
        var fontsLoadTime = Math.round(fontsLoadEntry.duration);

        if (fontsLoadTime) {
          // Tracks the amount of time the web fonts take to load.
          ga('send', 'timing', 'Fonts', 'load', fontsLoadTime,
              'fonts.googleapis.com');
        }
      })
      .catch(function() {
        ga('send', 'event', 'Fonts', 'error', 'fonts.googleapis.com');
      });
    }

  });
}
