/* eslint-disable no-console */

const gulp = require('gulp');
const md5 = require('md5');
// const NameAllModulesPlugin = require('name-all-modules-plugin');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');
const {addAsset, getManifest, getRevisionedAssetUrl} =
    require('./utils/assets');
const config = require('../config.json');


const buildCache = {};

const initPlugins = () => {
  return [
    // Give modules a deterministic name for better long-term caching:
    // https://github.com/webpack/webpack.js.org/issues/652#issuecomment-273023082
    // TODO(philipwalton): determine if needed anymore.
    // new webpack.NamedModulesPlugin(),

    // Give dynamically `import()`-ed scripts a deterministic name for better
    // long-term caching. Solution adapted from:
    // https://medium.com/webpack/predictable-long-term-caching-with-webpack-d3eee1d3fa31
    new webpack.NamedChunksPlugin((chunk) => {
      const hashChunk = () => {
        return md5(Array.from(chunk.modulesIterable, (m) => {
          return m.identifier();
        }).join()).slice(0, 10);
      }
      return chunk.name ? chunk.name : hashChunk()
    }),

    // Give deterministic names to all webpacks non-"normal" modules
    // https://medium.com/webpack/predictable-long-term-caching-with-webpack-d3eee1d3fa31
    // TODO(philipwalton): determine if needed anymore.
    // new NameAllModulesPlugin(),

    new ManifestPlugin({
      seed: getManifest(),
      fileName: config.manifestFileName,
      generate: (seed, files) => {
        return files.reduce((manifest, opts) => {
          // Needed until this issue is resolved:
          // https://github.com/danethurber/webpack-manifest-plugin/issues/159
          const unhashedName = path.basename(opts.path)
              .replace(/[_\.\-][0-9a-f]{10}/, '')

          addAsset(unhashedName, opts.path);
          return getManifest();
        }, seed);
      },
    }),

    new webpack.DefinePlugin({
      'process.env.NODE_ENV':
          JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
  ];
};

const generateBabelEnvLoader = (browserlist) => {
  return {
    test: /\.m?js$/,
    use: {
      loader: 'babel-loader',
      options: {
        babelrc: false,
        presets: [
          ['env', {
            // debug: true,
            modules: false,
            useBuiltIns: true,
            targets: {
              browsers: browserlist,
            },
          }],
        ],
      },
    },
  };
};

const baseConfig = () => ({
  mode: process.env.NODE_ENV || 'development',
  plugins: initPlugins(),
  devtool: '#source-map',
  cache: buildCache,
});

const getMainConfig = () => Object.assign(baseConfig(), {
  entry: {
    'main': './assets/javascript/main.js',
  },
  output: {
    path: path.resolve(__dirname, '..', config.publicStaticDir),
    publicPath: '/',
    filename: '[name]-[chunkhash:10].js',
  },
  module: {
    rules: [
      generateBabelEnvLoader([
        // The last two versions of each browser, excluding versions
        // that don't support <script type="module">.
        'last 2 Chrome versions', 'not Chrome < 60',
        'last 2 Safari versions', 'not Safari < 10.1',
        'last 2 iOS versions', 'not iOS < 10.3',
        'last 2 Firefox versions', 'not Firefox < 54',
        'last 2 Edge versions', 'not Edge < 15',
      ]),
    ],
  },
  optimization: {
    runtimeChunk: 'single',
    minimizer: [new TerserPlugin({
      test: /\.m?js$/,
      sourceMap: true,
      terserOptions: {
        mangle: {
          properties: {
            regex: /(^_|_$)/,
          }
        },
        safari10: true,
      },
    })],
  },
});

const getLegacyConfig = () => Object.assign(baseConfig(), {
  entry: {
    'main': './assets/javascript/main-legacy.js',
  },
  output: {
    path: path.resolve(__dirname, '..', config.publicStaticDir),
    publicPath: '/',
    filename: '[name]-[chunkhash:10].es5.js',
  },
  module: {
    rules: [
      generateBabelEnvLoader([
        'last 2 versions',
      ]),
    ],
  },
  optimization: {
    runtimeChunk: 'single',
    minimizer: [new TerserPlugin({
      test: /\.m?js$/,
      sourceMap: true,
      terserOptions: {
        // Don't mangle properties in legacy config
        // because it breaks polyfills.
        mangle: true,
        safari10: true,
      },
    })],
  },
});

const getSwConfig = () => ({
  mode: process.env.NODE_ENV || 'development',
  entry: {
    'sw': './assets/sw.js',
  },
  output: {
    path: path.resolve(__dirname, '..', config.publicDir),
    filename: '[name].js',
  },
  cache: buildCache,
  devtool: '#source-map',
  plugins: [
    new webpack.DefinePlugin({
      MAIN_CSS_URL: JSON.stringify(getRevisionedAssetUrl('main.css')),
      MAIN_JS_URL: JSON.stringify(getRevisionedAssetUrl('main.js')),
      MAIN_RUNTIME_URL: JSON.stringify(getRevisionedAssetUrl('runtime.js')),
    }),
  ],
  module: {
    rules: [
      generateBabelEnvLoader([
        // Browsers that support service worker.
        'last 2 Chrome versions', 'not Chrome < 45',
        'last 2 Firefox versions', 'not Firefox < 44',
        'last 2 Edge versions', 'not Edge < 17',
        'last 2 Safari versions', 'not Safari < 11.1',
      ]),
    ],
  },
  optimization: {
    minimizer: [new TerserPlugin({
      sourceMap: true,
      terserOptions: {
        // TODO(philipwalton): mangling properties in the service worker
        // breaks dependencies for some reason.
        // mangle: {
        //   properties: {
        //     regex: /(^_|_$)/,
        //   }
        // },
        mangle: true,
      },
    })],
  },
});

const createCompiler = (config) => {
  const compiler = webpack(config);
  return () => {
    return new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) return reject(err);
        console.log(stats.toString({colors: true}) + '\n');
        resolve();
      });
    });
  };
};

gulp.task('javascript', async () => {
  try {
    const compileMainBundle = createCompiler(getMainConfig());
    await compileMainBundle();

    const compileSwBundle = createCompiler(getSwConfig());
    await compileSwBundle();

    if (['debug', 'production'].includes(process.env.NODE_ENV)) {
      // Generate the main-legacy bundle.
      const compileLegacyBundle = createCompiler(getLegacyConfig());
      await compileLegacyBundle();
    }
  } catch (err) {
    console.error(err);
  }
});
