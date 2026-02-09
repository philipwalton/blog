import {visit, EXIT, CONTINUE} from 'unist-util-visit';
import type {Root} from 'mdast';
import type {VFile} from 'vfile';

const MIN_LENGTH = 180;

function getNodeText(node: {children?: unknown[]; value?: string}): string {
  if (node.value) {
    return node.value;
  }
  if (node.children) {
    return node.children
      .map((child) => getNodeText(child as typeof node))
      .join('');
  }
  return '';
}

export default function remarkExcerpt() {
  return (tree: Root, file: VFile) => {
    const frontmatter = file.data.astro?.frontmatter as Record<string, unknown>;

    // Skip if excerpt already defined in frontmatter
    if (!frontmatter || frontmatter.excerpt) {
      return;
    }

    const paragraphs: string[] = [];
    let totalLength = 0;

    visit(tree, 'paragraph', (node) => {
      const text = getNodeText(node);
      paragraphs.push(text);
      totalLength += text.length;

      // Keep collecting until we have enough text
      if (totalLength >= MIN_LENGTH) {
        return EXIT;
      }
      return CONTINUE;
    });

    frontmatter.excerpt = paragraphs.join(' ');
  };
}
