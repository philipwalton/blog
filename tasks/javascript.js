const gulp = require('gulp');
const {rollup} = require('rollup');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const replace = require('rollup-plugin-replace');
const terserRollupPlugin = require('rollup-plugin-terser').terser;
const {addAsset} = require('./utils/assets');
const {checkModuleDuplicates} = require('./utils/check-module-duplicates');
const config = require('../config.json');


const getEnv = () => {
  return process.env.NODE_ENV || 'development';
};

const getPackageNameFromFilePath = (filePath) => {
  // Since node modules can be nested, don't just match but get the
  // last directory name after `/node_modules/`.
  const pathParts = filePath.split('node_modules/').slice(-1);
  const lastPart = pathParts[pathParts.length - 1];

  return /^(?:[^@/]+)|^@(?:[^/]+)\/(?:[^/]+)/.exec(lastPart)[0];
};

const manualChunks = (id) => {
  if (id.includes('node_modules')) {
    return `npm.${getPackageNameFromFilePath(id)}`;
  }
};

const assetManifestPlugin = {
  generateBundle(options, bundle) {
    const ext = options.entryFileNames.slice(
        options.entryFileNames.indexOf('.'));

    for (const [name, assetInfo] of Object.entries(bundle)) {
      addAsset(`${assetInfo.name}${ext}`, name);
    }
  },
};

const terserConfig = {
  mangle: {
    toplevel: true,
    // properties: {
    //   regex: /(^_|_$)/,
    // },
    safari10: true,
  },
};

let moduleBundleCache;

const compileModuleBundle = async () => {
  const plugins = [
    resolve(),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(getEnv()),
    }),
    assetManifestPlugin,
  ];
  if (getEnv() !== 'development') {
    plugins.push(terserRollupPlugin(terserConfig));
  }

  const bundle = await rollup({
    input: 'assets/javascript/main.js',
    cache: moduleBundleCache,
    plugins,
    manualChunks,
    preserveSymlinks: true, // Needed for `file:` entries in package.json.
  });

  moduleBundleCache = bundle.cache;

  checkModuleDuplicates(bundle.cache.modules.map((m) => m.id));

  await bundle.write({
    dir: config.publicStaticDir,
    format: 'esm',
    chunkFileNames: '[name]-[hash].mjs',
    entryFileNames: '[name]-[hash].mjs',
  });
};

let nomoduleBundleCache;

const compileClassicBundle = async () => {
  const plugins = [
    resolve(),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(getEnv()),
    }),
    babel({
      exclude: [
        /core-js/,
        /regenerator-runtime/,
      ],
      presets: [['@babel/preset-env', {
        targets: {browsers: ['ie 11']},
        useBuiltIns: 'usage',
        // debug: true,
        loose: true,
        corejs: 3,
      }]],
    }),
    assetManifestPlugin,
  ];
  if (getEnv() !== 'development') {
    plugins.push(terserRollupPlugin(terserConfig));
  }

  const bundle = await rollup({
    input: 'assets/javascript/nomodule.js',
    cache: nomoduleBundleCache,
    plugins,
    preserveSymlinks: true, // Needed for `file:` entries in package.json.
  });

  nomoduleBundleCache = bundle.cache;

  await bundle.write({
    dir: config.publicStaticDir,
    format: 'iife',
    entryFileNames: '[name]-[hash].js',
  });
};

gulp.task('javascript', async () => {
  await compileModuleBundle();

  if (getEnv() !== 'development') {
    await compileClassicBundle();
  }
});
