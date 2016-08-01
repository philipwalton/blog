const babelify = require('babelify');
const browserify = require('browserify');
const spawn = require('child_process').spawn;
const del = require('del');
const envify = require('envify');
const fs = require('fs');
const gulp = require('gulp');
const cssnext = require('gulp-cssnext');
const eslint = require('gulp-eslint');
const gulpIf = require('gulp-if');
const resize = require('gulp-image-resize');
const imagemin = require('gulp-imagemin');
const plumber = require('gulp-plumber');
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const gutil = require('gulp-util');
const webdriver = require('gulp-webdriver');
const he = require('he');
const hljs = require('highlight.js');
const pngquant = require('imagemin-pngquant');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const merge = require('merge-stream');
const path = require('path');
const seleniumServerJar = require('selenium-server-standalone-jar');
const through = require('through2');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const yaml = require('js-yaml');


// Defaults to development mode.
process.env.NODE_ENV = process.env.NODE_ENV || 'development';


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


function isProd() {
  return process.env.NODE_ENV == 'production';
}


function streamError(err) {
  gutil.beep();
  gutil.log(err instanceof gutil.PluginError ? err.toString() : err.stack);
}


function renderMarkdown(content) {
  let md = new MarkdownIt({
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
    }
  }).use(markdownItAnchor);

  return md.render(content);
}


function renderContent() {
  let data = yaml.safeLoad(fs.readFileSync('./book.yaml', 'utf-8'));
  data.site.buildTime = new Date();
  return through.obj(
      function transform(file, enc, done) {
        let article = data.articles.find((a) =>
            path.basename(a.path) == path.basename(file.path, '.md'));

        article.content = renderMarkdown(file.contents.toString());
        done();
      },
      function flush(done) {
        this.push(new gutil.File({
          path: './data.json',
          contents: new Buffer(JSON.stringify(data, null, 2))
        }));
        done();
      }
  );
}


gulp.task('static', function() {
  return gulp.src(['./assets/favicon.ico']).pipe(gulp.dest(DEST));
});


gulp.task('images', function() {
  return merge(
    gulp.src('./assets/images/*.png', {base: '.'})
        .pipe(resize({width: 700}))
        .pipe(imagemin({use: [pngquant()]}))
        .pipe(gulp.dest(DEST)),

    gulp.src('./assets/images/*.png', {base: '.'})
        .pipe(resize({width: 1400}))
        .pipe(imagemin({use: [pngquant()]}))
        .pipe(rename((path) => path.basename += '-1400w'))
        .pipe(gulp.dest(DEST))
  );
});


gulp.task('content', function() {
  return gulp.src('./articles/*', {base: '.'})
      .pipe(plumber({errorHandler: streamError}))
      .pipe(renderContent())
      .pipe(gulp.dest(DEST));
});


gulp.task('css', function() {
  let opts = {
    browsers: '> 1%, last 2 versions, Safari > 5, ie > 9, Firefox ESR',
    compress: isProd(),
    url: {url: 'inline'}
  };
  return gulp.src('./assets/css/main.css', {base: '.'})
      .pipe(plumber({errorHandler: streamError}))
      .pipe(cssnext(opts))
      .pipe(gulp.dest(DEST));
});


gulp.task('javascript', function(done) {
  let entry = './assets/javascript/main.js';
  browserify(entry, {
    debug: true,
    detectGlobals: false
  })
  .transform(babelify)
  .transform(envify)
  .bundle()

  // TODO(philipwalton): Add real error handling.
  // This temporary hack fixes an issue with tasks not restarting in
  // watch mode after a syntax error is fixed.
  .on('error', (err) => {gutil.beep(); done(err); })
  .on('end', done)

  .pipe(source(entry))
  .pipe(buffer())
  .pipe(sourcemaps.init({loadMaps: true}))
  .pipe(gulpIf(isProd(), uglify()))
  .pipe(sourcemaps.write('./'))
  .pipe(gulp.dest(DEST));
});


gulp.task('lint', function() {
  return gulp.src([
    'gulpfile.js',
    'assets/javascript/**/*.js',
    'test/**/*.js'
  ])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError());
});


gulp.task('clean', function(done) {
  del(DEST, done);
});


gulp.task('build', ['content', 'css', 'images', 'javascript', 'static']);


gulp.task('serve', [], function(done) {
  devServer = spawn('dev_appserver.py', ['.']);
  devServer.stderr.on('data', (data) => {
    if (data.indexOf('Starting module') > -1) done();
    process.stdout.write(data);
  });
});


gulp.task('selenium', function(done) {
  seleniumServer = spawn('java',  ['-jar', seleniumServerJar.path]);
  seleniumServer.stderr.on('data', function(data) {
    if (data.indexOf('Selenium Server is up and running') > -1) {
      done();
    }
  });
});


gulp.task('watch', ['build', 'serve'], function() {
  gulp.watch('./assets/css/**/*.css', ['css']);
  gulp.watch('./assets/images/*', ['images']);
  gulp.watch('./assets/javascript/*', ['javascript']);
  gulp.watch('./static/*', ['static']);
  gulp.watch(['./articles/*'], ['content']);
});


gulp.task('test', ['lint', 'build', 'serve', 'selenium'], function() {
  function stopServers() {
    devServer.kill();
    seleniumServer.kill();
  }
  return gulp.src('./wdio.conf.js')
      .pipe(webdriver())
      .on('end', stopServers);
});


gulp.task('deploy', ['test', 'build'], function(done) {

  if (!isProd()) {
    throw new Error('The deploy task must be run in production mode.');
  }

  var appConfig = spawn('appcfg.py', ['update', '.']);
  appConfig.stderr.on('data', (data) => process.stdout.write(data));
  appConfig.on('close', () => done());
});


gulp.task('default', ['build']);
