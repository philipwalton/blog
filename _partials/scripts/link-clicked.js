var linkClicked = (function() {

  // require addListener

  function isLink(el) {
    return el.nodeName && el.nodeName.toLowerCase() == 'a' && el.href;
  }

  function getLinkAncestor(el) {
    if (isLink(el)) return el;
    while (el.parentNode && el.parentNode.nodeType == 1) {
      if (isLink(el)) return el;
      el = el.parentNode;
    }
  }

  return function(handler) {
    addListener(document, 'click', function(event) {
      var e = event || window.event;
      var target = e.target || e.srcElement;
      var link = getLinkAncestor(target);
      if (link) {
        handler.call(link, e);
      }
    });
  };

}());
