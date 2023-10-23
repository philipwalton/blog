import cssnano from 'cssnano';
import fs from 'fs-extra';
import postcss from 'postcss';
import atImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';
import {ENV} from './utils/env.js';

export const bundleCSS = async (srcPath) => {
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
    plugins.push(
      cssnano({
        preset: [
          'default',
          {
            discardComments: {removeAll: true},
            // Disable this because it breaks postcss-custom-properties:
            // https://github.com/ben-eb/cssnano/issues/448
            mergeLonghand: false,
          },
        ],
      }),
    );
  }

  const result = await postcss(plugins).process(css, {from: srcPath});

  return result.css;
};
