const seleniumServerJar = require('selenium-server-standalone-jar');
const {spawn} = require('child_process');

let seleniumServer;


module.exports = {
  start: () => {
    return new Promise((resolve) => {
      seleniumServer = spawn('java', ['-jar', seleniumServerJar.path]);
      seleniumServer.stderr.pipe(process.stdout);
      seleniumServer.stderr.on('data', (data) => {
        if (data.includes('Selenium Server is up and running')) {
          resolve();
        }
      });
    });
  },
  stop: () => {
    seleniumServer.kill();
  },
};

module.exports.start();
