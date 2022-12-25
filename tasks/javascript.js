import chalk from 'chalk';
import fs from 'fs-extra';
import gulp from 'gulp';
import {gzipSizeSync} from 'gzip-size';
import path from 'path';
import {rollup} from 'rollup';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import {checkDuplicatesPlugin} from './utils/check-duplicates-plugin.js';
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

/**
 * A Rollup plugin to generate a list of import dependencies for each entry
 * point in the module graph. This is then used by the template to generate
 * the necessary `<link rel="modulepreload">` tags.
 * @return {Object}
 */
const modulepreloadPlugin = () => {
  return {
    name: 'modulepreload',
    generateBundle(options, bundle) {
      // A mapping of entry chunk names to their full dependency list.
      const modulepreloadMap = {};

      // Loop through all the chunks to detect entries.
      for (const [fileName, chunkInfo] of Object.entries(bundle)) {
        if (chunkInfo.isEntry || chunkInfo.isDynamicEntry) {
          modulepreloadMap[chunkInfo.name] = [fileName, ...chunkInfo.imports];
        }
      }

      fs.outputJsonSync(
        path.join(config.publicDir, 'modulepreload.json'),
        modulepreloadMap,
        {spaces: 2}
      );
    },
  };
};

const reportBundleSizePlugin = () => {
  let entryNames;
  return {
    name: 'bundle-size-plugin',
    buildStart: (inputOptions) => {
      entryNames = Object.keys(inputOptions.input);
    },
    generateBundle: (options, bundle) => {
      let bundleSize = 0;
      for (const [filename, chunkInfo] of Object.entries(bundle)) {
        const chunkSize = gzipSizeSync(chunkInfo.code);
        bundleSize += chunkSize;
        console.log(
          chalk.magenta(String(chunkSize).padStart(6)),
          chalk.gray(filename)
        );
      }
      console.log(
        chalk.yellow(String(bundleSize).padStart(6)),
        chalk.white(`(total '${entryNames.join('/')}' bundle size)`)
      );
    },
  };
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

const manualChunks = (id) => {
  if (id.includes('node_modules')) {
    // Don't manually exclude `web-vitals` or `pending-beacon-polyfill` since
    // they're already lazy loaded.
    if (id.includes('web-vitals') || id.includes('pending-beacon-polyfill')) {
      return;
    }

    // The directory name following the last `node_modules`.
    // Usually this is the package, but it could also be the scope.
    const directories = id.split(path.sep);
    const chunk = directories[directories.lastIndexOf('node_modules') + 1];

    if (chunk.startsWith('workbox-')) {
      return 'workbox';
    }
    return chunk;
  }
};

let bundleCache;

const compileBundle = async () => {
  const plugins = [
    nodeResolve(),
    replace({
      values: globals,
      preventAssignment: true,
    }),
    checkDuplicatesPlugin(),
    modulepreloadPlugin(),
    reportBundleSizePlugin(),
  ];
  if (ENV !== 'development') {
    plugins.push(terser(terserConfig));
  }

  const bundle = await rollup({
    input: {
      'main-module': 'assets/javascript/main-module.js',
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

  await bundle.write({
    format: 'esm',
    dir: config.publicModulesDir,
    manualChunks,
    chunkFileNames: '[name].mjs',
    entryFileNames: '[name].mjs',
  });
};

gulp.task('javascript', async () => {
  try {
    await fs.remove(config.publicModulesDir);
    await compileBundle();
  } catch (err) {
    // Beep!
    process.stdout.write('\x07');

    // Log but don't throw so watching still works.
    console.error(err);
  }
});
