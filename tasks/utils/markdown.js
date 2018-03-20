const he = require('he');
const hljs = require('highlight.js');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');

/**
 * Renders markdown content as HTML with syntax highlighted code blocks.
 * @param {string} content A markdown string.
 * @return {string} The rendered HTML.
 */
const renderMarkdown = (content) => {
  const md = new MarkdownIt({
    html: true,
    typographer: true,
    highlight: function(code, lang) {
      code = lang ? hljs.highlight(lang, code).value :
          // Since we're not using highlight.js here, we need to
          // espace the html, but we have to unescape first in order
          // to avoid double escaping.
          he.escape(he.unescape(code));

      // Allow for highlighting portions of code blocks
      // using `**` before and after
      return code.replace(/\*\*(.+)?\*\*/g, '<mark>$1</mark>');
    },
  }).use(markdownItAnchor);

  return md.render(content);
};

module.exports = {renderMarkdown};
