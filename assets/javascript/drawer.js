import {closest} from 'dom-utils';
import {getActiveBreakpoint} from './breakpoints';
import {transition} from './transition.js';


const drawerToggle = /** @type {!Element} */ (
    document.getElementById('drawer-toggle'));

const drawer = /** @type {!Element} */ (
    document.getElementById('drawer'));

const header = /** @type {!Element} */ (
    document.getElementById('header'));


const TRANSITION_DURATION = 250;
let isOpen = false;


/**
 * A callback that handles clicks on the drawer menu icon.
 * @param {!Event} event The event associated with the click.
 */
const handleDrawerToggleClick = (event) => {
  event.preventDefault();
  isOpen ? close() : open();
};


/**
 * A callback that closes the drawer if the click originated from outside
 * the drawer element.
 * @param {!Event} event The event associated with the click.
 */
const handleClickOutsideDrawerContainer = (event) => {
  const target = /** @type {!Element} */ (event.target);
  // Closes an open drawer if the user clicked outside of the nav element.
  if (isOpen && drawerIsUsable() && !closest(target, '#header', true)) {
    close();
  }
};


/**
 * Returns whether or not the drawer menu icon is visible and thus actionable.
 * @return {boolean} True if the drawer menu icon is visible.
 */
const drawerIsUsable = () => {
  return getActiveBreakpoint().name != 'lg';
};


/**
 * Adds event handlers to the drawer menu button.
 */
export const init = () => {
  drawerToggle.addEventListener('click', handleDrawerToggleClick);
  drawerToggle.addEventListener('touchend', handleDrawerToggleClick);

  document.addEventListener('click', handleClickOutsideDrawerContainer);
  document.addEventListener('touchend', handleClickOutsideDrawerContainer);
};


/**
 * Opens a closed drawer.
 */
export const open = async () => {
  if (drawerIsUsable()) {
    isOpen = true;

    await Promise.all([
      transition(drawer, TRANSITION_DURATION, {
        to: 'Drawer--isOpen',
        using: 'Drawer--isTransitioning',
        useTransitions: true,
      }),
      transition(header, TRANSITION_DURATION, {
        to: 'Header--isDrawerOpen',
        using: 'Header--isTransitioning',
        useTransitions: true,
      }),
    ]);
  }
};


/**
 * Closes an open drawer.
 */
export const close = async () => {
  if (drawerIsUsable()) {
    isOpen = false;

    await Promise.all([
      transition(drawer, TRANSITION_DURATION, {
        from: 'Drawer--isOpen',
        using: 'Drawer--isTransitioning',
        useTransitions: true,
      }),
      transition(header, TRANSITION_DURATION, {
        from: 'Header--isDrawerOpen',
        using: 'Header--isTransitioning',
        useTransitions: true,
      }),
    ]);
  }
};
