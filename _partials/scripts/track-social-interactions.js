(function() {

  // require linkClicked

  linkClicked(function(event) {
    var socialNetwork = this.getAttribute('data-social-network');
    if (socialNetwork) {
      var socialAction = this.getAttribute('data-social-action');
      var socialTarget = this.getAttribute('data-social-target');

      // If the url is relative to the current host, expand it.
      if (socialTarget.charAt(0) == '/') {
        socialTarget = 'http://philipwalton.com' + socialTarget;
      }

      ga('send', 'social', socialNetwork, socialAction, socialTarget, {
        // `nonInteracdtion` prevents this event from affecting bounce rate.
        // https://developers.google.com/analytics/devguides/collection/analyticsjs/events
        'nonInteraction': 1
      });
    }
  });

}());
