var site = require('../../ingen')

site.Handlebars.registerHelper('ifCurrentPage', function(url, options) {
  return url == this.page.permalink.toString()
    ? options.fn(this)
    : options.inverse(this)
})
