/* eslint-disable no-console */

const fs = require('fs-extra');
const globby = require('globby');
const gulp = require('gulp');
const path = require('path');
const revHash = require('rev-hash');
const {rollup} = require('rollup');
const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const terserRollupPlugin = require('rollup-plugin-terser').terser;
const {checkDuplicatesPlugin} = require('./utils/check-duplicates-plugin');
const {ENV} = require('./utils/env');
const config = require('../config.json');


gulp.task('sw', async () => {
  try {
    const version = fs.readJSONSync('package.json').version;
    const buildTime = new Date();

    const criticalAssets = [{
      url: '/shell-start.html',
      revision: revHash(
          await fs.readFile(path.join(config.publicDir, 'shell-start.html'))),
    }, {
      url: '/shell-end.html',
      revision: revHash(
          await fs.readFile(path.join(config.publicDir, 'shell-end.html'))),
    }];

    const moduleFilePaths = await globby(`${config.publicModulesDir}/*.mjs`);
    for (const moduleFilePath of moduleFilePaths) {
      criticalAssets.push({
        url: path.join(config.publicModulesPath, path.basename(moduleFilePath)),
        revision: revHash(await fs.readFile(moduleFilePath)),
      });
    }

    const plugins = [
      resolve(),
      replace({
        'process.env.NODE_ENV': JSON.stringify(ENV),
        '__VERSION__': JSON.stringify(version),
        '__BUILD_TIME__': JSON.stringify(buildTime),
        '__PRECACHE_MANIFEST__': JSON.stringify(criticalAssets),
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
      preserveSymlinks: true, // Needed for `file:` entries in package.json.
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
