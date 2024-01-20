import fs from 'fs-extra';
import path from 'path';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import {ENV} from './utils/env.js';
import {dimensions, metrics} from '../functions/constants.js';

const config = fs.readJSONSync('./config.json');

// Set global variables to be replaced in the source files.
const globals = {
  'self.__ENV__': JSON.stringify(ENV),
  'process.env.NODE_ENV': JSON.stringify(ENV),
};
for (const [key, value] of Object.entries(dimensions)) {
  globals[key] = JSON.stringify(value);
}
for (const [key, value] of Object.entries(metrics)) {
  globals[key] = JSON.stringify(value);
}

const terserConfig = {
  mangle: {
    toplevel: true,
    // properties: {
    //   regex: /(^_|_$)/,
    // },
  },
};

let bundleCache;

export const bundleJS = async (entry) => {
  const plugins = [
    nodeResolve(),
    replace({
      values: globals,
      preventAssignment: true,
    }),
  ];
  if (ENV !== 'development') {
    plugins.push(terser(terserConfig));
  }

  const bundle = await rollup({
    input: {
      [path.basename(entry, '.js')]: `assets/javascript/${entry}`,
    },
    cache: bundleCache,
    plugins,
    preserveSymlinks: true, // Needed for `file:` entries in package.json.
    preserveEntrySignatures: false,
    treeshake: {
      moduleSideEffects: 'no-external',
    },
  });

  bundleCache = bundle.cache;

  return await bundle.write({
    format: 'esm',
    dir: config.publicStaticDir,
    entryFileNames: '[name]-[hash].js',
    // manualChunks,
    // chunkFileNames: '[name].mjs',
  });
};
