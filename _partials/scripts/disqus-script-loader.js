{{#is site.env 'production'}}
  {{#is layout 'article'}}
    getScript('//{{site.disqusShortname}}.disqus.com/embed.js');
  {{/is}}
{{/is}}
