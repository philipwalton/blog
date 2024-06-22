import fs from 'fs-extra';
import path from 'path';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import {ENV} from './env.js';

const config = fs.readJSONSync('./config.json');

// Set global variables to be replaced in the source files.
const globals = {
  'self.__ENV__': JSON.stringify(ENV),
  'self.__PARTIAL_PATH__': JSON.stringify(config.contentPartialPath),
  'process.env.NODE_ENV': JSON.stringify(ENV),
};

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
