/* global ga */

var parseUrl = require('./parse-url');
var linkClicked = require('./link-clicked');

function isExternalLink(link) {
  var url = parseUrl(link.href);
  var loc = parseUrl(location.href);
  return url.origin != loc.origin;
}

module.exports = {
  track: function() {
    linkClicked(function() {
      if (isExternalLink(this)) {

        // Opening links in an external tabs allows the ga beacon to send.
        // When following links directly, sometimes they don't make it.
        this.target = '_blank';

        ga('send', 'event', 'Outbound Link', 'click', this.href);
      }
    });

  }
};

