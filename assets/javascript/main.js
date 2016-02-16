require('./analytics');

var contentLoader = require('./content-loader');
var drawer = require('./drawer');

// Loads link via AJAX instead of full page loads in browsers with pushState.
contentLoader.init();

// Turns on the collapsable drawer.
drawer.init();
