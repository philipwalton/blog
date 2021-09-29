import fs from 'fs-extra';
import gulp from 'gulp';
import {resetManifest} from './utils/assets.js';

gulp.task('clean', async () => {
  const config = await fs.readJSON('./config.json');

  await fs.remove(config.publicDir);
  resetManifest();
});
