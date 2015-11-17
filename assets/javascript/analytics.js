/* global ga */

var linkClicked = require('./link-clicked');
var parseUrl = require('./parse-url');


function trackOutboundLinks() {
  linkClicked(function() {
    // Ignore outbound links on social buttons.
    if (this.getAttribute('data-social-network')) return;

    if (isLinkOutbound(this)) {
      // Opening links in an external tabs allows the ga beacon to send.
      // When following links directly, sometimes they don't make it.
      this.target = '_blank';

      ga('send', 'event', 'Outbound Link', 'click', this.href);
    }
  });
}


function trackSocialInteractions() {
  linkClicked(function() {
    var socialNetwork = this.getAttribute('data-social-network');
    if (socialNetwork) {
      var socialAction = this.getAttribute('data-social-action');
      var socialTarget = location.href;

      // Opening links in an external tab allows the ga beacon to send.
      // When following links directly, sometimes they don't make it.
      this.target = '_blank';

      ga('send', 'social', socialNetwork, socialAction, socialTarget);
    }
  });
}


function isLinkOutbound(link) {
  var url = parseUrl(link.href);
  var loc = parseUrl(location.href);
  return url.origin != loc.origin;
}


module.exports = {
  track: function() {
    trackOutboundLinks();
    trackSocialInteractions();
  }
};
