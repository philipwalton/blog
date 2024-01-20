import {clean} from './clean.js';
import {buildAll} from './content.js';
import {bundleSW} from './sw.js';

export async function build() {
  await buildAll();
  await bundleSW();
}

await clean();
await build();
