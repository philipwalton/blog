import fs from 'fs-extra';
import {buildAll} from './lib/content.js';
import {bundleSW} from './lib/sw.js';

await fs.copy('./src/static/', 'build/', {recursive: true});

await buildAll();
await bundleSW();
