import {spawn} from 'child_process';

let subprocess;

export const start = ({verbose = true} = {}) => {
  return new Promise((resolve, reject) => {
    subprocess = spawn('cloudflared', [
      'tunnel',
      '--url=http://localhost:5000',
    ]);

    const urlRegExp = /https:\/\/[^.]+\.trycloudflare\.com/;

    subprocess.stderr.on('data', (data) => {
      const match = urlRegExp.exec(data);
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
