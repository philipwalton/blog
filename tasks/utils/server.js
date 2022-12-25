import bodyParser from 'body-parser';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import superstatic from 'superstatic';
import {log} from '../../functions/log.js';

const PORT = 3001;
let server;

const app = express()
  // Log requests that make it to the server.
  .use(morgan('dev'))

  // Allow setting arbitrary headers for testing purposes.
  .use((req, res, next) => {
    if (req.query?.h) {
      const headers = JSON.parse(decodeURIComponent(req.query.h));
      for (const [key, value] of Object.entries(headers)) {
        res.set(key, value);
      }
    }
    next();
  })

  // Process analytics logs. Note: `body-parser` only needs to be used when
  // running `superstatic` as `firebase-functions` automatically includes it.
  // https://firebase.google.com/docs/functions/http-events#use_middleware_modules_with
  .use('/log', bodyParser.text())
  .use('/log', log)

  // Any request matching this pattern will return a test fixture.
  .use(/^\/__(.+)__/, (req, res) => {
    res.sendFile(path.resolve(`test/fixtures/${req.params[0]}.html`));
  })
  // All other requests will use superstatic
  // https://github.com/firebase/superstatic#superstaticoptions
  .use(superstatic.default());

export const start = async () => {
  await new Promise((resolve, reject) => {
    server = app.listen(PORT, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const stop = () => {
  server.close();
};
