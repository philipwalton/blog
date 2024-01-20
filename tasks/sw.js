import fs from 'fs-extra';
import path from 'path';
import revHash from 'rev-hash';
import {rollup} from 'rollup';
import replace from '@rollup/plugin-replace';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import {ENV} from './utils/env.js';

const config = fs.readJSONSync('./config.json');

// TODO: cache needs to be disabled because it doesn't bust when
// the one of the plugin-replace values change.
// let bundleCache;

export const bundleSW = async () => {
  const version = fs.readJSONSync('package.json').version;
  const buildTime = new Date();

  const criticalAssets = [
    {
      url: '/shell-start.html',
      revision: revHash(
        await fs.readFile(path.join(config.publicDir, 'shell-start.html')),
      ),
    },
    {
      url: '/shell-end.html',
      revision: revHash(
        await fs.readFile(path.join(config.publicDir, 'shell-end.html')),
      ),
    },
  ];

  const plugins = [
    replace({
      values: {
        'process.env.NODE_ENV': JSON.stringify(ENV),
        '__VERSION__': JSON.stringify(version),
        '__BUILD_TIME__': JSON.stringify(buildTime),
        '__PRECACHE_MANIFEST__': JSON.stringify(criticalAssets),
      },
      preventAssignment: true,
    }),
    nodeResolve(),
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
      }),
    );
  }

  const bundle = await rollup({
    input: {
      'sw': `assets/sw/sw.js`,
    },
    // cache: bundleCache,
    plugins,
    preserveSymlinks: true, // Needed for `file:` entries in package.json.
    preserveEntrySignatures: false,
    treeshake: {
      moduleSideEffects: 'no-external',
    },
  });

  // bundleCache = bundle.cache;

  return await bundle.write({
    format: 'esm',
    dir: config.publicDir,
    entryFileNames: '[name].js',
  });
};
