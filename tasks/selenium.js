const gulp = require('gulp');
const selenium = require('./utils/selenium');

gulp.task('selenium', async () => {
  try {
    await selenium.start();
  } catch (err) {
    console.error(err);
  }
});
