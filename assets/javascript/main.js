require('./analytics');

var contentLoader = require('./content-loader');
var supports = require('./supports');
var drawer = require('./drawer');


// Adds an `is-legacy` class on browsers that don't supports flexbox.
if (!supports.flexbox()) {
  document.documentElement.className += ' is-legacy';
}

// Loads link via AJAX instead of full page loads in browsers with pushState.
contentLoader.init();

// Turns on the collapsable drawer.
drawer.init();
