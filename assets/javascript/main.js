// Requires individual autotrack plugins.
require('autotrack/lib/plugins/media-query-tracker');
require('autotrack/lib/plugins/outbound-link-tracker');
require('autotrack/lib/plugins/session-duration-tracker');
require('autotrack/lib/plugins/social-tracker');
require('autotrack/lib/plugins/url-change-tracker');


var contentLoader = require('./content-loader');
var supports = require('./supports');


// Add an `is-legacy` class on browsers that don't supports flexbox.
if (!supports.flexbox()) {
  document.documentElement.className += ' is-legacy';
}


// Load links via AJAX instead of full page loads in browsers with pushState.
contentLoader.init();
