import gulp from 'gulp';

// Ensure referenced tasks are imported.
import './server.js';

gulp.task(
  'watch',
  gulp.series('build', 'server', () => {
    gulp.watch('assets/css/**/*.css', gulp.series('content', 'sw'));
    gulp.watch('assets/images/**/*', gulp.series('content'));
    gulp.watch('assets/javascript/**/*.js', gulp.series('content', 'sw'));
    gulp.watch(
      [
        'book.json',
        'templates/**/*',
        'articles/*.md',
        'worker/lib/experiments.js',
      ],
      gulp.series('content', 'sw'),
    );
    gulp.watch('assets/sw/**/*.js', gulp.series('sw'));
    gulp.watch('package.json', gulp.series('sw'));
  }),
);
