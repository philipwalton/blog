import htmlMinifier from 'html-minifier';
import {ENV} from './env.js';

const minifyHtml = (html) => {
  const opts = {
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

export const processHtml = (html) => {
  return ENV === 'development' ? html : minifyHtml(html);
};
