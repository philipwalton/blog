var UglifyJS = require("uglify-js")
var Handlebars = require('ingen').Handlebars

Handlebars.registerHelper('uglify', function(options) {
  return UglifyJS.minify(options.fn(this), {fromString: true}).code
})
