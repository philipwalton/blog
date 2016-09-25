import closest from 'dom-utils/lib/closest';
import delegate from 'dom-utils/lib/delegate';

let alertContainer = null;
let alertShowing = false;


function remove() {
  if (!alertShowing) return;

  let alert = alertContainer.firstChild;
  alert.classList.remove('Alert--active');
  alertShowing = false;

  alert.addEventListener('transitionend', ({target}) => {
    target.parentElement.removeChild(target);
  });
}


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


function renderIcon(id) {
  return `<svg class="Icon" viewBox="0 0 24 24">
    <use xmlns:xlink="http://www.w3.org/1999/xlink"
         xlink:href="#icon-${id}"></use></svg>`;
}


export default {
  init: function() {
    alertContainer = document.createElement('div');
    alertContainer.className = 'AlertContainer';

    delegate(alertContainer, 'click', '.Alert-close', remove);
    document.body.addEventListener('click', (e) => {
      const insideAlertContainer = !!closest(e.target, '.AlertContainer');
      if (!insideAlertContainer) remove();
    });

    document.body.appendChild(alertContainer);
  },

  add: function({title, body}) {
    if (alertShowing) remove();

    let alert = createAlert({title, body});
    alertContainer.appendChild(alert);
    alertShowing = true;

    alert.offsetTop; // Force a paint.
    alert.classList.add('Alert--active');
  },
};
