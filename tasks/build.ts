import fs from 'fs-extra';
import {buildAll} from './lib/content.ts';

await fs.copy('./src/static/', 'build/');

await buildAll();
