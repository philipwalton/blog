const gulp = require('gulp');
const {rollup} = require('rollup');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const replace = require('rollup-plugin-replace');
const terserRollupPlugin = require('rollup-plugin-terser').terser;
const {addAsset, addModulePreload} = require('./utils/assets');
const {checkModuleDuplicates} = require('./utils/check-module-duplicates');
const {ENV} = require('./utils/env');
const config = require('../config.json');


const path = require('path');
const chalk = require('chalk');
const gzipSize = require('gzip-size');


const getPackageNameFromFilePath = (filePath) => {
  // Since node modules can be nested, don't just match but get the
  // last directory name after `/node_modules/`.
  const pathParts = filePath.split('node_modules/').slice(-1);
  const lastPart = pathParts[pathParts.length - 1];

  return /^(?:[^@/]+)|^@(?:[^/]+)\/(?:[^/]+)/.exec(lastPart)[0];
};


/**
 * Takes a `chunkInfo` object and returns the unversioned name for chunks
 * with a corresponding module, or the versioned name for dynamically
 * generated chunks (since their unversioned name is just "chunk").
 * @param {Object} chunkInfo
 * @return {string}
 */
const getChunkName = (chunkInfo) => {
  return chunkInfo.name === 'chunk' ? chunkInfo.fileName :
      chunkInfo.name + path.extname(chunkInfo.fileName);
};

const manualChunks = (id) => {
  if (id.includes('node_modules')) {
    return `npm.${getPackageNameFromFilePath(id)}`;
  }
};


const bundleSizePlugin = () => {
  let entryFile;
  return {
    buildStart: (inputOptions) => {
      entryFile = inputOptions.input;
    },
    generateBundle: (options, bundle) => {
      let bundleSize = 0;
      for (const [filename, chunkInfo] of Object.entries(bundle)) {
        const chunkSize = gzipSize.sync(chunkInfo.code);
        bundleSize += chunkSize;
        console.log(
            chalk.magenta(String(chunkSize).padStart(6)),
            chalk.gray(filename));
      }
      console.log(
          chalk.yellow(String(bundleSize).padStart(6)),
          chalk.white(`(total '${path.basename(entryFile)}' bundle size)`));
    },
  };
};


const modulePreloadPlugin = (callback) => {
  return {
    generateBundle(options, bundle) {
      // Create a list of static module dependencies to preload.
      const staticChunks = new Map();

      const chunksToCheck = Object.keys(bundle);
      const recheckedChunks = new Set();

      let filename;
      while (filename = chunksToCheck.shift()) {
        const chunkInfo = bundle[filename];

        // Add any import in the top-level module graph (non-dynamic)
        if (chunkInfo.isEntry || staticChunks.has(filename)) {
          staticChunks.set(filename, chunkInfo);

          for (const i of chunkInfo.imports) {
            staticChunks.set(i, bundle[i]);

            // Imports need to be checked again since they may have been
            // originally checked before all entry chunks were discovered.
            // But don't recheck a chunk more than once.
            if (!recheckedChunks.has(i)) {
              chunksToCheck.push(i);
              recheckedChunks.add(i);
            }
          }
        }
      }
      callback(staticChunks);
    },
  };
};


const assetManifestPlugin = () => {
  return {
    generateBundle(options, bundle) {
      for (const [filename, chunkInfo] of Object.entries(bundle)) {
        addAsset(getChunkName(chunkInfo), filename);
      }
    },
  };
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
      'process.env.NODE_ENV': JSON.stringify(ENV),
    }),
    modulePreloadPlugin((staticChunks) => {
      for (const chunkInfo of staticChunks.values()) {
        addModulePreload(getChunkName(chunkInfo));
        if (chunkInfo.isDynamicEntry) {
          throw new Error(
              `Dynamic chunk '${chunkInfo.name}' found in the static graph`);
        }
      }
    }),
    bundleSizePlugin(),
    assetManifestPlugin(),
  ];
  if (ENV !== 'development') {
    plugins.push(terserRollupPlugin(terserConfig));
  }

  const bundle = await rollup({
    input: 'assets/javascript/main-module.js',
    cache: moduleBundleCache,
    plugins,
    manualChunks,
    preserveSymlinks: true, // Needed for `file:` entries in package.json.
    treeshake: {
      pureExternalModules: true,
    },
  });

  moduleBundleCache = bundle.cache;

  checkModuleDuplicates(bundle.cache.modules.map((m) => m.id));

  await bundle.write({
    dir: config.publicStaticDir,
    format: 'esm',
    chunkFileNames: '[name]-[hash].mjs',
    entryFileNames: '[name]-[hash].mjs',
    // Don't rewrite dynamic import when developing (for easier debugging).
    dynamicImportFunction: ENV === 'development' ? undefined : '__import__',
  });
};

let nomoduleBundleCache;

const compileClassicBundle = async () => {
  const plugins = [
    resolve(),
    commonjs(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(ENV),
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
      plugins: ['@babel/plugin-syntax-dynamic-import'],
    }),
    bundleSizePlugin(),
    assetManifestPlugin(),
  ];
  if (ENV !== 'development') {
    plugins.push(terserRollupPlugin(terserConfig));
  }

  const bundle = await rollup({
    input: 'assets/javascript/main-nomodule.js',
    cache: nomoduleBundleCache,
    plugins,
    inlineDynamicImports: true, // Need for a single output bundle.
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

  if (ENV !== 'development') {
    await compileClassicBundle();
  }
});
