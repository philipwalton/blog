import {expect, it} from 'vitest';
import {page} from 'vitest/browser';
import {getActiveBreakpoint, init} from './breakpoints.ts';

// Breakpoints from src/javascript/breakpoints.ts, at 16px per em:
// sm = all, md = 36em (576px), lg = 48em (768px).
it('tracks the active breakpoint across viewport changes', async () => {
  await page.viewport(500, 700);
  init();
  expect(getActiveBreakpoint().name).toBe('sm');

  await page.viewport(600, 700);
  await expect.poll(() => getActiveBreakpoint().name).toBe('md');

  await page.viewport(800, 700);
  await expect.poll(() => getActiveBreakpoint().name).toBe('lg');

  await page.viewport(500, 700);
  await expect.poll(() => getActiveBreakpoint().name).toBe('sm');
});
