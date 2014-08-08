var path = require('path');
var minify = require('html-minifier').minify;

module.exports = function() {

  // Don't minify in dev/test environments.
  if (this.config.env != 'production') return;

  var events = this.events

  // https://github.com/kangax/html-minifier
  var options = {
    removeComments: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
    removeRedundantAttributes: true,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    minifyJS: true,
    minifyCSS: true
  }

  events.on('beforeWrite', function(page) {

    // TODO: consider making `extension` a method on permalink
    var extension = page.template.filename
      ? path.extname(page.template.filename)
      : '.html';

    if (extension != '.xml') {
      page.content = minify(page.content, options);
    }
  });

};
