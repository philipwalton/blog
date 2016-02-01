
var closest = require('closest');


var drawerContainer = document.getElementById('drawer-container');
var drawerToggle = document.getElementById('drawer-toggle');
var isOpen = false;


function addClass(element, className) {
  var cls = element.className;
  if (!cls) {
    element.className = className;
    return;
  }
  else if (cls.indexOf(className) > -1) {
    return;
  }
  else {
    element.className = cls + ' ' + className;
  }
}


function removeClass(element, className) {
  var cls = element.className;
  if (cls.indexOf(className) < 0) return;

  var prevClasses = cls.split(/\s/);
  var newClasses = [];
  for (var i = 0, len = prevClasses.length; i < len; i++) {
    if (className != prevClasses[i]) newClasses.push(prevClasses[i]);
  }

  if (!newClasses.length) {
    element.removeAttribute('class');
  }
  else {
    element.className = newClasses.join(' ');
  }
}


function handleDrawerToggleClick(event) {
  isOpen ? close() : open();
}


function handleClickOutsideDrawerContainer(event) {
  // Closes an open menu if the user clicked outside of the nav element.
  if (isOpen && !closest(event.target, '#drawer-container', true)) close();
}


function open() {
  isOpen = true;
  addClass(document.documentElement, 'is-drawerOpen');
}


function close() {
  isOpen = false;
  removeClass(document.documentElement, 'is-drawerOpen');
}


module.exports = {
  init: function() {
    drawerToggle.addEventListener('click', handleDrawerToggleClick);
    drawerToggle.addEventListener('touchend', handleDrawerToggleClick);

    document.addEventListener('click', handleClickOutsideDrawerContainer);
    document.addEventListener('touchend', handleClickOutsideDrawerContainer);
  },
  open: open,
  close: close
}