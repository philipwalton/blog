{{#is site.env 'production'}}
  {{#if page.type}}
    // Notice the Handlebars bit below: {{site.disqusShortname}}
    (function() {
      var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
      dsq.src = 'http://{{site.disqusShortname}}.disqus.com/embed.js';
      (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
    })();
  {{/if}}
{{/is}}
