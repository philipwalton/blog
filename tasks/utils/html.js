const htmlMinifier = require('html-minifier');
const {ENV} = require('./env');


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
  return ENV === 'development' ? html : minifyHtml(html);
};

module.exports = {processHtml};
