var _ = require('lodash-node/modern')

var site = require('../../ingen')
var Query = require('../../ingen/lib/query')

site.Handlebars.registerHelper('articleArchive', function(options) {
  var query = new Query({type:'article'})
  var articles = query.run()
  var archive = []
  var curYear

  _.each(articles, function(article, i) {
    if (curYear && curYear.year == article.date.substr(0,4)) {
      curYear.articles.push(article)
    }
    else {
      curYear = {
        year: article.date.substr(0,4),
        articles: [article]
      }
      archive.push(curYear)
    }
  })

  return _.map(archive, function(year) {
    return options.fn(year)
  }).join('')
})
