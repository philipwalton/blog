import 'autotrack/lib/plugins/clean-url-tracker';
import 'autotrack/lib/plugins/event-tracker';
import 'autotrack/lib/plugins/media-query-tracker';
import 'autotrack/lib/plugins/outbound-link-tracker';
import 'autotrack/lib/plugins/page-visibility-tracker';
import 'autotrack/lib/plugins/url-change-tracker';


/* global WebFontConfig */


/**
 * A global list of tracker object, randomized to ensure no one tracker
 * data is always sent first.
 */
const ALL_TRACKERS = shuffleArray([
  {name: 't0', trackingId: 'UA-21292978-1'},
  {name: 'testing', trackingId: 'UA-21292978-3'}
]);


const TEST_TRACKER = ALL_TRACKERS.filter(({name}) => /test/.test(name));


const metrics = {
  PAGE_VISIBLE: 'metric1',
  PAGE_HIDDEN: 'metric2'
};


const dimensions = {
  BREAKPOINT: 'dimension1',
  RESOLUTION: 'dimension2',
  ORIENTATION: 'dimension3',
  HIT_SOURCE: 'dimension4',
  URL_QUERY_PARAMS: 'dimension5',
  METRIC_VALUE: 'dimension6'
};


// The command queue proxies.
let gaAll = createGaProxy(ALL_TRACKERS);
let gaTest = createGaProxy(TEST_TRACKER);


// Delays running any analytics until after the load event
// to ensure beacons don't block resources.
window.onload = function() {
  createTrackers();
  requirePlugins();
  requireExperimentalPlugins();
  sendInitialPageview();
  measureCssBlockTime();
  measureJavaSciptLoadTime();
  measureWebfontPerfAndFailures();
};


/**
 * Creates a ga() proxy function that calls commands on all but the
 * excluded trackers.
 */
function createGaProxy(trackers) {
  return function(...args) {
    let command = args[0];
    for (let {name} of trackers) {
      args[0] = `${name}.${command}`;
      window.ga(...args);
    }
  };
}


function createTrackers() {
  for (let tracker of ALL_TRACKERS) {
    window.ga('create', tracker.trackingId, 'auto', tracker.name, {
      siteSpeedSampleRate: 10
    });
  }
  if (process.env.NODE_ENV !== 'production') {
    window.ga(function() {
      for (let tracker of window.ga.getAll()) {
        tracker.set('sendHitTask', function(model) {
          console.log(model.get('name'), Date.now(),
              model.get('hitPayload').split('&').map(decodeURIComponent));
          throw 'Abort tracking in non-production environments.';
        });
      }
    });
  }
}


function sendInitialPageview() {
  gaAll('send', 'pageview', {[dimensions.HIT_SOURCE]: 'pageload'});
}


function requirePlugins() {
  gaAll('require', 'cleanUrlTracker', {
    queryDimensionIndex: getDefinitionIndex(dimensions.URL_QUERY_PARAMS),
    indexFilename: 'index.html',
    trailingSlash: true
  });
  gaAll('require', 'eventTracker');
  gaAll('require', 'mediaQueryTracker', {
    definitions: [
      {
        name: 'Breakpoint',
        dimensionIndex: getDefinitionIndex(dimensions.BREAKPOINT),
        items: [
          {name: 'sm', media: 'all'},
          {name: 'md', media: '(min-width: 36em)'},
          {name: 'lg', media: '(min-width: 48em)'}
        ]
      },
      {
        name: 'Resolution',
        dimensionIndex: getDefinitionIndex(dimensions.RESOLUTION),
        items: [
          {name: '1x',   media: 'all'},
          {name: '1.5x', media: '(-webkit-min-device-pixel-ratio: 1.5), ' +
                                '(min-resolution: 144dpi)'},
          {name: '2x',   media: '(-webkit-min-device-pixel-ratio: 2), ' +
                                '(min-resolution: 192dpi)'}
        ]
      },
      {
        name: 'Orientation',
        dimensionIndex: getDefinitionIndex(dimensions.ORIENTATION),
        items: [
          {name: 'landscape', media: '(orientation: landscape)'},
          {name: 'portrait',  media: '(orientation: portrait)'}
        ]
      }
    ]
  });
  gaAll('require', 'outboundLinkTracker');
  gaAll('require', 'urlChangeTracker', {
    fieldsObj: {[dimensions.HIT_SOURCE]: 'urlChangeTracker'}
  });
}


function requireExperimentalPlugins() {
  // Only require these plugins on the test tracker(s).
  gaTest('require', 'pageVisibilityTracker', {
    visibleMetricIndex: getDefinitionIndex(metrics.PAGE_VISIBLE),
    hiddenMetricIndex: getDefinitionIndex(metrics.PAGE_HIDDEN),
    fieldsObj: {[dimensions.HIT_SOURCE]: 'pageVisibilityTracker'},
    hitFilter: function(model) {
      model.set(dimensions.METRIC_VALUE, String(model.get('eventValue')), true);
    }
  });
}


function measureCssBlockTime() {
  let cssUnblockTime = measureDuration('css:unblock');
  if (cssUnblockTime) {
    // Tracks the amount of time the CSS blocks rendering.
    gaTest('send', 'event', 'CSS', 'unblock', {
      eventLabel: 'local',
      eventValue: cssUnblockTime,
      nonInteraction: true,
      [dimensions.METRIC_VALUE]: String(cssUnblockTime)
    });
    gaTest('send', 'timing', 'CSS', 'unblock', {
      timingLabel: 'local',
      timingValue: cssUnblockTime,
      [dimensions.METRIC_VALUE]: String(cssUnblockTime)
    });
  }
}


function measureJavaSciptLoadTime() {
  let jsExecuteTime = measureDuration('js:execute');
  if (jsExecuteTime) {
    // Tracks the amount of time the JavaScript takes to download and execute.
    gaTest('send', 'event', 'JavaScript', 'execute', {
      eventLabel: 'local',
      eventValue: jsExecuteTime,
      nonInteraction: true,
      [dimensions.METRIC_VALUE]: String(jsExecuteTime)
    });
    gaTest('send', 'timing', 'JavaScript', 'execute', {
      timingLabel: 'local',
      timingValue: jsExecuteTime,
      [dimensions.METRIC_VALUE]: String(jsExecuteTime)
    });
  }
}


function measureWebfontPerfAndFailures() {
  if (window.Promise) {
    new Promise(function(resolve, reject) {
      let loaded = /wf-(in)?active/.exec(document.documentElement.className);
      let success = loaded && !loaded[1]; // No "in" in the capture group.
      if (loaded) {
        success ? resolve() : reject();
      }
      else {
        let originalAciveCallback = WebFontConfig.active;
        WebFontConfig.inactive = reject;
        WebFontConfig.active = function() {
          originalAciveCallback();
          resolve();
        };
        // In case the webfont.js script failed to load.
        setTimeout(reject, WebFontConfig.timeout);
      }
    })
    .then(function() {
      let fontsActiveTime = measureDuration('fonts:active');
      if (fontsActiveTime) {
        // Tracks the amount of time the web fonts take to activate.
        gaTest('send', 'event', 'Fonts', 'active', {
          eventLabel: 'google',
          eventValue: fontsActiveTime,
          nonInteraction: true,
          [dimensions.METRIC_VALUE]: String(fontsActiveTime)
        });
        gaTest('send', 'timing', 'Fonts', 'active', {
          timingLabel: 'google',
          timingValue: fontsActiveTime,
          [dimensions.METRIC_VALUE]: String(fontsActiveTime)
        });
      }
    })
    .catch(function() {
      gaTest('send', 'event', 'Fonts', 'error', 'google');
    });
  }
}


function measureDuration(mark, reference = 'responseEnd') {
  if (window.__perf) {
    let name = `${reference}:${mark}`;
    performance.clearMeasures(name);
    performance.measure(name, reference, mark);
    let measure = performance.getEntriesByName(name)[0];
    return measure && Math.round(measure.duration);
  }
}


// Accepts a custom dimension or metric and returns it's numerical index.
function getDefinitionIndex(dimension) {
  return +dimension.slice(-1);
}


/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 * http://goo.gl/91pjZs
 * @param {Array} array The input array.
 * @return {Array} The randomized array.
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}
