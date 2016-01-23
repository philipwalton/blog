require('./analytics');

var contentLoader = require('./content-loader');
var supports = require('./supports');


// Add an `is-legacy` class on browsers that don't supports flexbox.
if (!supports.flexbox()) {
  document.documentElement.className += ' is-legacy';
}

// Load links via AJAX instead of full page loads in browsers with pushState.
contentLoader.init();
