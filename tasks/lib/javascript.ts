import fs from 'fs-extra';
import path from 'path';
import {rollup, type RollupCache} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import {ENV} from './env.ts';

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

let bundleCache: RollupCache | false = false;

export const bundleJS = async (entry: string) => {
  const plugins = [
    typescript(),
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
      [path.basename(entry, '.ts')]: `src/javascript/${entry}`,
    },
    cache: bundleCache,
    plugins,
    preserveSymlinks: true, // Needed for `file:` entries in package.json.
    preserveEntrySignatures: false,
    treeshake: {
      moduleSideEffects: 'no-external',
    },
  });

  bundleCache = bundle.cache ?? false;

  return await bundle.write({
    format: 'esm',
    dir: config.publicStaticDir,
    entryFileNames: '[name]-[hash].js',
    // manualChunks,
    // chunkFileNames: '[name].mjs',
  });
};
