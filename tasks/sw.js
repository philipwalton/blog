/* eslint-disable no-console */

const fse = require('fs-extra');
const gulp = require('gulp');
const {rollup} = require('rollup');
const replace = require('rollup-plugin-replace');
const resolve = require('rollup-plugin-node-resolve');
const terserRollupPlugin = require('rollup-plugin-terser').terser;
const {getManifest, getRevisionedAssetUrl} = require('./utils/assets');
const {checkModuleDuplicates} = require('./utils/check-module-duplicates');


const getEnv = () => {
  return process.env.NODE_ENV || 'development';
};

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
    for (const [key, value] of Object.entries(getManifest())) {
      if (key.match(/\.(css|mjs)$/)) {
        criticalAssets.push(`/static/${value}`);
      }
    }

    const plugins = [
      resolve(),
      replace({
        'process.env.NODE_ENV': JSON.stringify(getEnv()),
        '__VERSION__': JSON.stringify(version),
        '__BUILD_TIME__': JSON.stringify(buildTime),
        '__PRECACHE_MANIFEST__': JSON.stringify(criticalAssets),
        '__SHELL_START_PATH__': JSON.stringify(shellStartPath),
        '__SHELL_END_PATH__': JSON.stringify(shellEndPath),
      }),
    ];
    if (getEnv() !== 'development') {
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

    checkModuleDuplicates(bundle.cache.modules.map((m) => m.id));

    await bundle.write({
      file: 'build/sw.js',
      sourcemap: true,
      format: 'es',
    });
  } catch (err) {
    // Log but don't throw so watching still works.
    console.error(err);
  }
});
