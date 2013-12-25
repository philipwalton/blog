var events = require('../../ingen/lib/events')

events.on('beforeRenderPage', function(page) {
  page.selectedTab = page.title == 'Home' || page.title == 'About'
    ? page.title
    : 'Articles'
})
