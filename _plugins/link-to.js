var path = require('path')

module.exports = function() {

  var Handlebars = this.Handlebars
  var config = this.config

  Handlebars.registerHelper('linkTo', function(url) {
    var baseURL = config.env == "production"
      ? config.baseURL
      : 'http://localhost:' + config.port
    return baseURL + path.join('/', url.toString())
  })

}
