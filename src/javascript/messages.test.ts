import {afterEach, describe, expect, it, vi} from 'vitest';
import * as messages from './messages.ts';

function addMessage() {
  const onAction = vi.fn();
  const onDismiss = vi.fn();
  messages.add({
    body: 'Update available',
    action: 'Reload',
    onAction,
    onDismiss,
  });
  return {
    message: document.querySelector<HTMLElement>('.Message')!,
    onAction,
    onDismiss,
  };
}

describe('messages', () => {
  afterEach(() => {
    for (const el of document.querySelectorAll('.Message')) {
      el.remove();
    }
  });

  it('shows a popover message with the body and action', () => {
    const {message} = addMessage();

    expect(message.querySelector('.Message-body')!.textContent).toBe(
      'Update available',
    );
    expect(message.querySelector('.Message-action')!.textContent!.trim()).toBe(
      'Reload',
    );
    expect(message.matches(':popover-open')).toBe(true);
  });

  it('invokes onAction when the action button is clicked', () => {
    const {message, onAction, onDismiss} = addMessage();

    message.querySelector<HTMLButtonElement>('.Message-action')!.click();

    expect(onAction).toHaveBeenCalledOnce();
    expect(onDismiss).not.toHaveBeenCalled();
    expect(message.matches(':popover-open')).toBe(false);
  });

  it('invokes onDismiss when the close button is clicked', () => {
    const {message, onDismiss} = addMessage();

    message.querySelector<HTMLButtonElement>('.Message-close')!.click();

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(message.matches(':popover-open')).toBe(false);
  });
});
