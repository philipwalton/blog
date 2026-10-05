import {renderIcon} from './utils/renderIcon.ts';

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
  });

  const icon = Object.assign(document.createElement('div'), {
    className: 'Alert-icon',
    innerHTML: renderIcon('error-outline'),
  });

  const alertTitle = Object.assign(document.createElement('h1'), {
    className: 'Alert-title',
  });
  alertTitle.textContent = title;

  const message = Object.assign(document.createElement('div'), {
    className: 'Alert-message',
  });
  message.textContent = body;

  const alertBody = Object.assign(document.createElement('div'), {
    className: 'Alert-body',
  });
  alertBody.appendChild(alertTitle);
  alertBody.appendChild(message);

  const close = Object.assign(document.createElement('button'), {
    className: 'Alert-close',
    innerHTML: renderIcon('close'),
  });
  close.setAttribute('popovertarget', id);

  alert.appendChild(icon);
  alert.appendChild(alertBody);
  alert.appendChild(close);

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
