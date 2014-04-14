{{#is site.env 'production'}}
  {{#if type}}
    // Notice the Handlebars bit below: {{site.disqusShortname}}
    loadScriptAsync('//{{site.disqusShortname}}.disqus.com/embed.js');
  {{/if}}
{{/is}}
