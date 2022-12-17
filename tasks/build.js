import gulp from 'gulp';

// Ensure referenced tasks are registered.
import './clean.js';
import './content.js';
import './css.js';
import './images.js';
import './javascript.js';
import './sw.js';

gulp.task(
  'build',
  gulp.series(
    // 'clean',
    'images',
    'css',
    'javascript',
    'content',
    'sw'
  )
);
