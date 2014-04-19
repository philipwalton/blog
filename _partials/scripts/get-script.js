var firstScriptEl = document.getElementsByTagName('script')[0];

function getScript(url) {
  var scriptEl = document.createElement('script');
  scriptEl.src = url;
  // Insert this script before the first script to prevent blocking
  firstScriptEl.parentNode.insertBefore(scriptEl, firstScriptEl);
}
