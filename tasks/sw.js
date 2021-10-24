/* eslint-disable no-console */

import fs from 'fs-extra';
import {globby} from 'globby';
import gulp from 'gulp';
import path from 'path';
import revHash from 'rev-hash';
import {rollup} from 'rollup';
import replace from '@rollup/plugin-replace';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';
import {getRevisionedAssetUrl} from './utils/assets.js';
import {checkDuplicatesPlugin} from './utils/check-duplicates-plugin.js';
import {ENV} from './utils/env.js';
import {eachExperiment, getExperiment} from './utils/experiments.js';


const config = fs.readJSONSync('./config.json');

gulp.task('sw', async () => {
  await eachExperiment(async (experiment) => {
    try {
      const version = fs.readJSONSync('package.json').version;
      const buildTime = new Date();

      const shellStartURL = getRevisionedAssetUrl('shell-start.html');
      const shellEndURL = getRevisionedAssetUrl('shell-end.html');

      const criticalAssets = [{
        url: shellStartURL,
        revision: null,
      }, {
        url: shellEndURL,
        revision: null,
      }];

      const moduleFilePaths = await globby(`${config.publicModulesDir}/*.mjs`);
      for (const moduleFilePath of moduleFilePaths) {
        criticalAssets.push({
          url: path.join(
              config.publicModulesPath, path.basename(moduleFilePath)),
          revision: revHash(await fs.readFile(moduleFilePath)),
        });
      }

      if (getExperiment() === 'link-css') {
        criticalAssets.push({
          url: getRevisionedAssetUrl('main.css'),
          revision: null,
        });
      }

      const plugins = [
        {
          resolveId(source, importer) {
            // Use a custom strategy for precaching.
            if (source.match(/PrecacheStrategy\.m?js/)) {
              return path.resolve('./assets/sw/strategies/PrecacheStrategy.js');
            }
          },
        },
        nodeResolve(),
        replace({
          values: {
            'process.env.NODE_ENV': JSON.stringify(ENV),
            '__VERSION__': JSON.stringify(version),
            '__BUILD_TIME__': JSON.stringify(buildTime),
            '__PRECACHE_MANIFEST__': JSON.stringify(criticalAssets),
            '__SHELL_START_URL__': JSON.stringify(shellStartURL),
            '__SHELL_END_URL__': JSON.stringify(shellEndURL),
          },
          preventAssignment: true,
        }),
        checkDuplicatesPlugin(),
      ];
      if (ENV !== 'development') {
        plugins.push(terser({
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
        file: `build/${experiment ? `_${experiment}/` : ''}sw.js`,
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
});
