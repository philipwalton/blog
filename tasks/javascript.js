/* eslint-disable no-console */

const gulp = require('gulp');
const path = require('path');
const {rollup} = require('rollup');
const babel = require('rollup-plugin-babel');
const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const terserRollupPlugin = require('rollup-plugin-terser').terser;
const TerserWebpackPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');
const {addAsset, getManifest} = require('./utils/assets');
const {checkModuleDuplicates} = require('./utils/check-module-duplicates.js');
const config = require('../config.json');


const minifyNameCache = {};
const webpackBuildCache = {};

const getEnv = () => {
  return process.env.NODE_ENV || 'development';
};

const initPlugins = () => {
  return [
    // Identify each module by a hash, so caching is more predictable.
    new webpack.HashedModuleIdsPlugin(),

    // Create manifest of the original filenames to their hashed filenames.
    new ManifestPlugin({
      seed: getManifest(),
      fileName: config.manifestFileName,
      generate: (seed, files) => {
        return files.reduce((manifest, opts) => {
          // Needed until this issue is resolved:
          // https://github.com/danethurber/webpack-manifest-plugin/issues/159
          const unhashedName = path.basename(opts.path)
              .replace(/[_.-][0-9a-f]{10}/, '');

          addAsset(unhashedName, opts.path);
          return getManifest();
        }, seed);
      },
    }),

    // Allows minifiers to removed dev-only code.
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(getEnv()),
    }),
  ];
};

const generateBabelEnvLoader = (targets) => {
  return {
    test: /\.m?js$/,
    use: {
      loader: 'babel-loader',
      options: {
        babelrc: false,
        presets: [
          ['@babel/env', {
            // debug: true,
            modules: false,
            useBuiltIns: 'entry',
            targets,
          }],
        ],
      },
    },
  };
};

const baseConfig = () => ({
  mode: getEnv() === 'development' ? 'development' : 'production',
  plugins: initPlugins(),
  devtool: '#source-map',
  cache: webpackBuildCache,
});

const getMainConfig = () => Object.assign(baseConfig(), {
  entry: {
    'main': './assets/javascript/main.js',
  },
  output: {
    path: path.resolve(__dirname, '..', config.publicStaticDir),
    publicPath: '/',
    filename: '[name]-[chunkhash:10].mjs',
  },
  module: {
    rules: [
      generateBabelEnvLoader({
        browsers: [
          // The last two versions of each browser, excluding versions
          // that don't support <script type="module">.
          'last 2 Chrome versions', 'not Chrome < 60',
          'last 2 Safari versions', 'not Safari < 10.1',
          'last 2 iOS versions', 'not iOS < 10.3',
          'last 2 Firefox versions', 'not Firefox < 60',
          'last 2 Edge versions', 'not Edge < 16',
        ]
      }),
    ],
  },
  optimization: {
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        npm: {
          test: /node_modules/,
          name: (mod) => {
            const pkgName = mod.context.match(/node_modules\/([^/]+)/)[1];
            return `npm.${pkgName}`;
          },
        },
      },
    },
    minimizer: [new TerserWebpackPlugin({
      test: /\.m?js$/,
      parallel: false, // Needed for cross-file prop mangling.
      sourceMap: true,
      terserOptions: {
        mangle: {
          properties: {
            reserved: ['__e', '__esModule'],
            regex: /(^_|_$)/,
          },
        },
        nameCache: minifyNameCache, // Needed for cross-file prop mangling.
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
      generateBabelEnvLoader({browsers: ['last 2 versions']}),
    ],
  },
  optimization: {
    minimizer: [new TerserWebpackPlugin({
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

const createCompiler = (config) => {
  const compiler = webpack(config);
  return () => {
    return new Promise((resolve, reject) => {
      compiler.run((err, stats) => {
        if (err) return reject(err);
        console.log(stats.toString({
          colors: true,
          // Uncomment to see all bundled modules.
          // maxModules: Infinity,
        }));
        resolve();
      });
    });
  };
};

gulp.task('javascript:main', async () => {
  try {
    const compileMainBundle = createCompiler(getMainConfig());
    await compileMainBundle();

    console.log(minifyNameCache);

    if (getEnv() !== 'development') {
      // Generate the main-legacy bundle.
      const compileLegacyBundle = createCompiler(getLegacyConfig());
      await compileLegacyBundle();
    }
  } catch (err) {
    console.error(err);
  }
});

gulp.task('javascript:sw', async () => {
  try {
    const plugins = [
      resolve(),
      replace({
        'process.env.NODE_ENV': JSON.stringify(getEnv()),
      }),
      babel({
        presets: [['@babel/env', {
          // debug: true,
          modules: false,
          // useBuiltIns: true,
          targets: {
            browsers: [
              'last 2 Chrome versions', 'not Chrome < 45',
              'last 2 Firefox versions', 'not Firefox < 44',
              'last 2 Edge versions', 'not Edge < 17',
              'last 2 Safari versions', 'not Safari < 11.1',
            ],
          },
        }]],
      }),
    ];
    if (getEnv() !== 'development') {
      plugins.push(terserRollupPlugin({
        mangle: {
          properties: {
            regex: /(^_|_$)/,
          },
        },
      }));
    }

    const bundle = await rollup({
      input: 'assets/sw/sw.js',
      plugins,
    });

    checkModuleDuplicates(bundle.modules.map((m) => m.id));

    await bundle.write({
      file: 'build/sw.js',
      sourcemap: true,
      format: 'es',
    });
  } catch (err) {
    console.error(err);
  }
});

gulp.task('javascript', gulp.series('javascript:main', 'javascript:sw'));
