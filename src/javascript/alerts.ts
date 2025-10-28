import {renderIcon} from './utils/renderIcon.js';

let alertId = 0;

interface AlertOptions {
  title: string;
  body: string;
}

export const add = ({title, body}: AlertOptions) => {
  const id = `alert-${++alertId}`;
  const alert = Object.assign(document.createElement('div'), {
    className: 'Alert',
    id: id,
    popover: 'auto',
    innerHTML: `
      <div class="Alert-icon">
        ${renderIcon('error-outline')}
      </div>
      <div class="Alert-body">
        <h1 class="Alert-title">${title}</h1>
        <div class="Alert-message">${body}</div>
      </div>
      <button class="Alert-close" popovertarget=${id}>
        ${renderIcon('close')}
      </button>
    `,
  });

  alert.addEventListener('toggle', (event: ToggleEvent) => {
    const toggleEvent = event;
    if (toggleEvent.newState === 'closed') {
      alert.addEventListener('transitionend', alert.remove);
      alert.addEventListener('transitioncancel', alert.remove);
    }
  });

  document.body.appendChild(alert);
  alert.showPopover();
};
