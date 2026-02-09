import type {ShikiTransformer} from 'shiki';

interface HighlightRange {
  line: number;
  colStart?: number;
  colEnd?: number;
}

/**
 * Parses a highlight meta string like `{2,3,4[20-22],7[4-6]}` into ranges.
 */
function parseHighlightMeta(meta: string): HighlightRange[] {
  const ranges: HighlightRange[] = [];

  // Match the content inside curly braces
  const match = meta.match(/\{([^}]+)\}/);
  if (!match) return ranges;

  const parts = match[1]!.split(',');

  for (const part of parts) {
    const trimmed = part.trim();

    // Check for line with column range: 4[20-22]
    const colMatch = trimmed.match(/^(\d+)\[(\d+)-(\d+)\]$/);
    if (colMatch) {
      ranges.push({
        line: parseInt(colMatch[1]!, 10),
        colStart: parseInt(colMatch[2]!, 10),
        colEnd: parseInt(colMatch[3]!, 10),
      });
      continue;
    }

    // Check for line range: 2-5
    const lineRangeMatch = trimmed.match(/^(\d+)-(\d+)$/);
    if (lineRangeMatch) {
      const start = parseInt(lineRangeMatch[1]!, 10);
      const end = parseInt(lineRangeMatch[2]!, 10);
      for (let i = start; i <= end; i++) {
        ranges.push({line: i});
      }
      continue;
    }

    // Single line: 2
    const singleLineMatch = trimmed.match(/^(\d+)$/);
    if (singleLineMatch) {
      ranges.push({line: parseInt(singleLineMatch[1]!, 10)});
    }
  }

  return ranges;
}

/**
 * A Shiki transformer that highlights lines and column ranges.
 *
 * Syntax: {2,3,4[20-22],7[4-6]}
 * - 2,3 = highlight entire lines 2 and 3
 * - 2-5 = highlight lines 2 through 5
 * - 4[20-22] = highlight columns 20-21 on line 4
 * - 7[4-6] = highlight columns 4-5 on line 7
 *
 * All line and column numbers are 1-indexed. Column ranges are exclusive
 * on the end, so [1-2] highlights only the first character.
 */
export function transformerMetaRangeHighlight(
  options: {
    lineClassName?: string;
    wordClassName?: string;
  } = {},
): ShikiTransformer {
  const {lineClassName = 'highlighted', wordClassName = 'highlighted-word'} =
    options;

  return {
    name: 'meta-range-highlight',
    line(node, line) {
      const meta = this.options.meta?.__raw || '';
      const ranges = parseHighlightMeta(meta);

      // Check for full line highlights (no column specified)
      const fullLineHighlight = ranges.find(
        (r) => r.line === line && r.colStart === undefined,
      );

      if (fullLineHighlight) {
        this.addClassToHast(node, lineClassName);
      }
    },
    preprocess(code, options) {
      const meta = this.options.meta?.__raw || '';
      const ranges = parseHighlightMeta(meta);

      // Filter to only column-specific highlights
      const colRanges = ranges.filter((r) => r.colStart !== undefined);
      if (colRanges.length === 0) return;

      options.decorations ||= [];

      // Build line offset map (0-indexed line number -> start offset)
      const lines = code.split('\n');
      const lineOffsets: number[] = [];
      let offset = 0;
      for (const line of lines) {
        lineOffsets.push(offset);
        offset += line.length + 1; // +1 for newline
      }

      for (const range of colRanges) {
        // Convert 1-indexed line to 0-indexed
        const lineIndex = range.line - 1;
        if (lineIndex < 0 || lineIndex >= lines.length) continue;

        const lineStart = lineOffsets[lineIndex]!;
        const lineLength = lines[lineIndex]!.length;

        // Convert 1-indexed columns to 0-indexed offsets
        // End is exclusive, so [1-2] highlights only column 1
        const colStart = range.colStart! - 1;
        const colEnd = range.colEnd! - 1;

        // Clamp to line bounds
        const startOffset =
          lineStart + Math.max(0, Math.min(colStart, lineLength));
        const endOffset = lineStart + Math.max(0, Math.min(colEnd, lineLength));

        if (startOffset < endOffset) {
          options.decorations.push({
            start: startOffset,
            end: endOffset,
            properties: {class: wordClassName},
          });
        }
      }
    },
  };
}
