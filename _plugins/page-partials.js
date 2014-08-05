var path = require('path');
var _ = require('lodash-node/modern');

module.exports = function() {

  var Page = this.Page;
  var Permalink = this.Permalink;
  var Template = this.Template;
  var pages = Page.all();

  function replaceDefaultLayoutWithBlank(template) {
    if (template.layout) {
      template.layout = template.layout.clone();

      if (path.basename(template.layout.filename) == 'default.html') {
        delete template.layout;
        return;
      }
      replaceDefaultLayoutWithBlank(template.layout);
    }
  }

  this.events.on('beforeRender', function() {

    pages.forEach(function(p) {

      var page = p.clone();

      // Keep a reference to the original permalink so templates can use it.
      var originalPermalink = page.permalink.toString();
      page.originalPermalink = originalPermalink;

      page.template = p.template.clone();
      replaceDefaultLayoutWithBlank(page.template);

      var resolvedPermalink = !path.extname(originalPermalink)
        ? originalPermalink + '_index.html'
        : path.dirname(originalPermalink) + '_' + path.basename(originalPermalink);

      page.permalink = new Permalink(resolvedPermalink);
    });

  });

};
