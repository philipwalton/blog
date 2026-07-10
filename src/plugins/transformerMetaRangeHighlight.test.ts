import {describe, expect, it} from 'vitest';
import {transformerMetaRangeHighlight} from './transformerMetaRangeHighlight.ts';

interface Decoration {
  start: number;
  end: number;
  properties: {class: string};
}

/**
 * Runs the transformer's `line` hook for each line and returns a map of
 * line number to the classes added to it.
 */
function lineHighlights(
  meta: string,
  lineCount: number,
  options?: {lineClassName?: string},
): Map<number, string[]> {
  const transformer = transformerMetaRangeHighlight(options);
  const highlights = new Map<number, string[]>();

  for (let line = 1; line <= lineCount; line++) {
    const classes: string[] = [];
    const ctx = {
      options: {meta: {__raw: meta}},
      addClassToHast: (_node: unknown, className: string) => {
        classes.push(className);
      },
    };
    transformer.line!.call(ctx as never, {} as never, line);
    if (classes.length) {
      highlights.set(line, classes);
    }
  }
  return highlights;
}

/**
 * Runs the transformer's `preprocess` hook and returns the decorations
 * it added.
 */
function getDecorations(meta: string, code: string): Decoration[] | undefined {
  const transformer = transformerMetaRangeHighlight();
  const options: {decorations?: Decoration[]} = {};
  const ctx = {options: {meta: {__raw: meta}}};
  transformer.preprocess!.call(ctx as never, code, options as never);
  return options.decorations;
}

describe('line highlights', () => {
  it('highlights single lines', () => {
    expect([...lineHighlights('{2,4}', 5).keys()]).toEqual([2, 4]);
  });

  it('highlights line ranges', () => {
    expect([...lineHighlights('{2-4}', 5).keys()]).toEqual([2, 3, 4]);
  });

  it('highlights a mix of single lines and ranges', () => {
    expect([...lineHighlights('{1,3-4}', 5).keys()]).toEqual([1, 3, 4]);
  });

  it('adds the `highlighted` class by default', () => {
    expect(lineHighlights('{1}', 1).get(1)).toEqual(['highlighted']);
  });

  it('supports a custom class name', () => {
    const highlights = lineHighlights('{1}', 1, {lineClassName: 'custom'});
    expect(highlights.get(1)).toEqual(['custom']);
  });

  it('highlights nothing when the meta has no braces', () => {
    expect(lineHighlights('js', 3).size).toBe(0);
  });

  it('does not line-highlight column ranges', () => {
    expect(lineHighlights('{2[1-3]}', 3).size).toBe(0);
  });
});

describe('column highlights', () => {
  const code = 'const a = 1;\nconst bb = 22;\nconst ccc = 333;';

  it('adds a decoration for the column range', () => {
    const decorations = getDecorations('{2[7-9]}', code)!;

    expect(decorations).toHaveLength(1);
    const [decoration] = decorations;
    expect(code.slice(decoration!.start, decoration!.end)).toBe('bb');
    expect(decoration!.properties.class).toBe('highlighted-word');
  });

  it('supports multiple column ranges', () => {
    const decorations = getDecorations('{1[7-8],3[7-10]}', code)!;

    expect(decorations).toHaveLength(2);
    expect(code.slice(decorations[0]!.start, decorations[0]!.end)).toBe('a');
    expect(code.slice(decorations[1]!.start, decorations[1]!.end)).toBe('ccc');
  });

  it('clamps ranges to the line length', () => {
    const decorations = getDecorations('{1[11-99]}', code)!;

    expect(decorations).toHaveLength(1);
    expect(code.slice(decorations[0]!.start, decorations[0]!.end)).toBe('1;');
  });

  it('ignores lines outside the code', () => {
    expect(getDecorations('{9[1-2]}', code)).toEqual([]);
  });

  it('ignores ranges that are empty after clamping', () => {
    expect(getDecorations('{1[20-25]}', code)).toEqual([]);
  });

  it('adds no decorations when the meta has no column ranges', () => {
    expect(getDecorations('{1-2}', code)).toBeUndefined();
  });
});
