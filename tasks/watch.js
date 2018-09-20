const gulp = require('gulp');
const server = require('./utils/server');

gulp.task('watch', gulp.series('build', 'server', () => {
  gulp.watch('assets/css/**/*.css', gulp.series('css', 'content'));
  gulp.watch('assets/images/**/*', gulp.series('images', 'content'));
  gulp.watch('assets/javascript/*.js', gulp.series('javascript', 'content'));
  gulp.watch(['templates/**/*.html', 'articles/*.md'], gulp.series('content'));
}));
