const {spawn} = require('child_process');
const gulp = require('gulp');
const server = require('./utils/server');
const selenium = require('./utils/selenium');

// Ensure referenced tasks are registered.
require('./build.js');

gulp.task('test', gulp.series(
    gulp.series('build', () => {
      return Promise.all([
        server.start({verbose: false}),
        selenium.start({verbose: false}),
      ]);
    }),
    (done) => {
      spawn('wdio', [], {stdio: 'inherit'}).on('exit', () =>  {
        server.stop();
        selenium.stop();
        done();
      });
    }));
