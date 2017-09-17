const cssnano = require('cssnano');
const fs = require('fs-extra');
const postcss = require('postcss');
const atImport = require('postcss-import');
const cssnext = require('postcss-cssnext');
const {generateRevisionedAsset} = require('./static');


module.exports = {
  build: async () => {
    const css = await fs.readFile('assets/css/main.css', 'utf-8');
    const result = await postcss([
      atImport(),
      cssnext(),
      cssnano({preset: [
        'default',
        {discardComments: {removeAll: true}},
      ]}),
    ]).process(css, {
      from: 'assets/css/main.css',
      to: 'build/static/main.css',
      map: {
        inline: false,
      },
    });

    await generateRevisionedAsset('main.css', result.css);
    await fs.outputFile('build/static/main.css.map', result.map);
  },
};
