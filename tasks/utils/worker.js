import {spawn} from 'child_process';
// import * as tunnel from './tunnel.js';

let subprocess;

export const start = async ({verbose = true} = {}) => {
  // await tunnel.start();

  await new Promise((resolve, reject) => {
    const args = [`pages`, `dev`, `--port=3000`];

    subprocess = spawn('wrangler', args);

    subprocess.stdout.on('data', (data) => {
      if (data.includes(`Ready on http://localhost:3000`)) {
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

export const stop = () => {
  subprocess.kill();
};
