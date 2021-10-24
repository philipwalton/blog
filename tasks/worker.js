import gulp from 'gulp';
import {start} from './utils/worker.js';

gulp.task('worker', async () => {
  try {
    await start();
  } catch (err) {
    console.error(err);
  }
});
