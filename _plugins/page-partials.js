var path = require('path');
var _ = require('lodash-node/modern');

module.exports = function() {

  var Page = this.Page;
  var pages = Page.all();

  var Template = this.Template;

  function replaceDefaultLayoutWithBlank(template) {
    if (template.layout) {
      template.layout = template.layout.clone();
      template.layout.uuid = Math.random();

      if (path.basename(template.layout.filename, '.html') == 'default') {
        delete template.layout;
        return;
      }
      replaceDefaultLayoutWithBlank(template.layout);
    }
  }

  this.events.on('beforeRender', function() {

    pages.forEach(function(p) {

      var template = p.template.clone();
      replaceDefaultLayoutWithBlank(template);

      // Remove the default layout from the template layout chain
      // so create a partial

      var page = new Page(template, p.config);
      var filename = page.permalink.toString();
      filename = !path.extname(filename)
        ? filename + '_index.html'
        : path.dirname(filename) + '_' + path.basename(filename);

      page.permalink = filename;

    });

  });

};
