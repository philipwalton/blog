import fs from 'fs-extra';
import {resetManifest} from './lib/assets.js';

const config = await fs.readJSON('./config.json');

await fs.remove(config.publicDir);
resetManifest();
