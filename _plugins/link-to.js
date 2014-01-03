var path = require('path')
var config = require('ingen').config
var Handlebars = require('ingen').Handlebars

Handlebars.registerHelper('linkTo', function(url) {
  var baseURL = config.env == "production"
    ? config.baseURL
    : 'http://localhost:' + config.port
  return baseURL + path.join('/', url.toString())
})
