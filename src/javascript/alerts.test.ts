import {afterEach, describe, expect, it} from 'vitest';
import * as alerts from './alerts.ts';

describe('alerts', () => {
  afterEach(() => {
    for (const el of document.querySelectorAll('.Alert')) {
      el.remove();
    }
  });

  it('shows a popover alert with the title and body', () => {
    alerts.add({title: 'Error title', body: 'Error body'});

    const alert = document.querySelector<HTMLElement>('.Alert')!;
    expect(alert.querySelector('.Alert-title')!.textContent).toBe(
      'Error title',
    );
    expect(alert.querySelector('.Alert-message')!.textContent).toBe(
      'Error body',
    );
    expect(alert.matches(':popover-open')).toBe(true);
  });

  it('closes when the close button is clicked', () => {
    alerts.add({title: 'Title', body: 'Body'});

    const alert = document.querySelector<HTMLElement>('.Alert')!;
    alert.querySelector<HTMLButtonElement>('.Alert-close')!.click();

    expect(alert.matches(':popover-open')).toBe(false);
  });

  it('gives each alert a unique ID', () => {
    alerts.add({title: 'One', body: '1'});
    alerts.add({title: 'Two', body: '2'});

    const els = document.querySelectorAll('.Alert');
    expect(els).toHaveLength(2);
    expect(els[0]!.id).not.toBe(els[1]!.id);
  });

  it('renders title and body as literal text, never as HTML', () => {
    delete (window as unknown as {__pwned?: boolean}).__pwned;

    const maliciousTitle = '<b>Bold Title</b>';
    const maliciousBody = '<img src=x onerror="window.__pwned=true">';

    alerts.add({title: maliciousTitle, body: maliciousBody});

    const alert = document.querySelector<HTMLElement>('.Alert')!;
    const titleEl = alert.querySelector('.Alert-title')!;
    const messageEl = alert.querySelector('.Alert-message')!;

    // The strings must be shown verbatim as text, not parsed as markup.
    expect(titleEl.textContent).toBe(maliciousTitle);
    expect(messageEl.textContent).toBe(maliciousBody);

    // No elements should have been created from the interpolated strings.
    expect(titleEl.querySelector('b')).toBeNull();
    expect(messageEl.querySelector('img')).toBeNull();

    // The onerror handler must never have executed.
    expect((window as unknown as {__pwned?: boolean}).__pwned).toBeUndefined();
  });
});
