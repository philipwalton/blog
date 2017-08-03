/* eslint-disable no-console */

const babel = require('babel-core');
const fs = require('fs-extra');
const {compile} = require('google-closure-compiler-js');
const path = require('path');
const {rollup} = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const babelPlugin = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
const replace = require('rollup-plugin-replace');
const {SourceMapGenerator, SourceMapConsumer} = require('source-map');
const {generateRevisionedAsset, getRevisionedAssetUrl} = require('./static');

const {promisify} = require('util');
const glob = promisify(require('glob'));


const compilePolyfills = async () => {
  const entry = 'assets/javascript/polyfills.js';
  const bundle = await rollup({
    entry: entry,
    plugins: [
      nodeResolve({jsnext: true, main: true}),
      commonjs(),
    ],
    onwarn: (warning) => {
      // Ignore `this` inside an ES module warnings, as they don't apply here.
      // https://github.com/rollup/rollup/issues/794
      if (warning.code != 'THIS_IS_UNDEFINED') console.log(warning);
    },
  });
  const rollupResult = await bundle.generate({format: 'iife', sourceMap: true});
  const babelResult = babel.transform(rollupResult.code, {
    comments: false,
    presets: ['babili'],
    inputSourceMap: rollupResult.map,
  });

  await generateRevisionedAsset('polyfills.js', babelResult.code, {
    sourceMap: babelResult.map,
  });
};


const compileMain = async () => {
  const entry = 'assets/javascript/main.js';

  const {code, map} = await rollup({
    entry: entry,
    plugins: [
      replace({
        ENVIRONMENT: JSON.stringify(process.env.NODE_ENV || 'development'),
        POLYFILLS_URL: JSON.stringify(getRevisionedAssetUrl('polyfills.js')),
      }),
      nodeResolve({jsnext: true, main: true}),
    ],
  })
  .then(async (bundle) => {
    // In production mode, use Closure Compiler to bundle the script,
    // otherwise just output the rollup result as it's much faster.
    if (process.env.NODE_ENV == 'production') {
      const rollupResult = await bundle.generate({
        format: 'es',
        dest: path.basename(entry),
        sourceMap: true,
      });

      const externs = (await Promise.all([
        'assets/javascript/externs.js',
        './node_modules/tti-polyfill/src/externs.js',
        ...(await glob('./node_modules/autotrack/lib/externs/*.js')),
      ].map((filename) => fs.readFile(filename)))).join('\n');

      const closureFlags = {
        jsCode: [{
          src: rollupResult.code,
          path: path.basename(entry),
          sourceMap: rollupResult.map,
        }],
        defines: {DEBUG: false},
        compilationLevel: 'ADVANCED',
        useTypesForOptimization: true,
        outputWrapper: `(function(){%output%})();`,
        assumeFunctionWrapper: true,
        rewritePolyfills: false,
        warningLevel: 'VERBOSE',
        applyInputSourceMaps: true,
        createSourceMap: true,
        externs: [{src: externs}],
      };
      const closureResult = compile(closureFlags);

      if (closureResult.errors.length || closureResult.warnings.length) {
        // fs.writeFileSync(path.join(DEST, entry), rollupResult.code, 'utf-8');
        const results = {
          errors: closureResult.errors,
          warnings: closureResult.warnings,
        };
        return Promise.reject(new Error(JSON.stringify(results, null, 2)));
      } else {
        // Currently, closure compiler doesn't support applying its generated
        // source map to an existing source map, so we do it manually.
        const fromMap = JSON.parse(closureResult.sourceMap);
        const toMap = rollupResult.map;
        const generator = SourceMapGenerator.fromSourceMap(
            new SourceMapConsumer(fromMap));

        generator.applySourceMap(new SourceMapConsumer(toMap));

        return {
          code: closureResult.compiledCode,
          map: generator.toString(),
        };
      }
    } else {
      return bundle.generate({
        format: 'iife',
        sourceMap: true,
      });
    }
  });

  await generateRevisionedAsset('main.js', code, {sourceMap: map});
};


const compileServiceWorker = async () => {
  const entry = 'assets/sw.js';
  const bundle = await rollup({
    entry: entry,
    plugins: [
      nodeResolve({jsnext: true, main: true}),
      commonjs(),
      replace({
        MAIN_JS_URL: JSON.stringify(getRevisionedAssetUrl('main.js')),
        MAIN_CSS_URL: JSON.stringify(getRevisionedAssetUrl('main.css')),
      }),
      babelPlugin({
        exclude: 'node_modules/**',
        plugins: ['transform-async-to-generator'],
      }),
    ],
    onwarn: (warning) => {
      // Ignore missing export warnings as none are needed here:
      // https://github.com/jakearchibald/async-waituntil-polyfill/blob/master/async-waituntil.js
      if (warning.code != 'MISSING_EXPORT') console.log(warning);
    },
  });
  const rollupResult = await bundle.generate({format: 'iife', sourceMap: true});
  const babelResult = babel.transform(rollupResult.code, {
    comments: false,
    presets: ['babili'],
    inputSourceMap: rollupResult.map,
  });

  await fs.outputFile(
      'build/sw.js', `${babelResult.code}\n//# sourceMappingURL=sw.js.map`);
};


module.exports = {
  build: async () => {
    await compilePolyfills();

    // Depends on the revisioned polyfill.js URL.
    await compileMain();

    // Depends on the revisioned main.js and main.css URLs.
    await compileServiceWorker();
  },
};
