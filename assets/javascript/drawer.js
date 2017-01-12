import {closest} from 'dom-utils';
import {getActiveBreakpoint} from './breakpoints';


const drawerToggle = /** @type {!Element} */ (
    document.getElementById('drawer-toggle'));

const drawer = /** @type {!Element} */ (
    document.getElementById('drawer'));

const header = /** @type {!Element} */ (
    document.getElementById('header'));


const TRANSITION_DURATION = 250;
let isOpen = false;


/**
 * Adds a class to an element.
 * @param {!Element} element The HTML element to add the class to.
 * @param {string} className The class name to add.
 */
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


/**
 * Removes a class from an element.
 * @param {!Element} element The HTML element to remove the class from.
 * @param {string} className The class name to remove.
 */
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


/**
 * A callback that handles clicks on the drawer menu icon.
 * @param {!Event} event The event associated with the click.
 */
function handleDrawerToggleClick(event) {
  event.preventDefault();
  isOpen ? close() : open();
}


/**
 * A callback that closes the drawer if the click originated from outside
 * the drawer element.
 * @param {!Event} event The event associated with the click.
 */
function handleClickOutsideDrawerContainer(event) {
  const target = /** @type {!Element} */ (event.target);
  // Closes an open drawer if the user clicked outside of the nav element.
  if (isOpen && drawerIsUsable() && !closest(target, '#header', true)) {
    close();
  }
}


/**
 * Returns whether or not the drawer menu icon is visible and thus actionable.
 * @return {boolean} True if the drawer menu icon is visible.
 */
function drawerIsUsable() {
  return getActiveBreakpoint().name != 'lg';
}


/**
 * Adds event handlers to the drawer menu button.
 */
export function init() {
  drawerToggle.addEventListener('click', handleDrawerToggleClick);
  drawerToggle.addEventListener('touchend', handleDrawerToggleClick);

  document.addEventListener('click', handleClickOutsideDrawerContainer);
  document.addEventListener('touchend', handleClickOutsideDrawerContainer);
}


/**
 * Opens a closed drawer.
 */
export function open() {
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


/**
 * Closes an open drawer.
 */
export function close() {
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
