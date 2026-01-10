import he from 'he';
import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import markdownItAnchor from 'markdown-it-anchor';

function highlight(code: string, language: string) {
  // TODO(philipwalton): come up with a better way to do code marking.
  let mark = true;
  if (language.includes(':no-mark')) {
    mark = false;
    language = language.replace(':no-mark', '');
  }

  code = language
    ? hljs.highlight(code, {language}).value
    : // Since we're not using highlight.js here, we need to
      // escape the html, but we have to unescape first in order
      // to avoid double escaping.
      he.escape(he.unescape(code));

  // Allow for highlighting portions of code blocks
  // using `**` before and after
  if (mark) {
    code = code.replace(/\*\*(.+)?\*\*/g, '<mark>$1</mark>');
  }

  return (
    `<pre class="Callout">` +
    `<code class="language-${language}">${code}</code></pre>`
  );
}

export const renderMarkdown = (content: string) => {
  const md = new MarkdownIt({
    html: true,
    typographer: true,
    highlight,
  }).use(markdownItAnchor);

  return md.render(content);
};
