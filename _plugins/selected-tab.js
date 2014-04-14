module.exports = function() {var events = require('ingen').events

  this.events.on('beforeRenderLayout', function(page) {
    page.selectedTab = page.title == 'Home' || page.title == 'About'
      ? page.title
      : 'Articles'
  })

}
