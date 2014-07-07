var _ = require('lodash-node/modern')

module.exports = function() {

  var Handlebars = this.Handlebars
  var Query = this.Query
  var posts = this.posts.all();

  Handlebars.registerHelper('articleArchive', function(options) {

    var query = new Query({type:'article'}, posts);
    var articles = query.run()
    var archive = []
    var curYear

    _.each(articles, function(article, i) {
      if (curYear && curYear.year == article.data.date.substr(0,4)) {
        curYear.articles.push(article)
      }
      else {
        curYear = {
          year: article.data.date.substr(0,4),
          articles: [article]
        }
        archive.push(curYear)
      }
    })

    return _.map(archive, function(year) {
      return options.fn(year)
    }).join('')
  })

}
