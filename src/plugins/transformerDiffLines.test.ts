import {describe, expect, it} from 'vitest';
import {transformerDiffLines} from './transformerDiffLines.ts';

/**
 * Runs the transformer's `preprocess` and `line` hooks against a line
 * containing the given hast children, and returns the classes added to the
 * line along with the language the block ended up being highlighted with.
 */
function runTransformer(
  lang: string,
  meta: string,
  children: unknown[],
  options?: {className?: string; addClassName?: string},
): {classes: string[]; lang: string} {
  const transformer = transformerDiffLines(options);
  const classes: string[] = [];
  const codeOptions = {lang};
  const ctx = {
    meta: {},
    options: {lang, meta: {__raw: meta}},
    addClassToHast: (_node: unknown, className: string) => {
      classes.push(className);
    },
  };

  transformer.preprocess!.call(ctx as never, '', codeOptions as never);

  const node = {type: 'element', tagName: 'span', properties: {}, children};
  transformer.line!.call(ctx as never, node as never, 1);

  return {classes, lang: codeOptions.lang};
}

/** Returns the classes the transformer adds to a line. */
function diffClasses(
  lang: string,
  children: unknown[],
  options?: {className?: string; addClassName?: string},
): string[] {
  return runTransformer(lang, '', children, options).classes;
}

/** Builds the hast children Shiki produces for a line of tokens. */
function tokens(...values: string[]): unknown[] {
  return values.map((value) => ({
    type: 'element',
    tagName: 'span',
    properties: {},
    children: [{type: 'text', value}],
  }));
}

describe('diff lines', () => {
  it('marks lines starting with a plus as added', () => {
    expect(diffClasses('diff', tokens('+', '  added'))).toEqual([
      'diff',
      'add',
    ]);
  });

  it('marks lines starting with a minus as removed', () => {
    expect(diffClasses('diff', tokens('-', '  removed'))).toEqual([
      'diff',
      'remove',
    ]);
  });

  it('leaves context lines unmarked', () => {
    expect(diffClasses('diff', tokens('  context'))).toEqual([]);
  });

  it('leaves empty lines unmarked', () => {
    expect(diffClasses('diff', [])).toEqual([]);
  });

  it('ignores languages other than diff', () => {
    expect(diffClasses('js', tokens('+', '  added'))).toEqual([]);
  });

  it('reads the marker from nested token elements', () => {
    expect(diffClasses('diff', tokens('+  added'))).toEqual(['diff', 'add']);
  });

  it('supports custom class names', () => {
    const classes = diffClasses('diff', tokens('+  added'), {
      className: 'change',
      addClassName: 'inserted',
    });

    expect(classes).toEqual(['change', 'inserted']);
  });
});

describe('diff languages', () => {
  it('highlights the block with the language named in the meta', () => {
    expect(runTransformer('diff', 'jsonc', tokens('  context')).lang).toBe(
      'jsonc',
    );
  });

  it('keeps the diff grammar when no language is named', () => {
    expect(runTransformer('diff', '', tokens('  context')).lang).toBe('diff');
  });

  it('ignores the meta used by the other transformers', () => {
    const result = runTransformer('diff', '{2,3} /word/', tokens('  context'));
    expect(result.lang).toBe('diff');
  });

  it('still marks lines when the language is swapped', () => {
    const result = runTransformer('diff', 'jsonc', tokens('+  added'));
    expect(result.classes).toEqual(['diff', 'add']);
  });

  it('does not swap the language of non-diff blocks', () => {
    expect(runTransformer('js', 'jsonc', tokens('  context')).lang).toBe('js');
  });
});
