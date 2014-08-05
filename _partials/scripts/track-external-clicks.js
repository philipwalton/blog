{{#if site.googleAnalyticsTrackingID}}
  (function() {

    // require linkClicked

    function isExternalLink(el) {
      // Compare `hostname` instead of `host` because of an IE8 bug that would
      // report philipwalton:80 even though the URL didn't show a port.
      return el.hostname != location.hostname;
    }

    linkClicked(function(event) {
      if (isExternalLink(this)) {
        // Opening links in an external tabs allows the ga beacon to send.
        // When following links directly, sometimes they don't make it.
        this.target = '_blank';
        ga('send', 'event', 'Outbound Link', 'click', this.href);
      }
    });

  }());
{{/if}}
