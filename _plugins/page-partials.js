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
      var resolvedPermalink = page.permalink.toString();

      page.template = p.template.clone();
      replaceDefaultLayoutWithBlank(page.template);

      resolvedPermalink = !path.extname(resolvedPermalink)
        ? resolvedPermalink + '_index.html'
        : path.dirname(resolvedPermalink) + '_' + path.basename(resolvedPermalink);

      page.permalink = new Permalink(resolvedPermalink);
    });

  });

};
