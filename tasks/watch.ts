import chokidar from 'chokidar';
import fs from 'fs-extra';
import {cssCache, jsCache} from './lib/cache.ts';
import {buildAll} from './lib/content.ts';

const watch = (arg: string | string[]) => {
  return chokidar.watch(arg, {ignoreInitial: true});
};

const cssWatcher = watch('src/css');

cssWatcher.on('ready', () => {
  cssWatcher.on('all', async (event, path) => {
    console.log('css', event, path);
    cssCache.invalidate();
    await buildAll();
  });
});

const jsWatcher = watch('src/javascript');

jsWatcher.on('ready', () => {
  jsWatcher.on('all', async (event, path) => {
    console.log('js', event, path);
    jsCache.invalidate();
    await buildAll();
  });
});

const staticWatcher = watch(['src/static']);

staticWatcher.on('ready', () => {
  staticWatcher.on('all', async (event, path) => {
    console.log('static', event, path);
    await fs.copy('./src/static/', 'build/');
  });
});

const contentWatcher = watch([
  'book.json',
  'src/templates',
  'src/articles',
  'worker/lib/experiments.js',
]);

contentWatcher.on('ready', () => {
  contentWatcher.on('all', async (event, path) => {
    console.log('content', event, path);
    await buildAll();
  });
});
