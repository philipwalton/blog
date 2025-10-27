import {renderIcon} from './utils/renderIcon.js';

let messageId = 0;

export const add = ({body, action, onAction, onDismiss}) => {
  const id = `message-${++messageId}`;
  const message = Object.assign(document.createElement('div'), {
    className: 'Message',
    id: id,
    popover: 'auto',
    innerHTML: `
      <div class="Message-container">
        <div class="Message-body">${body}</div>
        <button class="Message-action" popovertarget=${id}>
          ${action}
        </button>
        <button class="Message-close" popovertarget=${id}>
          ${renderIcon('close')}
        </button>
      </div>
    `,
  });

  message.addEventListener('toggle', (event) => {
    if (event.newState === 'closed') {
      message.addEventListener('transitionend', message.remove);
      message.addEventListener('transitioncancel', message.remove);
    }
  });

  message.querySelector('.Message-action').addEventListener('click', onAction);
  message.querySelector('.Message-close').addEventListener('click', onDismiss);

  document.body.appendChild(message);
  message.showPopover();
};
