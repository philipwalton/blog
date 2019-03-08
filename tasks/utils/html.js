const htmlMinifier = require('html-minifier');

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


const processHtml = (html) => {
  return process.env.NODE_ENV == 'production' ?
      minifyHtml(html) : html;
};

module.exports = {processHtml};
