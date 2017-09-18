const cssnano = require('cssnano');
const fs = require('fs-extra');
const path = require('path');
const postcss = require('postcss');
const atImport = require('postcss-import');
const cssnext = require('postcss-cssnext');
const {generateRevisionedAsset} = require('./static');


const generateCss = async (filepath) => {
  const css = await fs.readFile(filepath, 'utf-8');
  const result = await postcss([
    atImport(),
    cssnext(),
    cssnano({preset: [
      'default',
      {discardComments: {removeAll: true}},
    ]}),
  ]).process(css, {
    from: filepath,
  });

  await generateRevisionedAsset(path.basename(filepath), result.css);
};

module.exports = {
  build: () => {
    return Promise.all([
      generateCss('assets/css/critical.css'),
      generateCss('assets/css/lazy.css'),
    ]);
  },
};
