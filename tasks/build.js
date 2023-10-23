import gulp from 'gulp';

// Ensure referenced tasks are registered.
import './clean.js';
import './content.js';
import './sw.js';

gulp.task('build', gulp.series('clean', 'content', 'sw'));
