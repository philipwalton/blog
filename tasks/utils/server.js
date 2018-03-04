const {spawn} = require('child_process');

let subprocess;

const start = async ({verbose = true} = {}) => {
  await new Promise((resolve, reject) => {
    subprocess = spawn('firebase', ['serve']);

    subprocess.stdout.on('data', (data) => {
      if (data.toString().includes('Local server:')) {
        resolve();
      }
    });

    if (verbose) {
      subprocess.stdout.pipe(process.stdout);
    }

    subprocess.on('error', (err) => reject(err));
  });
};

const stop = () => {
  subprocess.kill();
};

module.exports = {start, stop};
