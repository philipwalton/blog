import {closest, delegate} from 'dom-utils';


let alertContainer = null;
let alertShowing = false;


/**
 * Removes all shown alerts.
 */
function remove() {
  if (!alertShowing) return;

  const alert = alertContainer.firstChild;
  alert.classList.remove('Alert--active');
  alertShowing = false;

  alert.addEventListener('transitionend', ({target}) => {
    target.parentElement.removeChild(target);
  });
}


/**
 * Creates an alert with the passed title and body.
 * @param {{title: (string), body: (string)}} arg1
 *     title: The alert title text.
 *     body: The alert body text.
 * @return {!Element} The alert DOM element.
 */
function createAlert({title, body}) {
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
}


/**
 * Returns the markup to generate an SVG icon.
 * @param {string} id The icon id from the main icons file.
 * @return {string} The icon markup.
 */
function renderIcon(id) {
  return `<svg class="Icon" viewBox="0 0 24 24">
    <use xmlns:xlink="http://www.w3.org/1999/xlink"
         xlink:href="#icon-${id}"></use></svg>`;
}


/**
 * Initializes the alert DOM containers and event handlers to remove
 * added alerts.
 */
export function init() {
  alertContainer = document.createElement('div');
  alertContainer.className = 'AlertContainer';

  delegate(alertContainer, 'click', '.Alert-close', remove);
  document.body.addEventListener('click', (e) => {
    const insideAlertContainer = !!closest(
        /** @type {!Element} */ (e.target),
        '.AlertContainer');
    if (!insideAlertContainer) remove();
  });

  document.body.appendChild(alertContainer);
}

/**
 * Adds an alert with the passed title and body.
 * @param {{title: (string), body: (string)}} arg1
 *     title: The alert title text.
 *     body: The alert body text.
 */
export function add({title, body}) {
  if (alertShowing) remove();

  const alert = createAlert({title, body});
  alertContainer.appendChild(alert);
  alertShowing = true;

  // Use a timeout so the CSS transition is triggered.
  setTimeout(() => alert.classList.add('Alert--active'), 0);
}
