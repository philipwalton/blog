import chokidar from 'chokidar';
import {build} from './build.js';
import {cssCache, jsCache} from './utils/cache.js';
import {start as startServer} from './utils/server.js';
import {start as startWorker} from './utils/worker.js';

const cssWatcher = chokidar.watch('assets/css/**/*.css');

cssWatcher.on('ready', () => {
  cssWatcher.on('all', (...args) => {
    console.log('css', ...args);
    cssCache.invalidate();
    build();
  });
});

const jsWatcher = chokidar.watch('assets/javascript/**/*.js');

jsWatcher.on('ready', () => {
  jsWatcher.on('all', (...args) => {
    console.log('js', ...args);
    jsCache.invalidate();
    build();
  });
});

const swWatcher = chokidar.watch('assets/sw/**/*.js');

swWatcher.on('ready', () => {
  swWatcher.on('all', (...args) => {
    console.log('sw', ...args);
    build();
  });
});

const contentWatcher = chokidar.watch([
  'book.json',
  'templates/**/*',
  'articles/*.md',
  'worker/lib/experiments.js',
]);

contentWatcher.on('ready', () => {
  contentWatcher.on('all', (...args) => {
    console.log('content', ...args);
    build();
  });
});

startServer();
startWorker();
