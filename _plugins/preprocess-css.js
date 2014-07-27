var autoprefixer = require('autoprefixer');
var fs = require('fs-extra')
var rework = require('rework');
var inline = require('rework-plugin-inline');
var suit = require('rework-suit');

module.exports = function() {

  var events = this.events;

  function preprocess(source, dest) {
    var css = fs.readFileSync(source, 'utf-8')

    // Proproccess.
    css = rework(css, {source: '_styles/style.css'})
        .use(suit())
        .use(inline('assets/images'))
        .toString({compress: true});

    // Prefix.
    css = autoprefixer('last 2 versions', '> 2%').process(css).css

    // Save to the _site folder.
    fs.outputFileSync(dest, css);
  }

  events.on('afterBuild', function() {
    preprocess('_styles/style.css', '_site/assets/css/style.css')
  })

}
