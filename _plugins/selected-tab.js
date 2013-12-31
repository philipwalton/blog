var events = require('ingen').events

events.on('beforeRenderPage', function(page) {
  page.selectedTab = page.title == 'Home' || page.title == 'About'
    ? page.title
    : 'Articles'
})
