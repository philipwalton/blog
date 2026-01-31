import postcssGlobalData from '@csstools/postcss-global-data';
import postcssPresetEnv from 'postcss-preset-env';

export default {
  plugins: [
    postcssGlobalData({
      files: ['src/css/base/custom-media.css'],
    }),
    postcssPresetEnv({
      stage: 0,
      features: {
        'system-ui-font-family': false,
        'custom-properties': false,
      },
    }),
  ],
};
