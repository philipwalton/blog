var fs = require('fs-extra')
var events = require('ingen').events
var UglifyJS = require("uglify-js")

events.on('afterBuild', function(page) {
  var js = UglifyJS.minify('_scripts/track-external-clicks.js').code
  fs.outputFileSync('_site/assets/javascript/track-external-clicks.js', js)
})
