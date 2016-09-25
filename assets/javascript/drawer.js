import closest from 'dom-utils/lib/closest';
import {getActiveBreakpoint} from './breakpoints';


const TRANSITION_DURATION = 250;
const drawerToggle = document.getElementById('drawer-toggle');
const drawer = document.getElementById('drawer');
const header = document.getElementById('header');


let isOpen = false;


function addClass(element, className) {
  const cls = element.className;
  if (!cls) {
    element.className = className;
    return;
  } else if (cls.indexOf(className) > -1) {
    return;
  } else {
    element.className = cls + ' ' + className;
  }
}


function removeClass(element, className) {
  const cls = element.className;
  if (cls.indexOf(className) < 0) return;

  const prevClasses = cls.split(/\s/);
  const newClasses = [];
  for (let i = 0, len = prevClasses.length; i < len; i++) {
    if (className != prevClasses[i]) newClasses.push(prevClasses[i]);
  }

  if (!newClasses.length) {
    element.removeAttribute('class');
  } else {
    element.className = newClasses.join(' ');
  }
}


function handleDrawerToggleClick(event) {
  event.preventDefault();
  isOpen ? close() : open();
}


function handleClickOutsideDrawerContainer(event) {
  // Closes an open drawer if the user clicked outside of the nav element.
  if (isOpen && drawerIsUsable() && !closest(event.target, '#header', true)) {
    close();
  }
}


function open() {
  if (drawerIsUsable()) {
    isOpen = true;
    setTimeout(function fn() {
      removeClass(drawer, 'Drawer--opening');
      removeClass(drawer, 'Drawer--closed');
      addClass(drawer, 'Drawer--open');
    }, TRANSITION_DURATION);

    addClass(drawer, 'Drawer--opening');
    addClass(header, 'Header--drawerOpen');
  }
}


function close() {
  if (drawerIsUsable()) {
    isOpen = false;
    setTimeout(function fn() {
      removeClass(drawer, 'Drawer--closing');
      removeClass(drawer, 'Drawer--open');
      addClass(drawer, 'Drawer--closed');
    }, TRANSITION_DURATION);

    addClass(drawer, 'Drawer--closing');
    removeClass(header, 'Header--drawerOpen');
  }
}


function drawerIsUsable() {
  return getActiveBreakpoint().name != 'lg';
}


export default {
  init: function() {
    drawerToggle.addEventListener('click', handleDrawerToggleClick);
    drawerToggle.addEventListener('touchend', handleDrawerToggleClick);

    document.addEventListener('click', handleClickOutsideDrawerContainer);
    document.addEventListener('touchend', handleClickOutsideDrawerContainer);
  },
  open: open,
  close: close,
};
