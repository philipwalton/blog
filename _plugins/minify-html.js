var path = require('path');
var minify = require('html-minifier').minify;

module.exports = function() {

  var events = this.events

  // http://perfectionkills.com/experimenting-with-html-minifier/#options
  var options = {
    removeIgnored: false,
    removeComments: true,
    removeCommentsFromCDATA: true,
    removeCDATASectionsFromCDATA: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
    removeRedundantAttributes: true,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    removeEmptyElements: false,
    removeOptionalTags: false,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true
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
