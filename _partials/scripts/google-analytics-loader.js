{{#is site.env 'production'}}
  {{#if site.googleAnalyticsTrackingID}}
    getScript('//www.google-analytics.com/analytics.js');
  {{/if}}
{{/is}}
