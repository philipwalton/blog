module.exports = function() {

  this.events.on('beforeRenderContent', function(post) {
    if (post.type == 'article') {
      post.twitterShareLink = 'http://twitter.com/intent/tweet?text='
          + encodeURIComponent(post.title)
          + '&url='
          + encodeURIComponent('http://philipwalton.com'
                + post.permalink.toString())
          + '&via=philwalton'
    }
  })

}
