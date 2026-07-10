import {describe, expect, it} from 'vitest';
import {renderIcon} from './renderIcon.ts';

describe('renderIcon', () => {
  it('returns SVG markup referencing the icon by ID', () => {
    const markup = renderIcon('close');
    expect(markup).toContain('<svg class="Icon"');
    expect(markup).toContain('xlink:href="#icon-close"');
  });
});
