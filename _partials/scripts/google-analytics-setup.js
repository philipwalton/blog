{{#if site.googleAnalyticsTrackingID}}
  ga = function() {
    ga.q.push(arguments);
  };
  ga.q = [
    ['create', '{{site.googleAnalyticsTrackingID}}', 'auto'],
    ['send', 'pageview']
  ];
  ga.l = 1 * new Date();
{{/if}}
