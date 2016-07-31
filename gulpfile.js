const babelify = require('babelify');
const browserify = require('browserify');
const spawn = require('child_process').spawn;
const cssnext = require('gulp-cssnext');
const del = require('del');
const envify = require('envify');
const frontMatter = require('front-matter');
const fs = require('fs');
const gulp = require('gulp');
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
const htmlMinifier = require('html-minifier');
const pngquant = require('imagemin-pngquant');
const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const merge = require('merge-stream');
const moment = require('moment-timezone');
const nunjucks = require('nunjucks');
const path = require('path');
const querystring = require('querystring');
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


let siteData = {
  title: 'Philip Walton',
  description: 'Thoughts on web development, ' +
      'open source, software architecture, and the future.',
  baseUrl: 'https://philipwalton.com',
  timezone: 'America/Los_Angeles',
  buildTime: new Date()
};


let env = nunjucks.configure('templates', {
  autoescape: false,
  noCache: true,
  watch: false
});


env.addFilter('format', function(str, formatString) {
  return moment.tz(str, siteData.timezone).format(formatString);
});

// Necessary until this exists:
// https://github.com/mozilla/nunjucks/issues/359
env.addFilter('striptags', function(str) {
  return str.replace(/(<([^>]+)>)/ig, '');
});


function isProd() {
  return process.env.NODE_ENV == 'production';
}


function streamError(err) {
  gutil.beep();
  gutil.log(err instanceof gutil.PluginError ? err.toString() : err.stack);
}


function getPermalink(filepath) {
  let extname = path.extname(filepath);
  let dirname = path.dirname(filepath);
  let basename = path.basename(filepath, extname)
      .replace(/\d{4}-\d{2}-\d{2}-/, '');

  if (basename != 'index' &&
      basename != 'atom' &&
      basename != '404') {

    dirname += '/' + basename;
    basename = 'index';
    extname = '.html';

    filepath = path.join(dirname, basename + extname);
  }

  return path.join('/', path.relative('.', filepath))
      .replace(/^\/pages\//, '/')
      .replace(/index\.html$/, '');
}

function getDestPathFromPermalink(permalink) {
  // Add index.html if necessary and remove leading slash.
  return path.resolve(permalink.replace(/\/$/, '/index.html').slice(1));
}


function renderContent() {
  let files = [];

  let overrides = {env: isProd() ? 'production' : 'development'};
  let site = Object.assign(siteData, overrides, {articles: []});

  let md = new MarkdownIt({
    html: true,
    typographer: true,
    highlight: function(code, lang) {
      code = lang
          ? hljs.highlight(lang, code).value
          // since we're not using highlight.js here, we need to espace the html
          // unescape first in order to avoid double escaping
          : he.escape(he.unescape(code));

      // Allow for highlighting portions of code blocks
      // using `**` before and after
      return code.replace(/\*\*(.+)?\*\*/g, '<mark>$1</mark>');
    }
  }).use(markdownItAnchor);

  return through.obj(
    function transform(file, enc, done) {
      let contents = file.contents.toString();
      let yaml = frontMatter(contents);

      if (yaml.attributes) {
        contents = yaml.body;
        file.data = {
          site: site,
          page: Object.assign({permalink: getPermalink(file.path)}, yaml.attributes)
        };
      }

      if (path.extname(file.path) == '.md') {
        file.data.page.contents = contents = md.render(contents);
      }

      if (path.relative('.', file.path).startsWith('articles')) {
        site.articles.unshift(file.data.page);
      }

      file.contents = new Buffer(contents);

      files.push(file);
      done();
    },
    function flush(done) {
      files.forEach(function(file) { this.push(file); }.bind(this));
      done();
    }
  );
}


function renderTemplate() {
  return through.obj(function (file, enc, cb) {
    try {
      // Render the file's content to the page.content template property.
      let content = file.contents.toString();
      file.data.page.content = nunjucks.renderString(content, file.data);

      // Then render the page in its template.
      let template = file.data.page.template;
      file.contents = new Buffer(nunjucks.render(template, file.data));

      file.path = getDestPathFromPermalink(file.data.page.permalink);

      this.push(file);
    }
    catch (err) {
      this.emit('error', new gutil.PluginError('renderTemplate', err, {
        fileName: file.path
      }));
    }
    cb();
  });
}


function minifyHtml() {
  let opts = {
    removeComments: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true,
    removeRedundantAttributes: true,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    minifyJS: true,
    minifyCSS: true
  };
  return through.obj(function (file, enc, cb) {
    try {
      if (path.extname(file.path) == '.html') {
        let content = file.contents.toString();
        let minifiedContent = htmlMinifier.minify(content, opts);

        file.contents = new Buffer(minifiedContent);
        this.push(file);
      }
    }
    catch (err) {
      this.emit('error', new gutil.PluginError('minifyHtml', err, {
        fileName: file.path
      }));
    }

    this.push(file);
    cb();
  });
}


function createPartials() {
  return through.obj(function (file, enc, cb) {
    try {
      if (path.extname(file.path) == '.html') {
        let partial = file.clone();
        let content = partial.contents.toString()
            .replace(/^[\s\S]*<main[^>]*>([\s\S]*)<\/main>[\s\S]*$/, '$1');

        partial.contents = new Buffer(content);
        partial.path = path.join(
            path.dirname(file.path), '_' + path.basename(file.path));

        this.push(partial);
      }
    }
    catch (err) {
      this.emit('error', new gutil.PluginError('renderTemplate', err, {
        fileName: file.path
      }));
    }

    this.push(file);
    cb();
  });
}


gulp.task('static', function() {
  return gulp.src(['./static/*'], {dot: true}).pipe(gulp.dest(DEST));
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


gulp.task('pages', function() {
  return gulp.src(['./articles/*', './pages/*'], {base: '.'})
      .pipe(plumber({errorHandler: streamError}))
      .pipe(renderContent())
      .pipe(renderTemplate())
      .pipe(gulpIf(isProd(), minifyHtml()))
      .pipe(createPartials())
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
  return gulp.src(['gulpfile.babel.js', 'assets/javascript/**/*.js'])
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError());
});


gulp.task('clean', function(done) {
  del(DEST, done);
});


gulp.task('build', ['css', 'javascript', 'images', 'pages', 'static']);


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
  gulp.watch(['./pages/*', './articles/*', './templates/*'], ['pages']);
});


gulp.task('test', ['build', 'serve', 'selenium'], function() {
  function stopServers() {
    devServer.kill();
    seleniumServer.kill();
  }
  return gulp.src('./wdio.conf.js')
      .pipe(webdriver())
      .on('end', stopServers);
});


gulp.task('deploy', ['build'], function(done) {

  if (!isProd()) {
    throw new Error('The deploy task must be run in production mode.');
  }

  var appConfig = spawn('appcfg.py', ['update', '.']);
  appConfig.stderr.on('data', (data) => process.stdout.write(data));
  appConfig.on('close', () => done());
});


gulp.task('default', ['build']);
