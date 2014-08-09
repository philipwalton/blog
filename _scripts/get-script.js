var script = 'script';
var fjs = document.getElementsByTagName(script)[0];

module.exports = function(url) {
  var js = document.createElement(script);
  js.src = url;
  fjs.parentNode.insertBefore(js, fjs);
};
