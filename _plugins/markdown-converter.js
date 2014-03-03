var marked = require('marked')
var hljs = require("highlight.js")
var he = require('he')

module.exports = function() {

  var events = this.events
  var r = new marked.Renderer()

  r.code = function(code, lang) {

    var cls = lang && lang != 'text' ? ' class="' + lang + '"' : ''

    if (lang == null) {
      code = hljs.highlightAuto(code).value
    }
    // if lang is "text" then don't highlight
    else if (lang != 'text') {
      code = hljs.highlight(lang, code).value
    }
    else {
      // since we're not using highlight.js here, we need to espace the html
      // unescape first in order to avoid double escaping
      code = he.escape(he.unescape(code))
    }

    // Allow for highlighting portions of code blocks
    // using `**` before and after
    code = code.replace(/\*\*(.+)?\*\*/g, '<em>$1</em>')

    return '<pre class="highlight"><code' + cls + '>' + code + '</code></pre>'
  }

  events.on('afterRenderContent', function(page) {
    if (page.extension == '.md') {
      // TODO: changing the extention should be automatically done
      // by the Permalink object.
      page.permalink = page.permalink.replace(/\.md$/, '.html')
      page.content = marked(page.content, {renderer: r})
    }
  })

}
