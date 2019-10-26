const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const superstatic = require('superstatic');
const {log} = require('../../functions/log');


const PORT = 5000;
let server;

const app = express()
    // Log requests that make it to the server.
    .use(morgan('dev'))

    // Process analytics logs. Note: `body-parser` only needs to be used when
    // running `superstatic` as `firebase-functions` automatically includes it.
    // https://firebase.google.com/docs/functions/http-events#use_middleware_modules_with
    .use('/log', bodyParser.text())
    .use('/log', log)

    // Any request matching this pattern will return a test fixture.
    .use(/^\/__(.+)__/, (req, res, next) => {
      res.sendFile(path.resolve(`test/fixtures/${req.params[0]}.html`));
    })
    // All other requests will use superstatic
    // https://github.com/firebase/superstatic#superstaticoptions
    .use(superstatic());

const start = async ({verbose = true} = {}) => {
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

const stop = () => {
  server.close();
};

module.exports = {
  start,
  stop,
};
