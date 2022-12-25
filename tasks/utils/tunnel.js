import {spawn} from 'child_process';

let subprocess;

export const start = ({verbose = true} = {}) => {
  return new Promise((resolve, reject) => {
    subprocess = spawn('cloudflared', ['tunnel', 'run']);

    const successLogRegExp = /Connection.+registered/;

    subprocess.stderr.on('data', (data) => {
      const match = successLogRegExp.exec(data);
      if (match) {
        resolve(match[0]);
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
