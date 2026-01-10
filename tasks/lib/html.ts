import htmlMinifier from 'html-minifier';
import {ENV} from './env.ts';

const minifyHtml = (html: string) => {
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

export const processHtml = (html: string) => {
  return ENV === 'development' ? html : minifyHtml(html);
};
