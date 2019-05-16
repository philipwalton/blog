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
      for (const [filename, assetInfo] of Object.entries(bundle)) {
        const chunkSize = gzipSize.sync(assetInfo.code);
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


const assetManifestPlugin = {
  generateBundle(options, bundle) {
    const ext = options.entryFileNames.slice(
        options.entryFileNames.indexOf('.'));

    // Create a list of static module dependencies to preload.
    const staticModules = new Set();

    if (ext === '.mjs') {
      for (const [filename, assetInfo] of Object.entries(bundle)) {
        // Add any import in the top-level module graph (non-dynamic)
        if (assetInfo.isEntry || staticModules.has(filename)) {
          staticModules.add(filename);
          for (const i of assetInfo.imports) {
            staticModules.add(i);
          }
        }
      }
    }

    for (const [filename, assetInfo] of Object.entries(bundle)) {
      let moduleName = assetInfo.name;

      // Chunks get dynamically generated names, but that's OK since they're
      // never referenced from the markup via their original name.
      if (moduleName === 'chunk') {
        moduleName = filename;
      }
      addAsset(`${moduleName}${ext}`, filename);

      if (staticModules.has(filename)) {
        addModulePreload(`${moduleName}${ext}`);
      }
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
      'process.env.NODE_ENV': JSON.stringify(ENV),
    }),
    bundleSizePlugin(),
    assetManifestPlugin,
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
    assetManifestPlugin,
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
