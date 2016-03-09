// Loads autotrack plugins.
require('./analytics');

// Loads link via AJAX instead of full page loads in browsers with pushState.
require('./content-loader').init();

// Turns on the collapsable drawer.
require('./drawer').init();
