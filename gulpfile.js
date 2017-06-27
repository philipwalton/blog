/* eslint no-invalid-this: 0 */

const babel = require('babel-core');
const spawn = require('child_process').spawn;
const del = require('del');
const fs = require('fs');
const glob = require('glob');
const {compile} = require('google-closure-compiler-js');
const gulp = require('gulp');
const cssnext = require('gulp-cssnext');
const eslint = require('gulp-eslint');
const resize = require('gulp-image-resize');
const imagemin = require('gulp-imagemin');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const gutil = require('gulp-util');
const webdriver = require('gulp-webdriver');
const he = require('he');
const hljs = require('highlight.js');
const pngquant = require('imagemin-pngquant');
const localtunnel = require('localtunnel');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const merge = require('merge-stream');
const path = require('path');
const {rollup} = require('rollup');
const nodeResolve = require('rollup-plugin-node-resolve');
const replace = require('rollup-plugin-replace');
const seleniumServerJar = require('selenium-server-standalone-jar');
const {SourceMapGenerator, SourceMapConsumer} = require('source-map');
const through = require('through2');
const webpack = require('webpack');
const book = require('./book');


// Default to development mode.
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';


/**
 * The output directory for all the built files.
 */
const DEST = 'build';


/**
 * The app engine server used for testing and previewing the site.
 */
let devServer;


/**
 * A reference to the selenium server standalone subprocess.
 */
let seleniumServer;


/**
 * A reference to the localtunnel instance.
 */
let testTunnel;


/**
 * @return {boolean} True if NODE_ENV is production.
 */
function isProd() {
  return process.env.NODE_ENV == 'production';
}


/**
 * A callback passed to a stream's error handlers that beeps and logs and
 * error if passed one.
 * @param {Error} err The stream error.
 */
function streamError(err) {
  gutil.beep();
  gutil.log(err instanceof gutil.PluginError ? err.toString() : err.stack);
}


/**
 * Renders markdown content as HTML with syntax highlighted code blocks.
 * @param {string} content A markdown string.
 * @return {string} The rendered HTML.
 */
function renderMarkdown(content) {
  const md = new MarkdownIt({
    html: true,
    typographer: true,
    highlight: function(code, lang) {
      code = lang ? hljs.highlight(lang, code).value :
          // Since we're not using highlight.js here, we need to
          // espace the html, but we have to unescape first in order
          // to avoid double escaping.
          he.escape(he.unescape(code));

      // Allow for highlighting portions of code blocks
      // using `**` before and after
      return code.replace(/\*\*(.+)?\*\*/g, '<mark>$1</mark>');
    },
  }).use(markdownItAnchor);

  return md.render(content);
}


/**
 * Creates a transform stream that renders markdown files to HTML content.
 * @return {TransformStream} The transform stream.
 */
function renderContent() {
  book.site.buildTime = new Date();

  const transform = function transform(file, enc, done) {
    const article = book.articles.find((a) => {
      return path.basename(a.path) == path.basename(file.path, '.md');
    });

    if (article) {
      article.content = renderMarkdown(file.contents.toString());
    }

    done();
  };

  const flush = function flush(done) {
    this.push(new gutil.File({
      path: './book.json',
      contents: new Buffer(JSON.stringify(book, null, 2)),
    }));
    done();
  };

  return through.obj(transform, flush);
}


gulp.task('content', () => {
  return gulp.src('./articles/*', {base: '.'})
      .pipe(plumber({errorHandler: streamError}))
      .pipe(renderContent())
      .pipe(gulp.dest(DEST));
});


gulp.task('images', () => {
  return merge(
    gulp.src('./assets/images/*.png', {base: '.'})
        .pipe(resize({width: 700}))
        .pipe(imagemin({use: [pngquant()]}))
        .pipe(gulp.dest(DEST)),

    gulp.src('./assets/images/*.png', {base: '.'})
        .pipe(resize({width: 1400}))
        .pipe(imagemin({use: [pngquant()]}))
        .pipe(rename((path) => path.basename += '-1400w'))
        .pipe(gulp.dest(DEST)),

    gulp.src('./assets/images/*.svg', {base: '.'})
        .pipe(gulp.dest(DEST))
  );
});


gulp.task('css', () => {
  const opts = {
    browsers: '> 1%, last 2 versions, Safari > 5, ie > 9, Firefox ESR',
    compress: isProd(),
    url: {url: 'inline'},
  };
  return gulp.src('./assets/css/main.css', {base: '.'})
      .pipe(plumber({errorHandler: streamError}))
      .pipe(cssnext(opts))
      .pipe(gulp.dest(DEST));
});


gulp.task('javascript:main', (done) => {
  const entry = 'assets/javascript/main.js';
  rollup({
    entry: entry,
    plugins: [
      replace({
        ENVIRONMENT: JSON.stringify(process.env.NODE_ENV || 'development'),
      }),
      nodeResolve(),
    ],
  })
  .then((bundle) => {
    // In production mode, use Closure Compiler to bundle the script,
    // otherwise just output the rollup result as it's much faster.
    if (isProd()) {
      const rollupResult = bundle.generate({
        format: 'es',
        dest: path.basename(entry),
        sourceMap: true,
      });

      const externs = [
        'assets/javascript/externs.js',
        './node_modules/tti-polyfill/src/externs.js',
        ...glob.sync('./node_modules/autotrack/lib/externs/*.js'),
      ].reduce((acc, cur) => acc + fs.readFileSync(cur, 'utf-8'), '');

      const closureFlags = {
        jsCode: [{
          src: rollupResult.code,
          path: path.basename(entry),
          sourceMap: rollupResult.map,
        }],
        defines: {DEBUG: false},
        compilationLevel: 'ADVANCED',
        useTypesForOptimization: true,
        outputWrapper:
            `(function(){%output%})();\n` +
            `//# sourceMappingURL=${path.basename(entry)}.map`,
        assumeFunctionWrapper: true,
        rewritePolyfills: false,
        warningLevel: 'VERBOSE',
        applyInputSourceMaps: true,
        createSourceMap: true,
        externs: [{src: externs}],
      };
      const closureResult = compile(closureFlags);

      if (closureResult.errors.length || closureResult.warnings.length) {
        fs.writeFileSync(path.join(DEST, entry), rollupResult.code, 'utf-8');
        const results = {
          errors: closureResult.errors,
          warnings: closureResult.warnings,
        };
        done(new Error(JSON.stringify(results, null, 2)));
      } else {
        // Currently, closure compiler doesn't support applying its generated
        // source map to an existing source map, so we do it manually.
        const fromMap = JSON.parse(closureResult.sourceMap);
        const toMap = rollupResult.map;
        const generator = SourceMapGenerator.fromSourceMap(
            new SourceMapConsumer(fromMap));

        generator.applySourceMap(new SourceMapConsumer(toMap));

        fs.writeFileSync(path.join(DEST, entry),
            closureResult.compiledCode, 'utf-8');
        fs.writeFileSync(path.join(DEST, entry) + '.map',
            generator.toString(), 'utf-8');
        done();
      }
    } else {
      bundle.write({
        dest: path.join(DEST, entry),
        format: 'iife',
        sourceMap: true,
      }).then(() => done());
    }
  });
});


gulp.task('javascript:polyfills', ((compiler) => {
  const createCompiler = () => {
    const entryPath = './assets/javascript/polyfills.js';
    const entry = path.resolve(__dirname, entryPath);
    return webpack({
      entry: entry,
      output: {
        path: path.dirname(path.resolve(__dirname, DEST, entryPath)),
        filename: path.basename(entry),
      },
      devtool: '#source-map',
      plugins: [new webpack.optimize.UglifyJsPlugin({sourceMap: true})],
      performance: {hints: false},
      cache: {},
    });
  };
  return (done) => {
    (compiler || (compiler = createCompiler())).run(function(err, stats) {
      if (err) throw new gutil.PluginError('webpack', err);
      gutil.log('[webpack]', stats.toString('minimal'));
      done();
    });
  };
})());


gulp.task('javascript', ['javascript:main', 'javascript:polyfills']);


gulp.task('manifest', () => {
  return gulp.src([
    './assets/*.+(ico|json|png|svg|xml)',
  ]).pipe(gulp.dest(DEST));
});


gulp.task('service-worker', ((compiler) => {
  const createCompiler = () => {
    const entry = './assets/sw.js';
    return webpack({
      entry: entry,
      output: {
        path: path.dirname(path.resolve(__dirname, DEST, path.basename(entry))),
        filename: path.basename(entry),
      },
      // devtool: '#source-map',
      module: {
        loaders: [{
          test: /\.js$/,
          exclude: [/node_modules/],
          loader: 'babel-loader',
          query: {
            babelrc: false,
            cacheDirectory: false,
            presets: ['babili'],
            plugins: ['transform-async-to-generator'],
          },
        }],
      },
      performance: {hints: false},
      cache: {},
    });
  };
  return (done) => {
    (compiler || (compiler = createCompiler())).run(function(err, stats) {
      if (err) throw new gutil.PluginError('webpack', err);
      gutil.log('[webpack]', stats.toString('minimal'));

      // Minify the final file.
      // const {code, map} = babel.transformFileSync('build/sw.js', {
      const {code} = babel.transformFileSync('build/sw.js', {
        comments: false,
        presets: ['babili'],
      });

      // TODO(philipwalton): transform the source map.
      // const fromMap =
      //     JSON.parse(fs.readFileSync('build/sw.js.map', 'utf-8'));
      // const toMap = map;
      // const generator = SourceMapGenerator.fromSourceMap(
      //     new SourceMapConsumer(fromMap));

      // generator.applySourceMap(new SourceMapConsumer(toMap));
      // fs.writeFileSync('build/sw.js.map', generator.toString(), 'utf-8');

      fs.writeFileSync('build/sw.js', code, 'utf-8');
      done();
    });
  };
})());


gulp.task('lint', () => {
  return gulp.src([
    'gulpfile.js',
    'assets/sw.js',
    'assets/javascript/**/*.js',
    '!assets/javascript/externs.js',
    'test/**/*.js',
  ])
  .pipe(eslint({fix: true}))
  .pipe(eslint.format())
  .pipe(eslint.failAfterError());
});


gulp.task('clean', (done) => {
  del(DEST, done);
});


gulp.task('build', [
  'content',
  'css',
  'images',
  'javascript',
  'manifest',
  'service-worker',
]);


gulp.task('serve', [], (done) => {
  devServer = spawn('dev_appserver.py', ['.', '--port', '9090']);
  devServer.stderr.on('data', (data) => {
    if (data.indexOf('Starting module') > -1) done();
    process.stdout.write(data);
  });
});


gulp.task('selenium', (done) => {
  seleniumServer = spawn('java', ['-jar', seleniumServerJar.path]);
  seleniumServer.stderr.on('data', function(data) {
    if (data.includes('Selenium Server is up and running')) done();
  });
});


gulp.task('tunnel', ['serve'], (done) => {
  localtunnel(9090, (err, tunnel) => {
    if (err) {
      done(err);
    } else {
      testTunnel = tunnel;
      process.env.BASE_URL = tunnel.url;
      done();
    }
  });
});


gulp.task('watch', ['build', 'serve'], () => {
  gulp.watch('./assets/css/**/*.css', ['css']);
  gulp.watch('./assets/images/*', ['images']);
  gulp.watch(
      ['./assets/javascript/*', '!./assets/javascript/polyfills.js'],
      ['javascript:main']);
  gulp.watch(['./assets/javascript/polyfills.js'], ['javascript:polyfills']);
  gulp.watch('./assets/*.+(ico|json|png|svg|xml)', ['manifest']);
  gulp.watch(['./assets/sw.js'], ['service-worker']);
  gulp.watch(['./articles/*'], ['content']);
});


gulp.task('test', ['lint', 'build', 'tunnel', 'selenium'], () => {
  const stopServers = () => {
    devServer.kill();
    seleniumServer.kill();
    testTunnel.close();
  };
  return gulp.src('./wdio.conf.js')
      .pipe(webdriver())
      .on('end', stopServers);
});


gulp.task('deploy', [/*'test',*/ 'build'], (done) => {
  if (!isProd()) {
    throw new Error('The deploy task must be run in production mode.');
  }
  spawn('gcloud',
      ['app', 'deploy', '--project', 'philipwalton-site'],
      {stdio: 'inherit'})
          .on('error', (err) => done(err))
          .on('close', () => done());
});


gulp.task('default', ['build']);
