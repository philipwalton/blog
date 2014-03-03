module.exports = function() {var events = require('ingen').events

  this.events.on('beforeRenderPage', function(page) {
    page.selectedTab = page.title == 'Home' || page.title == 'About'
      ? page.title
      : 'Articles'
  })

}
