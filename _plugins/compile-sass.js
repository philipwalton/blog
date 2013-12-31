var events = require('../../ingen/lib/events')
var shell = require('shelljs')

events.on('afterBuild', function() {
  shell.exec('compass compile')
})
