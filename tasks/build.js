const gulp = require('gulp');

// Ensure referenced tasks are registered.
require('./clean.js');
require('./content.js');
require('./css.js');
require('./images.js');
require('./javascript.js');
require('./sw.js');

gulp.task('build', gulp.series(
    // 'clean',
    gulp.parallel('css', 'images'),
    gulp.parallel('css'),
    'javascript',
    'content',
    'sw'));
