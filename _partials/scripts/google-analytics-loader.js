{{#is site.env 'production'}}
  {{#if site.googleAnalyticsTrackingID}}
    loadScriptAsync('//www.google-analytics.com/analytics.js');
  {{/if}}
{{/is}}
