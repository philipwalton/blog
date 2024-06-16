import http from 'node:http';
import fs from 'fs-extra';

const PORT = 3001;
const LOG_FILE = 'beacons.log';

let server;

export const start = async () => {
  server = http.createServer((req, res) => {
    let body = ''; // Store request body chunks
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      const contents = [
        req.url,
        [...Object.entries(req.headers)]
          .map((e) => `${e[0]}=${encodeURIComponent(e[1])}`)
          .join('&'),
        body,
      ].join('\n');
      await fs.appendFileSync(LOG_FILE, contents + '\n--\n', 'utf-8');

      res.end();
    });
  });
  return new Promise((resolve) => {
    server.listen(PORT, 'localhost', () => resolve());
  });
};

export const stop = () => {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
};
