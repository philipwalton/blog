import assign from 'lodash/object/assign';
import babelify from 'babelify';
import browserify from 'browserify';
import buffer from 'vinyl-buffer';
import connect from 'connect';
import cssnext from 'gulp-cssnext';
import del from 'del';
import frontMatter from 'front-matter';
import gulp from 'gulp';
import gulpIf from 'gulp-if';
import gutil from 'gulp-util';
import he from 'he';
import hljs from 'highlight.js';
import htmlMinifier from 'html-minifier';
import MarkdownIt from 'markdown-it';
import moment from 'moment-timezone';
import nunjucks from 'nunjucks';
import path from 'path';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import shell from 'shelljs';
import serveStatic from 'serve-static';
import source from 'vinyl-source-stream';
import sourcemaps from 'gulp-sourcemaps';
import through from 'through2';
import uglify from 'gulp-uglify';
import yargs from 'yargs';


/**
 * The output directory for all the built files.
 */
const DEST = 'build';


/**
 * The name of the Github repo.
 */
const REPO = 'blog';


let siteData = {
  title: 'Philip Walton',
  description: 'Thoughts on web development, ' +
      'open source, software architecture, and the future.',
  baseUrl: 'http://philipwalton.com',
  timezone: 'America/Los_Angeles',
  buildTime: new Date(),
};


let env = nunjucks.configure('templates', {
  autoescape: false,
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


/**
 * Returns true is the NODE_ENV environment variable is set to 'production'.
 */
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
  let site = assign(siteData, overrides, {articles: []});

  let md = new MarkdownIt({
    html: true,
    typographer: true,
    highlight: function(code, lang) {
      var code = lang
          ? hljs.highlight(lang, code).value
          // since we're not using highlight.js here, we need to espace the html
          // unescape first in order to avoid double escaping
          : he.escape(he.unescape(code));

      // Allow for highlighting portions of code blocks
      // using `**` before and after
      return code.replace(/\*\*(.+)?\*\*/g, '<mark>$1</mark>');
    }
  });

  return through.obj(
    function transform(file, enc, done) {
      let contents = file.contents.toString();
      let yaml = frontMatter(contents);

      if (yaml.attributes) {
        contents = yaml.body;
        file.data = {
          site: site,
          page: assign({permalink: getPermalink(file.path)}, yaml.attributes)
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
  )
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
        let content = file.contents.toString()
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
  return gulp.src(['./assets/images/*'], {base: '.'}).pipe(gulp.dest(DEST));
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
  }
  return gulp.src('./assets/css/main.css', {base: '.'})
      .pipe(plumber({errorHandler: streamError}))
      .pipe(cssnext(opts))
      .pipe(gulp.dest(DEST));
});


gulp.task('javascript', function() {
  let entry = './assets/javascript/main.js';
  let opts = {debug: true,detectGlobals: false};
  return browserify(entry, opts)
      .transform(babelify)
      .bundle()
      .on('error', streamError)
      .pipe(source(entry))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(gulpIf(isProd(), uglify()))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest(DEST));
});


gulp.task('clean', function(done) {
  del(DEST, done);
});


gulp.task('default', ['css', 'javascript', 'images', 'pages', 'static']);


gulp.task('serve', ['default'], function() {
  let port = yargs.argv.port || yargs.argv.p || 4000;
  connect().use(serveStatic(DEST)).listen(port);

  gulp.watch('./assets/css/**/*.css', ['css']);
  gulp.watch('./assets/images/*', ['images']);
  gulp.watch('./assets/javascript/*', ['javascript']);
  gulp.watch(['./pages/*', './articles/*', './templates/*'], ['pages']);
});


gulp.task('deploy', ['default'], function() {

  if (!isProd()) {
    throw new Error('The deploy task must be run in production mode.');
  }

  // Create a tempory directory and
  // checkout the existing gh-pages branch.
  shell.rm('-rf', './_tmp');
  shell.mkdir('./_tmp');
  shell.cd('./_tmp');
  shell.exec('git init');
  shell.exec(`git remote add origin git@github.com:philipwalton/${REPO}.git`);
  shell.exec('git pull origin gh-pages');

  // Delete all the existing files and add
  // the new ones from the build directory.
  shell.rm('-rf', '*');
  shell.cp('-rf', path.join('..', DEST, '/'), './');

  // Remove the index to workaround a bug:
  // http://bit.ly/1JPtgwA
  shell.rm('.git/index');

  // Commit and push the changes to
  // the gh-pages branch.
  shell.exec('git add -A');
  shell.exec('git commit -m "Deploy site"');
  shell.exec('git branch -m gh-pages');
  shell.exec('git push origin gh-pages');

  // Clean up.
  shell.cd('..');
  shell.rm('-rf', './_tmp');
  shell.rm('-rf', DEST);

});
