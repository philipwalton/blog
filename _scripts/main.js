/* global Typekit */

var supports = require('./supports');
var outboundLinks = require('./outbound-links');
var socialInteractions = require('./social-interactions');
var contentLoader = require('./content-loader');


// Add an `is-legacy` class on browsers that don't supports flexbox.
if (!supports.flexbox()) {
  document.documentElement.className += ' is-legacy';
}


// Load typekit immediately if the script is download, otherwise queue it.
// Note: Using IEs readyState isn't needed here because IE<10 doesn't
// support <script async>, thus it will load blockingly.
if (window.Typekit) {
  Typekit.load();
}
else {
  document.getElementById('typekit').onload = function() {
    Typekit.load();
  };
}


// Track when the user clicks a link to an external site.
outboundLinks.track();


// Track when the user clicks a social link.
socialInteractions.track();


// Load links via AJAX instead of full page loads in browsers with pushState.
contentLoader.init();
