import {describe, expect, it} from 'vitest';
import remarkExcerpt from './remarkExcerpt.ts';

import type {Root} from 'mdast';
import type {VFile} from 'vfile';

const text = (value: string) => ({type: 'text', value});
const emphasis = (...children: unknown[]) => ({type: 'emphasis', children});
const paragraph = (...children: unknown[]) => ({type: 'paragraph', children});
const root = (...children: unknown[]) =>
  ({type: 'root', children}) as unknown as Root;

const vfile = (frontmatter?: Record<string, unknown>) =>
  ({data: {astro: {frontmatter}}}) as unknown as VFile;

describe('remarkExcerpt', () => {
  it('uses the first paragraph when long enough', () => {
    const long = 'a'.repeat(200);
    const frontmatter: Record<string, unknown> = {};

    remarkExcerpt()(
      root(paragraph(text(long)), paragraph(text('second'))),
      vfile(frontmatter),
    );

    expect(frontmatter.excerpt).toBe(long);
  });

  it('collects paragraphs until reaching the minimum length', () => {
    const p1 = 'b'.repeat(100);
    const p2 = 'c'.repeat(100);
    const p3 = 'd'.repeat(100);
    const frontmatter: Record<string, unknown> = {};

    remarkExcerpt()(
      root(paragraph(text(p1)), paragraph(text(p2)), paragraph(text(p3))),
      vfile(frontmatter),
    );

    expect(frontmatter.excerpt).toBe(`${p1} ${p2}`);
  });

  it('includes text from nested nodes', () => {
    const rest = 'x'.repeat(200);
    const frontmatter: Record<string, unknown> = {};

    remarkExcerpt()(
      root(paragraph(text('Hello '), emphasis(text('world')), text(rest))),
      vfile(frontmatter),
    );

    expect(frontmatter.excerpt).toBe(`Hello world${rest}`);
  });

  it('keeps an excerpt already defined in frontmatter', () => {
    const frontmatter: Record<string, unknown> = {excerpt: 'custom'};

    remarkExcerpt()(root(paragraph(text('e'.repeat(200)))), vfile(frontmatter));

    expect(frontmatter.excerpt).toBe('custom');
  });

  it('does nothing for files without astro frontmatter', () => {
    expect(() => {
      remarkExcerpt()(root(paragraph(text('hello'))), {data: {}} as VFile);
    }).not.toThrow();
  });
});
