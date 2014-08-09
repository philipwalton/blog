/* global ga */

var linkClicked = require('./link-clicked');

module.exports = {
  track: function() {
    linkClicked(function() {
      var socialNetwork = this.getAttribute('data-social-network');
      if (socialNetwork) {
        var socialAction = this.getAttribute('data-social-action');
        var socialTarget = location.href;

        // Opening links in an external tabs allows the ga beacon to send.
        // When following links directly, sometimes they don't make it.
        this.target = '_blank';

        ga('send', 'social', socialNetwork, socialAction, socialTarget);
      }
    });
  }
};
