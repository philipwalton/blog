(function(win, doc, tag, fn, scriptEl, firstScriptEl) {

  // this only needs to be done once, no matter how many scripts are loaded
  firstScriptEl = doc.getElementsByTagName(tag)[0];

  win[fn] = function(url) {

    scriptEl = doc.createElement(tag);
    scriptEl.async = 1;
    scriptEl.src = url;

    // Insert this script before the first script to prevent blocking
    firstScriptEl.parentNode.insertBefore(scriptEl, firstScriptEl);
  }

}(window, document, "script", "loadScriptAsync"));
