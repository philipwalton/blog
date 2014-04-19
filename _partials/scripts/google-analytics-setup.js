{{#is site.env 'production'}}
  {{#if site.googleAnalyticsTrackingID}}

    // Initialize the global `ga` function and its properties.
    ga = function() {
      ga.q.push(arguments);
    };
    ga.q = [];
    ga.l = 1 * new Date();

    // Create your tracker as usual.
    ga('create', '{{site.googleAnalyticsTrackingID}}', 'auto');
    ga('send', 'pageview');

  {{/if}}
{{/is}}
