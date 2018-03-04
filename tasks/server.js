const gulp = require('gulp');
const server = require('./utils/server');

gulp.task('server', async () => {
  try {
    await server.start();
  } catch (err) {
    console.error(err);
  }
});
