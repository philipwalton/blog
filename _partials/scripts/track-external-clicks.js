{{#if site.googleAnalyticsTrackingID}}
  (function() {

    // require linkClicked

    function isExternalLink(el) {
      return el.href.indexOf(location.host) < 0;
    }

    linkClicked(function(event) {
      if (isExternalLink(this)) {
        // Opening links in an external tabs allows the ga beacon to send.
        // When following links directly, sometimes they don't make it.
        this.target = '_blank';
        ga('send', 'event', 'Outbound Link', 'click', this.href, {
          // `nonInteracdtion` prevents this event from affecting bounce rate.
          // https://developers.google.com/analytics/devguides/collection/analyticsjs/events
          'nonInteraction': 1
        });
      }
    });

  }());
{{/if}}
