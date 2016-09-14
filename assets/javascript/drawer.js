import closest from 'dom-utils/lib/closest';


var drawerToggle = document.getElementById('drawer-toggle');
var drawer = document.getElementById('drawer');
var header = document.getElementById('header');

var isOpen = false;

const TRANSITION_END = (function getTransitionEndEvent() {
  const transitionStylePropToEventNameMap = {
    transition: 'transitionend',
    WebkitTransition: 'webkitTransitionEnd',
    MozTransition: 'transitionend',
    OTransition: 'oTransitionEnd',
  }
  const html = document.documentElement;
  for (let prop in transitionStylePropToEventNameMap) {
    if (html.style[prop] !== undefined) {
      return transitionStylePropToEventNameMap[prop];
    }
  }
  return 'transitionend'; // Fallback to the standard event.
}());


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
  event.preventDefault();
  isOpen ? close() : open();
}


function handleClickOutsideDrawerContainer(event) {
  // Closes an open menu if the user clicked outside of the nav element.
  if (isOpen && !closest(event.target, '#header', true)) close();
}


function open() {
  isOpen = true;

  drawer.addEventListener(TRANSITION_END, function fn() {
    removeClass(drawer, 'Drawer--opening');
    removeClass(drawer, 'Drawer--closed');
    addClass(drawer, 'Drawer--open');

    drawer.removeEventListener(TRANSITION_END, fn);
  });

  addClass(drawer, 'Drawer--opening');
  addClass(header, 'Header--drawerOpen');
}


function close() {
  isOpen = false;

  drawer.addEventListener(TRANSITION_END, function fn() {
    removeClass(drawer, 'Drawer--closing');
    removeClass(drawer, 'Drawer--open');
    addClass(drawer, 'Drawer--closed');

    drawer.removeEventListener(TRANSITION_END, fn);
  });


  addClass(drawer, 'Drawer--closing');
  removeClass(header, 'Header--drawerOpen');
}


export default {
  init: function() {
    drawerToggle.addEventListener('click', handleDrawerToggleClick);
    drawerToggle.addEventListener('touchend', handleDrawerToggleClick);

    document.addEventListener('click', handleClickOutsideDrawerContainer);
    document.addEventListener('touchend', handleClickOutsideDrawerContainer);
  },
  open: open,
  close: close
};
