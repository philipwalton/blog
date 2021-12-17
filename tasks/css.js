import cssnano from 'cssnano';
import fs from 'fs-extra';
import gulp from 'gulp';
import path from 'path';
import postcss from 'postcss';
import atImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';
import {generateRevisionedAsset} from './utils/assets.js';
import {ENV} from './utils/env.js';
import {eachExperiment} from './utils/experiments.js';


const compileCss = async (srcPath, experiment) => {
  const css = await fs.readFile(srcPath, 'utf-8');

  const plugins = [
    atImport(),
    postcssPresetEnv({
      stage: 0,
      browsers: ENV === 'development' ? 'last 2 Chrome versions' : 'defaults',
      features: {
        'system-ui-font-family': false,
        'custom-properties': false,
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
  await eachExperiment(async (experiment) => {
    try {
      const mainPath = './assets/css/main.css';
      const main = await compileCss(mainPath, experiment);
      await generateRevisionedAsset(path.basename(mainPath), main);

      const deferPath = './assets/css/defer.css';
      const defer = await compileCss(deferPath, experiment);
      await generateRevisionedAsset(path.basename(deferPath), defer);
    } catch (err) {
      console.error(err);
    }
  });
});
