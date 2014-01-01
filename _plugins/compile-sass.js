var shell = require('shelljs')
var events = require('ingen').events

events.on('afterBuild', function() {
  // shell.exec('compass compile')
})
