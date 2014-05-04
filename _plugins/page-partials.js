var _ = require('lodash-node/modern')

module.exports = function() {

  return

  var Page = this.Page;
  var pages = Page.all();

  this.events.on('beforeRender', function() {

    pages.forEach(function(p) {

      var template = p.template.clone();
      var post = p.post

      // Remove the default layout from the template layout chain
      // so create a partial

      var page = new Page(post || template, p.config);
      page.permalink = page.permalink.clone().append('/_index.html');

    });

  });

};
