import fs from 'fs-extra';
import {buildAll} from './lib/content.ts';
import {bundleSW} from './lib/sw.ts';

await fs.copy('./src/static/', 'build/');

await buildAll();
await bundleSW();
