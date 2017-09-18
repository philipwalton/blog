const fs = require('fs-extra');
const he = require('he');
const hljs = require('highlight.js');
const htmlMinifier = require('html-minifier');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const moment = require('moment-timezone');
const nunjucks = require('nunjucks');
const path = require('path');
const {getRevisionedAssetUrl} = require('./static');
const book = require('../book');


const env = nunjucks.configure('templates', {
  autoescape: false,
  watch: false,
});

env.addFilter('format', (str, formatString) => {
  return moment.tz(str, book.site.timezone).format(formatString);
});

env.addFilter('revision', (filename) => {
  return getRevisionedAssetUrl(filename);
});

const inlineCache = {};
env.addFilter('inline', (filepath) => {
  if (!inlineCache[filepath]) {
    inlineCache[filepath] = fs.readFileSync(`build/${filepath}`);
  }

  return inlineCache[filepath];
});

const minifyHtml = (html) => {
  let opts = {
    removeComments: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
    removeRedundantAttributes: true,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    minifyJS: true,
    minifyCSS: true,
  };

  return htmlMinifier.minify(html, opts);
};


const processHtml = (html) => {
  return process.env.NODE_ENV == 'production' ?
      minifyHtml(html) : html;
};

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


const getPageTemplateFromPathname = (pathname) => {
  if (pathname == '/') {
    return 'templates/index.html';
  } else if (pathname.endsWith('/')) {
    return `templates/${pathname.slice(0, -1)}.html`;
  } else {
    return `templates/${pathname}`;
  }
};

const getOutputPathFromPathname = (pathname) => {
  // Add index.html if necessary and remove leading slash.
  return `build${pathname.replace(/\/$/, '/index.html')}`;
};

const renderArticleContent = async () => {
  for (const article of book.articles) {
    const data = {
      site: book.site,
      page: article,
    };
    const content =
        await fs.readFile(`${article.path.slice(1, -1)}.md`, 'utf-8');

    article.content = renderMarkdown(nunjucks.renderString(content, data));
  }
};

const buildArticles = async () => {
  for (const article of book.articles) {
    const data = {
      site: book.site,
      page: article,
    };

    const html = nunjucks.render(path.resolve('templates/article.html'), data);

    await fs.outputFile(
        getOutputPathFromPathname(article.path),
        processHtml(html));
  }
};

const buildPages = async () => {
  for (const page of book.pages) {
    const pageTemplatePath = getPageTemplateFromPathname(page.path);

    const data = {
      site: book.site,
      articles: book.articles,
      page: page,
    };

    const content = nunjucks.render(path.resolve(pageTemplatePath), data);

    await fs.outputFile(
        getOutputPathFromPathname(page.path),
        page.path.match(/(\/|\.html)$/) ? processHtml(content) : content);
  }
};

const build = async () => {
  await renderArticleContent();
  await buildArticles();
  await buildPages();
};


module.exports = {build};
