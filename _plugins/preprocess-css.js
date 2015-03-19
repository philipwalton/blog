// var autoprefixer = require('autoprefixer');
// var fs = require('fs-extra')
// var rework = require('rework');
// var inline = require('rework-plugin-inline');
// var suit = require('rework-suit');

var cssnext = require('cssnext');
var fs = require('fs-extra')


module.exports = function() {

  var events = this.events;

  function preprocess(source, dest) {
    var css = fs.readFileSync(source, 'utf-8')

    var opts = {
      browsers: '> 1%, last 2 versions, Safari > 5, ie > 9, Firefox ESR',
      compress: true,
      from: '_styles/style.css',
      map: {inline: false},
      to: 'style.css',
      url: {
        url: 'inline'
      }
    };

    var bundle = cssnext(css, opts);

    // Save to the _site folder.
    fs.outputFileSync(dest, bundle.css);
    fs.outputFileSync(dest + '.map', bundle.map);
  }

  events.on('afterBuild', function() {
    preprocess('_styles/style.css', '_site/assets/css/style.css')
  })

}
