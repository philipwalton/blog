function addListener(event, fn) {
  if (window.addEventListener) {
    window.addEventListener(event, fn, false);
  }
  else if (window.attachEvent) {
    window.attachEvent('on' + event, fn);
  }
}
