import fs from 'fs-extra';
import {resetManifest} from './lib/assets.ts';

const config = await fs.readJSON('./config.json');

await fs.remove(config.publicDir);
resetManifest();
