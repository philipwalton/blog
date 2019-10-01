/* eslint-disable no-console */

const fse = require('fs-extra');
const gulp = require('gulp');
const path = require('path');
const {rollup} = require('rollup');
const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const terserRollupPlugin = require('rollup-plugin-terser').terser;
const {getRevisionedAssetUrl} = require('./utils/assets');
const {checkDuplicatesPlugin} = require('./utils/check-duplicates-plugin');
const {ENV} = require('./utils/env');
const config = require('../config.json');


gulp.task('sw', async () => {
  try {
    const version = fse.readJSONSync('package.json').version;
    const buildTime = new Date();

    const shellStartPath = getRevisionedAssetUrl('shell-start.html');
    const shellEndPath = getRevisionedAssetUrl('shell-end.html');
    const criticalAssets = [
      shellStartPath,
      shellEndPath,
    ];

    const moduleMap = fse.readJsonSync(
        path.join(config.publicDir, 'module-map.json'), 'utf-8');

    for (const [filename, revision] of Object.entries(moduleMap)) {
      criticalAssets.push({
        url: path.join(config.publicModulesPath, filename),
        revision,
      });
    }

    const plugins = [
      resolve(),
      replace({
        'process.env.NODE_ENV': JSON.stringify(ENV),
        '__VERSION__': JSON.stringify(version),
        '__BUILD_TIME__': JSON.stringify(buildTime),
        '__PRECACHE_MANIFEST__': JSON.stringify(criticalAssets),
        '__SHELL_START_PATH__': JSON.stringify(shellStartPath),
        '__SHELL_END_PATH__': JSON.stringify(shellEndPath),
      }),
      checkDuplicatesPlugin(),
    ];
    if (ENV !== 'development') {
      plugins.push(terserRollupPlugin({
        mangle: {
          toplevel: true,
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

    await bundle.write({
      file: 'build/sw.js',
      sourcemap: true,
      format: 'es',
    });
  } catch (err) {
    // Beep!
    process.stdout.write('\x07');

    // Log but don't throw so watching still works.
    console.error(err);
  }
});
