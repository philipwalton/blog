import gulp from 'gulp';
import {start} from './utils/server.js';

gulp.task('server', async () => {
  try {
    await start();
  } catch (err) {
    console.error(err);
  }
});
