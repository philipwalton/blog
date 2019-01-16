const gulp = require('gulp');
const server = require('./utils/server');
const selenium = require('./utils/selenium');
const tunnel = require('./utils/tunnel');
const webdriver = require('gulp-webdriver');


// Ensure referenced tasks are registered.
require('./build.js');
require('./server.js');
require('./selenium.js');
require('./tunnel.js');

const startServices = () => {
  const promises = [
    server.start({verbose: false}),
  ];

  if (process.env.CI) {
    promises.push(tunnel.start({verbose: false}));
  } else {
    promises.push(selenium.start({verbose: false}));
  }
  return Promise.all(promises);
};

const stopServices = () => {
  server.stop();
  if (process.env.CI) {
    tunnel.stop();
  } else {
    selenium.stop();
  }
};

gulp.task('test:e2e', () => {
  return gulp.src('./wdio.conf.js').pipe(webdriver()).on('end', stopServices);
});

gulp.task('test', gulp.series('build', startServices, 'test:e2e'));
