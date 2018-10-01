const gulp = require('gulp');
const tunnel = require('./utils/tunnel');

gulp.task('tunnel', async () => {
  try {
    await tunnel.start();
  } catch (err) {
    console.error(err);
  }
});
