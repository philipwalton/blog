var events = require('../../ingen/lib/events')

// Allow for highlighting portions of code blocks
// using `**` before and after
events.on('afterRenderContent', function(page) {
  if (page.extension == '.md') {
    page.content = page.content.replace(/\*\*(.+)?\*\*/g, '<em>$1</em>')
  }
})
