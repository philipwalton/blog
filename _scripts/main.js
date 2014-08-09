var supports = require('./supports');
var addListener = require('./add-listener.js');
var getScript = require('./get-script');
var outboundLinks = require('./outbound-links');
var socialInteractions = require('./social-interactions');
var contentLoader = require('./content-loader');

// Add an `is-legacy` class on browsers that don't supports flexbox.
if (!supports.flexbox()) {
  document.body.className += ' is-legacy';
}

// Track when the user clicks a link to an external site.
outboundLinks.track();

// Track when the user clicks a social link.
socialInteractions.track();

// Load links via AJAX instead of full page loads in browsers with pushState.
contentLoader.init();

// Wait to load Google Analytics until after the `load` event.
addListener(window, 'load', function() {
  getScript('//www.google-analytics.com/analytics.js');
});

