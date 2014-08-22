var supports = require('./supports');
var typekit = require('./typekit');
var outboundLinks = require('./outbound-links');
var socialInteractions = require('./social-interactions');
var contentLoader = require('./content-loader');


// Add an `is-legacy` class on browsers that don't supports flexbox.
if (!supports.flexbox()) {
  document.documentElement.className += ' is-legacy';
}


// Load the typekit fonts and trasition in, timeout if taking too long.
typekit.init();


// Track when the user clicks a link to an external site.
outboundLinks.track();


// Track when the user clicks a social link.
socialInteractions.track();


// Load links via AJAX instead of full page loads in browsers with pushState.
contentLoader.init();
