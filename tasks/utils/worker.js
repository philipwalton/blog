import {spawn} from 'child_process';
import * as tunnel from './tunnel.js';

let subprocess;

export const start = async ({verbose = true} = {}) => {
  await tunnel.start();

  await new Promise((resolve, reject) => {
    const args = [
      `dev`,
      `--unauthenticated`,
      `--host=https://localhost.philipwalton.dev`,
    ];

    if (process.env.NODE_ENV) {
      args.push([`--env=${process.env.NODE_ENV}`]);
    }

    subprocess = spawn('wrangler', args, {cwd: './worker/'});

    subprocess.stdout.on('data', (data) => {
      if (data.includes(`Listening on`)) {
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

