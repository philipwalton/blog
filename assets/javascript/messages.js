import {closest, delegate} from 'dom-utils';
import {transition} from './transition.js';

const MESSAGE_TRANSITION_TIME = 200;

const messages = new Map();
let messageContainer = null;


/**
 * Runs a message's action callback
 * @param {!Event} evt
 * @param {!Element} delegateTarget
 */
const action = async (evt, delegateTarget) => {
  const message = closest(delegateTarget, '.Message');
  const {onAction} = messages.get(message);

  messages.delete(message);

  await onAction();
  message.parentNode.removeChild(message);
};

/**
 * Removes a message
 * @param {!Event} evt
 * @param {!Element} delegateTarget
 */
const remove = async (evt, delegateTarget) => {
  const message = closest(delegateTarget, '.Message');
  const {onDismiss} = messages.get(message);

  messages.delete(message);
  onDismiss();

  await transition(message, MESSAGE_TRANSITION_TIME, {
    from: 'Message--isActive',
    using: 'Message--isTransitioning',
    useTransitions: true,
  });
  message.parentNode.removeChild(message);
};


/**
 * Creates an message with the passed title and body.
 * @param {{title: (string), body: (string)}} arg1
 *     title: The message title text.
 *     body: The message body text.
 * @return {!Element} The message DOM element.
 */
const createMessage = ({body, action}) => {
  const message = document.createElement('div');
  message.className = 'Message';
  message.innerHTML = `
    <div class="Message-body">${body}</div>
    <button class="Message-action">${action}</button>
    <button class="Message-close">${renderIcon('close')}</button>`;
  return message;
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
 * Initializes the message DOM containers and event handlers to remove
 * added messages.
 */
export const init = () => {
  messageContainer = document.createElement('div');
  messageContainer.className = 'MessageContainer';

  delegate(messageContainer, 'click', '.Message-action', action);
  delegate(messageContainer, 'click', '.Message-close', remove);

  document.body.appendChild(messageContainer);
};

/**
 * Adds an message with the passed body and action.
 *
 * TODO: add a category option, which would allow us to avoid adding multiple
 * messages for the same category of things, but still allow us to show message
 * for different categories of things.
 *
 * @param {{body: (string), action: (string)}} arg1
 *     body: The message body text.
 *     action: The message action text.
 */
export const add = async ({body, action, onAction, onDismiss}) => {
  const message = createMessage({body, action});

  // Map the DOM element to the passed onAction.
  messages.set(message, {onAction, onDismiss});

  // Add the message to the DOM and transition it in.
  messageContainer.appendChild(message);

  await transition(message, MESSAGE_TRANSITION_TIME, {
    to: 'Message--isActive',
    using: 'Message--isTransitioning',
    useTransitions: true,
  });
};


export const isShowing = () => {
  return messages.size > 0;
};
