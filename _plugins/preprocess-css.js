var fs = require('fs-extra')
var rework = require('rework')
var vars = require('rework-vars')
var imprt = require('rework-importer')
var shade = require('rework-shade')
var autoprefixer = require('autoprefixer')
var CleanCSS = require('clean-css')
var events = require('ingen').events

events.on('afterBuild', function() {

  var stylesheet = fs.readFileSync('_styles/style.css', 'utf-8')
  var css = rework(stylesheet)
    .use(imprt({path:'_styles'}))
    .use(vars())
    .use(rework.extend())
    .use(rework.inline('assets/images', 'assets/fonts'))
    .use(shade())
    .toString()

  // add prefixes
  css = autoprefixer('last 2 versions', '> 2%').process(css).css

  // minify
  var cleanCSS = new CleanCSS({
    keepSpecialComments: 0,
    processImport: false
  })
  // css = cleanCSS.minify(css)

  // save to the _site folder
  fs.outputFileSync('_site/assets/css/style.css', css)

})
