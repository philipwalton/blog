/* eslint-disable no-console */

const gulp = require('gulp');
const md5 = require('md5');
const NameAllModulesPlugin = require('name-all-modules-plugin');
const path = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');
const {addAsset, getManifest, getRevisionedAssetUrl} =
    require('./utils/assets');
const config = require('../config.json');

const buildCache = {};

const assetCachingPlugins = ({defines, runtimeName}) => {
  const plugins = [
    new webpack.DefinePlugin(Object.assign({
      'process.env.NODE_ENV':
          JSON.stringify(process.env.NODE_ENV || 'development'),
    }, defines)),

    // Give modules a deterministic name for better long-term caching:
    // https://github.com/webpack/webpack.js.org/issues/652#issuecomment-273023082
    new webpack.NamedModulesPlugin(),

    // Give dynamically `import()`-ed scripts a deterministic name for better
    // long-term caching. Solution adapted from:
    // https://medium.com/webpack/predictable-long-term-caching-with-webpack-d3eee1d3fa31
    new webpack.NamedChunksPlugin((chunk) => chunk.name ? chunk.name :
        md5(chunk.mapModules((m) => m.identifier()).join()).slice(0, 10)),

    // Extract runtime code so updates don't affect app-code caching:
    // https://webpack.js.org/guides/caching/
    new webpack.optimize.CommonsChunkPlugin({
      name: runtimeName || 'runtime',
    }),

    // Give deterministic names to all webpacks non-"normal" modules
    // https://medium.com/webpack/predictable-long-term-caching-with-webpack-d3eee1d3fa31
    new NameAllModulesPlugin(),

    new ManifestPlugin({
      seed: getManifest(),
      fileName: config.manifestFileName,
      reduce: (oldManifest, {name, path}) => {
        addAsset(name, path);
        return getManifest();
      },
    }),
  ];

  if (process.env.NODE_ENV == 'production') {
    plugins.push(new UglifyJSPlugin({
      sourceMap: true,
      uglifyOptions: {
        mangle: {
          // Solves this Safari 10 issue:
          // https://github.com/mishoo/UglifyJS2/issues/1753
          safari10: true,
        },
      },
    }));
  }

  return plugins;
};

const generateBabelEnvLoader = (browserlist) => {
  return {
    test: /\.js$/,
    use: {
      loader: 'babel-loader',
      options: {
        babelrc: false,
        presets: [
          ['env', {
            debug: true,
            modules: false,
            useBuiltIns: true,
            targets: {
              browsers: browserlist,
            },
          }],
        ],
        plugins: ['syntax-dynamic-import'],
      },
    },
  };
};

const getMainConfig = () => ({
  entry: {
    'main': './assets/javascript/main.js',
  },
  output: {
    path: path.resolve(__dirname, '..', config.publicStaticDir),
    publicPath: '/',
    filename: '[name]-[chunkhash:10].js',
  },
  cache: buildCache,
  devtool: '#source-map',
  plugins: assetCachingPlugins({
    runtimeName: 'runtime',
  }),
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
});

const getLegacyConfig = () => ({
  entry: {
    'main-legacy': './assets/javascript/main-legacy.js',
  },
  output: {
    path: path.resolve(__dirname, '..', config.publicStaticDir),
    publicPath: '/',
    filename: '[name]-[chunkhash:10].js',
  },
  cache: buildCache,
  devtool: '#source-map',
  plugins: assetCachingPlugins({
    runtimeName: 'runtime-legacy',
  }),
  module: {
    rules: [
      generateBabelEnvLoader([
        'last 2 versions',
      ]),
    ],
  },
});

const getSwConfig = () => ({
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
    new UglifyJSPlugin({sourceMap: true}),
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
