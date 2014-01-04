{{#is site.env 'production'}}
  {{#if site.googleAnalyticsTrackingID}}
    var _gaq = _gaq || [];
    _gaq.push(['_setAccount', '{{ site.googleAnalyticsTrackingID }}']);
    _gaq.push(['_trackPageview']);
  {{/if}}
{{/is}}
