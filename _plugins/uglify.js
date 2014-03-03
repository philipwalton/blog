var UglifyJS = require("uglify-js")

module.exports = function() {

  this.Handlebars.registerHelper('uglify', function(options) {
    return UglifyJS.minify(options.fn(this), {fromString: true}).code
  })

}
