// var autoprefixer = require('autoprefixer');
// var fs = require('fs-extra')
// var rework = require('rework');
// var inline = require('rework-plugin-inline');
// var suit = require('rework-suit');

var cssnext = require('cssnext');
var fs = require('fs-extra')
var postcss = require('postcss');
var url = require("postcss-url")


module.exports = function() {

  var events = this.events;

  function preprocess(source, dest) {
    var css = fs.readFileSync(source, 'utf-8')

    var bundle = postcss()
        .use(cssnext({
          compress: true
        }))
        .use(url({
          url: 'inline'
        }))
        .process(css, {
          map: {inline: false},
          from: '_styles/style.css',
          to: 'style.css'
        });

    // Save to the _site folder.
    fs.outputFileSync(dest, bundle.css);
    fs.outputFileSync(dest + '.map', bundle.map);
  }

  events.on('afterBuild', function() {
    preprocess('_styles/style.css', '_site/assets/css/style.css')
  })

}
