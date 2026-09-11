import type {ShikiTransformer} from 'shiki';
import type {Element, ElementContent} from 'hast';

/** Per-block state shared between the `preprocess` and `line` hooks. */
interface DiffMeta {
  isDiff?: boolean;
}

/**
 * Returns the concatenated text content of a hast node's descendants.
 */
function textContent(node: Element | ElementContent): string {
  if (node.type === 'text') return node.value;
  if (!('children' in node)) return '';

  return node.children.map(textContent).join('');
}

/**
 * Reads the language name from a meta string like `jsonc {2,4}`, ignoring
 * the `{...}` and `/word/` tokens the other transformers use.
 */
function parseLangMeta(meta: string): string | undefined {
  return meta
    .trim()
    .split(/\s+/)
    .find((part) => /^[\w.+#-]+$/.test(part));
}

/**
 * A Shiki transformer that marks added and removed lines in `diff` code
 * blocks, using the leading `+` and `-` characters that the diff syntax
 * already requires.
 *
 * Naming a second language in the fence info string highlights the block
 * with that language instead of the `diff` grammar, so unchanged lines keep
 * their syntax colors:
 *
 * ```diff jsonc
 *
 * Languages used that way must be listed in `shikiConfig.langs`, since Astro
 * only loads the grammar named by the fence itself.
 */
export function transformerDiffLines(
  options: {
    className?: string;
    addClassName?: string;
    removeClassName?: string;
  } = {},
): ShikiTransformer {
  const {
    className = 'diff',
    addClassName = 'add',
    removeClassName = 'remove',
  } = options;

  return {
    name: 'diff-lines',
    preprocess(_code, options) {
      if (options.lang !== 'diff') return;

      (this.meta as DiffMeta).isDiff = true;

      const lang = parseLangMeta(this.options.meta?.__raw || '');
      if (lang) {
        options.lang = lang as typeof options.lang;
      }
    },
    line(node) {
      if (!(this.meta as DiffMeta).isDiff) return;

      const marker = textContent(node)[0];
      if (marker !== '+' && marker !== '-') return;

      this.addClassToHast(node, className);
      this.addClassToHast(
        node,
        marker === '+' ? addClassName : removeClassName,
      );
    },
  };
}
