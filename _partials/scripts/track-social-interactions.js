(function() {

  // require linkClicked

  linkClicked(function(event) {
    var socialNetwork = this.getAttribute('data-social-network');
    if (socialNetwork) {
      var socialAction = this.getAttribute('data-social-action');
      var socialTarget = location.href;

      ga('send', 'social', socialNetwork, socialAction, socialTarget);
    }
  });

}());
