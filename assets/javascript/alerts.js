import {closest, delegate} from 'dom-utils';
import {transition} from './transition.js';

const ALERT_TRANSITION_TIME = 200;

let alertContainer = null;
let alertShowing = false;


/**
 * Removes all shown alerts.
 */
const remove = async () => {
  if (!alertShowing) return;

  alertShowing = false;

  const alert = alertContainer.firstChild;
  await transition(alert, ALERT_TRANSITION_TIME, {
    from: 'Alert--isActive',
    using: 'Alert--isTransitioning',
    useTransitions: true,
  });

  alertContainer.removeChild(alert);
};


/**
 * Creates an alert with the passed title and body.
 * @param {{title: (string), body: (string)}} arg1
 *     title: The alert title text.
 *     body: The alert body text.
 * @return {!Element} The alert DOM element.
 */
const createAlert = ({title, body}) => {
  const alert = document.createElement('div');
  alert.className = 'Alert';
  alert.innerHTML = `
    <div class="Alert-icon">${renderIcon('error-outline')}</div>
    <div class="Alert-body">
      <h1 class="Alert-title">${title}</h1>
      <div class="Alert-message">${body}</div>
    </div>
    <button class="Alert-close">${renderIcon('close')}</button>`;
  return alert;
};


/**
 * Returns the markup to generate an SVG icon.
 * @param {string} id The icon id from the main icons file.
 * @return {string} The icon markup.
 */
const renderIcon = (id) => {
  return `<svg class="Icon" viewBox="0 0 24 24">
    <use xmlns:xlink="http://www.w3.org/1999/xlink"
         xlink:href="#icon-${id}"></use></svg>`;
};


/**
 * Initializes the alert DOM containers and event handlers to remove
 * added alerts.
 */
const init = () => {
  alertContainer = document.createElement('div');
  alertContainer.className = 'AlertContainer';

  delegate(alertContainer, 'click', '.Alert-close', remove);
  document.body.addEventListener('click', (e) => {
    const insideAlertContainer = !!closest(
        /** @type {!Element} */ (e.target), '.AlertContainer');
    if (!insideAlertContainer) remove();
  });

  document.body.appendChild(alertContainer);
};

/**
 * Adds an alert with the passed title and body.
 * @param {{title: (string), body: (string)}} arg1
 *     title: The alert title text.
 *     body: The alert body text.
 */
export const add = async ({title, body}) => {
  if (!alertContainer) init();
  if (alertShowing) remove();

  const alert = createAlert({title, body});
  alertContainer.appendChild(alert);
  alertShowing = true;

  await transition(alert, ALERT_TRANSITION_TIME, {
    to: 'Alert--isActive',
    using: 'Alert--isTransitioning',
    useTransitions: true,
  });
};
