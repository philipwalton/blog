{{#is site.env 'production'}}

  // track clicks on outbound hyperlinks
  window._gaq && (function() {

    var links = document.getElementsByTagName("a")
    var link
    var i = 0

    function isLink(el) {
      return el.nodeName.toLowerCase() == "a" && el.href
    }

    function isExternalLink(el) {
      return el.href.indexOf(location.host) < 0
    }

    function getLinkAncestor(el) {
      if (isLink(el)) return el
      while (el.parentNode && el.parentNode.nodeType == 1) {
        if (isLink(el)) return el
        el = el.parentNode
      }
    }

    function logExternalClicks(event) {
      var e = event || window.event
      var target = e.target || e.srcElement
      var link = getLinkAncestor(target)
      if (link && isExternalLink(link)) {
        ga('send', 'event', 'Outbound Link', link.href);
      }
    }

    // add target="_blank" to external links
    while(link = links[i++]) {
      if (link.target != "_blank" && isExternalLink(link)) {
        link.target = "_blank"
      }
    }

    // register logging on click events
    if (document.addEventListener) {
      document.addEventListener("click", logExternalClicks)
    }
    else if (document.attachEvent) {
      document.attachEvent("onclick", logExternalClicks)
    }

  }())

{{/is}}
