import cssnano from 'cssnano';
import fs from 'fs-extra';
import gulp from 'gulp';
import path from 'path';
import postcss from 'postcss';
import atImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';
import {generateRevisionedAsset} from './utils/assets.js';
import {ENV} from './utils/env.js';


const compileCss = async (srcPath) => {
  const css = await fs.readFile(srcPath, 'utf-8');

  const plugins = [
    atImport(),
    postcssPresetEnv({
      stage: 0,
      browsers: ENV === 'development' ? 'last 2 Chrome versions' : 'defaults',
      features: {
        'system-ui-font-family': false,
      },
    }),
  ];
  if (ENV === 'production') {
    plugins.push(cssnano({preset: [
      'default', {
        discardComments: {removeAll: true},
        // This must be disabled because it breaks postcss-custom-properties:
        // https://github.com/ben-eb/cssnano/issues/448
        mergeLonghand: false,
      },
    ]}));
  }

  const result = await postcss(plugins).process(css, {from: srcPath});

  return result.css;
};

gulp.task('css', async () => {
  try {
    const srcPath = './assets/css/main.css';
    const css = await compileCss(srcPath);
    await generateRevisionedAsset(path.basename(srcPath), css);
  } catch (err) {
    console.error(err);
  }
});
