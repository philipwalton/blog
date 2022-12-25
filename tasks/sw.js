/* eslint-disable no-console */

import fs from 'fs-extra';
import {globby} from 'globby';
import gulp from 'gulp';
import path from 'path';
import revHash from 'rev-hash';
import {rollup} from 'rollup';
import replace from '@rollup/plugin-replace';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import {checkDuplicatesPlugin} from './utils/check-duplicates-plugin.js';
import {ENV} from './utils/env.js';

const config = fs.readJSONSync('./config.json');

gulp.task('sw', async () => {
  try {
    const version = fs.readJSONSync('package.json').version;
    const buildTime = new Date();

    const criticalAssets = [
      {
        url: '/shell-start.html',
        revision: revHash(
          await fs.readFile(path.join(config.publicDir, 'shell-start.html'))
        ),
      },
      {
        url: '/shell-end.html',
        revision: revHash(
          await fs.readFile(path.join(config.publicDir, 'shell-end.html'))
        ),
      },
    ];

    const moduleFilePaths = await globby(`${config.publicModulesDir}/*.mjs`);
    for (const moduleFilePath of moduleFilePaths) {
      criticalAssets.push({
        url: path.join(config.publicModulesPath, path.basename(moduleFilePath)),
        revision: revHash(await fs.readFile(moduleFilePath)),
      });
    }

    const plugins = [
      nodeResolve(),
      replace({
        values: {
          'process.env.NODE_ENV': JSON.stringify(ENV),
          '__VERSION__': JSON.stringify(version),
          '__BUILD_TIME__': JSON.stringify(buildTime),
          '__PRECACHE_MANIFEST__': JSON.stringify(criticalAssets),
        },
        preventAssignment: true,
      }),
      checkDuplicatesPlugin(),
    ];
    if (ENV !== 'development') {
      plugins.push(
        terser({
          mangle: {
            toplevel: true,
            properties: {
              regex: /(^_|_$)/,
            },
          },
        })
      );
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
