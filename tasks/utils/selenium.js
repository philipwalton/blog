const {spawn} = require('child_process');
const seleniumServerJar = require('selenium-server-standalone-jar');

let subprocess;

const start = async ({verbose = true} = {}) => {
  await new Promise((resolve, reject) => {
    subprocess = spawn('java', ['-jar', seleniumServerJar.path]);

    subprocess.stderr.on('data', (data) => {
      if (data.includes('Selenium Server is up and running')) {
        resolve();
      }
    });

    if (verbose) {
      subprocess.stdout.pipe(process.stdout);
      subprocess.stderr.pipe(process.stderr);
    }

    subprocess.on('error', (err) => reject(err));
  });
};

const stop = () => {
  subprocess.kill();
};

module.exports = {start, stop};
