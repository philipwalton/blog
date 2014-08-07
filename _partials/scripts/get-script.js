var getScript = (function() {
  var fjs = document.getElementsByTagName('script')[0];
  return function(url) {
    var js = document.createElement('script');
    js.src = url;
    fjs.parentNode.insertBefore(js, fjs);
  }
}());
