import chokidar from 'chokidar';
import fs from 'fs-extra';
import {cssCache, jsCache} from './lib/cache.js';
import {buildAll} from './lib/content.js';
import {bundleSW} from './lib/sw.js';

const cssWatcher = chokidar.watch('assets/css/**/*.css');

cssWatcher.on('ready', () => {
  cssWatcher.on('all', async (...args) => {
    console.log('css', ...args);
    cssCache.invalidate();
    await buildAll();
    await bundleSW();
  });
});

const jsWatcher = chokidar.watch('assets/javascript/**/*.js');

jsWatcher.on('ready', () => {
  jsWatcher.on('all', async (...args) => {
    console.log('js', ...args);
    jsCache.invalidate();
    await buildAll();
    await bundleSW();
  });
});

const swWatcher = chokidar.watch(['assets/sw/**/*.js', 'worker/**/*.js']);

swWatcher.on('ready', () => {
  swWatcher.on('all', async (...args) => {
    console.log('sw', ...args);
    await bundleSW();
  });
});

const staticWatcher = chokidar.watch(['assets/static/*']);

staticWatcher.on('ready', () => {
  staticWatcher.on('all', async (...args) => {
    console.log('static', ...args);
    await fs.copy('./assets/static/', 'build/', {recursive: true});
  });
});

const contentWatcher = chokidar.watch([
  'book.json',
  'templates/**/*',
  'articles/*.md',
  'worker/lib/experiments.js',
]);

contentWatcher.on('ready', () => {
  contentWatcher.on('all', async (...args) => {
    console.log('content', ...args);
    await buildAll();
    await bundleSW();
  });
});
